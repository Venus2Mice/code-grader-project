package parser

import (
	"testing"
)

// Test C++ Parser
func TestCppParser_Parse(t *testing.T) {
	parser := &CppParser{}

	tests := []struct {
		name          string
		code          string
		wantFuncCount int
		wantIncludes  int
		wantError     bool
	}{
		{
			name: "Simple function",
			code: `int add(int a, int b) {
    return a + b;
}`,
			wantFuncCount: 1,
			wantIncludes:  0,
			wantError:     false,
		},
		{
			name: "Function with includes",
			code: `#include <iostream>
#include <vector>

int sum(vector<int> nums) {
    int total = 0;
    for(int n : nums) total += n;
    return total;
}`,
			wantFuncCount: 1,
			wantIncludes:  2,
			wantError:     false,
		},
		{
			name: "Multiple functions",
			code: `int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}`,
			wantFuncCount: 2,
			wantIncludes:  0,
			wantError:     false,
		},
		{
			name: "Function with vector parameter",
			code: `#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    vector<int> result;
    return result;
}`,
			wantFuncCount: 1,
			wantIncludes:  1,
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
					t.Errorf("Parse() got %d functions, want %d. Functions: %v",
						len(parsed.Functions), tt.wantFuncCount, parsed.Functions)
				}

				if len(parsed.Imports) != tt.wantIncludes {
					t.Errorf("Parse() got %d includes, want %d", len(parsed.Imports), tt.wantIncludes)
				}
			}
		})
	}
}

func TestCppParser_MatchFunction(t *testing.T) {
	parser := &CppParser{}

	tests := []struct {
		name             string
		code             string
		expectedReturn   string
		expectedParams   []string
		wantMatch        bool
		wantFunctionName string
	}{
		{
			name: "Exact match",
			code: `int add(int a, int b) {
    return a + b;
}`,
			expectedReturn:   "int",
			expectedParams:   []string{"int", "int"},
			wantMatch:        true,
			wantFunctionName: "add",
		},
		{
			name: "Different name but same signature",
			code: `int my_solution(int x, int y) {
    return x + y;
}`,
			expectedReturn:   "int",
			expectedParams:   []string{"int", "int"},
			wantMatch:        true,
			wantFunctionName: "my_solution",
		},
		{
			name: "Vector parameter",
			code: `vector<int> solve(vector<int> nums, int target) {
    return nums;
}`,
			expectedReturn:   "int[]",
			expectedParams:   []string{"int[]", "int"},
			wantMatch:        true,
			wantFunctionName: "solve",
		},
		{
			name: "Reference parameter",
			code: `int process(vector<int>& nums) {
    return nums.size();
}`,
			expectedReturn:   "int",
			expectedParams:   []string{"int[]"},
			wantMatch:        true,
			wantFunctionName: "process",
		},
		{
			name: "Wrong parameter count",
			code: `int add(int a) {
    return a;
}`,
			expectedReturn: "int",
			expectedParams: []string{"int", "int"},
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
				if err == nil && matched != nil {
					t.Errorf("MatchFunction() expected no match but got: %v", matched.Name)
				}
			}
		})
	}
}

func TestCppParser_NormalizeType(t *testing.T) {
	parser := &CppParser{}

	tests := []struct {
		input    string
		expected string
	}{
		{"int", "int"},
		{"long", "long"},
		{"double", "double"},
		{"string", "string"},
		{"vector<int>", "int[]"},
		{"vector<double>", "double[]"},
		{"vector<vector<int>>", "int[][]"},
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

func TestCppParser_RemoveComments(t *testing.T) {
	parser := &CppParser{}

	tests := []struct {
		name     string
		code     string
		wantCode string
	}{
		{
			name:     "Single line comment",
			code:     "int x = 5; // This is a comment",
			wantCode: "int x = 5; ",
		},
		{
			name: "Multi line comment",
			code: `int x = 5;
/* This is a
   multi-line comment */
int y = 10;`,
			wantCode: `int x = 5;

int y = 10;`,
		},
		{
			name:     "No comments",
			code:     "int x = 5;",
			wantCode: "int x = 5;",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.removeComments(tt.code)
			if result != tt.wantCode {
				t.Errorf("removeComments() = %q, want %q", result, tt.wantCode)
			}
		})
	}
}

func TestCppParser_FullProgram(t *testing.T) {
	parser := &CppParser{}

	code := `#include <iostream>
#include <vector>
using namespace std;

// Helper function
int helper(int n) {
    return n * 2;
}

// Main solution
vector<int> twoSum(vector<int>& nums, int target) {
    vector<int> result;
    for(int i = 0; i < nums.size(); i++) {
        for(int j = i+1; j < nums.size(); j++) {
            if(nums[i] + nums[j] == target) {
                result.push_back(i);
                result.push_back(j);
                return result;
            }
        }
    }
    return result;
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> result = twoSum(nums, 9);
    return 0;
}`

	parsed, err := parser.Parse(code)
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}

	// Should find 2 functions (helper and twoSum, excluding main)
	if len(parsed.Functions) < 2 {
		t.Errorf("Expected at least 2 functions, got %d", len(parsed.Functions))
	}

	// Should find 2 includes
	if len(parsed.Imports) != 2 {
		t.Errorf("Expected 2 includes, got %d", len(parsed.Imports))
	}

	// Test matching the twoSum function
	matched, err := parser.MatchFunction(parsed, "int[]", []string{"int[]", "int"})
	if err != nil {
		t.Errorf("MatchFunction() error = %v", err)
	}
	if matched == nil {
		t.Errorf("Expected to find matching function")
	}
	if matched != nil && matched.Name != "twoSum" {
		t.Errorf("Expected to match 'twoSum', got '%s'", matched.Name)
	}
}
