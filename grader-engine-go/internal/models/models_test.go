package models

import (
	"encoding/json"
	"testing"
	"time"
)

// TestSubmissionModel tests the Submission model
func TestSubmissionModel(t *testing.T) {
	submission := Submission{
		ID:          1,
		ProblemID:   100,
		StudentID:   200,
		SourceCode:  "def solution(): pass",
		Language:    "python",
		Status:      "Pending",
		IsTest:      false,
		SubmittedAt: time.Now(),
		CachedScore: 0,
	}

	if submission.ID != 1 {
		t.Errorf("Expected ID 1, got %d", submission.ID)
	}

	if submission.Language != "python" {
		t.Errorf("Expected language python, got %s", submission.Language)
	}

	// Test table name
	tableName := submission.TableName()
	if tableName != "submissions" {
		t.Errorf("Expected table name 'submissions', got '%s'", tableName)
	}
}

// TestProblemModel tests the Problem model
func TestProblemModel(t *testing.T) {
	problem := Problem{
		ID:                1,
		ClassID:           10,
		Title:             "Two Sum",
		Description:       "Find two numbers that add up to target",
		Difficulty:        "easy",
		FunctionSignature: "def twoSum(nums: List[int], target: int) -> List[int]:",
		FunctionName:      "twoSum",
		TimeLimitMs:       1000,
		MemoryLimitKb:     256000,
		CreatedAt:         time.Now(),
	}

	if problem.Title != "Two Sum" {
		t.Errorf("Expected title 'Two Sum', got '%s'", problem.Title)
	}

	// Test table name
	tableName := problem.TableName()
	if tableName != "problems" {
		t.Errorf("Expected table name 'problems', got '%s'", tableName)
	}
}

// TestTestCaseModel tests the TestCase model
func TestTestCaseModel(t *testing.T) {
	inputs := json.RawMessage(`[{"type": "int[]", "value": [1,2,3]}, {"type": "int", "value": 9}]`)
	expectedOutput := json.RawMessage(`{"type": "int[]", "value": [0,1]}`)

	testCase := TestCase{
		ID:             1,
		ProblemID:      100,
		Inputs:         inputs,
		ExpectedOutput: expectedOutput,
		IsHidden:       false,
		Points:         10,
	}

	if testCase.Points != 10 {
		t.Errorf("Expected points 10, got %d", testCase.Points)
	}

	// Test JSON fields can be unmarshaled
	var inputsArray []map[string]interface{}
	err := json.Unmarshal(testCase.Inputs, &inputsArray)
	if err != nil {
		t.Errorf("Failed to unmarshal inputs: %v", err)
	}

	if len(inputsArray) != 2 {
		t.Errorf("Expected 2 inputs, got %d", len(inputsArray))
	}

	// Test table name
	tableName := testCase.TableName()
	if tableName != "test_cases" {
		t.Errorf("Expected table name 'test_cases', got '%s'", tableName)
	}
}

// TestSubmissionResultModel tests the SubmissionResult model
func TestSubmissionResultModel(t *testing.T) {
	testCaseID := 1
	result := SubmissionResult{
		ID:              1,
		SubmissionID:    100,
		TestCaseID:      &testCaseID,
		Status:          "Accepted",
		ExecutionTimeMs: 50,
		MemoryUsedKb:    1024,
		OutputReceived:  `[0, 1]`,
		ErrorMessage:    "",
	}

	if result.Status != "Accepted" {
		t.Errorf("Expected status 'Accepted', got '%s'", result.Status)
	}

	if *result.TestCaseID != 1 {
		t.Errorf("Expected test case ID 1, got %d", *result.TestCaseID)
	}

	// Test table name
	tableName := result.TableName()
	if tableName != "submission_results" {
		t.Errorf("Expected table name 'submission_results', got '%s'", tableName)
	}
}

