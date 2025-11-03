package parser

import (
	"testing"
)

// Test Python Parser
func TestPythonParser_Parse(t *testing.T) {
	parser := &PythonParser{}

	tests := []struct {
		name          string
		code          string
		wantFuncCount int
		wantImports   int
		wantError     bool
	}{
		{
			name: "Simple function with type hints",
			code: `def add(a: int, b: int) -> int:
    return a + b`,
			wantFuncCount: 1,
			wantImports:   0,
			wantError:     false,
		},
		{
			name: "Function without type hints",
			code: `def multiply(x, y):
    return x * y`,
			wantFuncCount: 1,
			wantImports:   0,
			wantError:     false,
		},
		{
			name: "Multiple functions with imports",
			code: `import json
from typing import List

def sum_list(nums: List[int]) -> int:
    return sum(nums)

def reverse_string(s: str) -> str:
    return s[::-1]`,
			wantFuncCount: 2,
			wantImports:   2,
			wantError:     false,
		},
		{
			name: "Function with List parameter",
			code: `def process(nums: List[int], target: int) -> List[int]:
    result = []
    for n in nums:
        if n == target:
            result.append(n)
    return result`,
			wantFuncCount: 1,
			wantImports:   0,
			wantError:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parsed, err := parser.Parse(tt.code)

			if (err != nil) != tt.wantError {
				t.Errorf("Parse() error = %v, wantError %v", err, tt.wantError)
				return
			}

			if err == nil {
				if len(parsed.Functions) != tt.wantFuncCount {
					t.Errorf("Parse() got %d functions, want %d", len(parsed.Functions), tt.wantFuncCount)
				}

				if len(parsed.Imports) != tt.wantImports {
					t.Errorf("Parse() got %d imports, want %d", len(parsed.Imports), tt.wantImports)
				}
			}
		})
	}
}

func TestPythonParser_MatchFunction(t *testing.T) {
	parser := &PythonParser{}

	tests := []struct {
		name             string
		code             string
		expectedReturn   string
		expectedParams   []string
		wantMatch        bool
		wantFunctionName string
	}{
		{
			name: "Exact match with type hints",
			code: `def twoSum(nums: List[int], target: int) -> List[int]:
    return []`,
			expectedReturn:   "int[]",
			expectedParams:   []string{"int[]", "int"},
			wantMatch:        true,
			wantFunctionName: "twoSum",
		},
		{
			name: "Different name but same signature",
			code: `def my_solution(nums: List[int], target: int) -> List[int]:
    return []`,
			expectedReturn:   "int[]",
			expectedParams:   []string{"int[]", "int"},
			wantMatch:        true,
			wantFunctionName: "my_solution",
		},
		{
			name: "No type hints (should match with 'any')",
			code: `def solve(a, b):
    return a + b`,
			expectedReturn:   "int",
			expectedParams:   []string{"int", "int"},
			wantMatch:        true,
			wantFunctionName: "solve",
		},
		{
			name: "Wrong parameter count",
			code: `def add(a: int) -> int:
    return a`,
			expectedReturn: "int",
			expectedParams: []string{"int", "int"},
			wantMatch:      false,
		},
		{
			name: "Wrong parameter types",
			code: `def process(s: str, n: int) -> int:
    return len(s)`,
			expectedReturn: "int",
			expectedParams: []string{"int[]", "int"},
			wantMatch:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parsed, err := parser.Parse(tt.code)
			if err != nil {
				t.Fatalf("Parse() error = %v", err)
			}

			matched, err := parser.MatchFunction(parsed, tt.expectedReturn, tt.expectedParams)

			if tt.wantMatch {
				if err != nil {
					t.Errorf("MatchFunction() error = %v, want match", err)
					return
				}
				if matched == nil {
					t.Errorf("MatchFunction() returned nil, want match")
					return
				}
				if matched.Name != tt.wantFunctionName {
					t.Errorf("MatchFunction() matched function name = %v, want %v", matched.Name, tt.wantFunctionName)
				}
			} else {
				if err == nil {
					t.Errorf("MatchFunction() expected error but got match: %v", matched)
				}
			}
		})
	}
}

