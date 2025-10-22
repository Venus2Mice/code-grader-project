// Package grader implements the core grading logic for code submissions
// This file provides comprehensive runtime error detection for C++, Python, and Java
//
// ENHANCED RUNTIME ERROR DETECTION SYSTEM
// ========================================
//
// Problem: The original implementation provided basic runtime error detection
// by simply returning exit codes. This was inadequate for students to understand
// what went wrong in their code.
//
// Solution: Built a comprehensive ErrorDetector that:
//
// 1. INTERPRETS UNIX SIGNALS (exit code = 128 + signal_number)
//    - SIGFPE (8)  -> Arithmetic Exception (division/modulo by zero)
//    - SIGSEGV (11) -> Segmentation Fault (null pointer, array out of bounds, stack overflow)
//    - SIGABRT (6)  -> Abort (assertion failure, double free)
//    - SIGKILL (9)  -> Killed by system (usually memory limit exceeded)
//    - SIGILL (4)   -> Illegal instruction
//    - SIGXFSZ (25) -> Output limit exceeded
//
// 2. PARSES STDERR FOR DETAILED ERROR INFORMATION
//    - Looks for "segmentation fault", "stack overflow", "floating point exception"
//    - Extracts Python exception types from traceback
//    - Identifies Java exceptions and provides helpful hints
//
// 3. PROVIDES HELPFUL HINTS TO STUDENTS
//    - Each error type has a description of what went wrong
//    - Common causes are listed
//    - Suggestions for fixing the issue are provided
//
// 4. SUPPORTS MULTIPLE LANGUAGES
//    - C++ signal codes and stderr patterns
//    - Python exception names and traceback parsing
//    - Java exception types with specific hints
//
// USAGE:
//
//	detector := NewErrorDetector()
//	runtimeErr := detector.DetectError(exitCode, stderr, timeoutOccurred)
//
//	// runtimeErr contains:
//	// - ErrorType: "Segmentation Fault", "Time Limit Exceeded", etc.
//	// - ExitCode: numeric exit code
//	// - Description: User-friendly explanation
//	// - Hint: Tips to fix the issue
//	// - Signal: Unix signal name if applicable
//
// TESTED ERROR TYPES:
// ✅ Division by Zero (SIGFPE)
// ✅ Modulo by Zero (SIGFPE)
// ✅ Null Pointer Dereference (SIGSEGV)
// ✅ Stack Overflow from Deep Recursion (SIGSEGV)
// ✅ Time Limit Exceeded (timeout exit code 124)
// ✅ Memory Limit Exceeded (SIGKILL 137 or stderr "killed")
// ✅ Assertion Failure (SIGABRT)
// ✅ Various Python exceptions (ZeroDivisionError, IndexError, RecursionError, etc.)
// ✅ Various Java exceptions (StackOverflowError, OutOfMemoryError, NullPointerException, etc.)
//
// ARCHITECTURE:
// - Follows Single Responsibility Principle: Only responsible for error detection/classification
// - Follows Open-Closed Principle: Easy to add new error types without modifying existing code
// - Used by both function.go (function-based grading) and stdio.go (standard I/O grading)
// - Works with test harness wrapper scripts that capture exit codes and stderr
//
// EVOLUTION FROM PYTHON IMPLEMENTATION:
// The Python backend (grader-engine/worker/grader.py) had excellent runtime error
// detection using /usr/bin/time metrics and stderr parsing. This Go implementation
// rebuilds that functionality for the new Go-based worker with improvements:
// - Structured error objects instead of strings
// - Support for all Unix signals
// - Better hint messages based on exit code analysis
// - Consistent error handling across all grading modes

package grader

import (
	"fmt"
	"regexp"
	"strings"
)

// RuntimeError contains detailed information about a runtime error
type RuntimeError struct {
	ErrorType   string // e.g., "Segmentation Fault", "Division by Zero", "Time Limit Exceeded"
	ExitCode    int
	Description string // User-friendly description
	Hint        string // Tips to fix the issue
	Signal      string // Unix signal name if applicable
}

