package generator

import (
	"encoding/json"
	"strings"
	"testing"

	"grader-engine-go/internal/models"
)

// Test GetSignatureFromProblemDefinition
func TestGetSignatureFromProblemDefinition(t *testing.T) {
	tests := []struct {
		name           string
		problem        *models.Problem
		wantFuncName   string
		wantParamTypes []string
		wantReturnType string
		wantParamNames []string
		wantError      bool
	}{
		{
			name: "Problem with parameters",
			problem: &models.Problem{
				FunctionName: "twoSum",
				ReturnType:   "int[]",
				Parameters:   json.RawMessage(`[{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}]`),
			},
			wantFuncName:   "twoSum",
			wantParamTypes: []string{"int[]", "int"},
			wantReturnType: "int[]",
			wantParamNames: []string{"nums", "target"},
			wantError:      false,
		},
		{
			name: "Problem with empty parameters",
			problem: &models.Problem{
				FunctionName: "hello",
				ReturnType:   "string",
				Parameters:   json.RawMessage(`[]`),
				TestCases: []models.TestCase{
					{
						Inputs: json.RawMessage(`[]`),
					},
				},
			},
			wantFuncName:   "hello",
			wantParamTypes: []string{},
			wantReturnType: "string",
			wantParamNames: []string{},
			wantError:      false,
		},
		{
			name: "Problem without function_name",
			problem: &models.Problem{
				FunctionName: "",
				ReturnType:   "int",
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			funcName, paramTypes, returnType, paramNames, err := GetSignatureFromProblemDefinition(tt.problem)

			if tt.wantError {
				if err == nil {
					t.Errorf("GetSignatureFromProblemDefinition() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("GetSignatureFromProblemDefinition() error = %v", err)
				return
			}

			if funcName != tt.wantFuncName {
				t.Errorf("function name = %v, want %v", funcName, tt.wantFuncName)
			}

			if returnType != tt.wantReturnType {
				t.Errorf("return type = %v, want %v", returnType, tt.wantReturnType)
			}

			if len(paramTypes) != len(tt.wantParamTypes) {
				t.Errorf("param types length = %v, want %v", len(paramTypes), len(tt.wantParamTypes))
			}

			for i, pt := range paramTypes {
				if i < len(tt.wantParamTypes) && pt != tt.wantParamTypes[i] {
					t.Errorf("param type[%d] = %v, want %v", i, pt, tt.wantParamTypes[i])
				}
			}

			if len(paramNames) != len(tt.wantParamNames) {
				t.Errorf("param names length = %v, want %v", len(paramNames), len(tt.wantParamNames))
			}
		})
	}
}

// Test InferSignatureFromTestCases
func TestInferSignatureFromTestCases(t *testing.T) {
	tests := []struct {
		name           string
		problem        *models.Problem
		wantFuncName   string
		wantParamTypes []string
		wantReturnType string
		wantError      bool
	}{
		{
			name: "Infer from test cases",
			problem: &models.Problem{
				FunctionName: "add",
				TestCases: []models.TestCase{
					{
						Inputs:         json.RawMessage(`[{"type": "int", "value": 1}, {"type": "int", "value": 2}]`),
						ExpectedOutput: json.RawMessage(`{"type": "int", "value": 3}`),
					},
				},
			},
			wantFuncName:   "add",
			wantParamTypes: []string{"int", "int"},
			wantReturnType: "int",
			wantError:      false,
		},
		{
			name: "No test cases",
			problem: &models.Problem{
				FunctionName: "test",
				TestCases:    []models.TestCase{},
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			funcName, paramTypes, returnType, err := InferSignatureFromTestCases(tt.problem)

			if tt.wantError {
				if err == nil {
					t.Errorf("InferSignatureFromTestCases() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("InferSignatureFromTestCases() error = %v", err)
				return
			}

			if funcName != tt.wantFuncName {
				t.Errorf("function name = %v, want %v", funcName, tt.wantFuncName)
			}

			if returnType != tt.wantReturnType {
				t.Errorf("return type = %v, want %v", returnType, tt.wantReturnType)
			}

			if len(paramTypes) != len(tt.wantParamTypes) {
				t.Errorf("param types length = %v, want %v", len(paramTypes), len(tt.wantParamTypes))
			}
		})
	}
}

// Test GenerateTestHarness
func TestGenerateTestHarness(t *testing.T) {
	tests := []struct {
		name     string
		problem  *models.Problem
		language string
		wantErr  bool
		contains []string // strings that should be in the generated harness
	}{
		{
			name: "Python harness with parameters",
			problem: &models.Problem{
				FunctionName: "add",
				ReturnType:   "int",
				Parameters:   json.RawMessage(`[{"name": "a", "type": "int"}, {"name": "b", "type": "int"}]`),
				TestCases: []models.TestCase{
					{
						Inputs:         json.RawMessage(`[{"type": "int", "value": 1}, {"type": "int", "value": 2}]`),
						ExpectedOutput: json.RawMessage(`{"type": "int", "value": 3}`),
					},
				},
			},
			language: "python",
			wantErr:  false,
			contains: []string{"import json", "def add", "USER_CODE_START", "USER_CODE_END"},
		},
		{
			name: "C++ harness with parameters",
			problem: &models.Problem{
				FunctionName: "add",
				ReturnType:   "int",
				Parameters:   json.RawMessage(`[{"name": "a", "type": "int"}, {"name": "b", "type": "int"}]`),
				TestCases: []models.TestCase{
					{
						Inputs:         json.RawMessage(`[{"type": "int", "value": 1}, {"type": "int", "value": 2}]`),
						ExpectedOutput: json.RawMessage(`{"type": "int", "value": 3}`),
					},
				},
			},
			language: "cpp",
			wantErr:  false,
			contains: []string{"#include", "int add", "USER_CODE_START", "USER_CODE_END"},
		},
		{
			name: "Java harness with parameters",
			problem: &models.Problem{
				FunctionName: "add",
				ReturnType:   "int",
				Parameters:   json.RawMessage(`[{"name": "a", "type": "int"}, {"name": "b", "type": "int"}]`),
				TestCases: []models.TestCase{
					{
						Inputs:         json.RawMessage(`[{"type": "int", "value": 1}, {"type": "int", "value": 2}]`),
						ExpectedOutput: json.RawMessage(`{"type": "int", "value": 3}`),
					},
				},
			},
			language: "java",
			wantErr:  false,
			contains: []string{"import", "class Solution", "public int add", "USER_CODE_START", "USER_CODE_END"},
		},
		{
			name: "Unsupported language",
			problem: &models.Problem{
				FunctionName: "test",
				ReturnType:   "int",
				Parameters:   json.RawMessage(`[]`),
				TestCases:    []models.TestCase{},
			},
			language: "rust",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			harness, err := GenerateTestHarness(tt.problem, tt.language)

			if tt.wantErr {
				if err == nil {
					t.Errorf("GenerateTestHarness() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("GenerateTestHarness() error = %v", err)
				return
			}

			// Check that expected strings are in the harness
			for _, str := range tt.contains {
				if !strings.Contains(harness, str) {
					t.Errorf("GenerateTestHarness() harness does not contain %q", str)
				}
			}
		})
	}
}

// Test InjectUserCode
func TestInjectUserCode(t *testing.T) {
	tests := []struct {
		name       string
		harness    string
		userCode   string
		language   string
		wantOutput string
	}{
		{
			name: "Python injection",
			harness: `# USER_CODE_START
def add(a: int, b: int) -> int:
    # STUDENT_CODE_HERE
# USER_CODE_END`,
			userCode: `def add(a, b):
    return a + b`,
			language:   "python",
			wantOutput: "return a + b",
		},
		{
			name: "C++ injection",
			harness: `// USER_CODE_START
int add(int a, int b) {
    // STUDENT_CODE_HERE
}
// USER_CODE_END`,
			userCode: `int add(int a, int b) {
    return a + b;
}`,
			language:   "cpp",
			wantOutput: "return a + b;",
		},
		{
			name: "Java injection",
			harness: `// USER_CODE_START
public int add(int a, int b) {
    // STUDENT_CODE_HERE
}
// USER_CODE_END`,
			userCode: `public int add(int a, int b) {
    return a + b;
}`,
			language:   "java",
			wantOutput: "return a + b;",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := InjectUserCode(tt.harness, tt.userCode, tt.language)

			if !strings.Contains(result, tt.wantOutput) {
				t.Errorf("InjectUserCode() result does not contain expected code %q\nGot:\n%s", tt.wantOutput, result)
			}

			// STUDENT_CODE_HERE placeholder should be replaced
			if strings.Contains(result, "STUDENT_CODE_HERE") {
				t.Errorf("InjectUserCode() result still contains STUDENT_CODE_HERE placeholder\nGot:\n%s", result)
			}

			// USER_CODE_START/END are just marker comments, they should remain
			if !strings.Contains(result, "USER_CODE_START") || !strings.Contains(result, "USER_CODE_END") {
				t.Errorf("InjectUserCode() result should preserve USER_CODE_START/END markers\nGot:\n%s", result)
			}
		})
	}
}
