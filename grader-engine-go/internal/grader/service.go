package grader

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"grader-engine-go/internal/config"
	"grader-engine-go/internal/models"
	"grader-engine-go/internal/pool"

	"gorm.io/gorm"
)

// Service handles the grading logic
type Service struct {
	config *config.Config
	db     *gorm.DB
	pool   *pool.ContainerPool
}

// NewService creates a new grading service
func NewService(cfg *config.Config, db *gorm.DB, containerPool *pool.ContainerPool) *Service {
	return &Service{
		config: cfg,
		db:     db,
		pool:   containerPool,
	}
}

// GradeSubmission grades a single submission
func (s *Service) GradeSubmission(submissionID int) (*models.GradingResult, error) {
	log.Printf("[%d] Starting grading process...", submissionID)

	// Fetch submission with eager loading
	var submission models.Submission
	err := s.db.Preload("Problem.TestCases").First(&submission, submissionID).Error
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

	// Initialize result
	result := &models.GradingResult{
		OverallStatus: "System Error",
		Results:       []models.TestCaseResult{},
	}

	// Use unified LeetCode-style grading
	result, err = s.gradeStructured(&submission, containerID)

	if err != nil {
		log.Printf("[%d] Grading error: %v", submissionID, err)
		result = &models.GradingResult{
			OverallStatus: "System Error",
			Results: []models.TestCaseResult{
				{
					Status:       "System Error",
					ErrorMessage: err.Error(),
				},
			},
		}
	}

	// Update backend asynchronously
	go s.updateBackend(submissionID, result)

	return result, nil
}

// updateBackend sends grading result to backend API
func (s *Service) updateBackend(submissionID int, result *models.GradingResult) {
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