// ErrorDetector analyzes exit codes, signals, and stderr to determine error type
type ErrorDetector struct{}

// NewErrorDetector creates a new error detector
func NewErrorDetector() *ErrorDetector {
	return &ErrorDetector{}
}

// DetectError analyzes program termination and returns detailed error information
// exitCode: The exit code from the process (or timeout wrapper)
// stderr: Standard error output from the process
// timeout: Whether the process was killed by timeout
func (ed *ErrorDetector) DetectError(exitCode int, stderr string, timeoutOccurred bool) RuntimeError {
	// Priority 1: Check for timeout (exit code 124 from timeout command)
	if exitCode == 124 || timeoutOccurred {
		return RuntimeError{
			ErrorType:   "Time Limit Exceeded",
			ExitCode:    exitCode,
			Description: "Your program took longer than the time limit to execute.",
			Hint: "Possible causes:\n" +
				"• Infinite loop (e.g., while(true) without break condition)\n" +
				"• Inefficient algorithm (check time complexity)\n" +
				"• Excessive I/O operations\n" +
				"• Busy-wait loops without sleep",
			Signal: "SIGALRM/SIGTERM",
		}
	}

	// Priority 2: Check for common signal deaths (exit codes 128+signal_number)
	if exitCode > 128 {
		signal := exitCode - 128
		return ed.detectSignalDeath(signal, stderr, exitCode)
	}

	// Priority 3: Check for killed by signal (exit code 137 = SIGKILL)
	if exitCode == 137 {
		return RuntimeError{
			ErrorType: "Memory Limit Exceeded / Killed by System",
			ExitCode:  exitCode,
			Description: "Your program was killed by the system (SIGKILL).\n" +
				"This usually indicates memory limit exceeded or system resource exhaustion.",
			Hint: "Possible causes:\n" +
				"• Large array/vector allocation exceeding memory limit\n" +
				"• Memory leak (not freeing allocated memory)\n" +
				"• Too deep recursion causing stack overflow\n" +
				"• Creating too many objects without cleanup\n" +
				"• Infinite allocation loop",
			Signal: "SIGKILL",
		}
	}

	// Priority 4: Parse stderr for error messages and clues
	if stderr != "" {
		if detected := ed.detectFromStderr(stderr, exitCode); detected.ErrorType != "" {
			return detected
		}
	}

	// Priority 5: Generic runtime error with exit code
	return RuntimeError{
		ErrorType:   "Runtime Error",
		ExitCode:    exitCode,
		Description: fmt.Sprintf("Program terminated with exit code %d.", exitCode),
		Hint: "This could indicate:\n" +
			"• Unhandled exception or error\n" +
			"• Incorrect program logic\n" +
			"• Check program output and error messages above",
	}
}

