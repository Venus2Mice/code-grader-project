package language

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/docker/docker/client"
)

// JavaHandler implements language handler for Java
type JavaHandler struct {
	BaseHandler
}

// NewJavaHandler creates a new Java language handler
func NewJavaHandler() *JavaHandler {
	return &JavaHandler{
		BaseHandler: BaseHandler{
			language:      "java",
			fileExtension: "java",
			supportsStdio: true,
			supportsFunc:  false, // TODO: Implement function grading for Java
		},
	}
}

// Compile compiles Java source code using javac
func (h *JavaHandler) Compile(ctx context.Context, cli *client.Client, containerID string, sourceCode string) (success bool, errorMsg string, err error) {
	// Java requires the class name to match filename
	// Extract class name from source code
	className := h.extractMainClassName(sourceCode)
	if className == "" {
		return false, "Could not find public class with main method", nil
	}

	filename := className + ".java"

	// Copy source code to container with correct filename
	if err := copyFileToContainer(ctx, cli, containerID, filename, sourceCode); err != nil {
		return false, "", fmt.Errorf("failed to copy source code: %w", err)
	}

	// Compile with javac
	compileCmd := []string{
		"javac",
		"-encoding", "UTF-8",
		"-J-Xms128m", "-J-Xmx256m", // Limit compiler memory
		filename,
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

	// Store class name for execution
	// Create a marker file with the class name
	if err := copyFileToContainer(ctx, cli, containerID, ".classname", className); err != nil {
		return false, "", fmt.Errorf("failed to store class name: %w", err)
	}

	return true, "", nil
}

// GetExecutableCommand returns the command to run Java program
func (h *JavaHandler) GetExecutableCommand() string {
	// The actual class name will be read from .classname file at runtime
	// This is a placeholder - the actual command is built in PrepareExecution
	return "java Main"
}

// GetResourceMultipliers returns resource multipliers for Java
// Java has significant JVM overhead
func (h *JavaHandler) GetResourceMultipliers() ResourceMultipliers {
	return ResourceMultipliers{
		TimeMultiplier:   3.0,    // Java is ~3x slower than C++ (including JVM startup)
		MemoryMultiplier: 2.0,    // Java uses ~2x more memory
		MemoryOverhead:   51200,  // ~50MB for JVM
	}
}

// PrepareExecution sets up Java execution environment
func (h *JavaHandler) PrepareExecution(ctx context.Context, cli *client.Client, containerID string) error {
	// Read the class name from marker file
	// This is set during compilation
	return nil
}

// extractMainClassName extracts the name of the public class containing main method
func (h *JavaHandler) extractMainClassName(sourceCode string) string {
	// Match: public class ClassName
	publicClassRe := regexp.MustCompile(`public\s+class\s+(\w+)`)
	matches := publicClassRe.FindStringSubmatch(sourceCode)
	
	if len(matches) > 1 {
		className := matches[1]
		
		// Verify this class has a main method
		mainMethodRe := regexp.MustCompile(`public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+\w+\s*\)`)
		if mainMethodRe.MatchString(sourceCode) {
			return className
		}
	}

	// Fallback: look for any class with main method
	classRe := regexp.MustCompile(`class\s+(\w+)`)
	mainRe := regexp.MustCompile(`public\s+static\s+void\s+main`)
	
	if mainRe.MatchString(sourceCode) {
		matches := classRe.FindStringSubmatch(sourceCode)
		if len(matches) > 1 {
			return matches[1]
		}
	}

	// Default fallback
	return "Main"
}

// ParseCompileError extracts meaningful error messages from javac output
func (h *JavaHandler) ParseCompileError(compilerOutput string) string {
	lines := strings.Split(compilerOutput, "\n")
	var errors []string

	for i, line := range lines {
		// javac error format: "filename.java:line: error: message"
		if strings.Contains(line, ".java:") && strings.Contains(line, " error:") {
			errors = append(errors, strings.TrimSpace(line))
			
			// Include next line (often contains the problematic code)
			if i+1 < len(lines) && strings.TrimSpace(lines[i+1]) != "" {
				errors = append(errors, "  "+strings.TrimSpace(lines[i+1]))
			}
			
			// Include pointer line (^)
			if i+2 < len(lines) && strings.Contains(lines[i+2], "^") {
				errors = append(errors, "  "+strings.TrimSpace(lines[i+2]))
			}
		}
	}

	if len(errors) > 0 {
		// Return first few errors
		if len(errors) > 10 {
			errors = errors[:10]
			errors = append(errors, "... (more errors omitted)")
		}
		return strings.Join(errors, "\n")
	}

	// Common javac errors that might not match above pattern
	if strings.Contains(compilerOutput, "class") && strings.Contains(compilerOutput, "public") {
		return "Compilation Error: Public class name must match filename\n" +
			"Make sure your public class name matches the file name."
	}

	// Fallback: return truncated output
	if len(compilerOutput) > 1000 {
		return compilerOutput[:1000] + "\n... (output truncated)"
	}
	return compilerOutput
}

// ParseRuntimeError determines Java runtime error type from exit code
func (h *JavaHandler) ParseRuntimeError(exitCode int, stderr string) string {
	// Timeout
	if exitCode == 124 {
		return "Time Limit Exceeded"
	}

	// Killed by signal
	if exitCode == 137 {
		return "Runtime Error: Process Killed (SIGKILL)\n" +
			"Possible causes:\n" +
			"• Memory limit exceeded\n" +
			"• JVM out of memory"
	}

	// Parse Java exception from stderr
	exceptionType := h.extractJavaException(stderr)
	if exceptionType != "" {
		return h.formatJavaException(exceptionType, stderr)
	}

	// Check for OutOfMemoryError
	if strings.Contains(stderr, "OutOfMemoryError") || strings.Contains(stderr, "Java heap space") {
		return "Runtime Error: Out of Memory\n" +
			"Your program used too much memory.\n" +
			"Possible causes:\n" +
			"• Creating too many objects\n" +
			"• Large arrays or collections\n" +
			"• Memory leak (objects not being garbage collected)"
	}

	// Check for StackOverflowError
	if strings.Contains(stderr, "StackOverflowError") {
		return "Runtime Error: Stack Overflow\n" +
			"Possible causes:\n" +
			"• Infinite recursion\n" +
			"• Very deep recursion"
	}

	// Generic error
	if stderr != "" {
		lines := strings.Split(stderr, "\n")
		// Get first few meaningful lines
		var errorLines []string
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if trimmed != "" && !strings.HasPrefix(trimmed, "at java.") && !strings.HasPrefix(trimmed, "at sun.") {
				errorLines = append(errorLines, line)
				if len(errorLines) >= 5 {
					break
				}
			}
		}
		if len(errorLines) > 0 {
			return "Runtime Error:\n" + strings.Join(errorLines, "\n")
		}
	}

	return fmt.Sprintf("Runtime Error (exit code: %d)", exitCode)
}

