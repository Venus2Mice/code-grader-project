package generator

import (
	"encoding/json"
	"testing"

	"grader-engine-go/internal/models"
)

func TestInferSignatureFromTestCases(t *testing.T) {
	tests := []struct {
		name           string
		problem        *models.Problem
		wantFuncName   string
		wantParamTypes []string
		wantReturnType string
		wantErr        bool
	}{
		{
			name: "Two Sum problem with function_name set",
			problem: &models.Problem{
				FunctionName:      "twoSum",
				FunctionSignature: "", // not used anymore
				TestCases: []models.TestCase{
					{
						Inputs: json.RawMessage(`[
							{"type": "int[]", "value": [2, 7, 11, 15]},
							{"type": "int", "value": 9}
						]`),
						ExpectedOutput: json.RawMessage(`{"type": "int[]", "value": [0, 1]}`),
					},
				},
			},
			wantFuncName:   "twoSum",
			wantParamTypes: []string{"int[]", "int"},
			wantReturnType: "int[]",
			wantErr:        false,
		},
		{
			name: "Palindrome check - fallback to extracting from signature",
			problem: &models.Problem{
				FunctionName:      "", // empty, should fallback
				FunctionSignature: "bool isPalindrome(int x);",
				TestCases: []models.TestCase{
					{
						Inputs: json.RawMessage(`[
							{"type": "int", "value": 121}
						]`),
						ExpectedOutput: json.RawMessage(`{"type": "bool", "value": true}`),
					},
				},
			},
			wantFuncName:   "isPalindrome",
			wantParamTypes: []string{"int"},
			wantReturnType: "bool",
			wantErr:        false,
		},
		{
			name: "Python signature format",
			problem: &models.Problem{
				FunctionName:      "",
				FunctionSignature: "def reverseString(s: List[str]) -> None:",
				TestCases: []models.TestCase{
					{
						Inputs: json.RawMessage(`[
							{"type": "string[]", "value": ["h","e","l","l","o"]}
						]`),
						ExpectedOutput: json.RawMessage(`{"type": "void", "value": null}`),
					},
				},
			},
			wantFuncName:   "reverseString",
			wantParamTypes: []string{"string[]"},
			wantReturnType: "void",
			wantErr:        false,
		},
		{
			name: "No test cases - should error",
			problem: &models.Problem{
				FunctionName: "test",
				TestCases:    []models.TestCase{},
			},
			wantErr: true,
		},
		{
			name: "Multiple parameters",
			problem: &models.Problem{
				FunctionName: "search",
				TestCases: []models.TestCase{
					{
						Inputs: json.RawMessage(`[
							{"type": "int[]", "value": [1,2,3,4]},
							{"type": "int", "value": 3},
							{"type": "bool", "value": true}
						]`),
						ExpectedOutput: json.RawMessage(`{"type": "int", "value": 2}`),
					},
				},
			},
			wantFuncName:   "search",
			wantParamTypes: []string{"int[]", "int", "bool"},
			wantReturnType: "int",
			wantErr:        false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			funcName, paramTypes, returnType, err := InferSignatureFromTestCases(tt.problem)

			if tt.wantErr {
				if err == nil {
					t.Error("Expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}

			if funcName != tt.wantFuncName {
				t.Errorf("Function name = %q, want %q", funcName, tt.wantFuncName)
			}

			if len(paramTypes) != len(tt.wantParamTypes) {
				t.Errorf("Param types length = %d, want %d", len(paramTypes), len(tt.wantParamTypes))
			} else {
				for i, pt := range paramTypes {
					if pt != tt.wantParamTypes[i] {
						t.Errorf("Param type[%d] = %q, want %q", i, pt, tt.wantParamTypes[i])
					}
				}
			}

			if returnType != tt.wantReturnType {
				t.Errorf("Return type = %q, want %q", returnType, tt.wantReturnType)
			}
		})
	}
}

func TestExtractFunctionName(t *testing.T) {
	tests := []struct {
		signature string
		want      string
	}{
		{"def twoSum(nums, target):", "twoSum"},
		{"bool isPalindrome(int x);", "isPalindrome"},
		{"public int[] twoSum(int[] nums, int target)", "twoSum"},
		{"vector<int> twoSum(vector<int>& nums, int target)", "twoSum"},
		{"void reverseString(char[] s)", "reverseString"},
		{"invalid", "solution"},
		{"", "solution"},
	}

	for _, tt := range tests {
		t.Run(tt.signature, func(t *testing.T) {
			got := extractFunctionName(tt.signature)
			if got != tt.want {
				t.Errorf("extractFunctionName(%q) = %q, want %q", tt.signature, got, tt.want)
			}
		})
	}
}
