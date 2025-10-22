package cleanup

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
)

// CleanupService handles automatic cleanup of Docker containers and volumes
type CleanupService struct {
	dockerClient      *client.Client
	managedContainers map[string]bool // Track containers managed by this worker
	managedVolumes    map[string]bool // Track volumes created for containers
	mu                sync.RWMutex
	stopChan          chan bool
	isRunning         bool
	cleanupInterval   time.Duration // How often to run cleanup (default: 30 seconds)
}

// NewCleanupService creates a new cleanup service
func NewCleanupService(cli *client.Client, cleanupInterval time.Duration) *CleanupService {
	if cleanupInterval == 0 {
		cleanupInterval = 30 * time.Second // Default: cleanup every 30 seconds
	}

	return &CleanupService{
		dockerClient:      cli,
		managedContainers: make(map[string]bool),
		managedVolumes:    make(map[string]bool),
		stopChan:          make(chan bool),
		cleanupInterval:   cleanupInterval,
	}
}

// RegisterContainer registers a container as managed by this worker
func (cs *CleanupService) RegisterContainer(containerID string) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	cs.managedContainers[containerID] = true
	log.Printf("📝 Registered container: %s", containerID[:12])
}

// UnregisterContainer removes a container from tracking
func (cs *CleanupService) UnregisterContainer(containerID string) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	delete(cs.managedContainers, containerID)
}

// RegisterVolume registers a volume as created by this worker
func (cs *CleanupService) RegisterVolume(volumeName string) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	cs.managedVolumes[volumeName] = true
	log.Printf("📝 Registered volume: %s", volumeName)
}

// CleanupContainerAndVolumes performs comprehensive cleanup for a specific container and its volumes
func (cs *CleanupService) CleanupContainerAndVolumes(ctx context.Context, containerID string) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	log.Printf("🧹 Cleaning up container and volumes: %s", containerID[:12])

	// Step 1: Get container info before removal (to find volumes)
	inspect, err := cs.dockerClient.ContainerInspect(ctx, containerID)
	if err != nil {
		log.Printf("⚠️  Could not inspect container for cleanup: %v", err)
		// Continue anyway - container might already be gone
	} else {
		// Step 2: Clean volumes used by this container
		if err := cs.cleanupContainerVolumes(ctx, &inspect); err != nil {
			log.Printf("⚠️  Error cleaning volumes: %v", err)
		}
	}

	// Step 3: Remove the container itself
	if err := cs.dockerClient.ContainerRemove(ctx, containerID, container.RemoveOptions{
		Force:         true,
		RemoveVolumes: true, // This removes anonymous volumes
	}); err != nil {
		log.Printf("⚠️  Failed to remove container %s: %v", containerID[:12], err)
		return err
	}

	log.Printf("✅ Removed container: %s", containerID[:12])
	cs.UnregisterContainer(containerID)
	return nil
}

// cleanupContainerVolumes removes named volumes attached to a container
func (cs *CleanupService) cleanupContainerVolumes(ctx context.Context, inspect *types.ContainerJSON) error {
	if inspect == nil || inspect.Mounts == nil {
		return nil
	}

	for _, mount := range inspect.Mounts {
		// Only handle named volumes (not bind mounts)
		if mount.Type == "volume" && mount.Name != "" {
			if err := cs.removeVolume(ctx, mount.Name); err != nil {
				log.Printf("⚠️  Failed to remove volume %s: %v", mount.Name, err)
			}
		}
	}

	return nil
}

// removeVolume removes a named Docker volume
func (cs *CleanupService) removeVolume(ctx context.Context, volumeName string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Check if volume exists first
	_, err := cs.dockerClient.VolumeInspect(ctx, volumeName)
	if err != nil {
		// Volume doesn't exist, nothing to do
		return nil
	}

	// Remove the volume
	if err := cs.dockerClient.VolumeRemove(ctx, volumeName, true); err != nil {
		return fmt.Errorf("failed to remove volume %s: %w", volumeName, err)
	}

	log.Printf("🗑️  Removed volume: %s", volumeName)
	cs.unregisterVolume(volumeName)
	return nil
}

// unregisterVolume removes a volume from tracking
func (cs *CleanupService) unregisterVolume(volumeName string) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	delete(cs.managedVolumes, volumeName)
}

// Start begins the automatic cleanup routine
func (cs *CleanupService) Start() error {
	cs.mu.Lock()
	if cs.isRunning {
		cs.mu.Unlock()
		return fmt.Errorf("cleanup service already running")
	}
	cs.isRunning = true
	cs.mu.Unlock()

	log.Printf("🔄 Starting automatic cleanup service (interval: %v)", cs.cleanupInterval)

	go cs.cleanupLoop()
	return nil
}

// cleanupLoop runs the periodic cleanup routine
func (cs *CleanupService) cleanupLoop() {
	ticker := time.NewTicker(cs.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			cs.performScheduledCleanup()
		case <-cs.stopChan:
			log.Println("🛑 Cleanup service loop stopped")
			return
		}
	}
}

// performScheduledCleanup runs cleanup for all managed resources
func (cs *CleanupService) performScheduledCleanup() {
	ctx := context.Background()

	// Cleanup exited containers
	cs.cleanupExitedContainers(ctx)

	// Cleanup orphaned volumes (dangling volumes)
	cs.cleanupOrphanedVolumes(ctx)

	// Cleanup stuck containers (not responding for too long)
	cs.cleanupStuckContainers(ctx)
}

