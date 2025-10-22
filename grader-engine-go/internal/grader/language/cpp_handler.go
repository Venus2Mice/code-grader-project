package language

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/docker/docker/client"
)

// CppHandler implements language handler for C++
type CppHandler struct {
	BaseHandler
}

// NewCppHandler creates a new C++ language handler
func NewCppHandler() *CppHandler {
	return &CppHandler{
		BaseHandler: BaseHandler{
			language:      "cpp",
			fileExtension: "cpp",
			supportsStdio: true,
			supportsFunc:  true,
		},
	}
}

// Compile compiles C++ source code using g++
func (h *CppHandler) Compile(ctx context.Context, cli *client.Client, containerID string, sourceCode string) (success bool, errorMsg string, err error) {
	// Copy source code to container
	if err := copyFileToContainer(ctx, cli, containerID, "main.cpp", sourceCode); err != nil {
		return false, "", fmt.Errorf("failed to copy source code: %w", err)
	}

	// Compile with g++
	// -std=c++17: C++17 standard
	// -O1: Optimize (faster than -O2 compilation)
	// -Wall -Wextra: Enable warnings
	// -Wno-unused-result: Suppress unused result warnings (common in competitive programming)
	compileCmd := []string{
		"g++",
		"-std=c++17",
		"-O1",
		"-Wall",
		"-Wextra",
		"-Wno-unused-result",
		"main.cpp",
		"-o",
		"main",
	}

	exitCode, output, err := execInContainer(ctx, cli, containerID, compileCmd)
	if err != nil {
		return false, "", fmt.Errorf("compilation exec failed: %w", err)
	}

	if exitCode != 0 {
		// Compilation failed
		errorMsg = h.ParseCompileError(output)
		return false, errorMsg, nil
	}

	// Compilation successful
	return true, "", nil
}

// GetExecutableCommand returns the command to run compiled C++ binary
func (h *CppHandler) GetExecutableCommand() string {
	return "./main"
}

// GetResourceMultipliers returns resource multipliers for C++
// C++ is the baseline (1.0x)
func (h *CppHandler) GetResourceMultipliers() ResourceMultipliers {
	return ResourceMultipliers{
		TimeMultiplier:   1.0, // Baseline
		MemoryMultiplier: 1.0, // Baseline
		MemoryOverhead:   0,   // No overhead for native binary
	}
}

// ParseCompileError extracts meaningful error messages from g++ output
func (h *CppHandler) ParseCompileError(compilerOutput string) string {
	lines := strings.Split(compilerOutput, "\n")
	var errors []string

	for _, line := range lines {
		// Match g++ error format: "file:line:column: error: message"
		if strings.Contains(line, ": error:") || strings.Contains(line, ": fatal error:") {
			errors = append(errors, strings.TrimSpace(line))
		}
	}

	if len(errors) > 0 {
		// Return first few errors (avoid overwhelming output)
		if len(errors) > 5 {
			errors = errors[:5]
			errors = append(errors, "... (more errors omitted)")
		}
		return strings.Join(errors, "\n")
	}

	// If no structured errors found, return raw output (truncated)
	if len(compilerOutput) > 1000 {
		return compilerOutput[:1000] + "\n... (output truncated)"
	}
	return compilerOutput
}

// ParseRuntimeError determines C++ runtime error type from exit code
func (h *CppHandler) ParseRuntimeError(exitCode int, stderr string) string {
	stderrLower := strings.ToLower(stderr)

	switch exitCode {
	case 124:
		return "Time Limit Exceeded"

	case 136:
		return "Runtime Error: Floating Point Exception (SIGFPE)\n" +
			"Common causes:\n" +
			"• Division by zero\n" +
			"• Integer overflow in arithmetic\n" +
			"• Invalid modulo operation"

	case 139:
		return "Runtime Error: Segmentation Fault (SIGSEGV)\n" +
			"Common causes:\n" +
			"• Accessing out-of-bounds array index\n" +
			"• Dereferencing null or invalid pointer\n" +
			"• Stack overflow from deep recursion\n" +
			"• Accessing freed memory"

	case 134:
		return "Runtime Error: Aborted (SIGABRT)\n" +
			"Common causes:\n" +
			"• Failed assertion (assert())\n" +
			"• Double free\n" +
			"• Heap corruption"

	case 137:
		return "Runtime Error: Killed (SIGKILL)\n" +
			"Process was forcefully terminated.\n" +
			"Possible causes:\n" +
			"• Memory limit exceeded\n" +
			"• System resource exhaustion"

	default:
		// Check stderr for additional clues
		if strings.Contains(stderrLower, "segmentation fault") || strings.Contains(stderrLower, "sigsegv") {
			return fmt.Sprintf("Runtime Error: Segmentation Fault (exit code: %d)", exitCode)
		}

		if strings.Contains(stderrLower, "floating point") || strings.Contains(stderrLower, "sigfpe") {
			return fmt.Sprintf("Runtime Error: Floating Point Exception (exit code: %d)", exitCode)
		}

		if strings.Contains(stderrLower, "stack overflow") {
			return fmt.Sprintf("Runtime Error: Stack Overflow (exit code: %d)\n"+
				"Possible causes:\n"+
				"• Infinite recursion\n"+
				"• Very deep recursion\n"+
				"• Large local arrays", exitCode)
		}

		if strings.Contains(stderrLower, "aborted") || strings.Contains(stderrLower, "sigabrt") {
			return fmt.Sprintf("Runtime Error: Aborted (exit code: %d)", exitCode)
		}

		// Generic runtime error
		if stderr != "" {
			// Extract first line of stderr for context
			firstLine := strings.Split(stderr, "\n")[0]
			if len(firstLine) > 200 {
				firstLine = firstLine[:200] + "..."
			}
			return fmt.Sprintf("Runtime Error (exit code: %d)\n%s", exitCode, firstLine)
		}

		return fmt.Sprintf("Runtime Error (exit code: %d)", exitCode)
	}
}

// Helper function to detect specific error patterns
func (h *CppHandler) detectErrorPattern(stderr string) string {
	patterns := map[string]string{
		`std::bad_alloc`:           "Memory allocation failed (std::bad_alloc)",
		`std::out_of_range`:        "Array/vector index out of range (std::out_of_range)",
		`std::length_error`:        "Container size exceeds maximum (std::length_error)",
		`std::overflow_error`:      "Arithmetic overflow (std::overflow_error)",
		`std::underflow_error`:     "Arithmetic underflow (std::underflow_error)",
		`terminate called`:         "Unhandled exception - program terminated",
		`pure virtual`:             "Pure virtual function called",
		`double free`:              "Memory freed twice (double free)",
		`corrupted size vs`:        "Heap corruption detected",
		`invalid pointer`:          "Invalid pointer used in free/delete",
	}

	for pattern, message := range patterns {
		re := regexp.MustCompile(pattern)
		if re.MatchString(stderr) {
			return message
		}
	}

	return ""
}
