package grader

import (
	"context"
	"fmt"
	"log"
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
		// Return single error result
		return &models.GradingResult{
			OverallStatus: "Runtime Error",
			Results: []models.TestCaseResult{
				{
					Status:       "Runtime Error",
					ErrorMessage: fmt.Sprintf("%v", execErr),
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
func (s *Service) runCompiledTestHarness(ctx context.Context, cli *client.Client, containerID string, handler language.LanguageHandler, multipliers language.ResourceMultipliers, baseTimeMs, baseMemoryKb int) (string, int, int, error) {
	// Prepare execution environment
	if err := handler.PrepareExecution(ctx, cli, containerID); err != nil {
		return "", 0, 0, fmt.Errorf("failed to prepare execution: %w", err)
	}

	// Run the executable command
	startTime := time.Now()
	exitCode, output, err := s.execInContainer(ctx, cli, containerID, []string{handler.GetExecutableCommand()})
	execTime := int(time.Since(startTime).Milliseconds())

	if err != nil {
		return "", execTime, 0, err
	}

	if exitCode != 0 {
		return "", execTime, 0, fmt.Errorf("execution failed with exit code: %d", exitCode)
	}

	return output, execTime, 0, nil
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