// extractJavaException extracts the exception type from Java stack trace
func (h *JavaHandler) extractJavaException(stderr string) string {
	// Java exceptions start with: "Exception in thread "main" ExceptionType: message"
	re := regexp.MustCompile(`Exception in thread "[^"]*" ([a-zA-Z.]+Exception|[a-zA-Z.]+Error):`)
	matches := re.FindStringSubmatch(stderr)
	if len(matches) >= 2 {
		// Extract just the exception name without package
		parts := strings.Split(matches[1], ".")
		return parts[len(parts)-1]
	}
	return ""
}

// formatJavaException formats common Java exceptions with helpful hints
func (h *JavaHandler) formatJavaException(exceptionType string, fullStackTrace string) string {
	hints := map[string]string{
		"ArithmeticException":            "Arithmetic error (e.g., division by zero)",
		"ArrayIndexOutOfBoundsException": "Array index out of bounds",
		"NullPointerException":           "Attempted to use null object reference",
		"NumberFormatException":          "Invalid number format in parsing",
		"InputMismatchException":         "Input type doesn't match expected type",
		"NoSuchElementException":         "Attempted to access element that doesn't exist",
		"IllegalArgumentException":       "Invalid argument passed to method",
		"ClassCastException":             "Invalid type casting",
		"StackOverflowError":             "Stack overflow (likely infinite recursion)",
		"OutOfMemoryError":               "JVM ran out of memory",
	}

	hint, hasHint := hints[exceptionType]

	// Extract the exception message line
	lines := strings.Split(fullStackTrace, "\n")
	var exceptionLine string
	for _, line := range lines {
		if strings.Contains(line, "Exception in thread") {
			exceptionLine = strings.TrimSpace(line)
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

	// Add relevant stack trace (exclude JVM internals)
	result += "\n\nStack trace (user code only):"
	relevantLines := h.extractRelevantStackTrace(fullStackTrace, 5)
	if len(relevantLines) > 0 {
		result += "\n" + strings.Join(relevantLines, "\n")
	}

	return result
}

// extractRelevantStackTrace extracts user code lines from Java stack trace
func (h *JavaHandler) extractRelevantStackTrace(fullStackTrace string, maxLines int) []string {
	lines := strings.Split(fullStackTrace, "\n")
	var relevant []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		
		// Skip JVM internal classes
		if strings.HasPrefix(trimmed, "at java.") ||
			strings.HasPrefix(trimmed, "at sun.") ||
			strings.HasPrefix(trimmed, "at jdk.") ||
			strings.Contains(trimmed, "java.lang.reflect") {
			continue
		}

		// Include user code
		if strings.HasPrefix(trimmed, "at ") {
			relevant = append(relevant, line)
			if len(relevant) >= maxLines {
				break
			}
		}
	}

	return relevant
}
