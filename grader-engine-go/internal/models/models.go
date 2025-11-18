package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// Submission represents a student's code submission
type Submission struct {
	ID          int       `gorm:"primaryKey"`
	ProblemID   int       `gorm:"column:problem_id;not null"`
	StudentID   int       `gorm:"column:student_id;not null"`
	SourceCode  string    `gorm:"column:source_code;type:text;not null"`
	Language    string    `gorm:"column:language;size:50;not null;default:'cpp'"`
	Status      string    `gorm:"column:status;size:50;default:'Pending'"`
	IsTest      bool      `gorm:"column:is_test;default:false"`
	SubmittedAt time.Time `gorm:"column:submitted_at;default:CURRENT_TIMESTAMP"`
	CachedScore int       `gorm:"column:cached_score;default:0"`

	// Associations
	Problem Problem            `gorm:"foreignKey:ProblemID"`
	Results []SubmissionResult `gorm:"foreignKey:SubmissionID"`
}

func (Submission) TableName() string {
	return "submissions"
}

// Problem represents a programming problem
type Problem struct {
	ID                int             `gorm:"primaryKey"`
	ClassID           int             `gorm:"column:class_id;not null"`
	Title             string          `gorm:"column:title;size:255;not null"`
	Description       string          `gorm:"column:description;type:text"`
	MarkdownContent   *string         `gorm:"column:markdown_content;type:text"` // NEW: Optional markdown content
	Difficulty        string          `gorm:"column:difficulty;size:20;default:'medium'"`
	FunctionSignature *string         `gorm:"column:function_signature;type:text"`       // DEPRECATED: Optional for backward compatibility
	FunctionName      string          `gorm:"column:function_name;size:100;not null"`    // NEW: Teacher-defined function name
	ReturnType        string          `gorm:"column:return_type;size:100;default:'int'"` // NEW: Return type (e.g., "int", "int[]", "string")
	Parameters        json.RawMessage `gorm:"column:parameters;type:jsonb;default:'[]'"` // NEW: [{"name": "param1", "type": "int[]"}, {...}]
	ParameterTypes    json.RawMessage `gorm:"column:parameter_types;type:jsonb"`         // DEPRECATED: kept for backward compatibility
	TimeLimitMs       int             `gorm:"column:time_limit_ms;default:1000"`
	MemoryLimitKb     int             `gorm:"column:memory_limit_kb;default:256000"`
	LanguageLimits    LanguageLimits  `gorm:"column:language_limits;type:jsonb"` // Language-specific limits
	DueDate           *time.Time      `gorm:"column:due_date"`
    CreatedAt         time.Time       `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	
	// Code quality grading configuration
	QualityWeight        int  `gorm:"column:quality_weight;default:40"`

	// Associations
	TestCases []TestCase `gorm:"foreignKey:ProblemID"`
}

func (Problem) TableName() string {
	return "problems"
}

// TestCase represents a test case for a problem
type TestCase struct {
	ID             int             `gorm:"primaryKey"`
	ProblemID      int             `gorm:"column:problem_id;not null"`
	Inputs         json.RawMessage `gorm:"column:inputs;type:jsonb;not null"`          // Array of {type, value}
	ExpectedOutput json.RawMessage `gorm:"column:expected_output;type:jsonb;not null"` // {type, value}
	IsHidden       bool            `gorm:"column:is_hidden;default:false"`
	Points         int             `gorm:"column:points;default:10"`
}

func (TestCase) TableName() string {
	return "test_cases"
}

// SubmissionResult represents the result of running a test case
type SubmissionResult struct {
	ID              int    `gorm:"primaryKey"`
	SubmissionID    int    `gorm:"column:submission_id;not null"`
	TestCaseID      *int   `gorm:"column:test_case_id"`
	Status          string `gorm:"column:status;size:50;not null"`
	ExecutionTimeMs int    `gorm:"column:execution_time_ms"`
	MemoryUsedKb    int    `gorm:"column:memory_used_kb"`
	OutputReceived  string `gorm:"column:output_received;type:text"`
	ErrorMessage    string `gorm:"column:error_message;type:text"`
}

func (SubmissionResult) TableName() string {
	return "submission_results"
}

// GradingResult represents the overall grading result
type GradingResult struct {
	OverallStatus  string           `json:"overall_status"`
	Results        []TestCaseResult `json:"results"`
	QualityMetrics *QualityMetrics  `json:"quality_metrics,omitempty"` // NEW: Code quality analysis
}

// QualityMetrics represents code quality analysis results
type QualityMetrics struct {
	QualityScore    int               `json:"quality_score"`
	ComplexityScore int               `json:"complexity_score"`
	StyleScore      int               `json:"style_score"`
	SecurityScore   int               `json:"security_score"`
	Issues          []QualityIssue    `json:"issues"`
	Metrics         ComplexityMetrics `json:"metrics"`
}

// QualityIssue represents a single code quality issue
type QualityIssue struct {
	Line     int    `json:"line"`
	Column   int    `json:"column,omitempty"`
	Severity string `json:"severity"` // "error", "warning", "info"
	Category string `json:"category"` // "style", "complexity", "security", "best-practice"
	Message  string `json:"message"`
	Code     string `json:"code,omitempty"`
}

// ComplexityMetrics holds code complexity measurements
type ComplexityMetrics struct {
	CyclomaticComplexity int     `json:"cyclomatic_complexity"`
	CognitiveComplexity  int     `json:"cognitive_complexity,omitempty"`
	MaxNestingDepth      int     `json:"max_nesting_depth"`
	FunctionLength       int     `json:"function_length"`
	CommentLines         int     `json:"comment_lines"`
	MaintainabilityIndex float64 `json:"maintainability_index,omitempty"`
}

// TestCaseResult represents the result of a single test case
type TestCaseResult struct {
	TestCaseID      *int   `json:"test_case_id"`
	Status          string `json:"status"`
	ExecutionTimeMs int    `json:"execution_time_ms"`
	MemoryUsedKb    int    `json:"memory_used_kb"`
	OutputReceived  string `json:"output_received,omitempty"`
	ErrorMessage    string `json:"error_message,omitempty"`
}

// LanguageLimits holds language-specific time and memory limits
// Stored as JSONB in PostgreSQL: {"cpp": {"timeMs": 1000, "memoryKb": 65536}, "python": {...}}
type LanguageLimits map[string]LanguageLimit

// LanguageLimit defines limits for a specific language
type LanguageLimit struct {
	TimeMs   int `json:"timeMs"`
	MemoryKb int `json:"memoryKb"`
}

// Value implements driver.Valuer for database storage
func (ll LanguageLimits) Value() (driver.Value, error) {
	if ll == nil {
		return nil, nil
	}
	return json.Marshal(ll)
}

// Scan implements sql.Scanner for database retrieval
func (ll *LanguageLimits) Scan(value interface{}) error {
	if value == nil {
		*ll = make(LanguageLimits)
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, ll)
}

// GetLimitForLanguage returns custom limit for language, or default if not set
func (p *Problem) GetLimitForLanguage(language string) (timeMs int, memoryKb int) {
	// Check if custom limit exists for this language
	if limit, exists := p.LanguageLimits[language]; exists {
		return limit.TimeMs, limit.MemoryKb
	}

	// Return default limits
	return p.TimeLimitMs, p.MemoryLimitKb
}
