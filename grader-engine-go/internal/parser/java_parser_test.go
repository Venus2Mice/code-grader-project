package parser

import (
	"testing"
)

// Test Java Parser
func TestJavaParser_Parse(t *testing.T) {
	parser := &JavaParser{}

	tests := []struct {
		name            string
		code            string
		wantMethodCount int
		wantImports     int
		wantError       bool
	}{
		{
			name: "Simple method",
			code: `public int add(int a, int b) {
    return a + b;
}`,
			wantMethodCount: 1,
			wantImports:     0,
			wantError:       false,
		},
		{
			name: "Method with imports",
			code: `import java.util.List;
import java.util.ArrayList;

public List<Integer> process(int[] nums) {
    List<Integer> result = new ArrayList<>();
    return result;
}`,
			wantMethodCount: 1,
			wantImports:     2,
			wantError:       false,
		},
		{
			name: "Multiple methods",
			code: `public int add(int a, int b) {
    return a + b;
}

public int multiply(int a, int b) {
    return a * b;
}`,
			wantMethodCount: 2,
			wantImports:     0,
			wantError:       false,
		},
		{
			name: "Method with array parameter",
			code: `public int sumArray(int[] nums) {
    int sum = 0;
    for(int n : nums) sum += n;
    return sum;
}`,
			wantMethodCount: 1,
			wantImports:     0,
			wantError:       false,
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
				if len(parsed.Functions) != tt.wantMethodCount {
					t.Errorf("Parse() got %d methods, want %d. Methods: %v",
						len(parsed.Functions), tt.wantMethodCount, parsed.Functions)
				}

				if len(parsed.Imports) != tt.wantImports {
					t.Errorf("Parse() got %d imports, want %d", len(parsed.Imports), tt.wantImports)
				}
			}
		})
	}
}

func TestJavaParser_MatchFunction(t *testing.T) {
	parser := &JavaParser{}

	tests := []struct {
		name           string
		code           string
		expectedReturn string
		expectedParams []string
		wantMatch      bool
		wantMethodName string
	}{
		{
			name: "Exact match",
			code: `public int add(int a, int b) {
    return a + b;
}`,
			expectedReturn: "int",
			expectedParams: []string{"int", "int"},
			wantMatch:      true,
			wantMethodName: "add",
		},
		{
			name: "Different name but same signature",
			code: `public int mySolution(int x, int y) {
    return x + y;
}`,
			expectedReturn: "int",
			expectedParams: []string{"int", "int"},
			wantMatch:      true,
			wantMethodName: "mySolution",
		},
		{
			name: "Array parameter",
			code: `public int[] solve(int[] nums, int target) {
    return nums;
}`,
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantMatch:      true,
			wantMethodName: "solve",
		},
		{
			name: "List parameter",
			code: `public List<Integer> process(List<Integer> nums) {
    return nums;
}`,
			expectedReturn: "int[]",
			expectedParams: []string{"int[]"},
			wantMatch:      true,
			wantMethodName: "process",
		},
		{
			name: "Wrong parameter count",
			code: `public int add(int a) {
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
				if matched.Name != tt.wantMethodName {
					t.Errorf("MatchFunction() matched method name = %v, want %v", matched.Name, tt.wantMethodName)
				}
			} else {
				if err == nil && matched != nil {
					t.Errorf("MatchFunction() expected no match but got: %v", matched.Name)
				}
			}
		})
	}
}

func TestJavaParser_NormalizeType(t *testing.T) {
	parser := &JavaParser{}

	tests := []struct {
		input    string
		expected string
	}{
		{"int", "int"},
		{"Integer", "int"},
		{"long", "long"},
		{"Long", "long"},
		{"String", "string"},
		{"boolean", "bool"},
		{"Boolean", "bool"},
		{"int[]", "int[]"},
		{"List<Integer>", "int[]"},
		{"ArrayList<Integer>", "int[]"},
		{"List<String>", "string[]"},
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

func TestJavaParser_RemoveComments(t *testing.T) {
	parser := &JavaParser{}

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

func TestJavaParser_FullProgram(t *testing.T) {
	parser := &JavaParser{}

	code := `import java.util.List;
import java.util.ArrayList;

public class Solution {
    // Helper method
    private int helper(int n) {
        return n * 2;
    }
    
    // Main solution
    public int[] twoSum(int[] nums, int target) {
        for(int i = 0; i < nums.length; i++) {
            for(int j = i+1; j < nums.length; j++) {
                if(nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
    
    public static void main(String[] args) {
        Solution solution = new Solution();
        int[] result = solution.twoSum(new int[]{2, 7, 11, 15}, 9);
    }
}`

	parsed, err := parser.Parse(code)
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}

	// Should find 2 methods (helper and twoSum, excluding main)
	if len(parsed.Functions) < 2 {
		t.Errorf("Expected at least 2 methods, got %d", len(parsed.Functions))
	}

	// Should find 2 imports
	if len(parsed.Imports) != 2 {
		t.Errorf("Expected 2 imports, got %d", len(parsed.Imports))
	}

	// Test matching the twoSum method
	matched, err := parser.MatchFunction(parsed, "int[]", []string{"int[]", "int"})
	if err != nil {
		t.Errorf("MatchFunction() error = %v", err)
	}
	if matched == nil {
		t.Errorf("Expected to find matching method")
	}
	if matched != nil && matched.Name != "twoSum" {
		t.Errorf("Expected to match 'twoSum', got '%s'", matched.Name)
	}
}
