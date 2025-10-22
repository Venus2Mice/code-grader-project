package language

import (
	"testing"
)

func TestCppHandler_GetLanguage(t *testing.T) {
	handler := NewCppHandler()
	if handler.GetLanguage() != "cpp" {
		t.Errorf("Expected 'cpp', got '%s'", handler.GetLanguage())
	}
}

func TestCppHandler_SupportsStdio(t *testing.T) {
	handler := NewCppHandler()
	if !handler.SupportsStdio() {
		t.Error("CppHandler should support stdio mode")
	}
}

func TestCppHandler_SupportsFunction(t *testing.T) {
	handler := NewCppHandler()
	if !handler.SupportsFunction() {
		t.Error("CppHandler should support function mode")
	}
}

func TestCppHandler_GetResourceMultipliers(t *testing.T) {
	handler := NewCppHandler()
	multipliers := handler.GetResourceMultipliers()

	if multipliers.TimeMultiplier != 1.0 {
		t.Errorf("Expected time multiplier 1.0, got %f", multipliers.TimeMultiplier)
	}
	if multipliers.MemoryMultiplier != 1.0 {
		t.Errorf("Expected memory multiplier 1.0, got %f", multipliers.MemoryMultiplier)
	}
	if multipliers.MemoryOverhead != 0 {
		t.Errorf("Expected memory overhead 0, got %d", multipliers.MemoryOverhead)
	}
}

func TestCppHandler_ParseRuntimeError(t *testing.T) {
	handler := &CppHandler{}

	tests := []struct {
		name     string
		exitCode int
		stderr   string
		expected string
	}{
		{
			name:     "Division by zero",
			exitCode: 136,
			stderr:   "Floating point exception",
			expected: "Runtime Error: Floating Point Exception (SIGFPE)\nCommon causes:\n• Division by zero\n• Integer overflow in arithmetic\n• Invalid modulo operation",
		},
		{
			name:     "Segmentation fault",
			exitCode: 139,
			stderr:   "Segmentation fault",
			expected: "Runtime Error: Segmentation Fault (SIGSEGV)\nCommon causes:\n• Accessing out-of-bounds array index\n• Dereferencing null or invalid pointer\n• Stack overflow from deep recursion\n• Accessing freed memory",
		},
		{
			name:     "Abort signal",
			exitCode: 134,
			stderr:   "Aborted",
			expected: "Runtime Error: Aborted (SIGABRT)\nCommon causes:\n• Failed assertion (assert())\n• Double free\n• Heap corruption",
		},
		{
			name:     "Unknown error",
			exitCode: 1,
			stderr:   "Some error",
			expected: "Runtime Error (exit code: 1)\nSome error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := handler.ParseRuntimeError(tt.exitCode, tt.stderr)
			if result != tt.expected {
				t.Errorf("Expected:\n%s\nGot:\n%s", tt.expected, result)
			}
		})
	}
}

func TestCppHandler_ParseCompileError(t *testing.T) {
	handler := &CppHandler{}

	tests := []struct {
		name     string
		output   string
		expected string
	}{
		{
			name: "Syntax error",
			output: `main.cpp: In function 'int main()':
main.cpp:5:5: error: 'x' was not declared in this scope
    5 |     x = 10;
      |     ^
main.cpp:6:12: error: expected ';' before '}' token
    6 | }
      |            ^`,
			expected: `main.cpp:5:5: error: 'x' was not declared in this scope
main.cpp:6:12: error: expected ';' before '}' token`,
		},
		{
			name: "Type mismatch",
			output: `main.cpp:10:15: error: cannot convert 'const char*' to 'int' in assignment
   10 |     int num = "hello";
      |               ^~~~~~~`,
			expected: `main.cpp:10:15: error: cannot convert 'const char*' to 'int' in assignment`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := handler.ParseCompileError(tt.output)
			if result != tt.expected {
				t.Errorf("Expected:\n%s\nGot:\n%s", tt.expected, result)
			}
		})
	}
}

func TestCppHandler_GetExecutableCommand(t *testing.T) {
	handler := NewCppHandler()
	cmd := handler.GetExecutableCommand()

	if cmd != "./main" {
		t.Errorf("Expected './main', got '%s'", cmd)
	}
}
