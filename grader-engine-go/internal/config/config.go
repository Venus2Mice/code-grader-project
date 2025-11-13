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

	// Database connection pool settings
	DBMaxIdleConns    int // Maximum idle connections
	DBMaxOpenConns    int // Maximum open connections
	DBConnMaxLifetime int // Connection max lifetime in minutes

	// API server settings
	APIPort string // HTTP API server port for health checks

	// Temp directory
	TempDir string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		RabbitMQHost:       getEnv("RABBITMQ_HOST", "localhost"),
		RabbitMQQueue:      getEnv("RABBITMQ_QUEUE", "grading_queue"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://user:password123@localhost:5432/code_grader_db?sslmode=disable"),
		BackendAPIURL:      getEnv("BACKEND_API_URL", "http://localhost:5000"),
		DockerImage:        getEnv("DOCKER_IMAGE", "code-grader-project-sandbox:latest"),
		ContainerPoolSize:  getEnvInt("CONTAINER_POOL_SIZE", 3),
		DefaultTimeLimit:   getEnvInt("DEFAULT_TIME_LIMIT", 1000),
		DefaultMemoryLimit: getEnvInt("DEFAULT_MEMORY_LIMIT", 256000),
		DBMaxIdleConns:     getEnvInt("DB_MAX_IDLE_CONNS", 10),
		DBMaxOpenConns:     getEnvInt("DB_MAX_OPEN_CONNS", 100),
		DBConnMaxLifetime:  getEnvInt("DB_CONN_MAX_LIFETIME_MINUTES", 60),
		APIPort:            getEnv("API_PORT", "8080"),
		TempDir:            getEnv("TEMP_DIR", "/tmp/grader"),
	}

	// Validate required fields
	if cfg.RabbitMQHost == "" {
		return nil, fmt.Errorf("RABBITMQ_HOST is required")
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	// Validate container pool size (1-20)
	if cfg.ContainerPoolSize < 1 || cfg.ContainerPoolSize > 20 {
		return nil, fmt.Errorf("CONTAINER_POOL_SIZE must be between 1 and 20, got: %d", cfg.ContainerPoolSize)
	}

	// Validate database pool settings
	if cfg.DBMaxIdleConns < 1 {
		return nil, fmt.Errorf("DB_MAX_IDLE_CONNS must be at least 1")
	}
	if cfg.DBMaxOpenConns < cfg.DBMaxIdleConns {
		return nil, fmt.Errorf("DB_MAX_OPEN_CONNS (%d) must be >= DB_MAX_IDLE_CONNS (%d)", cfg.DBMaxOpenConns, cfg.DBMaxIdleConns)
	}
	if cfg.DBConnMaxLifetime < 1 {
		return nil, fmt.Errorf("DB_CONN_MAX_LIFETIME_MINUTES must be at least 1")
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
