package grader

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"grader-engine-go/internal/analyzer"
	"grader-engine-go/internal/config"
	"grader-engine-go/internal/models"
	"grader-engine-go/internal/pool"

	"github.com/docker/docker/client"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// GraderService handles the grading logic
// Renamed from Service to avoid confusion with the interface
type GraderService struct {
	config *config.Config
	db     *gorm.DB
	pool   pool.ContainerPool // Use interface instead of concrete type
}

// NewService creates a new grading service
// Returns the interface type for dependency inversion
func NewService(cfg *config.Config, db *gorm.DB, containerPool pool.ContainerPool) Service {
	return &GraderService{
		config: cfg,
		db:     db,
		pool:   containerPool,
	}
}

// GradeSubmission grades a single submission
func (s *GraderService) GradeSubmission(submissionID int) (*models.GradingResult, error) {
	log.Printf("[%d] Starting grading process...", submissionID)

	// FIX #11: Use pessimistic locking to prevent race conditions
	// Fetch submission with exclusive lock and eager loading
	var submission models.Submission
	err := s.db.WithContext(context.Background()).
		Clauses(clause.Locking{Strength: "UPDATE"}). // Pessimistic lock
		Preload("Problem.TestCases").
		First(&submission, submissionID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch submission: %w", err)
	}

	if submission.Problem.ID == 0 {
		return nil, fmt.Errorf("problem not found for submission %d", submissionID)
	}

	log.Printf("[%d] Problem: %s, Test cases: %d",
		submissionID, submission.Problem.Title, len(submission.Problem.TestCases))

	// Get container from pool
	containerID, err := s.pool.Get(10 * time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to get container from pool: %w", err)
	}
	defer s.pool.Return(containerID)

	log.Printf("[%d] Got container: %s", submissionID, containerID[:12])

	// Initialize result with system error status (will be updated if successful)
	result := &models.GradingResult{
		OverallStatus: models.StatusSystemError,
		Results:       []models.TestCaseResult{},
	}

	// Run static code analysis for all supported languages
	var qualityMetrics *models.QualityMetrics
	if analyzer.ShouldAnalyze(submission.Language) {
		log.Printf("[%d] Running code quality analysis...", submissionID)
		
		// Create Docker client for analyzer
		cli, err := client.NewClientWithOpts(client.FromEnv, client.WithVersion("1.44"))
		if err != nil {
			log.Printf("[%d] Failed to create Docker client for analyzer: %v", submissionID, err)
		} else {
			defer cli.Close()
			
			// Get analyzer for language
			analyzerFactory := analyzer.NewFactory(containerID, cli)
			codeAnalyzer, err := analyzerFactory.GetAnalyzer(submission.Language)
			if err != nil {
				log.Printf("[%d] Failed to get analyzer: %v", submissionID, err)
			} else {
				// Run analysis
				analysisResult, err := codeAnalyzer.AnalyzeCode(submission.SourceCode, submission.Language)
				if err != nil {
					log.Printf("[%d] Code analysis failed: %v", submissionID, err)
				} else {
					// Convert analyzer.AnalysisResult to models.QualityMetrics
					qualityMetrics = convertAnalysisResult(analysisResult)
					log.Printf("[%d] Code quality analysis complete: score=%d", submissionID, qualityMetrics.QualityScore)
				}
			}
		}
	}

	// Use unified LeetCode-style grading
	result, err = s.gradeStructured(&submission, containerID)

	if err != nil {
		log.Printf("[%d] Grading error: %v", submissionID, err)
		result = &models.GradingResult{
			OverallStatus: models.StatusSystemError,
			Results: []models.TestCaseResult{
				{
					Status:       models.StatusSystemError,
					ErrorMessage: err.Error(),
				},
			},
		}
	}

	// Attach quality metrics to result
	result.QualityMetrics = qualityMetrics

	// Update backend asynchronously
	go s.updateBackend(submissionID, result)

	return result, nil
}

// updateBackend sends grading result to backend API
func (s *GraderService) updateBackend(submissionID int, result *models.GradingResult) {
	url := fmt.Sprintf("%s/internal/submissions/%d/result", s.config.BackendAPIURL, submissionID)

	jsonData, err := json.Marshal(result)
	if err != nil {
		log.Printf("[%d] Failed to marshal result: %v", submissionID, err)
		return
	}

	maxRetries := 3
	for attempt := 0; attempt < maxRetries; attempt++ {
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
		if err == nil && resp.StatusCode < 300 {
			resp.Body.Close()
			log.Printf("[%d] ✅ Backend updated successfully", submissionID)
			return
		}

		if resp != nil {
			resp.Body.Close()
		}

		if attempt < maxRetries-1 {
			waitTime := time.Duration(1<<uint(attempt)) * time.Second
			log.Printf("[%d] ⚠️  Backend update failed (attempt %d/%d), retrying in %v...",
				submissionID, attempt+1, maxRetries, waitTime)
			time.Sleep(waitTime)
		}
	}

	log.Printf("[%d] ❌ Failed to update backend after %d attempts", submissionID, maxRetries)
}

// convertAnalysisResult converts analyzer.AnalysisResult to models.QualityMetrics
func convertAnalysisResult(analysisResult *analyzer.AnalysisResult) *models.QualityMetrics {
	issues := make([]models.QualityIssue, len(analysisResult.Issues))
	for i, issue := range analysisResult.Issues {
		issues[i] = models.QualityIssue{
			Line:     issue.Line,
			Column:   issue.Column,
			Severity: issue.Severity,
			Category: issue.Category,
			Message:  issue.Message,
			Code:     issue.Code,
		}
	}

	return &models.QualityMetrics{
		QualityScore:    analysisResult.QualityScore,
		ComplexityScore: analysisResult.ComplexityScore,
		StyleScore:      analysisResult.StyleScore,
		SecurityScore:   analysisResult.SecurityScore,
		Issues:          issues,
		Metrics: models.ComplexityMetrics{
			CyclomaticComplexity: analysisResult.Metrics.CyclomaticComplexity,
			CognitiveComplexity:  analysisResult.Metrics.CognitiveComplexity,
			MaxNestingDepth:      analysisResult.Metrics.MaxNestingDepth,
			FunctionLength:       analysisResult.Metrics.FunctionLength,
			CommentLines:         analysisResult.Metrics.CommentLines,
			MaintainabilityIndex: analysisResult.Metrics.MaintainabilityIndex,
		},
	}
}