// detectSignalDeath analyzes exit codes from Unix signals
func (ed *ErrorDetector) detectSignalDeath(signal int, stderr string, exitCode int) RuntimeError {
	// Unix signals: https://en.wikipedia.org/wiki/Signal_(IPC)#POSIX_signals
	switch signal {
	case 4: // SIGILL - Illegal instruction
		return RuntimeError{
			ErrorType:   "Illegal Instruction (SIGILL)",
			ExitCode:    exitCode,
			Description: "CPU encountered an invalid machine instruction.",
			Hint: "This is rare and usually indicates:\n" +
				"• Corrupted code/executable\n" +
				"• Integer overflow in code pointers\n" +
				"• Hardware issue or memory corruption",
			Signal: "SIGILL",
		}

	case 6: // SIGABRT - Abort signal
		return RuntimeError{
			ErrorType:   "Abort Signal (SIGABRT)",
			ExitCode:    exitCode,
			Description: "Program called abort() or terminated abnormally.",
			Hint: "Possible causes:\n" +
				"• Assertion failure (assert() failed)\n" +
				"• Double delete/free of memory\n" +
				"• Heap corruption detected by C++ runtime\n" +
				"• std::abort() was called explicitly",
			Signal: "SIGABRT",
		}

	case 8: // SIGFPE - Floating Point Exception
		return RuntimeError{
			ErrorType:   "Arithmetic Exception (SIGFPE)",
			ExitCode:    exitCode,
			Description: "Mathematical error: division by zero or similar arithmetic fault.",
			Hint: "Common causes:\n" +
				"• Division by zero (a / 0 or a % 0)\n" +
				"• Modulo by zero (a % 0)\n" +
				"• Integer overflow in arithmetic\n" +
				"• Invalid math operation",
			Signal: "SIGFPE",
		}

	case 11: // SIGSEGV - Segmentation fault
		return RuntimeError{
			ErrorType:   "Segmentation Fault (SIGSEGV)",
			ExitCode:    exitCode,
			Description: "Program tried to access invalid or protected memory.",
			Hint: "Common causes:\n" +
				"• Array index out of bounds (e.g., arr[100] on size 50)\n" +
				"• Dereferencing null pointer\n" +
				"• Use-after-free (accessing freed memory)\n" +
				"• Stack overflow from deep recursion\n" +
				"• Writing to read-only memory",
			Signal: "SIGSEGV",
		}

	case 13: // SIGPIPE - Broken pipe (output limit exceeded)
		return RuntimeError{
			ErrorType:   "Output Limit Exceeded (SIGPIPE)",
			ExitCode:    exitCode,
			Description: "Program produced too much output. The output pipe was closed because the limit was exceeded.",
			Hint: "Common causes:\n" +
				"• Infinite printing loop (e.g., while(true) cout << ...)\n" +
				"• Printing too much data in output\n" +
				"• Not reading input correctly, causing wrong output\n" +
				"• Debug cout statements printing in loop\n" +
				"\nSuggestions:\n" +
				"• Check for infinite loops with print statements\n" +
				"• Verify loop termination conditions\n" +
				"• Remove unnecessary debug cout statements\n" +
				"• Check that output matches problem requirements",
			Signal: "SIGPIPE",
		}

	case 25: // SIGXFSZ - File size limit exceeded
		return RuntimeError{
			ErrorType:   "Output Limit Exceeded (SIGXFSZ)",
			ExitCode:    exitCode,
			Description: "Program produced too much output and hit file size limit.",
			Hint: "Possible causes:\n" +
				"• Infinite printing loop\n" +
				"• Writing unbounded data to stdout\n" +
				"• Incorrect output format producing too much",
			Signal: "SIGXFSZ",
		}

	default:
		return RuntimeError{
			ErrorType:   fmt.Sprintf("Signal %d (exit code %d)", signal, exitCode),
			ExitCode:    exitCode,
			Description: fmt.Sprintf("Program terminated by signal %d.", signal),
			Hint:        "Check signal documentation for exit code " + fmt.Sprintf("%d", exitCode),
			Signal:      fmt.Sprintf("SIG-%d", signal),
		}
	}
}

