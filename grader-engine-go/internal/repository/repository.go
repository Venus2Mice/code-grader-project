package repository

import (
	"context"

	"grader-engine-go/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SubmissionRepository defines interface for submission data access
// Following Repository Pattern - abstracts data layer from business logic
type SubmissionRepository interface {
	// GetByIDWithLock fetches a submission by ID with pessimistic lock
	// Used to prevent race conditions during grading
	GetByIDWithLock(ctx context.Context, id int) (*models.Submission, error)

	// GetByID fetches a submission by ID without lock
	GetByID(ctx context.Context, id int) (*models.Submission, error)

	// Update updates a submission
	Update(ctx context.Context, submission *models.Submission) error

	// UpdateStatus updates only the status field
	UpdateStatus(ctx context.Context, id int, status string) error
}

// ProblemRepository defines interface for problem data access
type ProblemRepository interface {
	// GetByID fetches a problem by ID with test cases
	GetByID(ctx context.Context, id int) (*models.Problem, error)

	// GetByIDWithTestCases fetches a problem with all test cases loaded
	GetByIDWithTestCases(ctx context.Context, id int) (*models.Problem, error)
}

// submissionRepository implements SubmissionRepository using GORM
type submissionRepository struct {
	db *gorm.DB
}

// NewSubmissionRepository creates a new submission repository
func NewSubmissionRepository(db *gorm.DB) SubmissionRepository {
	return &submissionRepository{db: db}
}

// GetByIDWithLock fetches submission with pessimistic lock and eager loads problem + test cases
func (r *submissionRepository) GetByIDWithLock(ctx context.Context, id int) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.WithContext(ctx).
		Clauses(clause.Locking{Strength: "UPDATE"}). // Pessimistic lock
		Preload("Problem.TestCases").
		First(&submission, id).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

// GetByID fetches submission without lock
func (r *submissionRepository) GetByID(ctx context.Context, id int) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.WithContext(ctx).
		Preload("Problem.TestCases").
		First(&submission, id).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

// Update updates the submission
func (r *submissionRepository) Update(ctx context.Context, submission *models.Submission) error {
	return r.db.WithContext(ctx).Save(submission).Error
}

// UpdateStatus updates only the status field efficiently
func (r *submissionRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	return r.db.WithContext(ctx).
		Model(&models.Submission{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// problemRepository implements ProblemRepository using GORM
type problemRepository struct {
	db *gorm.DB
}

// NewProblemRepository creates a new problem repository
func NewProblemRepository(db *gorm.DB) ProblemRepository {
	return &problemRepository{db: db}
}

// GetByID fetches problem by ID
func (r *problemRepository) GetByID(ctx context.Context, id int) (*models.Problem, error) {
	var problem models.Problem
	err := r.db.WithContext(ctx).First(&problem, id).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}

// GetByIDWithTestCases fetches problem with test cases
func (r *problemRepository) GetByIDWithTestCases(ctx context.Context, id int) (*models.Problem, error) {
	var problem models.Problem
	err := r.db.WithContext(ctx).
		Preload("TestCases").
		First(&problem, id).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}
