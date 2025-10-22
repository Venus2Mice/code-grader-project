package language

import (
	"context"
	"time"

	"github.com/docker/docker/client"
)

// LanguageHandler defines the interface for language-specific compilation and execution
// Following SOLID principles:
// - Single Responsibility: Each handler manages one language
// - Open-Closed: Can add new languages without modifying existing code
// - Liskov Substitution: All handlers can be used interchangeably
// - Interface Segregation: Minimal, focused interface
// - Dependency Inversion: Grader depends on abstraction, not concrete implementations
type LanguageHandler interface {
	// GetLanguage returns the language identifier (e.g., "cpp", "python", "java")
	GetLanguage() string

	// GetFileExtension returns the source file extension (e.g., "cpp", "py", "java")
	GetFileExtension() string

	// Compile compiles the source code in the container
	// Returns success status and error message if compilation fails
	// For interpreted languages (Python), this validates syntax
	Compile(ctx context.Context, cli *client.Client, containerID string, sourceCode string) (success bool, errorMsg string, err error)

	// GetExecutableCommand returns the command to execute the compiled program
	// For compiled languages: "./main"
	// For interpreted languages: "python3 main.py"
	GetExecutableCommand() string

	// GetResourceMultipliers returns time and memory multipliers for this language
	// compared to C++ baseline
	// Example: Python is 5x slower, so timeMultiplier = 5.0
	GetResourceMultipliers() ResourceMultipliers

	// PrepareExecution prepares the container for execution
	// For example, Java might need to set CLASSPATH
	// Returns additional environment variables or setup commands
	PrepareExecution(ctx context.Context, cli *client.Client, containerID string) error

	// ParseCompileError extracts human-readable error from compiler output
	ParseCompileError(compilerOutput string) string

	// ParseRuntimeError determines error type from exit code and stderr
	ParseRuntimeError(exitCode int, stderr string) string

	// SupportsStdio indicates if this language supports stdio grading mode
	SupportsStdio() bool

	// SupportsFunction indicates if this language supports function grading mode
	SupportsFunction() bool
}

// ResourceMultipliers defines time and memory multipliers for a language
type ResourceMultipliers struct {
	TimeMultiplier   float64 // Multiplier for time limit (1.0 = baseline)
	MemoryMultiplier float64 // Multiplier for memory limit (1.0 = baseline)
	MemoryOverhead   int     // Fixed memory overhead in KB (e.g., JVM: 50MB)
}

// CompilationResult holds the result of compilation
type CompilationResult struct {
	Success      bool
	ErrorMessage string
	Duration     time.Duration
}

// ExecutionResult holds the result of program execution
type ExecutionResult struct {
	ExitCode     int
	Stdout       string
	Stderr       string
	Duration     time.Duration
	MemoryUsedKB int
}

// BaseHandler provides common functionality for all language handlers
// This follows DRY (Don't Repeat Yourself) principle
type BaseHandler struct {
	language      string
	fileExtension string
	supportsStdio bool
	supportsFunc  bool
}

func (b *BaseHandler) GetLanguage() string {
	return b.language
}

func (b *BaseHandler) GetFileExtension() string {
	return b.fileExtension
}

func (b *BaseHandler) SupportsStdio() bool {
	return b.supportsStdio
}

func (b *BaseHandler) SupportsFunction() bool {
	return b.supportsFunc
}

func (b *BaseHandler) PrepareExecution(ctx context.Context, cli *client.Client, containerID string) error {
	// Default: no preparation needed
	return nil
}
