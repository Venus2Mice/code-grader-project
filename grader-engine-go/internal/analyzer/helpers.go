package analyzer

import (
	"context"
	"fmt"
	"io"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

// execCommand executes a command in a Docker container
func execCommand(ctx context.Context, cli *client.Client, containerID string, cmd []string) error {
	execConfig := types.ExecConfig{
		Cmd:          cmd,
		AttachStdout: false,
		AttachStderr: false,
	}

	execID, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return err
	}

	return cli.ContainerExecStart(ctx, execID.ID, types.ExecStartCheck{})
}

// execCommandWithOutput executes a command and returns stdout/stderr
func execCommandWithOutput(ctx context.Context, cli *client.Client, containerID string, cmd []string) (string, error) {
	execConfig := types.ExecConfig{
		Cmd:          cmd,
		AttachStdout: true,
		AttachStderr: true,
	}

	execID, err := cli.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return "", err
	}

	resp, err := cli.ContainerExecAttach(ctx, execID.ID, types.ExecStartCheck{})
	if err != nil {
		return "", err
	}
	defer resp.Close()

	// Read all output
	output, err := io.ReadAll(resp.Reader)
	if err != nil {
		return "", err
	}

	// Check exit code
	inspectResp, err := cli.ContainerExecInspect(ctx, execID.ID)
	if err != nil {
		return string(output), err
	}

	if inspectResp.ExitCode != 0 {
		return string(output), fmt.Errorf("command exited with code %d", inspectResp.ExitCode)
	}

	return string(output), nil
}
