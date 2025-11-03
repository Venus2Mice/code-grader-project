package generator

import (
	"encoding/json"
	"fmt"
	"grader-engine-go/internal/models"
)

// Parameter represents a function parameter definition
type Parameter struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

// GetSignatureFromProblemDefinition gets signature directly from problem definition (NEW)
// Returns: function name, parameter types, return type, parameter names
func GetSignatureFromProblemDefinition(problem *models.Problem) (string, []string, string, []string, error) {
	// Check if problem has explicit definition
	if problem.FunctionName == "" {
		return "", nil, "", nil, fmt.Errorf("problem does not have function_name defined")
	}

	functionName := problem.FunctionName
	returnType := problem.ReturnType

	// Parse parameters from JSONB
	var parameters []Parameter
	if len(problem.Parameters) > 0 {
		if err := json.Unmarshal(problem.Parameters, &parameters); err != nil {
			return "", nil, "", nil, fmt.Errorf("failed to parse parameters: %w", err)
		}
	}

	// Extract types and names
	paramTypes := make([]string, len(parameters))
	paramNames := make([]string, len(parameters))
	for i, param := range parameters {
		paramTypes[i] = param.Type
		paramNames[i] = param.Name
	}

	return functionName, paramTypes, returnType, paramNames, nil
}

// InferSignatureFromTestCases analyzes test cases to determine function signature
// Returns: function name, parameter types, return type
// DEPRECATED: Use GetSignatureFromProblemDefinition instead
func InferSignatureFromTestCases(problem *models.Problem) (string, []string, string, error) {
	if len(problem.TestCases) == 0 {
		return "", nil, "", fmt.Errorf("no test cases available for type inference")
	}

	// Try to use explicit definition first
	functionName, paramTypes, returnType, _, err := GetSignatureFromProblemDefinition(problem)
	if err == nil {
		// Explicit definition exists, use it
		return functionName, paramTypes, returnType, nil
	}

	// Fallback to old inference method
	// Use function_name if available, otherwise extract from signature
	functionName = problem.FunctionName
	if functionName == "" && problem.FunctionSignature != nil {
		// Try to extract from signature (backward compatibility)
		functionName = extractFunctionName(*problem.FunctionSignature)
	}

	if functionName == "" {
		return "", nil, "", fmt.Errorf("cannot determine function name")
	}

	// Analyze first test case to infer types
	firstTC := problem.TestCases[0]

	// Parse inputs to get parameter types
	var inputs []TestInput
	if err := json.Unmarshal(firstTC.Inputs, &inputs); err != nil {
		return "", nil, "", fmt.Errorf("failed to parse inputs: %w", err)
	}

	paramTypes = make([]string, len(inputs))
	for i, input := range inputs {
		paramTypes[i] = input.Type
	}

	// Parse expected output to get return type
	var output TestOutput
	if err := json.Unmarshal(firstTC.ExpectedOutput, &output); err != nil {
		return "", nil, "", fmt.Errorf("failed to parse expected output: %w", err)
	}

	returnType = output.Type

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
