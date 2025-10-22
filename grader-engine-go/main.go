package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"grader-engine-go/internal/config"
	"grader-engine-go/internal/database"
	"grader-engine-go/internal/pool"
	"grader-engine-go/internal/worker"
)

func main() {
	log.Println("🚀 Starting Go Grader Worker...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load configuration: %v", err)
	}

	log.Printf("📋 Configuration loaded:")
	log.Printf("   - RabbitMQ: %s", cfg.RabbitMQHost)
	log.Printf("   - Database: %s", cfg.DatabaseURL)
	log.Printf("   - Backend API: %s", cfg.BackendAPIURL)
	log.Printf("   - Pool Size: %d", cfg.ContainerPoolSize)

	// Initialize database connection
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected")

	// Initialize Docker container pool
	log.Printf("🐳 Initializing container pool (size=%d)...", cfg.ContainerPoolSize)
	containerPool, err := pool.NewContainerPool(cfg.ContainerPoolSize, cfg.DockerImage)
	if err != nil {
		log.Fatalf("❌ Failed to initialize container pool: %v", err)
	}
	log.Printf("✅ Container pool initialized with %d containers", cfg.ContainerPoolSize)

	// Create worker
	w := worker.New(cfg, db, containerPool)

	// Start worker in goroutine
	errChan := make(chan error, 1)
	go func() {
		log.Println("🎯 Starting RabbitMQ consumer...")
		if err := w.Start(); err != nil {
			errChan <- err
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errChan:
		log.Printf("❌ Worker error: %v", err)
	case sig := <-sigChan:
		log.Printf("⚠️  Received signal: %v", sig)
	}

	// Graceful shutdown
	log.Println("🛑 Shutting down gracefully...")

	// Stop worker
	if err := w.Stop(); err != nil {
		log.Printf("⚠️  Error stopping worker: %v", err)
	}

	// Print cleanup stats before shutdown
	log.Printf("📊 Cleanup Service Stats: %v", containerPool.GetCleanupStats())

	// Cleanup container pool
	log.Println("🧹 Cleaning up container pool...")
	containerPool.Shutdown()

	// Close database
	sqlDB, _ := db.DB()
	if sqlDB != nil {
		sqlDB.Close()
	}

	log.Println("👋 Shutdown complete")
}