// TestGradingResult tests the GradingResult structure
func TestGradingResult(t *testing.T) {
	testCaseID := 1
	result := GradingResult{
		OverallStatus: "Accepted",
		Results: []TestCaseResult{
			{
				TestCaseID:      &testCaseID,
				Status:          "Accepted",
				ExecutionTimeMs: 50,
				MemoryUsedKb:    1024,
				OutputReceived:  `[0, 1]`,
			},
		},
	}

	if result.OverallStatus != "Accepted" {
		t.Errorf("Expected overall status 'Accepted', got '%s'", result.OverallStatus)
	}

	if len(result.Results) != 1 {
		t.Errorf("Expected 1 result, got %d", len(result.Results))
	}
}

// TestLanguageLimits tests language-specific limits
func TestLanguageLimits(t *testing.T) {
	limits := LanguageLimits{
		"cpp": LanguageLimit{
			TimeMs:   1000,
			MemoryKb: 65536,
		},
		"python": LanguageLimit{
			TimeMs:   5000,
			MemoryKb: 131072,
		},
		"java": LanguageLimit{
			TimeMs:   3000,
			MemoryKb: 131072,
		},
	}

	// Test Value() for database storage
	value, err := limits.Value()
	if err != nil {
		t.Errorf("Failed to convert limits to value: %v", err)
	}

	if value == nil {
		t.Error("Expected non-nil value")
	}

	// Test Scan() for database retrieval
	var scannedLimits LanguageLimits
	jsonBytes, _ := json.Marshal(limits)
	err = scannedLimits.Scan(jsonBytes)
	if err != nil {
		t.Errorf("Failed to scan limits: %v", err)
	}

	if scannedLimits["cpp"].TimeMs != 1000 {
		t.Errorf("Expected cpp time limit 1000, got %d", scannedLimits["cpp"].TimeMs)
	}
}

// TestGetLimitForLanguage tests language-specific limit retrieval
func TestGetLimitForLanguage(t *testing.T) {
	problem := Problem{
		TimeLimitMs:   1000,
		MemoryLimitKb: 65536,
		LanguageLimits: LanguageLimits{
			"python": LanguageLimit{
				TimeMs:   5000,
				MemoryKb: 131072,
			},
		},
	}

	// Test custom limit for Python
	timeMs, memoryKb := problem.GetLimitForLanguage("python")
	if timeMs != 5000 {
		t.Errorf("Expected Python time limit 5000, got %d", timeMs)
	}
	if memoryKb != 131072 {
		t.Errorf("Expected Python memory limit 131072, got %d", memoryKb)
	}

	// Test default limit for C++
	timeMs, memoryKb = problem.GetLimitForLanguage("cpp")
	if timeMs != 1000 {
		t.Errorf("Expected C++ time limit 1000 (default), got %d", timeMs)
	}
	if memoryKb != 65536 {
		t.Errorf("Expected C++ memory limit 65536 (default), got %d", memoryKb)
	}

	// Test default limit for unknown language
	timeMs, memoryKb = problem.GetLimitForLanguage("rust")
	if timeMs != 1000 {
		t.Errorf("Expected Rust time limit 1000 (default), got %d", timeMs)
	}
	if memoryKb != 65536 {
		t.Errorf("Expected Rust memory limit 65536 (default), got %d", memoryKb)
	}
}

// TestLanguageLimitsScanNil tests scanning nil values
func TestLanguageLimitsScanNil(t *testing.T) {
	var limits LanguageLimits
	err := limits.Scan(nil)
	if err != nil {
		t.Errorf("Failed to scan nil: %v", err)
	}

	if limits == nil {
		t.Error("Expected empty map, got nil")
	}
}

// TestLanguageLimitsValueNil tests nil value conversion
func TestLanguageLimitsValueNil(t *testing.T) {
	var limits LanguageLimits
	value, err := limits.Value()
	if err != nil {
		t.Errorf("Failed to convert nil limits: %v", err)
	}

	if value != nil {
		t.Errorf("Expected nil value, got %v", value)
	}
}
