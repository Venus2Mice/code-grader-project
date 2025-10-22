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

// gradeStdio performs stdio-based grading using language handlers
func (s *Service) gradeStdio(submission *models.Submission, containerID string) (*models.GradingResult, error) {
	ctx := context.Background()
	cli, _ := client.NewClientWithOpts(client.FromEnv)
	defer cli.Close()

	submissionID := submission.ID

	log.Printf("[%d] Starting STDIO grading for language: %s", submissionID, submission.Language)

	// Step 1: Get language handler
	registry := language.GetRegistry()
	handler, err := registry.Get(submission.Language)
	if err != nil {
		return nil, fmt.Errorf("unsupported language: %w", err)
	}

	// Check if language supports stdio mode
	if !handler.SupportsStdio() {
		return nil, fmt.Errorf("language %s does not support stdio grading mode", submission.Language)
	}

	log.Printf("[%d] Using language handler: %s", submissionID, handler.GetLanguage())

	// Step 2: Compile/validate code using language handler
	log.Printf("[%d] Compiling/validating source code...", submissionID)
	success, errorMsg, err := handler.Compile(ctx, cli, containerID, submission.SourceCode)
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

	// Step 3: Prepare execution environment (if needed)
	if err := handler.PrepareExecution(ctx, cli, containerID); err != nil {
		return nil, fmt.Errorf("failed to prepare execution: %w", err)
	}

	// Step 4: Run test cases with language-specific settings
	overallStatus := "Accepted"
	results := []models.TestCaseResult{}

	// Get custom limits for this language (or default if not set)
	baseTimeMs, baseMemoryKb := submission.Problem.GetLimitForLanguage(submission.Language)

	// Get resource multipliers for this language
	multipliers := handler.GetResourceMultipliers()

	for i, tc := range submission.Problem.TestCases {
		log.Printf("[%d] Running test case %d/%d...", submissionID, i+1, len(submission.Problem.TestCases))

		result := s.runTestCase(ctx, cli, containerID, &tc, &submission.Problem, submissionID, handler, multipliers, baseTimeMs, baseMemoryKb)
		results = append(results, result)

		if result.Status != "Accepted" && overallStatus == "Accepted" {
			overallStatus = result.Status
		}
	}

	return &models.GradingResult{
		OverallStatus: overallStatus,
		Results:       results,
	}, nil
}

