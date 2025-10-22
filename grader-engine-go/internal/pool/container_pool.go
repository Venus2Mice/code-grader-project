package pool

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

// ContainerPool manages a pool of reusable Docker containers
type ContainerPool struct {
	client     *client.Client
	imageName  string
	size       int
	containers chan string // Channel of container IDs
	mu         sync.Mutex
	active     map[string]bool // Track active containers
}

// NewContainerPool creates and initializes a new container pool
func NewContainerPool(size int, imageName string) (*ContainerPool, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}

	pool := &ContainerPool{
		client:     cli,
		imageName:  imageName,
		size:       size,
		containers: make(chan string, size),
		active:     make(map[string]bool),
	}

	// Pre-create containers
	if err := pool.initialize(); err != nil {
		return nil, err
	}

	return pool, nil
}

// initialize pre-creates containers for the pool
func (p *ContainerPool) initialize() error {
	ctx := context.Background()

	log.Printf("🐳 Creating %d containers for pool...", p.size)
	for i := 0; i < p.size; i++ {
		containerID, err := p.createContainer(ctx)
		if err != nil {
			log.Printf("⚠️  Failed to create container %d/%d: %v", i+1, p.size, err)
			continue
		}

		p.containers <- containerID
		p.active[containerID] = true
		log.Printf("   ✅ Created container %d/%d: %s", i+1, p.size, containerID[:12])
	}

	if len(p.containers) == 0 {
		return fmt.Errorf("failed to create any containers")
	}

	return nil
}

// createContainer creates a new sandbox container
func (p *ContainerPool) createContainer(ctx context.Context) (string, error) {
	// Create container config
	config := &container.Config{
		Image: p.imageName,
		Cmd:   []string{"sleep", "3600"},
	}

	// Host config with resource limits
	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory: 256 * 1024 * 1024, // 256MB
		},
		AutoRemove: false,
	}

	// Create container
	resp, err := p.client.ContainerCreate(ctx, config, hostConfig, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	// Start container
	if err := p.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		p.client.ContainerRemove(ctx, resp.ID, container.RemoveOptions{Force: true})
		return "", fmt.Errorf("failed to start container: %w", err)
	}

	return resp.ID, nil
}

// Get retrieves a container from the pool
func (p *ContainerPool) Get(timeout time.Duration) (string, error) {
	select {
	case containerID := <-p.containers:
		// Verify container is still running
		ctx := context.Background()
		inspect, err := p.client.ContainerInspect(ctx, containerID)
		if err != nil || !inspect.State.Running {
			log.Printf("⚠️  Container %s not running, creating new one", containerID[:12])
			p.removeContainer(containerID)
			
			// Create a new container
			newID, err := p.createContainer(ctx)
			if err != nil {
				return "", fmt.Errorf("failed to create replacement container: %w", err)
			}
			return newID, nil
		}
		
		return containerID, nil
		
	case <-time.After(timeout):
		return "", fmt.Errorf("timeout waiting for available container")
	}
}

// Return returns a container to the pool after cleanup
func (p *ContainerPool) Return(containerID string) error {
	ctx := context.Background()

	// Cleanup container sandbox
	if err := p.cleanupContainer(ctx, containerID); err != nil {
		log.Printf("⚠️  Failed to cleanup container %s: %v", containerID[:12], err)
	}

	// Return to pool
	select {
	case p.containers <- containerID:
		return nil
	default:
		// Pool is full, remove this container
		log.Printf("⚠️  Pool full, removing container %s", containerID[:12])
		return p.removeContainer(containerID)
	}
}

// cleanupContainer removes temporary files from container
func (p *ContainerPool) cleanupContainer(ctx context.Context, containerID string) error {
	cleanupCmd := []string{
		"sh", "-c",
		"cd /sandbox && rm -f main.cpp main input.txt output.txt exitcode.txt time_output.txt program_stderr.txt run_wrapper.sh 2>/dev/null || true",
	}

	execConfig := container.ExecOptions{
		Cmd:          cleanupCmd,
		AttachStdout: false,
		AttachStderr: false,
	}

	exec, err := p.client.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return err
	}

	return p.client.ContainerExecStart(ctx, exec.ID, container.ExecStartOptions{})
}

// removeContainer removes a container from the pool
func (p *ContainerPool) removeContainer(containerID string) error {
	p.mu.Lock()
	delete(p.active, containerID)
	p.mu.Unlock()

	ctx := context.Background()
	return p.client.ContainerRemove(ctx, containerID, container.RemoveOptions{Force: true})
}

// Shutdown cleans up all containers in the pool
func (p *ContainerPool) Shutdown() {
	ctx := context.Background()

	log.Println("🧹 Shutting down container pool...")
	
	// Close channel to prevent new additions
	close(p.containers)

	// Remove all containers
	for containerID := range p.containers {
		if err := p.client.ContainerRemove(ctx, containerID, container.RemoveOptions{Force: true}); err != nil {
			log.Printf("⚠️  Failed to remove container %s: %v", containerID[:12], err)
		} else {
			log.Printf("   ✅ Removed container %s", containerID[:12])
		}
	}

	// Close Docker client
	p.client.Close()
	log.Println("✅ Container pool shutdown complete")
}
