package grader

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"grader-engine-go/internal/generator"
	"grader-engine-go/internal/grader/language"
	"grader-engine-go/internal/models"

	"github.com/docker/docker/client"
)

// gradeStructured performs LeetCode-style grading with structured inputs
func (s *Service) gradeStructured(submission *models.Submission, containerID string) (*models.GradingResult, error) {
	ctx := context.Background()
	cli, _ := client.NewClientWithOpts(client.FromEnv)
	defer cli.Close()

	submissionID := submission.ID

	log.Printf("[%d] Starting LeetCode-style grading for language: %s", submissionID, submission.Language)

	// Step 1: Get language handler
	registry := language.GetRegistry()
	handler, err := registry.Get(submission.Language)
	if err != nil {
		return nil, fmt.Errorf("unsupported language: %w", err)
	}

	log.Printf("[%d] Using language handler: %s", submissionID, handler.GetLanguage())

	// Step 2: Generate test harness with structured inputs
	log.Printf("[%d] Generating test harness...", submissionID)
	testHarness, err := generator.GenerateTestHarness(&submission.Problem, submission.Language)
	if err != nil {
		return nil, fmt.Errorf("failed to generate test harness: %w", err)
	}

	// Step 3: Inject user code into harness
	log.Printf("[%d] Injecting user code...", submissionID)
	finalCode := generator.InjectUserCode(testHarness, submission.SourceCode, submission.Language)

	// Step 4: Compile
	log.Printf("[%d] Compiling code...", submissionID)
	success, errorMsg, err := handler.Compile(ctx, cli, containerID, finalCode)
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

	// Step 5: Prepare execution
	if err := handler.PrepareExecution(ctx, cli, containerID); err != nil {
		return nil, fmt.Errorf("failed to prepare execution: %w", err)
	}

	// Step 6: Execute and collect results
	overallStatus := "Accepted"
	results := []models.TestCaseResult{}

	// Get custom limits for this language
	baseTimeMs, baseMemoryKb := submission.Problem.GetLimitForLanguage(submission.Language)
	multipliers := handler.GetResourceMultipliers()

	log.Printf("[%d] Running test harness (all %d test cases)...", submissionID, len(submission.Problem.TestCases))

	// Run the compiled program once - it executes all test cases
	allOutputs, execTime, memUsed, execErr := s.runTestHarness(ctx, cli, containerID, handler, multipliers, baseTimeMs, baseMemoryKb)

	if execErr != nil {
		log.Printf("[%d] Execution error: %v", submissionID, execErr)

		// Parse runtime error details
		errMsg := execErr.Error()
		errorType := "Runtime Error"
		errorDesc := errMsg

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

	// Parse outputs: each line is JSON output for one test case
	outputLines := strings.Split(strings.TrimSpace(allOutputs), "\n")

	for i, tc := range submission.Problem.TestCases {
		var outputStr string
		if i < len(outputLines) {
			outputStr = strings.TrimSpace(outputLines[i])
		}

		// Parse expected output
		var expectedOutput generator.TestOutput
		if err := json.Unmarshal(tc.ExpectedOutput, &expectedOutput); err != nil {
			log.Printf("[%d] Failed to parse expected output for test case %d: %v", submissionID, i+1, err)
			results = append(results, models.TestCaseResult{
				TestCaseID:   &tc.ID,
				Status:       "System Error",
				ErrorMessage: "Failed to parse expected output",
			})
			continue
		}

		// Check if output contains error
		var outputObj map[string]interface{}
		if err := json.Unmarshal([]byte(outputStr), &outputObj); err == nil {
			if errMsg, hasError := outputObj["error"]; hasError {
				results = append(results, models.TestCaseResult{
					TestCaseID:      &tc.ID,
					Status:          "Runtime Error",
					ExecutionTimeMs: execTime,
					MemoryUsedKb:    memUsed,
					ErrorMessage:    fmt.Sprintf("%v", errMsg),
				})
				overallStatus = "Runtime Error"
				continue
			}
		}

		// Compare outputs
		match := compareOutputs(outputStr, expectedOutput)

		status := "Accepted"
		if !match {
			status = "Wrong Answer"
		}

		result := models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          status,
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memUsed,
			OutputReceived:  outputStr,
		}

		results = append(results, result)

		if status != "Accepted" && overallStatus == "Accepted" {
			overallStatus = status
		}
	}

	log.Printf("[%d] LeetCode-style grading completed. Status: %s", submissionID, overallStatus)

	return &models.GradingResult{
		OverallStatus: overallStatus,
		Results:       results,
	}, nil
}

