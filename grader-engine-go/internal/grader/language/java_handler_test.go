package language

import (
	"testing"
)

func TestJavaHandler_GetLanguage(t *testing.T) {
	handler := NewJavaHandler()
	if handler.GetLanguage() != "java" {
		t.Errorf("Expected 'java', got '%s'", handler.GetLanguage())
	}
}

func TestJavaHandler_SupportsStdio(t *testing.T) {
	handler := NewJavaHandler()
	if !handler.SupportsStdio() {
		t.Error("JavaHandler should support stdio mode")
	}
}
func TestJavaHandler_SupportsFunction(t *testing.T) {
	handler := NewJavaHandler()
	if handler.SupportsFunction() {
		t.Error("JavaHandler should not support function mode yet")
	}
}

func TestJavaHandler_GetResourceMultipliers(t *testing.T) {
	handler := NewJavaHandler()
	multipliers := handler.GetResourceMultipliers()

	if multipliers.TimeMultiplier != 3.0 {
		t.Errorf("Expected time multiplier 3.0, got %f", multipliers.TimeMultiplier)
	}
	if multipliers.MemoryMultiplier != 2.0 {
		t.Errorf("Expected memory multiplier 2.0, got %f", multipliers.MemoryMultiplier)
	}
	if multipliers.MemoryOverhead != 50*1024 {
		t.Errorf("Expected memory overhead 51200 KB, got %d", multipliers.MemoryOverhead)
	}
}

func TestJavaHandler_ParseRuntimeError(t *testing.T) {
	handler := NewJavaHandler()

	tests := []struct {
		name     string
		exitCode int
		stderr   string
		expected string
	}{
		{
			name:     "NullPointerException",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.NullPointerException\n\tat Main.main(Main.java:5)",
			expected: "Runtime Error:\nException in thread \"main\" java.lang.NullPointerException\n\tat Main.main(Main.java:5)",
		},
		{
			name:     "ArrayIndexOutOfBoundsException",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.ArrayIndexOutOfBoundsException: Index 10 out of bounds for length 5\n\tat Main.main(Main.java:8)",
			expected: "Runtime Error: ArrayIndexOutOfBoundsException\nException in thread \"main\" java.lang.ArrayIndexOutOfBoundsException: Index 10 out of bounds for length 5\n\nCommon cause: Array index out of bounds\n\nStack trace (user code only):\n\tat Main.main(Main.java:8)",
		},
		{
			name:     "ArithmeticException",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.ArithmeticException: / by zero\n\tat Main.main(Main.java:3)",
			expected: "Runtime Error: ArithmeticException\nException in thread \"main\" java.lang.ArithmeticException: / by zero\n\nCommon cause: Arithmetic error (e.g., division by zero)\n\nStack trace (user code only):\n\tat Main.main(Main.java:3)",
		},
		{
			name:     "StackOverflowError",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.StackOverflowError\n\tat Solution.factorial(Solution.java:10)",
			expected: "Runtime Error: Stack Overflow\nPossible causes:\n• Infinite recursion\n• Very deep recursion",
		},
		{
			name:     "OutOfMemoryError",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.OutOfMemoryError: Java heap space\n\tat Main.main(Main.java:15)",
			expected: "Runtime Error: OutOfMemoryError\nException in thread \"main\" java.lang.OutOfMemoryError: Java heap space\n\nCommon cause: JVM ran out of memory\n\nStack trace (user code only):\n\tat Main.main(Main.java:15)",
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

func TestJavaHandler_ParseCompileError(t *testing.T) {
	handler := NewJavaHandler()

	tests := []struct {
		name     string
		output   string
		expected string
	}{
		{
			name: "Syntax error",
			output: `Main.java:5: error: ';' expected
        int x = 10
                  ^
1 error`,
			expected: `Main.java:5: error: ';' expected
  int x = 10
  ^`,
		},
		{
			name: "Class name mismatch",
			output: `Main.java:1: error: class Solution is public, should be declared in a file named Solution.java
public class Solution {
       ^
1 error`,
			expected: `Main.java:1: error: class Solution is public, should be declared in a file named Solution.java
  public class Solution {
  ^`,
		},
		{
			name: "Type mismatch",
			output: `Main.java:10: error: incompatible types: String cannot be converted to int
        int num = "hello";
                  ^
1 error`,
			expected: `Main.java:10: error: incompatible types: String cannot be converted to int
  int num = "hello";
  ^`,
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

func TestJavaHandler_GetExecutableCommand(t *testing.T) {
	handler := NewJavaHandler()
	cmd := handler.GetExecutableCommand()

	if cmd != "java Main" {
		t.Errorf("Expected 'java Main', got '%s'", cmd)
	}
}