func TestPythonParser_NormalizeType(t *testing.T) {
	parser := &PythonParser{}

	tests := []struct {
		input    string
		expected string
	}{
		{"int", "int"},
		{"str", "string"},
		{"bool", "bool"},
		{"float", "double"},
		{"List[int]", "int[]"},
		{"List[str]", "string[]"},
		{"List[List[int]]", "int[][]"},
		{"list[int]", "int[]"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := parser.normalizeType(tt.input)
			if result != tt.expected {
				t.Errorf("normalizeType(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestPythonParser_ParseParameters(t *testing.T) {
	parser := &PythonParser{}

	tests := []struct {
		name      string
		paramsStr string
		wantTypes []string
		wantNames []string
	}{
		{
			name:      "Simple params with types",
			paramsStr: "a: int, b: int",
			wantTypes: []string{"int", "int"},
			wantNames: []string{"a", "b"},
		},
		{
			name:      "List parameter",
			paramsStr: "nums: List[int], target: int",
			wantTypes: []string{"int[]", "int"},
			wantNames: []string{"nums", "target"},
		},
		{
			name:      "No type hints",
			paramsStr: "a, b, c",
			wantTypes: []string{"any", "any", "any"},
			wantNames: []string{"a", "b", "c"},
		},
		{
			name:      "Empty params",
			paramsStr: "",
			wantTypes: []string{},
			wantNames: []string{},
		},
		{
			name:      "Nested List",
			paramsStr: "matrix: List[List[int]]",
			wantTypes: []string{"int[][]"},
			wantNames: []string{"matrix"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotTypes, gotNames := parser.parseParameters(tt.paramsStr)

			if len(gotTypes) != len(tt.wantTypes) {
				t.Errorf("parseParameters() got %d types, want %d", len(gotTypes), len(tt.wantTypes))
				return
			}

			for i := range gotTypes {
				if gotTypes[i] != tt.wantTypes[i] {
					t.Errorf("parseParameters() type[%d] = %v, want %v", i, gotTypes[i], tt.wantTypes[i])
				}
			}

			for i := range gotNames {
				if gotNames[i] != tt.wantNames[i] {
					t.Errorf("parseParameters() name[%d] = %v, want %v", i, gotNames[i], tt.wantNames[i])
				}
			}
		})
	}
}

func TestPythonParser_FullProgram(t *testing.T) {
	parser := &PythonParser{}

	// Test with a full program including imports, multiple functions, and main block
	code := `import json
from typing import List, Optional

def helper_function(n: int) -> int:
    return n * 2

def main_solution(nums: List[int], target: int) -> List[int]:
    result = []
    for i, num in enumerate(nums):
        complement = target - num
        if complement in nums[i+1:]:
            return [i, nums.index(complement, i+1)]
    return result

def another_function(s: str) -> bool:
    return len(s) > 0

if __name__ == "__main__":
    print(main_solution([1, 2, 3], 5))
`

	parsed, err := parser.Parse(code)
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}

	// Should find 3 functions (excluding main block)
	if len(parsed.Functions) != 3 {
		t.Errorf("Expected 3 functions, got %d", len(parsed.Functions))
	}

	// Should find 2 imports
	if len(parsed.Imports) != 2 {
		t.Errorf("Expected 2 imports, got %d", len(parsed.Imports))
	}

	// Should find main block
	if parsed.MainBlock == "" {
		t.Errorf("Expected main block to be found")
	}

	// Test matching the main_solution function
	matched, err := parser.MatchFunction(parsed, "int[]", []string{"int[]", "int"})
	if err != nil {
		t.Errorf("MatchFunction() error = %v", err)
	}
	if matched == nil {
		t.Errorf("Expected to find matching function")
	}
	if matched != nil && matched.Name != "main_solution" {
		t.Errorf("Expected to match 'main_solution', got '%s'", matched.Name)
	}
}
