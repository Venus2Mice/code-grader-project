package grader

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// copyFileToContainer copies a file content to a container
func (s *Service) copyFileToContainer(ctx context.Context, cli *client.Client, containerID, filename, content string) error {
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
		return err
	}
	if _, err := tw.Write([]byte(content)); err != nil {
		return err
	}
	if err := tw.Close(); err != nil {
		return err
	}

	// Copy to container
	return cli.CopyToContainer(ctx, containerID, "/sandbox", &buf, container.CopyToContainerOptions{})
}

// execInContainer executes a command in a container and returns exit code and output
func (s *Service) execInContainer(ctx context.Context, cli *client.Client, containerID string, cmd []string) (int, string, error) {
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
	output := outBuf.String() + errBuf.String()

	return inspect.ExitCode, output, nil
}

// readFileFromContainer reads a file from a container
func (s *Service) readFileFromContainer(ctx context.Context, cli *client.Client, containerID, filepath string) string {
	reader, _, err := cli.CopyFromContainer(ctx, containerID, filepath)
	if err != nil {
		return ""
	}
	defer reader.Close()

	// Extract from tar
	tr := tar.NewReader(reader)
	for {
		header, err := tr.Next()
		if err != nil {
			break
		}

		if header.Typeflag == tar.TypeReg {
			var buf bytes.Buffer
			io.Copy(&buf, tr)
			return buf.String()
		}
	}

	return ""
}

// parseTimeMetrics extracts execution time and memory usage from /usr/bin/time output
func (s *Service) parseTimeMetrics(timeOutput string) (execTimeMs int, memoryKb int) {
	lines := strings.Split(timeOutput, "\n")

	for _, line := range lines {
		// Parse elapsed time: "Elapsed (wall clock) time (h:mm:ss or m:ss): 0:00.05"
		if strings.Contains(line, "Elapsed (wall clock) time") {
			re := regexp.MustCompile(`(\d+):(\d+\.\d+)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) == 3 {
				minutes, _ := strconv.Atoi(matches[1])
				seconds, _ := strconv.ParseFloat(matches[2], 64)
				execTimeMs = int((float64(minutes)*60 + seconds) * 1000)
			}
		}

		// Parse memory: "Maximum resident set size (kbytes): 2048"
		if strings.Contains(line, "Maximum resident set size") {
			re := regexp.MustCompile(`(\d+)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) > 0 {
				memoryKb, _ = strconv.Atoi(matches[0])
			}
		}
	}

	return
}