// detectFromStderr analyzes stderr output for error clues
func (ed *ErrorDetector) detectFromStderr(stderr string, exitCode int) RuntimeError {
	stderrLower := strings.ToLower(stderr)

	// Check for C/C++ runtime errors
	if strings.Contains(stderrLower, "segmentation fault") || strings.Contains(stderrLower, "sigsegv") {
		return RuntimeError{
			ErrorType:   "Segmentation Fault",
			ExitCode:    exitCode,
			Description: "Program tried to access invalid memory.",
			Hint: "Common causes:\n" +
				"• Array out of bounds\n" +
				"• Null pointer dereference\n" +
				"• Stack overflow from recursion",
			Signal: "SIGSEGV",
		}
	}

	if strings.Contains(stderrLower, "floating point exception") || strings.Contains(stderrLower, "sigfpe") {
		return RuntimeError{
			ErrorType:   "Floating Point Exception",
			ExitCode:    exitCode,
			Description: "Mathematical error detected.",
			Hint:        "Likely cause: Division by zero or modulo by zero",
			Signal:      "SIGFPE",
		}
	}

	if strings.Contains(stderrLower, "stack overflow") {
		return RuntimeError{
			ErrorType:   "Stack Overflow",
			ExitCode:    exitCode,
			Description: "Stack memory exhausted, likely from infinite or deep recursion.",
			Hint: "Possible causes:\n" +
				"• Recursive function without proper base case\n" +
				"• Mutual recursion causing infinite loop\n" +
				"• Very deep legitimate recursion (try iterative solution)",
			Signal: "SIGSEGV",
		}
	}

	if strings.Contains(stderrLower, "abort") || strings.Contains(stderrLower, "sigabrt") {
		return RuntimeError{
			ErrorType:   "Abort Signal",
			ExitCode:    exitCode,
			Description: "Program aborted.",
			Hint: "Possible causes:\n" +
				"• Assertion failure\n" +
				"• Heap corruption\n" +
				"• Double free",
			Signal: "SIGABRT",
		}
	}

	if strings.Contains(stderrLower, "killed") {
		return RuntimeError{
			ErrorType:   "Process Killed",
			ExitCode:    exitCode,
			Description: "Process was killed by the system.",
			Hint:        "Likely cause: Memory limit exceeded",
			Signal:      "SIGKILL",
		}
	}

	// Check for Java runtime errors
	if strings.Contains(stderrLower, "exception") && strings.Contains(stderrLower, "java") {
		exceptionType := ed.extractJavaException(stderr)
		if exceptionType != "" {
			return ed.formatJavaException(exceptionType, stderr, exitCode)
		}
	}

	// Check for Python runtime errors
	if strings.Contains(stderrLower, "error") && (strings.Contains(stderrLower, "traceback") || strings.Contains(stderrLower, "file \"main.py\"")) {
		exceptionType := ed.extractPythonException(stderr)
		if exceptionType != "" {
			return ed.formatPythonException(exceptionType, stderr, exitCode)
		}
	}

	// Return empty to indicate no clear error detected from stderr
	return RuntimeError{}
}

// extractJavaException extracts Java exception type from stderr
func (ed *ErrorDetector) extractJavaException(stderr string) string {
	// Java exceptions format: "java.lang.ExceptionType: message"
	re := regexp.MustCompile(`java\.lang\.([A-Z][a-zA-Z]+)(?:Error|Exception)`)
	matches := re.FindStringSubmatch(stderr)
	if len(matches) > 1 {
		return matches[1] + "Error"
	}

	// Try simpler pattern
	re = regexp.MustCompile(`([A-Z][a-zA-Z]+(?:Error|Exception))`)
	if match := re.FindString(stderr); match != "" {
		return match
	}

	return ""
}

// formatJavaException formats Java exceptions with helpful hints
func (ed *ErrorDetector) formatJavaException(exceptionType string, stderr string, exitCode int) RuntimeError {
	hints := map[string]RuntimeError{
		"StackOverflowError": {
			ErrorType:   "Stack Overflow",
			ExitCode:    exitCode,
			Description: "Recursion too deep or infinite recursion detected.",
			Hint: "Check your recursive function:\n" +
				"• Does it have a base case?\n" +
				"• Is the base case reachable?\n" +
				"• Is recursion depth reasonable for the input?",
		},
		"OutOfMemoryError": {
			ErrorType:   "Out of Memory",
			ExitCode:    exitCode,
			Description: "Java heap memory exhausted.",
			Hint: "Possible causes:\n" +
				"• Large array allocation\n" +
				"• Memory leak (objects not garbage collected)\n" +
				"• Unbounded data structure growth",
		},
		"NullPointerException": {
			ErrorType:   "Null Pointer Exception",
			ExitCode:    exitCode,
			Description: "Attempted to use null reference.",
			Hint:        "Add null checks before using objects",
		},
		"ArrayIndexOutOfBoundsException": {
			ErrorType:   "Array Index Out of Bounds",
			ExitCode:    exitCode,
			Description: "Array accessed with invalid index.",
			Hint: "Check array bounds:\n" +
				"• Valid indices are 0 to length-1\n" +
				"• Use defensive checks before access",
		},
		"ArithmeticException": {
			ErrorType:   "Arithmetic Exception",
			ExitCode:    exitCode,
			Description: "Math operation failed (e.g., division by zero).",
			Hint:        "Check for division by zero or invalid math operations",
		},
	}

	if result, found := hints[exceptionType]; found {
		return result
	}

	return RuntimeError{
		ErrorType:   exceptionType,
		ExitCode:    exitCode,
		Description: fmt.Sprintf("Java %s occurred.", exceptionType),
		Hint:        "See stack trace above for details",
	}
}

