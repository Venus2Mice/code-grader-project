package grader

import (
	"grader-engine-go/internal/models"
)

// Service interface defines the contract for grading operations
// Following Interface Segregation Principle - focused, minimal interface
// This allows for:
// - Easy mocking in tests
// - Multiple implementations (e.g., different grading strategies)
// - Dependency Inversion - high-level modules depend on abstraction
type Service interface {
	// GradeSubmission grades a single submission and returns the result
	GradeSubmission(submissionID int) (*models.GradingResult, error)
}

// Ensure *GraderService implements Service interface at compile time
var _ Service = (*GraderService)(nil)
