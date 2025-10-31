package generator

import (
	"encoding/json"
	"fmt"
	"grader-engine-go/internal/models"
)

// InferSignatureFromTestCases analyzes test cases to determine function signature
// Returns: function name, parameter types, return type
func InferSignatureFromTestCases(problem *models.Problem) (string, []string, string, error) {
	if len(problem.TestCases) == 0 {
		return "", nil, "", fmt.Errorf("no test cases available for type inference")
	}

	// Use function_name if available, otherwise extract from signature
	functionName := problem.FunctionName
	if functionName == "" {
		// Fallback: try to extract from signature (backward compatibility)
		functionName = extractFunctionName(problem.FunctionSignature)
	}

	// Analyze first test case to infer types
	firstTC := problem.TestCases[0]

	// Parse inputs to get parameter types
	var inputs []TestInput
	if err := json.Unmarshal(firstTC.Inputs, &inputs); err != nil {
		return "", nil, "", fmt.Errorf("failed to parse inputs: %w", err)
	}

	paramTypes := make([]string, len(inputs))
	for i, input := range inputs {
		paramTypes[i] = input.Type
	}

	// Parse expected output to get return type
	var output TestOutput
	if err := json.Unmarshal(firstTC.ExpectedOutput, &output); err != nil {
		return "", nil, "", fmt.Errorf("failed to parse expected output: %w", err)
	}

	returnType := output.Type

	return functionName, paramTypes, returnType, nil
}

// extractFunctionName extracts function name from signature (backward compatibility)
func extractFunctionName(signature string) string {
	// Python: def functionName(...)
	if len(signature) > 4 && signature[:4] == "def " {
		for i := 4; i < len(signature); i++ {
			if signature[i] == '(' {
				return signature[4:i]
			}
		}
	}

	// C++/Java: returnType functionName(...)
	// Find first '('
	parenIdx := -1
	for i, ch := range signature {
		if ch == '(' {
			parenIdx = i
			break
		}
	}

	if parenIdx == -1 {
		return "solution" // default fallback
	}

	// Work backwards from '(' to find function name
	nameEnd := parenIdx
	nameStart := parenIdx

	// Skip whitespace before '('
	for nameStart > 0 && (signature[nameStart-1] == ' ' || signature[nameStart-1] == '\t') {
		nameStart--
	}

	// Find start of function name
	for nameStart > 0 {
		ch := signature[nameStart-1]
		if (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch == '_' {
			nameStart--
		} else {
			break
		}
	}

	if nameStart < nameEnd {
		return signature[nameStart:nameEnd]
	}

	return "solution" // default fallback
}
