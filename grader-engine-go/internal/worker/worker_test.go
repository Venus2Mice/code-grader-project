package worker

import (
	"encoding/json"
	"errors"
	"testing"
	"time"

	"grader-engine-go/internal/config"
	"grader-engine-go/internal/models"

	"github.com/streadway/amqp"
	"gorm.io/gorm"
)

// MockGraderService is a mock implementation of GraderService for testing
type MockGraderService struct {
	GradeFunc func(submissionID int) (*models.GradingResult, error)
}

func (m *MockGraderService) GradeSubmission(submissionID int) (*models.GradingResult, error) {
	if m.GradeFunc != nil {
		return m.GradeFunc(submissionID)
	}
	return &models.GradingResult{
		OverallStatus: models.StatusAccepted,
		Results:       []models.TestCaseResult{},
	}, nil
}

// MockAPIServer is a mock implementation for metrics tracking
type MockAPIServer struct {
	TaskCount int
}

func (m *MockAPIServer) IncrementTaskCounter() {
	m.TaskCount++
}

// MockContainerPool is a mock implementation of ContainerPool interface
type MockContainerPool struct {
	GetFunc              func(timeout time.Duration) (string, error)
	ReturnFunc           func(containerID string) error
	ShutdownFunc         func()
	StatsFunc            func() map[string]interface{}
	GetSizeFunc          func() int
	GetAvailableCountFunc func() int
}

func (m *MockContainerPool) Get(timeout time.Duration) (string, error) {
	if m.GetFunc != nil {
		return m.GetFunc(timeout)
	}
	return "mock-container-id", nil
}

func (m *MockContainerPool) Return(containerID string) error {
	if m.ReturnFunc != nil {
		return m.ReturnFunc(containerID)
	}
	return nil
}

func (m *MockContainerPool) Shutdown() {
	if m.ShutdownFunc != nil {
		m.ShutdownFunc()
	}
}

func (m *MockContainerPool) GetCleanupStats() map[string]interface{} {
	if m.StatsFunc != nil {
		return m.StatsFunc()
	}
	return map[string]interface{}{}
}

func (m *MockContainerPool) GetSize() int {
	if m.GetSizeFunc != nil {
		return m.GetSizeFunc()
	}
	return 5
}

func (m *MockContainerPool) GetAvailableCount() int {
	if m.GetAvailableCountFunc != nil {
		return m.GetAvailableCountFunc()
	}
	return 5
}

// MockChannel is a mock implementation of RabbitMQChannel interface
type MockChannel struct {
	PublishFunc      func(exchange, key string, mandatory, immediate bool, msg amqp.Publishing) error
	QueueDeclareFunc func(name string, durable, autoDelete, exclusive, noWait bool, args amqp.Table) (amqp.Queue, error)
	QosFunc          func(prefetchCount, prefetchSize int, global bool) error
	ConsumeFunc      func(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error)
	CloseFunc        func() error
}

func (m *MockChannel) Publish(exchange, key string, mandatory, immediate bool, msg amqp.Publishing) error {
	if m.PublishFunc != nil {
		return m.PublishFunc(exchange, key, mandatory, immediate, msg)
	}
	return nil
}

func (m *MockChannel) QueueDeclare(name string, durable, autoDelete, exclusive, noWait bool, args amqp.Table) (amqp.Queue, error) {
	if m.QueueDeclareFunc != nil {
		return m.QueueDeclareFunc(name, durable, autoDelete, exclusive, noWait, args)
	}
	return amqp.Queue{Name: name}, nil
}

func (m *MockChannel) Qos(prefetchCount, prefetchSize int, global bool) error {
	if m.QosFunc != nil {
		return m.QosFunc(prefetchCount, prefetchSize, global)
	}
	return nil
}

func (m *MockChannel) Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args amqp.Table) (<-chan amqp.Delivery, error) {
	if m.ConsumeFunc != nil {
		return m.ConsumeFunc(queue, consumer, autoAck, exclusive, noLocal, noWait, args)
	}
	ch := make(chan amqp.Delivery)
	close(ch)
	return ch, nil
}

