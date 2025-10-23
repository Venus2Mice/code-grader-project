package grader

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"grader-engine-go/internal/grader/language"
	"grader-engine-go/internal/models"

	"github.com/docker/docker/client"
)

// gradeFunctionBased performs function-based grading with test harness generation
func (s *Service) gradeFunctionBased(submission *models.Submission, containerID string) (*models.GradingResult, error) {
	ctx := context.Background()
	cli, _ := client.NewClientWithOpts(client.FromEnv)
	defer cli.Close()

	submissionID := submission.ID

	log.Printf("[%d] Starting Function-based grading for language: %s", submissionID, submission.Language)

	// Step 1: Get language handler
	registry := language.GetRegistry()
	handler, err := registry.Get(submission.Language)
	if err != nil {
		return nil, fmt.Errorf("unsupported language: %w", err)
	}

	// Check if language supports function mode
	if !handler.SupportsFunction() {
		return nil, fmt.Errorf("language %s does not support function grading mode", submission.Language)
	}

	log.Printf("[%d] Using language handler: %s", submissionID, handler.GetLanguage())

	// Step 2: Generate test harness
	log.Printf("[%d] Generating test harness...", submissionID)
	testHarness, err := s.generateTestHarness(submission, handler)
	if err != nil {
		return nil, fmt.Errorf("failed to generate test harness: %w", err)
	}

	// Step 3: Compile test harness + user code
	log.Printf("[%d] Compiling test harness with user code...", submissionID)
	success, errorMsg, err := handler.Compile(ctx, cli, containerID, testHarness)
	if err != nil {
		return nil, fmt.Errorf("compilation failed: %w", err)
	}

	if !success {
		log.Printf("[%d] Compile error:\n%s", submissionID, errorMsg)
		return &models.GradingResult{
			OverallStatus: "Compile Error",
			Results: []models.TestCaseResult{
				{
					Status:       "Compile Error",
					ErrorMessage: errorMsg,
				},
			},
		}, nil
	}

	log.Printf("[%d] Compilation successful", submissionID)

	// Step 4: Prepare execution environment
	if err := handler.PrepareExecution(ctx, cli, containerID); err != nil {
		return nil, fmt.Errorf("failed to prepare execution: %w", err)
	}

	// Step 5: Execute test harness once and collect all outputs
	overallStatus := "Accepted"
	results := []models.TestCaseResult{}

	// Get custom limits for this language (or default if not set)
	baseTimeMs, baseMemoryKb := submission.Problem.GetLimitForLanguage(submission.Language)

	// Get resource multipliers for this language
	multipliers := handler.GetResourceMultipliers()

	log.Printf("[%d] Running compiled test harness (all %d test cases)...", submissionID, len(submission.Problem.TestCases))

	// Run the compiled binary once - it will execute all test cases and output results
	allOutputs, execTime, memUsed, execErr := s.runCompiledTestHarness(ctx, cli, containerID, handler, multipliers, baseTimeMs, baseMemoryKb)

	if execErr != nil {
		log.Printf("[%d] Execution error: %v", submissionID, execErr)

		// Parse runtime error details if available
		errMsg := execErr.Error()
		errorType := "Runtime Error"
		errorDesc := errMsg

		// Check if it's a detailed runtime error from the detector
		if strings.HasPrefix(errMsg, "RUNTIME_ERROR:") {
			parts := strings.Split(strings.TrimPrefix(errMsg, "RUNTIME_ERROR:"), "|")
			if len(parts) >= 2 {
				errorType = parts[0]
				errorDesc = parts[1]
				if len(parts) >= 3 && parts[2] != "" {
					errorDesc = errorDesc + "\n\nTips to fix:\n" + parts[2]
				}
			}
		}

		// Return single error result with detailed information
		return &models.GradingResult{
			OverallStatus: errorType,
			Results: []models.TestCaseResult{
				{
					Status:       errorType,
					ErrorMessage: errorDesc,
				},
			},
		}, nil
	}

	// Parse outputs: each line is a test case result
	outputLines := strings.Split(strings.TrimSpace(allOutputs), "\n")

	for i, tc := range submission.Problem.TestCases {
		var output string
		if i < len(outputLines) {
			output = strings.TrimSpace(outputLines[i])
		}

		// Compare output
		expectedOutput := strings.TrimSpace(tc.ExpectedOutput)

		var status string
		if output == expectedOutput {
			status = "Accepted"
		} else if strings.Join(strings.Fields(output), " ") == strings.Join(strings.Fields(expectedOutput), " ") {
			status = "Presentation Error"
		} else {
			status = "Wrong Answer"
		}

		result := models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          status,
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memUsed,
			OutputReceived:  output,
		}

		results = append(results, result)

		if status != "Accepted" && overallStatus == "Accepted" {
			overallStatus = status
		}
	}

	log.Printf("[%d] Function grading completed. Status: %s", submissionID, overallStatus)

	return &models.GradingResult{
		OverallStatus: overallStatus,
		Results:       results,
	}, nil
}