// runTestCase executes a single test case with language-specific handling
func (s *Service) runTestCase(ctx context.Context, cli *client.Client, containerID string,
	tc *models.TestCase, problem *models.Problem, submissionID int,
	handler language.LanguageHandler, multipliers language.ResourceMultipliers,
	baseTimeMs int, baseMemoryKb int) models.TestCaseResult {

	// Copy input data to container
	inputData := tc.InputData
	if inputData == "" {
		inputData = ""
	}

	if err := s.copyFileToContainer(ctx, cli, containerID, "input.txt", inputData); err != nil {
		log.Printf("[%d] Failed to copy input: %v", submissionID, err)
		return models.TestCaseResult{
			TestCaseID:   &tc.ID,
			Status:       "System Error",
			ErrorMessage: fmt.Sprintf("Failed to copy input: %v", err),
		}
	}

	// Create execution wrapper script with adjusted time limit
	// Use base limit (custom or default) then apply language-specific multiplier
	adjustedTimeLimit := float64(baseTimeMs) * multipliers.TimeMultiplier / 1000.0

	// Get executable command from handler
	execCmd := handler.GetExecutableCommand()

	wrapperScript := fmt.Sprintf(`#!/bin/bash
/usr/bin/time -v -o /sandbox/time_output.txt timeout %.2f %s < /sandbox/input.txt > /sandbox/output.txt 2> /sandbox/program_stderr.txt
PROGRAM_EXIT=$?
echo $PROGRAM_EXIT > /sandbox/exitcode.txt
exit $PROGRAM_EXIT
`, adjustedTimeLimit, execCmd)

	if err := s.copyFileToContainer(ctx, cli, containerID, "run_wrapper.sh", wrapperScript); err != nil {
		return models.TestCaseResult{
			TestCaseID:   &tc.ID,
			Status:       "System Error",
			ErrorMessage: "Failed to create wrapper script",
		}
	}

	// Make script executable
	s.execInContainer(ctx, cli, containerID, []string{"chmod", "+x", "/sandbox/run_wrapper.sh"})

	// Execute test
	startTime := time.Now()
	s.execInContainer(ctx, cli, containerID, []string{"/bin/bash", "/sandbox/run_wrapper.sh"})
	actualTime := time.Since(startTime)

	// Read exit code
	exitCode := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/exitcode.txt")
	exitCodeInt, _ := strconv.Atoi(strings.TrimSpace(exitCode))

	// Read output
	output := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/output.txt")
	output = strings.TrimSpace(strings.ReplaceAll(output, "\r\n", "\n"))

	// Read stderr
	stderr := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/program_stderr.txt")

	// Parse time metrics
	timeMetrics := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/time_output.txt")
	execTime, memoryUsed := s.parseTimeMetrics(timeMetrics)

	// Use actual time if parsing failed
	if execTime == 0 {
		execTime = int(actualTime.Milliseconds())
	}

	// Determine status
	expectedOutput := strings.TrimSpace(strings.ReplaceAll(tc.ExpectedOutput, "\r\n", "\n"))

	// Check for timeout
	if exitCodeInt == 124 {
		return models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          "Time Limit Exceeded",
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memoryUsed,
			ErrorMessage:    fmt.Sprintf("Time limit: %dms", problem.TimeLimitMs),
		}
	}

	// Check for runtime errors using enhanced error detection
	if exitCodeInt != 0 {
		// First try language-specific error detection
		errorMsg := handler.ParseRuntimeError(exitCodeInt, stderr)

		// If not detailed, use general error detector
		if errorMsg == fmt.Sprintf("Runtime Error (exit code: %d)", exitCodeInt) || errorMsg == "" {
			detector := NewErrorDetector()
			runtimeErr := detector.DetectError(exitCodeInt, stderr, false)
			if runtimeErr.ErrorType != "" {
				// Format detailed error with hint
				errorMsg = fmt.Sprintf("❌ %s\n\n%s", runtimeErr.ErrorType, runtimeErr.Description)
				if runtimeErr.Hint != "" {
					errorMsg += "\n\n💡 " + runtimeErr.Hint
				}
			}
		}

		return models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          "Runtime Error",
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memoryUsed,
			ErrorMessage:    errorMsg,
		}
	}

	// Check memory limit (use base limit then apply language-specific multiplier and overhead)
	adjustedMemoryLimit := int(float64(baseMemoryKb)*multipliers.MemoryMultiplier) + multipliers.MemoryOverhead
	if memoryUsed > adjustedMemoryLimit {
		return models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          "Memory Limit Exceeded",
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memoryUsed,
			ErrorMessage:    fmt.Sprintf("Used %d KB, limit %d KB", memoryUsed, adjustedMemoryLimit),
		}
	}

	// Compare output
	if output == expectedOutput {
		return models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          "Accepted",
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memoryUsed,
		}
	}

	// Check for presentation error (whitespace differences only)
	if strings.Join(strings.Fields(output), " ") == strings.Join(strings.Fields(expectedOutput), " ") {
		return models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          "Presentation Error",
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memoryUsed,
			OutputReceived:  output,
			ErrorMessage:    "Output differs in whitespace only",
		}
	}

	// Wrong answer
	return models.TestCaseResult{
		TestCaseID:      &tc.ID,
		Status:          "Wrong Answer",
		ExecutionTimeMs: execTime,
		MemoryUsedKb:    memoryUsed,
		OutputReceived:  output,
	}
}

// DEPRECATED: Moved to language handlers
// detectRuntimeError determines the type of runtime error from exit code
func (s *Service) detectRuntimeError(exitCode int, stderr string) string {
	stderrLower := strings.ToLower(stderr)

	switch exitCode {
	case 136:
		return "Floating Point Exception (SIGFPE) - Division by zero or arithmetic error"
	case 139:
		return "Segmentation Fault (SIGSEGV) - Invalid memory access"
	case 134:
		return "Aborted (SIGABRT) - Program called abort()"
	case 137:
		return "Killed (SIGKILL) - Process was killed"
	default:
		// Check stderr for clues
		if strings.Contains(stderrLower, "floating point exception") {
			return "Floating Point Exception"
		}
		if strings.Contains(stderrLower, "segmentation fault") {
			return "Segmentation Fault"
		}
		if strings.Contains(stderrLower, "stack overflow") {
			return "Stack Overflow"
		}
		return fmt.Sprintf("Runtime Error (exit code: %d)", exitCode)
	}
}

// Helper functions will be in helper.go