func (m *MockChannel) Close() error {
	if m.CloseFunc != nil {
		return m.CloseFunc()
	}
	return nil
}

// MockAcknowledger implements amqp.Acknowledger interface
type MockAcknowledger struct {
	AckCalled  bool
	NackCalled bool
	Requeue    bool
	Multiple   bool
	Tag        uint64
}

func (m *MockAcknowledger) Ack(tag uint64, multiple bool) error {
	m.AckCalled = true
	m.Tag = tag
	m.Multiple = multiple
	return nil
}

func (m *MockAcknowledger) Nack(tag uint64, multiple, requeue bool) error {
	m.NackCalled = true
	m.Tag = tag
	m.Multiple = multiple
	m.Requeue = requeue
	return nil
}

func (m *MockAcknowledger) Reject(tag uint64, requeue bool) error {
	return nil
}

// NewMockDelivery creates a mock amqp.Delivery with tracking
func NewMockDelivery(body []byte) (amqp.Delivery, *MockAcknowledger) {
	acker := &MockAcknowledger{}
	return amqp.Delivery{
		Body:         body,
		Acknowledger: acker,
	}, acker
}

// Test Worker.New() constructor
func TestWorkerNew(t *testing.T) {
	cfg := &config.Config{
		RabbitMQHost:  "localhost",
		RabbitMQQueue: "test_queue",
		DatabaseURL:   "mock://db",
	}

	mockDB := &gorm.DB{}
	mockPool := &MockContainerPool{}

	worker := New(cfg, mockDB, mockPool)

	if worker == nil {
		t.Fatal("Expected worker to be created, got nil")
	}

	if worker.config != cfg {
		t.Error("Worker config not set correctly")
	}

	if worker.db != mockDB {
		t.Error("Worker db not set correctly")
	}

	if worker.pool == nil {
		t.Error("Worker pool not set correctly")
	}

	if worker.apiServer != nil {
		t.Error("Worker apiServer should be nil initially")
	}
}

// Test Worker.SetAPIServer()
func TestWorkerSetAPIServer(t *testing.T) {
	cfg := &config.Config{}
	mockGraderService := &MockGraderService{}
	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)

	mockAPI := &MockAPIServer{}
	worker.SetAPIServer(mockAPI)

	if worker.apiServer != mockAPI {
		t.Error("API server not set correctly")
	}
}

// Test TaskMessage JSON marshaling/unmarshaling
func TestTaskMessageJSON(t *testing.T) {
	tests := []struct {
		name    string
		task    TaskMessage
		wantErr bool
	}{
		{
			name: "Valid task message",
			task: TaskMessage{
				SubmissionID: 123,
				RetryCount:   0,
				IsTest:       false,
			},
			wantErr: false,
		},
		{
			name: "Task with retry count",
			task: TaskMessage{
				SubmissionID: 456,
				RetryCount:   2,
				IsTest:       true,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Marshal
			jsonData, err := json.Marshal(tt.task)
			if err != nil {
				t.Fatalf("Failed to marshal: %v", err)
			}

			// Unmarshal
			var decoded TaskMessage
			err = json.Unmarshal(jsonData, &decoded)
			if (err != nil) != tt.wantErr {
				t.Errorf("Unmarshal error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr {
				if decoded.SubmissionID != tt.task.SubmissionID {
					t.Errorf("SubmissionID = %v, want %v", decoded.SubmissionID, tt.task.SubmissionID)
				}
				if decoded.RetryCount != tt.task.RetryCount {
					t.Errorf("RetryCount = %v, want %v", decoded.RetryCount, tt.task.RetryCount)
				}
				if decoded.IsTest != tt.task.IsTest {
					t.Errorf("IsTest = %v, want %v", decoded.IsTest, tt.task.IsTest)
				}
			}
		})
	}
}

// Test handleMessage with valid submission
func TestHandleMessageValidSubmission(t *testing.T) {
	cfg := &config.Config{
		RabbitMQQueue: "test_queue",
	}

	mockGraded := false
	mockGraderService := &MockGraderService{
		GradeFunc: func(submissionID int) (*models.GradingResult, error) {
			mockGraded = true
			if submissionID != 123 {
				t.Errorf("Expected submission ID 123, got %d", submissionID)
			}
			return &models.GradingResult{
				OverallStatus: models.StatusAccepted,
				Results:       []models.TestCaseResult{},
			}, nil
		},
	}

	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)

	mockAPI := &MockAPIServer{}
	worker.SetAPIServer(mockAPI)

	// Create valid message
	task := TaskMessage{
		SubmissionID: 123,
		RetryCount:   0,
		IsTest:       false,
	}
	jsonData, _ := json.Marshal(task)

	delivery, acker := NewMockDelivery(jsonData)

	// Handle message
	worker.handleMessage(delivery)

	// Verify
	if !mockGraded {
		t.Error("Expected grading to be called")
	}

	if mockAPI.TaskCount != 1 {
		t.Errorf("Expected task counter to be 1, got %d", mockAPI.TaskCount)
	}

	if !acker.AckCalled {
		t.Error("Expected message to be acknowledged")
	}

	if acker.NackCalled {
		t.Error("Expected message not to be nacked")
	}
}

