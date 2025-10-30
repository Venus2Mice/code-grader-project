package worker

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"grader-engine-go/internal/config"
	"grader-engine-go/internal/grader"
	"grader-engine-go/internal/pool"

	"github.com/streadway/amqp"
	"gorm.io/gorm"
)

// Worker represents the grading worker
type Worker struct {
	config        *config.Config
	db            *gorm.DB
	pool          *pool.ContainerPool
	conn          *amqp.Connection
	channel       *amqp.Channel
	stopChan      chan bool
	graderService *grader.Service
	apiServer     interface{ IncrementTaskCounter() } // For tracking metrics
}

// TaskMessage represents the message structure from RabbitMQ
type TaskMessage struct {
	SubmissionID int `json:"submission_id"`
	RetryCount   int `json:"retry_count,omitempty"` // Track retry attempts
}

// New creates a new worker instance
func New(cfg *config.Config, db *gorm.DB, containerPool *pool.ContainerPool) *Worker {
	graderService := grader.NewService(cfg, db, containerPool)

	return &Worker{
		config:        cfg,
		db:            db,
		pool:          containerPool,
		stopChan:      make(chan bool),
		graderService: graderService,
		apiServer:     nil, // Will be set via SetAPIServer
	}
}

// SetAPIServer sets the API server for metrics tracking
func (w *Worker) SetAPIServer(apiServer interface{ IncrementTaskCounter() }) {
	w.apiServer = apiServer
}

// Start begins consuming messages from RabbitMQ
func (w *Worker) Start() error {
	// Connect to RabbitMQ with retry
	if err := w.connectRabbitMQ(); err != nil {
		return err
	}

	// Declare queue
	q, err := w.channel.QueueDeclare(
		w.config.RabbitMQQueue, // name
		true,                   // durable
		false,                  // delete when unused
		false,                  // exclusive
		false,                  // no-wait
		nil,                    // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	// Set QoS
	err = w.channel.Qos(
		1,     // prefetch count
		0,     // prefetch size
		false, // global
	)
	if err != nil {
		return fmt.Errorf("failed to set QoS: %w", err)
	}

	// Start consuming
	msgs, err := w.channel.Consume(
		q.Name, // queue
		"",     // consumer
		false,  // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	log.Println("✅ RabbitMQ consumer started")
	log.Printf("⏳ Waiting for messages on queue '%s'...", q.Name)

	// Process messages
	for {
		select {
		case msg := <-msgs:
			w.handleMessage(msg)
		case <-w.stopChan:
			log.Println("⚠️  Stop signal received")
			return nil
		}
	}
}

// connectRabbitMQ connects to RabbitMQ with retry logic
func (w *Worker) connectRabbitMQ() error {
	maxRetries := 10
	retryDelay := 5 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("🔌 Connecting to RabbitMQ at %s... (attempt %d/%d)", w.config.RabbitMQHost, i+1, maxRetries)

		conn, err := amqp.Dial(fmt.Sprintf("amqp://guest:guest@%s:5672/", w.config.RabbitMQHost))
		if err == nil {
			w.conn = conn

			// Create channel
			ch, err := conn.Channel()
			if err != nil {
				conn.Close()
				return fmt.Errorf("failed to open channel: %w", err)
			}
			w.channel = ch

			log.Println("✅ Connected to RabbitMQ")
			return nil
		}

		log.Printf("❌ Failed to connect: %v", err)
		if i < maxRetries-1 {
			log.Printf("⏳ Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	return fmt.Errorf("failed to connect to RabbitMQ after %d attempts", maxRetries)
}

// handleMessage processes a single message from the queue
func (w *Worker) handleMessage(msg amqp.Delivery) {
	log.Printf("📨 Received message: %s", string(msg.Body))

	// Parse message
	var task TaskMessage
	if err := json.Unmarshal(msg.Body, &task); err != nil {
		log.Printf("❌ Failed to parse message: %v", err)
		msg.Nack(false, false) // Don't requeue invalid messages
		return
	}

	if task.SubmissionID == 0 {
		log.Printf("❌ Invalid submission ID: %d", task.SubmissionID)
		msg.Nack(false, false)
		return
	}

	// Grade submission
	log.Printf("🎯 Grading submission #%d (retry: %d)...", task.SubmissionID, task.RetryCount)
	startTime := time.Now()

	result, err := w.graderService.GradeSubmission(task.SubmissionID)

	duration := time.Since(startTime)

	if err != nil {
		log.Printf("❌ Failed to grade submission #%d: %v (took %v)", task.SubmissionID, err, duration)

		// Check retry count to prevent infinite loops
		const maxRetries = 3
		if task.RetryCount >= maxRetries {
			log.Printf("⚠️  Submission #%d exceeded max retries (%d), moving to dead-letter", task.SubmissionID, maxRetries)
			// Don't requeue - message will go to dead-letter queue if configured
			msg.Nack(false, false)
			return
		}

		// Increment retry count and requeue
		task.RetryCount++
		requeueMsg, _ := json.Marshal(task)
		log.Printf("🔄 Requeuing submission #%d (retry %d/%d)", task.SubmissionID, task.RetryCount, maxRetries)

		// Publish back to queue with updated retry count
		err = w.channel.Publish(
			"",                     // exchange
			w.config.RabbitMQQueue, // routing key
			false,                  // mandatory
			false,                  // immediate
			amqp.Publishing{
				ContentType:  "application/json",
				Body:         requeueMsg,
				DeliveryMode: amqp.Persistent,
			},
		)
		if err != nil {
			log.Printf("⚠️  Failed to requeue with retry count: %v", err)
		}

		// Acknowledge original message (we've published the retry manually)
		msg.Ack(false)
		return
	}

	log.Printf("✅ Graded submission #%d: %s (took %v)", task.SubmissionID, result.OverallStatus, duration)

	// Increment task counter for metrics
	if w.apiServer != nil {
		w.apiServer.IncrementTaskCounter()
	}

	// Acknowledge message
	msg.Ack(false)
}

// Stop stops the worker gracefully
func (w *Worker) Stop() error {
	log.Println("🛑 Stopping worker...")

	close(w.stopChan)

	if w.channel != nil {
		w.channel.Close()
	}

	if w.conn != nil {
		w.conn.Close()
	}

	log.Println("✅ Worker stopped")
	return nil
}