// runTestHarness executes the compiled test harness
func (s *Service) runTestHarness(ctx context.Context, cli *client.Client, containerID string, handler language.LanguageHandler, multipliers language.ResourceMultipliers, baseTimeMs, baseMemoryKb int) (string, int, int, error) {
	adjustedTimeLimit := float64(baseTimeMs) * multipliers.TimeMultiplier / 1000.0
	execCmd := handler.GetExecutableCommand()

	// Simplified wrapper script (fixed from previous issue)
	wrapperScript := fmt.Sprintf(`#!/bin/bash
{ time /usr/bin/time -v -o /sandbox/time_output.txt timeout %.2f %s > /sandbox/output.txt 2> /sandbox/program_stderr.txt; } 2> /sandbox/bash_time.txt
PROGRAM_EXIT=$?
echo $PROGRAM_EXIT > /sandbox/exitcode.txt
exit $PROGRAM_EXIT
`, adjustedTimeLimit, execCmd)

	if err := s.copyFileToContainer(ctx, cli, containerID, "run_wrapper.sh", wrapperScript); err != nil {
		return "", 0, 0, fmt.Errorf("failed to create wrapper script: %w", err)
	}

	s.execInContainer(ctx, cli, containerID, []string{"chmod", "+x", "/sandbox/run_wrapper.sh"})

	startTime := time.Now()
	_, _, _ = s.execInContainer(ctx, cli, containerID, []string{"/bin/bash", "/sandbox/run_wrapper.sh"})
	actualTime := time.Since(startTime)

	// Read results
	exitCodeStr := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/exitcode.txt")
	exitCodeInt, _ := strconv.Atoi(strings.TrimSpace(exitCodeStr))

	output := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/output.txt")
	stderr := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/program_stderr.txt")

	// Parse timing
	bashTime := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/bash_time.txt")
	execTime := s.parseBashTime(bashTime)

	timeMetrics := s.readFileFromContainer(ctx, cli, containerID, "/sandbox/time_output.txt")
	_, memoryUsed := s.parseTimeMetrics(timeMetrics)

	if execTime == 0 {
		execTime, _ = s.parseTimeMetrics(timeMetrics)
	}

	if execTime == 0 {
		execTime = int(actualTime.Milliseconds())
	}

	// Check for timeout
	timeoutOccurred := exitCodeInt == 124 || (execTime > int(adjustedTimeLimit*1000) && execTime > baseTimeMs)

	// Detect runtime errors
	if exitCodeInt != 0 {
		detector := NewErrorDetector()
		runtimeErr := detector.DetectError(exitCodeInt, stderr, timeoutOccurred)
		errorMsg := fmt.Sprintf("RUNTIME_ERROR:%s|%s|%s", runtimeErr.ErrorType, runtimeErr.Description, runtimeErr.Hint)
		return "", execTime, memoryUsed, fmt.Errorf("%s", errorMsg)
	}

	return strings.TrimSpace(output), execTime, memoryUsed, nil
}

// compareOutputs compares actual output JSON with expected output
func compareOutputs(actualJSON string, expected generator.TestOutput) bool {
	// Parse actual output
	var actual interface{}
	if err := json.Unmarshal([]byte(actualJSON), &actual); err != nil {
		return false
	}

	// Compare based on type
	switch expected.Type {
	case "int", "long":
		actualInt, ok1 := toInt(actual)
		expectedInt, ok2 := toInt(expected.Value)
		return ok1 && ok2 && actualInt == expectedInt

	case "bool", "boolean":
		actualBool, ok1 := toBool(actual)
		expectedBool, ok2 := toBool(expected.Value)
		return ok1 && ok2 && actualBool == expectedBool

	case "string":
		actualStr := fmt.Sprintf("%v", actual)
		expectedStr := fmt.Sprintf("%v", expected.Value)
		return actualStr == expectedStr

	case "int[]", "long[]":
		return compareArrays(actual, expected.Value)

	case "string[]":
		return compareArrays(actual, expected.Value)

	default:
		// Generic comparison
		actualJSON, _ := json.Marshal(actual)
		expectedJSON, _ := json.Marshal(expected.Value)
		return string(actualJSON) == string(expectedJSON)
	}
}

// Helper functions
func toInt(v interface{}) (int64, bool) {
	switch val := v.(type) {
	case float64:
		return int64(val), true
	case int:
		return int64(val), true
	case int64:
		return val, true
	default:
		return 0, false
	}
}

func toBool(v interface{}) (bool, bool) {
	if b, ok := v.(bool); ok {
		return b, true
	}
	return false, false
}

func compareArrays(actual, expected interface{}) bool {
	actualJSON, err1 := json.Marshal(actual)
	expectedJSON, err2 := json.Marshal(expected)
	if err1 != nil || err2 != nil {
		return false
	}
	return string(actualJSON) == string(expectedJSON)
}