// Test handleMessage with invalid JSON
func TestHandleMessageInvalidJSON(t *testing.T) {
	cfg := &config.Config{}
	mockGraderService := &MockGraderService{}
	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)

	delivery, acker := NewMockDelivery([]byte("invalid json {{{"))

	worker.handleMessage(delivery)

	if acker.AckCalled {
		t.Error("Expected message not to be acknowledged")
	}

	if !acker.NackCalled {
		t.Error("Expected message to be nacked")
	}

	if acker.Requeue {
		t.Error("Expected message not to be requeued")
	}
}

// Test handleMessage with invalid submission ID
func TestHandleMessageInvalidSubmissionID(t *testing.T) {
	cfg := &config.Config{}
	mockGraderService := &MockGraderService{}
	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)

	task := TaskMessage{
		SubmissionID: 0, // Invalid ID
		RetryCount:   0,
	}
	jsonData, _ := json.Marshal(task)

	delivery, acker := NewMockDelivery(jsonData)

	worker.handleMessage(delivery)

	if acker.AckCalled {
		t.Error("Expected message not to be acknowledged")
	}

	if !acker.NackCalled {
		t.Error("Expected message to be nacked")
	}

	if acker.Requeue {
		t.Error("Expected message not to be requeued")
	}
}

// Test handleMessage with grading error and retry
func TestHandleMessageGradingErrorWithRetry(t *testing.T) {
	publishCalled := false
	mockChannel := &MockChannel{
		PublishFunc: func(exchange, key string, mandatory, immediate bool, msg amqp.Publishing) error {
			publishCalled = true

			// Verify the requeued message has incremented retry count
			var task TaskMessage
			if err := json.Unmarshal(msg.Body, &task); err != nil {
				t.Errorf("Failed to unmarshal requeued message: %v", err)
			}

			if task.RetryCount != 1 {
				t.Errorf("Expected retry count 1, got %d", task.RetryCount)
			}

			return nil
		},
	}

	cfg := &config.Config{
		RabbitMQQueue: "test_queue",
	}

	mockGraderService := &MockGraderService{
		GradeFunc: func(submissionID int) (*models.GradingResult, error) {
			return nil, errors.New("grading failed")
		},
	}

	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)
	worker.channel = mockChannel

	task := TaskMessage{
		SubmissionID: 123,
		RetryCount:   0,
	}
	jsonData, _ := json.Marshal(task)

	delivery, acker := NewMockDelivery(jsonData)

	worker.handleMessage(delivery)

	if !publishCalled {
		t.Error("Expected message to be republished with retry count")
	}

	if !acker.AckCalled {
		t.Error("Expected original message to be acknowledged")
	}
}

