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
func (s *GraderService) gradeStructured(submission *models.Submission, containerID string) (*models.GradingResult, error) {
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

	// Step 3: Inject user code into harness directly (no preprocessing needed)
	// LeetCode-style: just wrap user's code in test harness
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
			OverallStatus: models.StatusCompileError,
			Results: []models.TestCaseResult{
				{
					Status:       models.StatusCompileError,
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
	overallStatus := models.StatusAccepted
	results := []models.TestCaseResult{}

	// Get custom limits for this language
	baseTimeMs, baseMemoryKb := submission.Problem.GetLimitForLanguage(submission.Language)
	multipliers := handler.GetResourceMultipliers()

	// FIX #12: Validate resource multipliers are within acceptable range
	if multipliers.TimeMultiplier < 0.1 || multipliers.TimeMultiplier > 10 {
		log.Printf("[%d] WARNING: Invalid time multiplier %f, clamping to valid range", submissionID, multipliers.TimeMultiplier)
		if multipliers.TimeMultiplier < 0.1 {
			multipliers.TimeMultiplier = 0.1
		} else if multipliers.TimeMultiplier > 10 {
			multipliers.TimeMultiplier = 10
		}
	}

	if multipliers.MemoryMultiplier < 0.1 || multipliers.MemoryMultiplier > 10 {
		log.Printf("[%d] WARNING: Invalid memory multiplier %f, clamping to valid range", submissionID, multipliers.MemoryMultiplier)
		if multipliers.MemoryMultiplier < 0.1 {
			multipliers.MemoryMultiplier = 0.1
		} else if multipliers.MemoryMultiplier > 10 {
			multipliers.MemoryMultiplier = 10
		}
	}

	// Compute adjusted memory limit considering language characteristics
	adjustedMemoryKb := int(float64(baseMemoryKb) * multipliers.MemoryMultiplier)
	if multipliers.MemoryOverhead > 0 {
		adjustedMemoryKb += multipliers.MemoryOverhead
	}

	log.Printf("[%d] Running test harness (all %d test cases)...", submissionID, len(submission.Problem.TestCases))

	// Run the compiled program once - it executes all test cases
	allOutputs, execTime, memUsed, execErr := s.runTestHarness(ctx, cli, containerID, handler, multipliers, baseTimeMs, baseMemoryKb)

	// CRITICAL FIX #7: Check if memory limit exceeded BEFORE processing outputs
	if memUsed > adjustedMemoryKb {
		log.Printf("[%d] MEMORY LIMIT EXCEEDED: Used %d KB, limit %d KB (adjusted)", submissionID, memUsed, adjustedMemoryKb)
		return &models.GradingResult{
			OverallStatus: "Memory Limit Exceeded",
			Results: []models.TestCaseResult{
				{
					Status:          "Memory Limit Exceeded",
					ExecutionTimeMs: execTime,
					MemoryUsedKb:    memUsed,
					ErrorMessage:    fmt.Sprintf("Program used %d KB of memory, but limit is %d KB", memUsed, adjustedMemoryKb),
				},
			},
		}, nil
	}

	// FIX #9: Parse output lines even if there's a runtime error
	// This way we can capture partial outputs when program crashes mid-execution
	outputLines := strings.Split(strings.TrimSpace(allOutputs), "\n")

	if execErr != nil {
		log.Printf("[%d] Execution error: %v", submissionID, execErr)

		// Parse runtime error details
		errMsg := execErr.Error()
		errorType := models.StatusRuntimeError
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

		// FIX #9: Try to parse partial outputs if available
		partialResults := []models.TestCaseResult{}
		for i, tc := range submission.Problem.TestCases {
			var outputStr string
			if i < len(outputLines) {
				outputStr = strings.TrimSpace(outputLines[i])
			}

			if outputStr != "" && i < len(outputLines) {
				// Successfully got output for this test case, show what we have
				partialResults = append(partialResults, models.TestCaseResult{
					TestCaseID:      &tc.ID,
					Status:          "Partial Run - " + errorType,
					OutputReceived:  outputStr,
					ExecutionTimeMs: execTime,
					MemoryUsedKb:    memUsed,
					ErrorMessage:    "Program terminated with error before completing all test cases",
				})
			} else {
				// No output for this test case
				partialResults = append(partialResults, models.TestCaseResult{
					TestCaseID:      &tc.ID,
					Status:          errorType,
					ExecutionTimeMs: execTime,
					MemoryUsedKb:    memUsed,
					ErrorMessage:    errorDesc,
				})
			}
		}

		return &models.GradingResult{
			OverallStatus: errorType,
			Results:       partialResults,
		}, nil
	}

	for i, tc := range submission.Problem.TestCases {
		var outputStr string
		if i < len(outputLines) {
			outputStr = strings.TrimSpace(outputLines[i])
		}

		// CRITICAL FIX #1: Check if output is missing (output lines < test cases)
		if outputStr == "" && i >= len(outputLines) {
			log.Printf("[%d] WARNING: Test case %d has no output (program may have crashed)", submissionID, i+1)
			results = append(results, models.TestCaseResult{
				TestCaseID:      &tc.ID,
				Status:          models.StatusSystemError,
				ErrorMessage:    "No output received for this test case - program may have terminated early",
				ExecutionTimeMs: execTime,
				MemoryUsedKb:    memUsed,
			})
			overallStatus = models.StatusSystemError
			continue
		}

		// Parse expected output
		var expectedOutput generator.TestOutput
		if err := json.Unmarshal(tc.ExpectedOutput, &expectedOutput); err != nil {
			log.Printf("[%d] Failed to parse expected output for test case %d: %v", submissionID, i+1, err)
			results = append(results, models.TestCaseResult{
				TestCaseID:   &tc.ID,
				Status:       models.StatusSystemError,
				ErrorMessage: "Failed to parse expected output",
			})
			continue
		}

		// CRITICAL FIX #2: Detect empty output before processing
		if outputStr == "" {
			log.Printf("[%d] WARNING: Test case %d received empty output", submissionID, i+1)
			results = append(results, models.TestCaseResult{
				TestCaseID:      &tc.ID,
				Status:          models.StatusSystemError,
				ErrorMessage:    "Empty output received - program may have encountered an error",
				ExecutionTimeMs: execTime,
				MemoryUsedKb:    memUsed,
			})
			overallStatus = models.StatusSystemError
			continue
		}

		// Check if output contains error
		var outputObj map[string]interface{}
		if err := json.Unmarshal([]byte(outputStr), &outputObj); err == nil {
			if errMsg, hasError := outputObj["error"]; hasError {
				results = append(results, models.TestCaseResult{
					TestCaseID:      &tc.ID,
					Status:          models.StatusRuntimeError,
					ExecutionTimeMs: execTime,
					MemoryUsedKb:    memUsed,
					ErrorMessage:    fmt.Sprintf("%v", errMsg),
				})
				overallStatus = models.StatusRuntimeError
				continue
			}
		}

		// Compare outputs
		// FIX #10: Pass submission ID and test case number for detailed logging
		match := compareOutputsWithLogging(outputStr, expectedOutput, submissionID, i+1)

		status := models.StatusAccepted
		if !match {
			status = models.StatusWrongAnswer
		}

		result := models.TestCaseResult{
			TestCaseID:      &tc.ID,
			Status:          status,
			ExecutionTimeMs: execTime,
			MemoryUsedKb:    memUsed,
			OutputReceived:  outputStr,
		}

		results = append(results, result)

		if status != models.StatusAccepted && overallStatus == models.StatusAccepted {
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
func (s *GraderService) runTestHarness(ctx context.Context, cli *client.Client, containerID string, handler language.LanguageHandler, multipliers language.ResourceMultipliers, baseTimeMs, baseMemoryKb int) (string, int, int, error) {
	adjustedTimeLimit := float64(baseTimeMs) * multipliers.TimeMultiplier / 1000.0
	execCmd := handler.GetExecutableCommand()

	// FIX: Add output size limit to prevent disk fill (10MB limit)
	// This prevents malicious or buggy programs from filling disk with output
	maxOutputBytes := 10 * 1024 * 1024 // 10MB

	// Enhanced wrapper script with output size limit
	wrapperScript := fmt.Sprintf(`#!/bin/bash
{ time /usr/bin/time -v -o /sandbox/time_output.txt timeout %.2f %s 2> /sandbox/program_stderr.txt | head -c %d > /sandbox/output.txt; } 2> /sandbox/bash_time.txt
PROGRAM_EXIT=${PIPESTATUS[1]}
echo $PROGRAM_EXIT > /sandbox/exitcode.txt
exit $PROGRAM_EXIT
`, adjustedTimeLimit, execCmd, maxOutputBytes)

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

	// FIX: Check if output was truncated due to size limit
	if len(output) >= maxOutputBytes {
		return "", execTime, memoryUsed, fmt.Errorf("RUNTIME_ERROR:Output Limit Exceeded|Program produced more than 10MB of output|Optimize your output or reduce the number of print statements")
	}

	// FIX #5: Improve timeout detection logic
	// Priority 1: Exit code 124 = timeout command terminated the process
	timeoutOccurred := exitCodeInt == 124

	// Priority 2: If not caught by timeout command, check against time limit with tolerance
	if !timeoutOccurred && baseTimeMs > 0 {
		adjustedTimeLimitMs := int(adjustedTimeLimit * 1000)
		toleranceMs := 100 // 100ms tolerance for system overhead
		timeoutOccurred = execTime > (adjustedTimeLimitMs + toleranceMs)
	}

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
// FIX #3: Enhanced comparison with type-specific logic and precision handling
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

	case "float", "double":
		// FIX #3: Add epsilon-based comparison for floating point
		actualFloat, ok1 := toFloat(actual)
		expectedFloat, ok2 := toFloat(expected.Value)
		if !ok1 || !ok2 {
			return false
		}
		// Use epsilon comparison: allow up to 1e-9 difference
		epsilon := 1e-9
		return absoluteFloat(actualFloat-expectedFloat) < epsilon

	case "string":
		// FIX #3: Normalize whitespace for string comparison
		actualStr := normalizeString(fmt.Sprintf("%v", actual))
		expectedStr := normalizeString(fmt.Sprintf("%v", expected.Value))
		return actualStr == expectedStr

	case "int[]", "long[]":
		return compareArrays(actual, expected.Value)

	case "string[]":
		return compareArrays(actual, expected.Value)

	case "float[]", "double[]":
		// FIX #3: Add array comparison with epsilon tolerance
		return compareFloatArrays(actual, expected.Value)

	default:
		// Generic comparison
		actualJSON, _ := json.Marshal(actual)
		expectedJSON, _ := json.Marshal(expected.Value)
		return string(actualJSON) == string(expectedJSON)
	}
}

// FIX #10: Wrapper function for compareOutputs with detailed logging
func compareOutputsWithLogging(actualJSON string, expected generator.TestOutput, submissionID int, testCaseNum int) bool {
	match := compareOutputs(actualJSON, expected)

	if !match {
		// Log details about the mismatch for debugging
		log.Printf("[%d] Test case %d mismatch detected:", submissionID, testCaseNum)
		log.Printf("[%d]   Expected type: %s, value: %v", submissionID, expected.Type, expected.Value)
		log.Printf("[%d]   Actual output: %s", submissionID, actualJSON)

		// Try to provide specific debugging info based on type
		switch expected.Type {
		case "int", "long":
			var actualVal interface{}
			if err := json.Unmarshal([]byte(actualJSON), &actualVal); err == nil {
				actualInt, _ := toInt(actualVal)
				expectedInt, _ := toInt(expected.Value)
				log.Printf("[%d]   Difference: actual=%d vs expected=%d", submissionID, actualInt, expectedInt)
			}
		case "float", "double":
			var actualVal interface{}
			if err := json.Unmarshal([]byte(actualJSON), &actualVal); err == nil {
				actualFloat, _ := toFloat(actualVal)
				expectedFloat, _ := toFloat(expected.Value)
				diff := absoluteFloat(actualFloat - expectedFloat)
				log.Printf("[%d]   Difference: actual=%.10f vs expected=%.10f (diff=%.10e)", submissionID, actualFloat, expectedFloat, diff)
			}
		case "string":
			log.Printf("[%d]   String comparison failed (check whitespace/format)", submissionID)
		}
	} else {
		// FIX #10: Log successful matches at debug level
		log.Printf("[%d] Test case %d: PASS (type: %s)", submissionID, testCaseNum, expected.Type)
	}

	return match
}

// Helper functions

// FIX #3: Add float conversion with better error handling
func toFloat(v interface{}) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case float32:
		return float64(val), true
	case int:
		return float64(val), true
	case int64:
		return float64(val), true
	default:
		return 0, false
	}
}

// FIX #3: Add absolute value for float comparison
func absoluteFloat(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// FIX #3: Normalize string by trimming whitespace
func normalizeString(s string) string {
	return strings.TrimSpace(s)
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

// FIX #3: Add float array comparison with epsilon tolerance
func compareFloatArrays(actual, expected interface{}) bool {
	actualArray, ok1 := actual.([]interface{})
	if !ok1 {
		// Fallback to standard comparison if not array
		return compareArrays(actual, expected)
	}

	expectedArray, ok2 := expected.([]interface{})
	if !ok2 {
		return false
	}

	// Check length
	if len(actualArray) != len(expectedArray) {
		return false
	}

	// Compare each element with epsilon tolerance
	epsilon := 1e-9
	for i := range actualArray {
		actualVal, ok1 := toFloat(actualArray[i])
		expectedVal, ok2 := toFloat(expectedArray[i])
		if !ok1 || !ok2 {
			return false
		}
		if absoluteFloat(actualVal-expectedVal) >= epsilon {
			return false
		}
	}

	return true
}
