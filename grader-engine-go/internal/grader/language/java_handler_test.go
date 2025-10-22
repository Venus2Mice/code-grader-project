package language

import (
	"testing"
)

func TestJavaHandler_GetLanguage(t *testing.T) {
	handler := &JavaHandler{}
	if handler.GetLanguage() != "java" {
		t.Errorf("Expected 'java', got '%s'", handler.GetLanguage())
	}
}

func TestJavaHandler_SupportsStdio(t *testing.T) {
	handler := &JavaHandler{}
	if !handler.SupportsStdio() {
		t.Error("JavaHandler should support stdio mode")
	}
}

func TestJavaHandler_SupportsFunction(t *testing.T) {
	handler := &JavaHandler{}
	if !handler.SupportsFunction() {
		t.Error("JavaHandler should support function mode")
	}
}

func TestJavaHandler_GetResourceMultipliers(t *testing.T) {
	handler := &JavaHandler{}
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
	handler := &JavaHandler{}
	
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
			expected: "Runtime Error: NullPointerException\n💡 Hint: You're accessing a null object. Check your object initialization.",
		},
		{
			name:     "ArrayIndexOutOfBoundsException",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.ArrayIndexOutOfBoundsException: Index 10 out of bounds for length 5\n\tat Main.main(Main.java:8)",
			expected: "Runtime Error: ArrayIndexOutOfBoundsException\n💡 Hint: Array index is out of bounds. Check your array access.",
		},
		{
			name:     "ArithmeticException",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.ArithmeticException: / by zero\n\tat Main.main(Main.java:3)",
			expected: "Runtime Error: ArithmeticException\n💡 Hint: Arithmetic error (likely division by zero). Check your calculations.",
		},
		{
			name:     "StackOverflowError",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.StackOverflowError\n\tat Solution.factorial(Solution.java:10)",
			expected: "Runtime Error: StackOverflowError\n💡 Hint: Too many recursive calls. Check your recursion depth or use iteration.",
		},
		{
			name:     "OutOfMemoryError",
			exitCode: 1,
			stderr:   "Exception in thread \"main\" java.lang.OutOfMemoryError: Java heap space\n\tat Main.main(Main.java:15)",
			expected: "Runtime Error: OutOfMemoryError\n💡 Hint: Program ran out of memory. Check for memory leaks or reduce memory usage.",
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
	handler := &JavaHandler{}
	
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
			expected: `Compile Error:
Main.java:5: error: ';' expected`,
		},
		{
			name: "Class name mismatch",
			output: `Main.java:1: error: class Solution is public, should be declared in a file named Solution.java
public class Solution {
       ^
1 error`,
			expected: `Compile Error:
Main.java:1: error: class Solution is public, should be declared in a file named Solution.java

💡 Hint: Your public class name must match the filename (Main.java)`,
		},
		{
			name: "Type mismatch",
			output: `Main.java:10: error: incompatible types: String cannot be converted to int
        int num = "hello";
                  ^
1 error`,
			expected: `Compile Error:
Main.java:10: error: incompatible types: String cannot be converted to int`,
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
	handler := &JavaHandler{}
	cmd := handler.GetExecutableCommand()
	
	if cmd != "java Main" {
		t.Errorf("Expected 'java Main', got '%s'", cmd)
	}
}
