package parser

import (
	"testing"
)

// Integration tests for PreprocessCode
func TestPreprocessCode(t *testing.T) {
	tests := []struct {
		name           string
		sourceCode     string
		language       string
		expectedReturn string
		expectedParams []string
		wantError      bool
		wantFuncName   string
	}{
		{
			name: "Python - exact match",
			sourceCode: `def twoSum(nums: List[int], target: int) -> List[int]:
    return []`,
			language:       "python",
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantError:      false,
			wantFuncName:   "twoSum",
		},
		{
			name: "Python - different name, same signature",
			sourceCode: `def my_custom_solution(nums, target):
    return []`,
			language:       "python",
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantError:      false,
			wantFuncName:   "my_custom_solution",
		},
		{
			name: "C++ - exact match",
			sourceCode: `int add(int a, int b) {
    return a + b;
}`,
			language:       "cpp",
			expectedReturn: "int",
			expectedParams: []string{"int", "int"},
			wantError:      false,
			wantFuncName:   "add",
		},
		{
			name: "C++ - with vector",
			sourceCode: `#include <vector>
vector<int> solve(vector<int> nums, int target) {
    return nums;
}`,
			language:       "cpp",
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantError:      false,
			wantFuncName:   "solve",
		},
		{
			name: "Java - exact match",
			sourceCode: `public int add(int a, int b) {
    return a + b;
}`,
			language:       "java",
			expectedReturn: "int",
			expectedParams: []string{"int", "int"},
			wantError:      false,
			wantFuncName:   "add",
		},
		{
			name: "Java - with List",
			sourceCode: `import java.util.List;
public List<Integer> process(List<Integer> nums, int target) {
    return nums;
}`,
			language:       "java",
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantError:      false,
			wantFuncName:   "process",
		},
		{
			name: "No matching function",
			sourceCode: `def wrong_signature(a, b, c):
    return a + b + c`,
			language:       "python",
			expectedReturn: "int",
			expectedParams: []string{"int", "int"},
			wantError:      true,
		},
		{
			name:           "Unsupported language",
			sourceCode:     "some code",
			language:       "rust",
			expectedReturn: "int",
			expectedParams: []string{"int"},
			wantError:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parsed, err := PreprocessCode(tt.sourceCode, tt.language, tt.expectedReturn, tt.expectedParams)

			if tt.wantError {
				if err == nil {
					t.Errorf("PreprocessCode() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("PreprocessCode() error = %v", err)
				return
			}

			if parsed.MatchedFunc == nil {
				t.Errorf("PreprocessCode() MatchedFunc is nil")
				return
			}

			if parsed.MatchedFunc.Name != tt.wantFuncName {
				t.Errorf("PreprocessCode() matched function = %v, want %v",
					parsed.MatchedFunc.Name, tt.wantFuncName)
			}

			if parsed.Language != tt.language {
				t.Errorf("PreprocessCode() language = %v, want %v", parsed.Language, tt.language)
			}
		})
	}
}

func TestGetParser(t *testing.T) {
	tests := []struct {
		language  string
		wantError bool
	}{
		{"python", false},
		{"cpp", false},
		{"java", false},
		{"javascript", true},
		{"go", true},
		{"", true},
	}

	for _, tt := range tests {
		t.Run(tt.language, func(t *testing.T) {
			parser, err := GetParser(tt.language)

			if tt.wantError {
				if err == nil {
					t.Errorf("GetParser(%q) expected error but got none", tt.language)
				}
				return
			}

			if err != nil {
				t.Errorf("GetParser(%q) unexpected error: %v", tt.language, err)
				return
			}

			if parser == nil {
				t.Errorf("GetParser(%q) returned nil parser", tt.language)
			}
		})
	}
}

func TestPreprocessCode_FullPrograms(t *testing.T) {
	tests := []struct {
		name           string
		sourceCode     string
		language       string
		expectedReturn string
		expectedParams []string
		wantFuncName   string
	}{
		{
			name: "Python full program",
			sourceCode: `import json
from typing import List

def helper(n):
    return n * 2

def twoSum(nums: List[int], target: int) -> List[int]:
    result = []
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return result

if __name__ == "__main__":
    print(twoSum([1, 2, 3], 5))
`,
			language:       "python",
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantFuncName:   "twoSum",
		},
		{
			name: "C++ full program",
			sourceCode: `#include <iostream>
#include <vector>
using namespace std;

int helper(int n) {
    return n * 2;
}

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
}`,
			language:       "cpp",
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantFuncName:   "twoSum",
		},
		{
			name: "Java full program",
			sourceCode: `import java.util.List;
import java.util.ArrayList;

public class Solution {
    private int helper(int n) {
        return n * 2;
    }
    
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
}`,
			language:       "java",
			expectedReturn: "int[]",
			expectedParams: []string{"int[]", "int"},
			wantFuncName:   "twoSum",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parsed, err := PreprocessCode(tt.sourceCode, tt.language, tt.expectedReturn, tt.expectedParams)

			if err != nil {
				t.Errorf("PreprocessCode() error = %v", err)
				return
			}

			if parsed.MatchedFunc == nil {
				t.Errorf("PreprocessCode() MatchedFunc is nil")
				return
			}

			if parsed.MatchedFunc.Name != tt.wantFuncName {
				t.Errorf("PreprocessCode() matched function = %v, want %v",
					parsed.MatchedFunc.Name, tt.wantFuncName)
			}

			// Should have extracted imports
			if len(parsed.Imports) == 0 {
				t.Logf("Warning: Expected imports but got none for %s", tt.language)
			}

			// Should have found multiple functions
			if len(parsed.Functions) < 2 {
				t.Logf("Warning: Expected multiple functions but got %d", len(parsed.Functions))
			}
		})
	}
}
