package language

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// copyFileToContainer copies a file content to a container's /sandbox directory
func copyFileToContainer(ctx context.Context, cli *client.Client, containerID, filename, content string) error {
	// First, ensure /sandbox directory exists
	if err := ensureSandboxDirectory(ctx, cli, containerID); err != nil {
		return fmt.Errorf("failed to ensure sandbox directory: %w", err)
	}

	// Create tar archive
	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)

	// Add file to tar
	header := &tar.Header{
		Name: filename,
		Mode: 0644,
		Size: int64(len(content)),
	}
	if err := tw.WriteHeader(header); err != nil {
		return fmt.Errorf("failed to write tar header: %w", err)
	}
	if _, err := tw.Write([]byte(content)); err != nil {
		return fmt.Errorf("failed to write tar content: %w", err)
	}
	if err := tw.Close(); err != nil {
		return fmt.Errorf("failed to close tar writer: %w", err)
	}

	// Copy to container
	err := cli.CopyToContainer(ctx, containerID, "/sandbox", &buf, container.CopyToContainerOptions{})
	if err != nil {
		return fmt.Errorf("failed to copy to container: %w", err)
	}

	return nil
}

// ensureSandboxDirectory creates /sandbox directory if it doesn't exist
func ensureSandboxDirectory(ctx context.Context, cli *client.Client, containerID string) error {
	// Create exec instance to create directory
	execConfig := container.ExecOptions{
		Cmd:          []string{"mkdir", "-p", "/sandbox"},
		AttachStdout: true,
		AttachStderr: true,
	}

	exec, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return fmt.Errorf("failed to create exec for mkdir: %w", err)
	}

	// Execute mkdir
	resp, err := cli.ContainerExecAttach(ctx, exec.ID, container.ExecStartOptions{})
	if err != nil {
		return fmt.Errorf("failed to attach to mkdir exec: %w", err)
	}
	defer resp.Close()

	// Wait for exec to complete
	inspect, err := cli.ContainerExecInspect(ctx, exec.ID)
	if err != nil {
		return fmt.Errorf("failed to inspect mkdir exec: %w", err)
	}

	if inspect.ExitCode != 0 {
		return fmt.Errorf("mkdir failed with exit code %d", inspect.ExitCode)
	}

	return nil
}

// execInContainer executes a command in a container and returns exit code and combined output
func execInContainer(ctx context.Context, cli *client.Client, containerID string, cmd []string) (exitCode int, output string, err error) {
	// Create exec instance
	execConfig := container.ExecOptions{
		Cmd:          cmd,
		AttachStdout: true,
		AttachStderr: true,
		WorkingDir:   "/sandbox",
	}

	exec, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return 0, "", fmt.Errorf("failed to create exec: %w", err)
	}

	// Attach to exec
	resp, err := cli.ContainerExecAttach(ctx, exec.ID, container.ExecStartOptions{})
	if err != nil {
		return 0, "", fmt.Errorf("failed to attach to exec: %w", err)
	}
	defer resp.Close()

	// Read output
	var outBuf, errBuf bytes.Buffer
	outputDone := make(chan error)

	go func() {
		_, err = stdcopy.StdCopy(&outBuf, &errBuf, resp.Reader)
		outputDone <- err
	}()

	<-outputDone

	// Get exit code
	inspect, err := cli.ContainerExecInspect(ctx, exec.ID)
	if err != nil {
		return 0, "", fmt.Errorf("failed to inspect exec: %w", err)
	}

	// Combine stdout and stderr
	combinedOutput := outBuf.String() + errBuf.String()

	return inspect.ExitCode, combinedOutput, nil
}

// readFileFromContainer reads a file from a container
func readFileFromContainer(ctx context.Context, cli *client.Client, containerID, filepath string) (string, error) {
	reader, _, err := cli.CopyFromContainer(ctx, containerID, filepath)
	if err != nil {
		return "", fmt.Errorf("failed to copy from container: %w", err)
	}
	defer reader.Close()

	// Extract from tar
	tr := tar.NewReader(reader)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", fmt.Errorf("failed to read tar: %w", err)
		}

		if header.Typeflag == tar.TypeReg {
			var buf bytes.Buffer
			if _, err := io.Copy(&buf, tr); err != nil {
				return "", fmt.Errorf("failed to read file content: %w", err)
			}
			return buf.String(), nil
		}
	}

	return "", fmt.Errorf("file not found in tar")
}