// runCompiledTestHarness executes the compiled test harness and returns all outputs
// The test harness outputs one line per test case
// Enhanced with comprehensive runtime error detection
func (s *Service) runCompiledTestHarness(ctx context.Context, cli *client.Client, containerID string, handler language.LanguageHandler, multipliers language.ResourceMultipliers, baseTimeMs, baseMemoryKb int) (string, int, int, error) {
	// Prepare execution environment
	if err := handler.PrepareExecution(ctx, cli, containerID); err != nil {
		return "", 0, 0, fmt.Errorf("failed to prepare execution: %w", err)
	}

	// Create wrapper script to capture metrics and exit code properly
	adjustedTimeLimit := float64(baseTimeMs) * multipliers.TimeMultiplier / 1000.0
	execCmd := handler.GetExecutableCommand()

	// Use bash time for precise execution timing (millisecond accuracy)
	// Fixed: Remove conflicting file descriptor redirections
	wrapperScript := fmt.Sprintf(`#!/bin/bash
{ time /usr/bin/time -v -o /sandbox/time_output.txt timeout %.2f %s > /sandbox/output.txt 2> /sandbox/program_stderr.txt; } 2> /sandbox/bash_time.txt
PROGRAM_EXIT=$?
echo $PROGRAM_EXIT > /sandbox/exitcode.txt
exit $PROGRAM_EXIT
`, adjustedTimeLimit, execCmd)

	if err := s.copyFileToContainer(ctx, cli, containerID, "run_wrapper.sh", wrapperScript); err != nil {
		return "", 0, 0, fmt.Errorf("failed to create wrapper script: %w", err)
	}

	// Make script executable
	s.execInContainer(ctx, cli, containerID, []string{"chmod", "+x", "/sandbox/run_wrapper.sh"})

	// Run the wrapper script
	startTime := time.Now()
	_, _, _ = s.execInContainer(ctx, cli, containerID, []string{"/bin/bash", "/sandbox/run_wrapper.sh"})
	actualTime := time.Since(startTime)

	// Read the actual exit code from the program (not wrapper's exit code)
	exitCodeStr := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/exitcode.txt")
	exitCodeInt, _ := strconv.Atoi(strings.TrimSpace(exitCodeStr))

	// Read output and error streams
	output := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/output.txt")
	stderr := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/program_stderr.txt")

	// Try to parse bash time first (more accurate for fast programs)
	bashTime := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/bash_time.txt")
	execTime := s.parseBashTime(bashTime)

	// Parse memory from /usr/bin/time -v
	timeMetrics := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/time_output.txt")
	_, memoryUsed := s.parseTimeMetrics(timeMetrics)

	// Fallback to /usr/bin/time if bash time parsing failed
	if execTime == 0 {
		execTime, _ = s.parseTimeMetrics(timeMetrics)
	}

	// Last resort: use actual time if both failed
	if execTime == 0 {
		execTime = int(actualTime.Milliseconds())
	}

	// Check for timeout (exit code 124 from timeout command)
	timeoutOccurred := exitCodeInt == 124 || (execTime > int(adjustedTimeLimit*1000) && execTime > baseTimeMs)

	// Detect runtime errors using enhanced detector
	if exitCodeInt != 0 {
		detector := NewErrorDetector()
		runtimeErr := detector.DetectError(exitCodeInt, stderr, timeoutOccurred)

		// Return error as special format that will be caught in gradeFunctionBased
		errorMsg := fmt.Sprintf("RUNTIME_ERROR:%s|%s|%s", runtimeErr.ErrorType, runtimeErr.Description, runtimeErr.Hint)
		return "", execTime, memoryUsed, fmt.Errorf("%s", errorMsg)
	}

	return strings.TrimSpace(output), execTime, memoryUsed, nil
}

// generateTestHarness creates a test harness that wraps user code with test cases
func (s *Service) generateTestHarness(submission *models.Submission, handler language.LanguageHandler) (string, error) {
	problem := &submission.Problem

	switch submission.Language {
	case "cpp":
		return s.generateCppTestHarness(problem, submission.SourceCode)
	case "python":
		return s.generatePythonTestHarness(problem, submission.SourceCode)
	case "java":
		return s.generateJavaTestHarness(problem, submission.SourceCode)
	default:
		return "", fmt.Errorf("test harness generation not implemented for language: %s", submission.Language)
	}
}
