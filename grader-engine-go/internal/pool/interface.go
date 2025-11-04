package pool

import (
	"time"
)

// ContainerPool interface defines the contract for container pool operations
// Following Interface Segregation Principle - focused interface
// Allows for:
// - Easy mocking in tests
// - Multiple implementations (local Docker, remote Docker, Kubernetes pods, etc.)
// - Dependency Inversion Principle
type ContainerPool interface {
	// Get retrieves an available container from the pool
	// Blocks until a container is available or timeout expires
	Get(timeout time.Duration) (containerID string, err error)

	// Return returns a container back to the pool
	// Container should be cleaned before returning
	Return(containerID string) error

	// Shutdown gracefully shuts down the pool
	// Stops all containers and releases resources
	Shutdown()

	// GetCleanupStats returns statistics about cleanup operations
	GetCleanupStats() map[string]interface{}

	// GetSize returns the total size of the pool
	GetSize() int

	// GetAvailableCount returns the number of available containers
	GetAvailableCount() int
}

// Ensure *ContainerPoolImpl implements ContainerPool interface at compile time
var _ ContainerPool = (*ContainerPoolImpl)(nil)
