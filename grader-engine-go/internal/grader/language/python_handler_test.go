package language

import (
	"testing"
)

func TestPythonHandler_GetLanguage(t *testing.T) {
	handler := NewPythonHandler()
	if handler.GetLanguage() != "python" {
		t.Errorf("Expected 'python', got '%s'", handler.GetLanguage())
	}
}

func TestPythonHandler_SupportsStdio(t *testing.T) {
	handler := NewPythonHandler()
	if !handler.SupportsStdio() {
		t.Error("PythonHandler should support stdio mode")
	}
}

func TestPythonHandler_SupportsFunction(t *testing.T) {
	handler := NewPythonHandler()
	if !handler.SupportsFunction() {
		t.Error("PythonHandler should support function mode")
	}
}

func TestPythonHandler_GetResourceMultipliers(t *testing.T) {
	handler := NewPythonHandler()
	multipliers := handler.GetResourceMultipliers()

	if multipliers.TimeMultiplier != 5.0 {
		t.Errorf("Expected time multiplier 5.0, got %f", multipliers.TimeMultiplier)
	}
	if multipliers.MemoryMultiplier != 2.0 {
		t.Errorf("Expected memory multiplier 2.0, got %f", multipliers.MemoryMultiplier)
	}
	if multipliers.MemoryOverhead != 20*1024 {
		t.Errorf("Expected memory overhead 20480 KB, got %d", multipliers.MemoryOverhead)
	}
}

func TestPythonHandler_ParseRuntimeError(t *testing.T) {
	handler := NewPythonHandler()

	tests := []struct {
		name     string
		exitCode int
		stderr   string
		expected string
	}{
		{
			name:     "ZeroDivisionError",
			exitCode: 1,
			stderr:   "Traceback (most recent call last):\n  File \"main.py\", line 5, in <module>\n    result = 10 / 0\nZeroDivisionError: division by zero",
			expected: "Runtime Error: ZeroDivisionError\nZeroDivisionError: division by zero\n\nCommon cause: Division by zero or modulo by zero\n\nTraceback (last few calls):\n  File \"main.py\", line 5, in <module>\nZeroDivisionError: division by zero",
		},
		{
			name:     "IndexError",
			exitCode: 1,
			stderr:   "Traceback (most recent call last):\n  File \"main.py\", line 3, in <module>\n    print(arr[10])\nIndexError: list index out of range",
			expected: "Runtime Error: IndexError\nIndexError: list index out of range\n\nCommon cause: List/array index out of range\n\nTraceback (last few calls):\n  File \"main.py\", line 3, in <module>\nIndexError: list index out of range",
		},
		{
			name:     "NameError",
			exitCode: 1,
			stderr:   "Traceback (most recent call last):\n  File \"main.py\", line 2, in <module>\n    print(x)\nNameError: name 'x' is not defined",
			expected: "Runtime Error: NameError\nNameError: name 'x' is not defined\n\nCommon cause: Variable or function name not defined\n\nTraceback (last few calls):\n  File \"main.py\", line 2, in <module>\nNameError: name 'x' is not defined",
		},
		{
			name:     "TypeError",
			exitCode: 1,
			stderr:   "Traceback (most recent call last):\n  File \"main.py\", line 1, in <module>\n    result = '2' + 2\nTypeError: can only concatenate str (not \"int\") to str",
			expected: "Runtime Error: TypeError\nTypeError: can only concatenate str (not \"int\") to str\n\nCommon cause: Operation on incompatible types\n\nTraceback (last few calls):\n  File \"main.py\", line 1, in <module>\nTypeError: can only concatenate str (not \"int\") to str",
		},
		{
			name:     "RecursionError",
			exitCode: 1,
			stderr:   "Traceback (most recent call last):\n  File \"main.py\", line 5, in factorial\n    return n * factorial(n - 1)\nRecursionError: maximum recursion depth exceeded",
			expected: "Runtime Error: RecursionError\nRecursionError: maximum recursion depth exceeded\n\nCommon cause: Maximum recursion depth exceeded (infinite recursion?)\n\nTraceback (last few calls):\n  File \"main.py\", line 5, in factorial\nRecursionError: maximum recursion depth exceeded",
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

func TestPythonHandler_ParseCompileError(t *testing.T) {
	handler := NewPythonHandler()

	tests := []struct {
		name     string
		output   string
		expected string
	}{
		{
			name: "Syntax error",
			output: `  File "/sandbox/main.py", line 5
    if x == 10
              ^
SyntaxError: invalid syntax`,
			expected: `  File "/sandbox/main.py", line 5
    if x == 10
              ^
SyntaxError: invalid syntax`,
		},
		{
			name: "Indentation error",
			output: `  File "/sandbox/main.py", line 3
    print("Hello")
    ^
IndentationError: unexpected indent`,
			expected: `  File "/sandbox/main.py", line 3
    print("Hello")
    ^
IndentationError: unexpected indent`,
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

func TestPythonHandler_GetExecutableCommand(t *testing.T) {
	handler := NewPythonHandler()
	cmd := handler.GetExecutableCommand()

	if cmd != "python3 main.py" {
		t.Errorf("Expected 'python3 main.py', got '%s'", cmd)
	}
}