// cleanupExitedContainers removes containers that have exited
func (cs *CleanupService) cleanupExitedContainers(ctx context.Context) {
	cs.mu.RLock()
	containerIDs := make([]string, 0, len(cs.managedContainers))
	for cid := range cs.managedContainers {
		containerIDs = append(containerIDs, cid)
	}
	cs.mu.RUnlock()

	for _, containerID := range containerIDs {
		inspect, err := cs.dockerClient.ContainerInspect(ctx, containerID)
		if err != nil {
			// Container no longer exists, cleanup from tracking
			cs.UnregisterContainer(containerID)
			continue
		}

		// Remove exited containers
		if !inspect.State.Running {
			log.Printf("🔍 Found exited container: %s (state: %s)", containerID[:12], inspect.State.Status)
			if err := cs.CleanupContainerAndVolumes(ctx, containerID); err != nil {
				log.Printf("⚠️  Error cleaning up exited container: %v", err)
			}
		}
	}
}

// cleanupOrphanedVolumes removes dangling volumes created by the worker
func (cs *CleanupService) cleanupOrphanedVolumes(ctx context.Context) {
	// Get all dangling volumes
	args := filters.NewArgs()
	args.Add("dangling", "true")

	volumes, err := cs.dockerClient.VolumeList(ctx, volume.ListOptions{Filters: args})
	if err != nil {
		log.Printf("⚠️  Error listing dangling volumes: %v", err)
		return
	}

	for _, vol := range volumes.Volumes {
		// Check if it's one of our managed volumes
		cs.mu.RLock()
		isManagedByUs := cs.managedVolumes[vol.Name]
		cs.mu.RUnlock()

		if isManagedByUs {
			log.Printf("🔍 Found orphaned volume: %s", vol.Name)
			if err := cs.removeVolume(ctx, vol.Name); err != nil {
				log.Printf("⚠️  Error removing orphaned volume: %v", err)
			}
		}
	}
}

// cleanupStuckContainers removes containers that haven't been used for too long
// This helps prevent resource leaks from crashed or stuck containers
func (cs *CleanupService) cleanupStuckContainers(ctx context.Context) {
	cs.mu.RLock()
	containerIDs := make([]string, 0, len(cs.managedContainers))
	for cid := range cs.managedContainers {
		containerIDs = append(containerIDs, cid)
	}
	cs.mu.RUnlock()

	maxIdleTime := 5 * time.Minute // Container idle for more than 5 minutes

	for _, containerID := range containerIDs {
		inspect, err := cs.dockerClient.ContainerInspect(ctx, containerID)
		if err != nil {
			cs.UnregisterContainer(containerID)
			continue
		}

		if !inspect.State.Running {
			continue // Already handled by cleanupExitedContainers
		}

		// Check last activity time (estimated from StartedAt)
		startedAtStr := inspect.State.StartedAt
		startedAt, err := time.Parse(time.RFC3339Nano, startedAtStr)
		if err != nil {
			log.Printf("⚠️  Could not parse container start time: %v", err)
			continue
		}

		idleTime := time.Since(startedAt)

		if idleTime > maxIdleTime {
			log.Printf("🔍 Found stuck container (idle %v): %s", idleTime, containerID[:12])
			// Force kill and remove
			if err := cs.CleanupContainerAndVolumes(ctx, containerID); err != nil {
				log.Printf("⚠️  Error cleaning up stuck container: %v", err)
			}
		}
	}
}

// GracefulShutdown performs cleanup of all managed resources
func (cs *CleanupService) GracefulShutdown() {
	log.Println("🛑 Performing graceful cleanup...")

	// Stop the cleanup loop
	close(cs.stopChan)

	// Wait a bit for loop to stop
	time.Sleep(100 * time.Millisecond)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cs.mu.Lock()
	defer cs.mu.Unlock()

	// Remove all managed containers
	log.Printf("📦 Cleaning up %d managed containers...", len(cs.managedContainers))
	for containerID := range cs.managedContainers {
		if err := cs.CleanupContainerAndVolumes(ctx, containerID); err != nil {
			log.Printf("⚠️  Error cleaning container during shutdown: %v", err)
		}
	}
	cs.managedContainers = make(map[string]bool)

	// Remove all managed volumes
	log.Printf("🗑️  Cleaning up %d managed volumes...", len(cs.managedVolumes))
	for volumeName := range cs.managedVolumes {
		if err := cs.removeVolume(ctx, volumeName); err != nil {
			log.Printf("⚠️  Error cleaning volume during shutdown: %v", err)
		}
	}
	cs.managedVolumes = make(map[string]bool)

	log.Println("✅ Graceful cleanup complete")
}

// GetStats returns cleanup service statistics
func (cs *CleanupService) GetStats() map[string]interface{} {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	return map[string]interface{}{
		"is_running":          cs.isRunning,
		"managed_containers":  len(cs.managedContainers),
		"managed_volumes":     len(cs.managedVolumes),
		"cleanup_interval_ms": cs.cleanupInterval.Milliseconds(),
	}
}
