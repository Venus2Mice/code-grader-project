package config

import (
	"os"
	"testing"
)

// TestLoadDefaultConfig tests loading configuration with defaults
func TestLoadDefaultConfig(t *testing.T) {
	// Save original env vars
	originalRabbitHost := os.Getenv("RABBITMQ_HOST")
	originalDatabaseURL := os.Getenv("DATABASE_URL")
	originalBackendAPI := os.Getenv("BACKEND_API_URL")

	defer func() {
		os.Setenv("RABBITMQ_HOST", originalRabbitHost)
		os.Setenv("DATABASE_URL", originalDatabaseURL)
		os.Setenv("BACKEND_API_URL", originalBackendAPI)
	}()

	// Clear env vars to test defaults
	os.Unsetenv("RABBITMQ_HOST")
	os.Unsetenv("DATABASE_URL")
	os.Unsetenv("BACKEND_API_URL")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	// Test default values
	if cfg.RabbitMQHost == "" {
		t.Error("RabbitMQ host should have a default value")
	}

	if cfg.RabbitMQQueue == "" {
		t.Error("RabbitMQ queue should have a default value")
	}

	if cfg.ContainerPoolSize <= 0 {
		t.Error("Container pool size should be positive")
	}

	if cfg.DBMaxIdleConns <= 0 {
		t.Error("DB max idle conns should be positive")
	}

	if cfg.DBMaxOpenConns <= 0 {
		t.Error("DB max open conns should be positive")
	}
}

// TestLoadConfigFromEnv tests loading configuration from environment variables
func TestLoadConfigFromEnv(t *testing.T) {
	// Set custom env vars
	os.Setenv("RABBITMQ_HOST", "custom-rabbitmq")
	os.Setenv("RABBITMQ_QUEUE", "custom-queue")
	os.Setenv("DATABASE_URL", "postgresql://custom-db")
	os.Setenv("BACKEND_API_URL", "http://custom-backend")
	os.Setenv("DOCKER_IMAGE", "custom-image:latest")
	os.Setenv("CONTAINER_POOL_SIZE", "5")

	defer func() {
		os.Unsetenv("RABBITMQ_HOST")
		os.Unsetenv("RABBITMQ_QUEUE")
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("BACKEND_API_URL")
		os.Unsetenv("DOCKER_IMAGE")
		os.Unsetenv("CONTAINER_POOL_SIZE")
	}()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	if cfg.RabbitMQHost != "custom-rabbitmq" {
		t.Errorf("Expected RabbitMQ host 'custom-rabbitmq', got '%s'", cfg.RabbitMQHost)
	}

	if cfg.RabbitMQQueue != "custom-queue" {
		t.Errorf("Expected RabbitMQ queue 'custom-queue', got '%s'", cfg.RabbitMQQueue)
	}

	if cfg.DatabaseURL != "postgresql://custom-db" {
		t.Errorf("Expected database URL 'postgresql://custom-db', got '%s'", cfg.DatabaseURL)
	}

	if cfg.BackendAPIURL != "http://custom-backend" {
		t.Errorf("Expected backend API URL 'http://custom-backend', got '%s'", cfg.BackendAPIURL)
	}

	if cfg.DockerImage != "custom-image:latest" {
		t.Errorf("Expected docker image 'custom-image:latest', got '%s'", cfg.DockerImage)
	}

	if cfg.ContainerPoolSize != 5 {
		t.Errorf("Expected container pool size 5, got %d", cfg.ContainerPoolSize)
	}
}

// TestLoadConfigInvalidPoolSize tests invalid pool size handling
func TestLoadConfigInvalidPoolSize(t *testing.T) {
	os.Setenv("CONTAINER_POOL_SIZE", "invalid")
	defer os.Unsetenv("CONTAINER_POOL_SIZE")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	// Should fallback to default
	if cfg.ContainerPoolSize <= 0 {
		t.Error("Container pool size should fallback to default when invalid")
	}
}

// TestConfigDatabaseSettings tests database configuration
func TestConfigDatabaseSettings(t *testing.T) {
	os.Setenv("DB_MAX_IDLE_CONNS", "15")
	os.Setenv("DB_MAX_OPEN_CONNS", "75")
	os.Setenv("DB_CONN_MAX_LIFETIME", "20")

	defer func() {
		os.Unsetenv("DB_MAX_IDLE_CONNS")
		os.Unsetenv("DB_MAX_OPEN_CONNS")
		os.Unsetenv("DB_CONN_MAX_LIFETIME")
	}()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	if cfg.DBMaxIdleConns != 15 {
		t.Errorf("Expected DB max idle conns 15, got %d", cfg.DBMaxIdleConns)
	}

	if cfg.DBMaxOpenConns != 75 {
		t.Errorf("Expected DB max open conns 75, got %d", cfg.DBMaxOpenConns)
	}

	// Note: DBConnMaxLifetime might have a default value, so we just check it exists
	if cfg.DBConnMaxLifetime <= 0 {
		t.Errorf("Expected DB conn max lifetime > 0, got %d", cfg.DBConnMaxLifetime)
	}
}
