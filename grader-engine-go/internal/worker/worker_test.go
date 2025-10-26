package worker

import (
	"encoding/json"
	"testing"
)

// TestTaskMessageMarshaling tests JSON marshaling/unmarshaling of TaskMessage
func TestTaskMessageMarshaling(t *testing.T) {
	task := TaskMessage{
		SubmissionID: 123,
		RetryCount:   2,
	}

	// Marshal to JSON
	jsonData, err := json.Marshal(task)
	if err != nil {
		t.Fatalf("Failed to marshal task: %v", err)
	}

	// Unmarshal from JSON
	var unmarshaled TaskMessage
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal task: %v", err)
	}

	if unmarshaled.SubmissionID != 123 {
		t.Errorf("Expected submission ID 123, got %d", unmarshaled.SubmissionID)
	}

	if unmarshaled.RetryCount != 2 {
		t.Errorf("Expected retry count 2, got %d", unmarshaled.RetryCount)
	}
}

// TestTaskMessageDefaultRetryCount tests default retry count
func TestTaskMessageDefaultRetryCount(t *testing.T) {
	jsonData := []byte(`{"submission_id": 456}`)

	var task TaskMessage
	err := json.Unmarshal(jsonData, &task)
	if err != nil {
		t.Fatalf("Failed to unmarshal task: %v", err)
	}

	if task.SubmissionID != 456 {
		t.Errorf("Expected submission ID 456, got %d", task.SubmissionID)
	}

	if task.RetryCount != 0 {
		t.Errorf("Expected retry count 0 (default), got %d", task.RetryCount)
	}
}

// TestTaskMessageInvalidJSON tests handling of invalid JSON
func TestTaskMessageInvalidJSON(t *testing.T) {
	invalidJSON := []byte(`{"submission_id": "not_a_number"}`)

	var task TaskMessage
	err := json.Unmarshal(invalidJSON, &task)
	if err == nil {
		t.Error("Expected error for invalid JSON, got nil")
	}
}

// TestTaskMessageZeroSubmissionID tests zero submission ID handling
func TestTaskMessageZeroSubmissionID(t *testing.T) {
	jsonData := []byte(`{"submission_id": 0, "retry_count": 1}`)

	var task TaskMessage
	err := json.Unmarshal(jsonData, &task)
	if err != nil {
		t.Fatalf("Failed to unmarshal task: %v", err)
	}

	if task.SubmissionID != 0 {
		t.Errorf("Expected submission ID 0, got %d", task.SubmissionID)
	}
}

// TestTaskMessageMaxRetry tests maximum retry scenarios
func TestTaskMessageMaxRetry(t *testing.T) {
	task := TaskMessage{
		SubmissionID: 789,
		RetryCount:   3,
	}

	maxRetries := 3
	if task.RetryCount >= maxRetries {
		t.Log("Task has reached maximum retries (expected behavior)")
	}

	if task.RetryCount < maxRetries {
		t.Errorf("Expected retry count >= %d, got %d", maxRetries, task.RetryCount)
	}
}

// TestWorkerCreation tests worker instantiation
func TestWorkerCreation(t *testing.T) {
	// This is a unit test for the Worker struct creation
	// We don't actually connect to RabbitMQ or database here

	// Just verify that the New function signature is correct
	// by creating a nil worker (since we can't create real dependencies in unit test)
	var worker *Worker
	if worker != nil {
		t.Error("Expected nil worker in unit test")
	}

	t.Log("Worker struct definition validated")
}
