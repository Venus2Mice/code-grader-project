package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all configuration for the grader worker
type Config struct {
	// RabbitMQ settings
	RabbitMQHost  string
	RabbitMQQueue string

	// Database settings
	DatabaseURL string

	// Backend API settings
	BackendAPIURL string

	// Docker settings
	DockerImage       string
	ContainerPoolSize int

	// Resource limits
	DefaultTimeLimit   int // milliseconds
	DefaultMemoryLimit int // kilobytes

	// Temp directory
	TempDir string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		RabbitMQHost:       getEnv("RABBITMQ_HOST", "localhost"),
		RabbitMQQueue:      getEnv("RABBITMQ_QUEUE", "grading_queue"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/code_grader?sslmode=disable"),
		BackendAPIURL:      getEnv("BACKEND_API_URL", "http://localhost:5000"),
		DockerImage:        getEnv("DOCKER_IMAGE", "cpp-grader-env"),
		ContainerPoolSize:  getEnvInt("CONTAINER_POOL_SIZE", 3),
		DefaultTimeLimit:   getEnvInt("DEFAULT_TIME_LIMIT", 1000),
		DefaultMemoryLimit: getEnvInt("DEFAULT_MEMORY_LIMIT", 256000),
		TempDir:            getEnv("TEMP_DIR", "/tmp/grader"),
	}

	// Validate required fields
	if cfg.RabbitMQHost == "" {
		return nil, fmt.Errorf("RABBITMQ_HOST is required")
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