// Test handleMessage exceeding max retries
func TestHandleMessageExceedingMaxRetries(t *testing.T) {
	publishCalled := false
	mockChannel := &MockChannel{
		PublishFunc: func(exchange, key string, mandatory, immediate bool, msg amqp.Publishing) error {
			publishCalled = true
			return nil
		},
	}

	cfg := &config.Config{
		RabbitMQQueue: "test_queue",
	}

	mockGraderService := &MockGraderService{
		GradeFunc: func(submissionID int) (*models.GradingResult, error) {
			return nil, errors.New("grading failed")
		},
	}

	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)
	worker.channel = mockChannel

	task := TaskMessage{
		SubmissionID: 123,
		RetryCount:   3, // Already at max retries
	}
	jsonData, _ := json.Marshal(task)

	delivery, acker := NewMockDelivery(jsonData)

	worker.handleMessage(delivery)

	if publishCalled {
		t.Error("Expected message not to be republished when max retries exceeded")
	}

	if acker.AckCalled {
		t.Error("Expected message not to be acknowledged when max retries exceeded")
	}

	if !acker.NackCalled {
		t.Error("Expected message to be nacked when max retries exceeded")
	}

	if acker.Requeue {
		t.Error("Expected message not to be requeued when max retries exceeded")
	}
}

// Test handleMessage with successful grading increments metrics
func TestHandleMessageMetricsIncrement(t *testing.T) {
	cfg := &config.Config{
		RabbitMQQueue: "test_queue",
	}

	mockGraderService := &MockGraderService{
		GradeFunc: func(submissionID int) (*models.GradingResult, error) {
			return &models.GradingResult{
				OverallStatus: models.StatusAccepted,
				Results:       []models.TestCaseResult{},
			}, nil
		},
	}

	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)

	mockAPI := &MockAPIServer{TaskCount: 5}
	worker.SetAPIServer(mockAPI)

	task := TaskMessage{
		SubmissionID: 123,
		RetryCount:   0,
	}
	jsonData, _ := json.Marshal(task)

	delivery, _ := NewMockDelivery(jsonData)

	worker.handleMessage(delivery)

	if mockAPI.TaskCount != 6 {
		t.Errorf("Expected task count to be 6, got %d", mockAPI.TaskCount)
	}
}

// Test handleMessage without API server (no crash)
func TestHandleMessageWithoutAPIServer(t *testing.T) {
	cfg := &config.Config{
		RabbitMQQueue: "test_queue",
	}

	mockGraderService := &MockGraderService{
		GradeFunc: func(submissionID int) (*models.GradingResult, error) {
			return &models.GradingResult{
				OverallStatus: models.StatusAccepted,
				Results:       []models.TestCaseResult{},
			}, nil
		},
	}

	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)
	// Don't set API server

	task := TaskMessage{
		SubmissionID: 123,
		RetryCount:   0,
	}
	jsonData, _ := json.Marshal(task)

	delivery, acker := NewMockDelivery(jsonData)

	// Should not crash
	worker.handleMessage(delivery)

	if !acker.AckCalled {
		t.Error("Expected message to be acknowledged")
	}
}

// Test Stop() method
func TestWorkerStop(t *testing.T) {
	cfg := &config.Config{}
	mockGraderService := &MockGraderService{}
	worker := NewWithGraderService(cfg, &gorm.DB{}, &MockContainerPool{}, mockGraderService)

	// Initialize stop channel (normally done in Start())
	worker.stopChan = make(chan bool, 1)

	err := worker.Stop()
	if err != nil {
		t.Errorf("Stop() returned error: %v", err)
	}

	// Verify stopChan is closed (will panic if we close again)
	defer func() {
		if r := recover(); r != nil {
			// Expected - channel is already closed
		}
	}()
	close(worker.stopChan)
}
