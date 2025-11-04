package language

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/docker/docker/client"
)

// PythonHandler implements language handler for Python 3
type PythonHandler struct {
	BaseHandler
}

// NewPythonHandler creates a new Python language handler
func NewPythonHandler() *PythonHandler {
	return &PythonHandler{
		BaseHandler: BaseHandler{
			language:      "python",
			fileExtension: "py",
			supportsStdio: true,
			supportsFunc:  true, // ✅ IMPLEMENTED: See harness_python_v2.go
		},
	}
}

// Compile validates Python syntax (Python is interpreted, not compiled)
func (h *PythonHandler) Compile(ctx context.Context, cli *client.Client, containerID string, sourceCode string) (success bool, errorMsg string, err error) {
	// Copy source code to container
	if err := copyFileToContainer(ctx, cli, containerID, "main.py", sourceCode); err != nil {
		return false, "", fmt.Errorf("failed to copy source code: %w", err)
	}

	// Validate syntax using py_compile
	validateCmd := []string{
		"python3",
		"-m",
		"py_compile",
		"main.py",
	}

	exitCode, output, err := execInContainer(ctx, cli, containerID, validateCmd)
	if err != nil {
		return false, "", fmt.Errorf("syntax validation failed: %w", err)
	}

	if exitCode != 0 {
		// Syntax error
		errorMsg = h.ParseCompileError(output)
		return false, errorMsg, nil
	}

	// Syntax is valid
	return true, "", nil
}

// GetExecutableCommand returns the command to run Python script
func (h *PythonHandler) GetExecutableCommand() string {
	return "python3 main.py"
}

// GetResourceMultipliers returns resource multipliers for Python
// Python is typically 5-10x slower than C++ and uses more memory
func (h *PythonHandler) GetResourceMultipliers() ResourceMultipliers {
	return ResourceMultipliers{
		TimeMultiplier:   5.0,   // Python is ~5x slower than C++
		MemoryMultiplier: 2.0,   // Python uses ~2x more memory
		MemoryOverhead:   20480, // ~20MB for Python interpreter
	}
}

// ParseCompileError extracts meaningful error messages from Python syntax errors
func (h *PythonHandler) ParseCompileError(output string) string {
	// Python syntax errors have format:
	// File "main.py", line X
	//   code line
	//   ^
	// SyntaxError: message

	lines := strings.Split(output, "\n")
	var errorLines []string
	capturing := false

	for i, line := range lines {
		// Start capturing at "File" line
		if strings.Contains(line, "File \"main.py\"") {
			capturing = true
			errorLines = append(errorLines, line)
			continue
		}

		// Capture context lines
		if capturing {
			errorLines = append(errorLines, line)
			// Stop after error message line
			if strings.Contains(line, "Error:") {
				// Add one more line if available (additional context)
				if i+1 < len(lines) && lines[i+1] != "" {
					errorLines = append(errorLines, lines[i+1])
				}
				break
			}
		}
	}

	if len(errorLines) > 0 {
		return strings.Join(errorLines, "\n")
	}

	// Fallback: return truncated output
	if len(output) > 500 {
		return output[:500] + "\n... (output truncated)"
	}
	return output
}

// ParseRuntimeError determines Python runtime error type from exit code
func (h *PythonHandler) ParseRuntimeError(exitCode int, stderr string) string {
	// Timeout
	if exitCode == 124 {
		return "Time Limit Exceeded"
	}

	// Killed by signal
	if exitCode == 137 {
		return "Runtime Error: Process Killed (SIGKILL)\n" +
			"Possible causes:\n" +
			"• Memory limit exceeded\n" +
			"• System resource exhaustion"
	}

	// Parse Python exception from stderr
	exceptionType := h.extractPythonException(stderr)
	if exceptionType != "" {
		return h.formatPythonException(exceptionType, stderr)
	}

	// Generic error with stderr
	if stderr != "" {
		lines := strings.Split(stderr, "\n")
		// Get last few meaningful lines (usually the exception)
		var errorLines []string
		for i := len(lines) - 1; i >= 0 && len(errorLines) < 10; i-- {
			if strings.TrimSpace(lines[i]) != "" {
				errorLines = append([]string{lines[i]}, errorLines...)
			}
		}
		return "Runtime Error:\n" + strings.Join(errorLines, "\n")
	}

	return fmt.Sprintf("Runtime Error (exit code: %d)", exitCode)
}

// extractPythonException extracts the exception type from Python traceback
func (h *PythonHandler) extractPythonException(stderr string) string {
	// Python exceptions end with: "ExceptionType: message"
	lines := strings.Split(stderr, "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			continue
		}

		// Match pattern: "ExceptionType: message"
		re := regexp.MustCompile(`^([A-Z][a-zA-Z]*Error|[A-Z][a-zA-Z]*Exception):\s*(.*)$`)
		matches := re.FindStringSubmatch(line)
		if len(matches) >= 2 {
			return matches[1]
		}
	}
	return ""
}

// formatPythonException formats common Python exceptions with helpful hints
func (h *PythonHandler) formatPythonException(exceptionType string, fullTraceback string) string {
	hints := map[string]string{
		"ZeroDivisionError": "Division by zero or modulo by zero",
		"IndexError":        "List/array index out of range",
		"KeyError":          "Dictionary key not found",
		"ValueError":        "Invalid value for operation (e.g., int('abc'))",
		"TypeError":         "Operation on incompatible types",
		"NameError":         "Variable or function name not defined",
		"AttributeError":    "Object attribute/method not found",
		"ImportError":       "Failed to import module",
		"RecursionError":    "Maximum recursion depth exceeded (infinite recursion?)",
		"MemoryError":       "Out of memory",
		"OverflowError":     "Arithmetic operation result too large",
		"KeyboardInterrupt": "Program interrupted (should not happen in grading)",
		"EOFError":          "Unexpected end of input (input() with no data)",
		"AssertionError":    "Assertion failed (assert statement)",
	}

	hint, hasHint := hints[exceptionType]

	// Extract the exception message line
	lines := strings.Split(fullTraceback, "\n")
	var exceptionLine string
	for i := len(lines) - 1; i >= 0; i-- {
		if strings.Contains(lines[i], exceptionType+":") {
			exceptionLine = lines[i]
			break
		}
	}

	result := fmt.Sprintf("Runtime Error: %s\n", exceptionType)
	if exceptionLine != "" {
		result += exceptionLine + "\n"
	}
	if hasHint {
		result += "\nCommon cause: " + hint
	}

	// Add relevant traceback lines (max 5)
	result += "\n\nTraceback (last few calls):"
	tracebackLines := h.extractRelevantTraceback(fullTraceback, 5)
	if len(tracebackLines) > 0 {
		result += "\n" + strings.Join(tracebackLines, "\n")
	}

	return result
}

// extractRelevantTraceback extracts the most relevant lines from Python traceback
func (h *PythonHandler) extractRelevantTraceback(fullTraceback string, maxLines int) []string {
	lines := strings.Split(fullTraceback, "\n")
	var relevant []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Include lines from main.py only
		if strings.Contains(line, "File \"main.py\"") ||
			(len(relevant) > 0 && strings.HasPrefix(trimmed, "^")) ||
			(len(relevant) > 0 && !strings.HasPrefix(line, " ") && !strings.Contains(line, "File")) {
			relevant = append(relevant, line)
			if len(relevant) >= maxLines {
				break
			}
		}
	}

	return relevant
}
