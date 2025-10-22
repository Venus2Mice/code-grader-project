package grader

import (
	"context"
	"fmt"
	"log"

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

	// Step 5: Run test cases with language-specific settings
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

	log.Printf("[%d] Function grading completed. Status: %s", submissionID, overallStatus)

	return &models.GradingResult{
		OverallStatus: overallStatus,
		Results:       results,
	}, nil
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