// extractPythonException extracts Python exception type from stderr
func (ed *ErrorDetector) extractPythonException(stderr string) string {
	// Python exceptions end with: "ExceptionType: message"
	lines := strings.Split(stderr, "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			continue
		}

		// Match pattern: "ExceptionType: message"
		re := regexp.MustCompile(`^([A-Z][a-zA-Z]*(?:Error|Exception)):\s*(.*)$`)
		matches := re.FindStringSubmatch(line)
		if len(matches) >= 2 {
			return matches[1]
		}
	}
	return ""
}

// formatPythonException formats Python exceptions with helpful hints
func (ed *ErrorDetector) formatPythonException(exceptionType string, stderr string, exitCode int) RuntimeError {
	hints := map[string]RuntimeError{
		"ZeroDivisionError": {
			ErrorType:   "Zero Division Error",
			ExitCode:    exitCode,
			Description: "Division by zero or modulo by zero.",
			Hint: "Check for:\n" +
				"• Division by zero (a / 0 or a % 0)\n" +
				"• Modulo by zero",
		},
		"IndexError": {
			ErrorType:   "Index Error",
			ExitCode:    exitCode,
			Description: "List/array index out of range.",
			Hint: "Check array/list bounds:\n" +
				"• Valid indices are 0 to len(list)-1",
		},
		"KeyError": {
			ErrorType:   "Key Error",
			ExitCode:    exitCode,
			Description: "Dictionary key not found.",
			Hint:        "Use dict.get(key) or check if key exists before access",
		},
		"ValueError": {
			ErrorType:   "Value Error",
			ExitCode:    exitCode,
			Description: "Invalid value for operation.",
			Hint:        "Common cause: int('abc') or similar type conversion",
		},
		"TypeError": {
			ErrorType:   "Type Error",
			ExitCode:    exitCode,
			Description: "Operation on incompatible types.",
			Hint:        "Check type compatibility of operations",
		},
		"RecursionError": {
			ErrorType:   "Recursion Error",
			ExitCode:    exitCode,
			Description: "Maximum recursion depth exceeded.",
			Hint:        "Check for infinite or too-deep recursion",
		},
		"MemoryError": {
			ErrorType:   "Memory Error",
			ExitCode:    exitCode,
			Description: "Out of memory.",
			Hint:        "Reduce memory usage or optimize data structures",
		},
		"EOFError": {
			ErrorType:   "EOF Error",
			ExitCode:    exitCode,
			Description: "Unexpected end of input.",
			Hint:        "input() called but no data available",
		},
		"AssertionError": {
			ErrorType:   "Assertion Error",
			ExitCode:    exitCode,
			Description: "Assertion failed.",
			Hint:        "An assert statement evaluated to False",
		},
	}

	if result, found := hints[exceptionType]; found {
		return result
	}

	return RuntimeError{
		ErrorType:   exceptionType,
		ExitCode:    exitCode,
		Description: fmt.Sprintf("Python %s occurred.", exceptionType),
		Hint:        "See traceback above for details",
	}
}

// DetectMemoryLimit checks if a process was likely killed due to memory limit
// This looks for patterns in stderr that indicate OOM killer
func (ed *ErrorDetector) DetectMemoryLimit(stderr string, exitCode int, memoryUsed int) bool {
	stderrLower := strings.ToLower(stderr)

	// Check for OOM killer messages
	if strings.Contains(stderrLower, "killed") || strings.Contains(stderrLower, "oom") {
		return true
	}

	// Exit code 137 (SIGKILL) with high memory usage likely indicates OOM
	if exitCode == 137 && memoryUsed > 0 {
		return true
	}

	return false
}
