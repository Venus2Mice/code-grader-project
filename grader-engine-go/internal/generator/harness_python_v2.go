package generator

import (
	"encoding/json"
	"fmt"
	"strings"

	"grader-engine-go/internal/models"
)

// generatePythonHarnessV2 generates simplified Python harness with type inference
func generatePythonHarnessV2(problem *models.Problem, functionName string, paramTypes []string, returnType string) (string, error) {
	var sb strings.Builder

	// Imports
	sb.WriteString("import json\n")
	sb.WriteString("import sys\n")
	sb.WriteString("from typing import List, Optional, Any\n\n")

	// Generate parameter names (param0, param1, ...)
	paramNames := make([]string, len(paramTypes))
	for i := range paramTypes {
		paramNames[i] = fmt.Sprintf("param%d", i)
	}

	// Convert types to Python syntax
	pythonParamTypes := make([]string, len(paramTypes))
	for i, t := range paramTypes {
		pythonParamTypes[i] = convertToPythonType(t)
	}
	pythonReturnType := convertToPythonType(returnType)

	// User code placeholder with function signature
	sb.WriteString("# USER_CODE_START\n")
	sb.WriteString(fmt.Sprintf("def %s(", functionName))
	for i, paramName := range paramNames {
		if i > 0 {
			sb.WriteString(", ")
		}
		sb.WriteString(fmt.Sprintf("%s: %s", paramName, pythonParamTypes[i]))
	}
	sb.WriteString(fmt.Sprintf(") -> %s:\n", pythonReturnType))
	sb.WriteString("    # STUDENT_CODE_HERE\n")
	sb.WriteString("# USER_CODE_END\n\n")

	// Test harness
	sb.WriteString("if __name__ == \"__main__\":\n")

	// Generate test cases
	for i, tc := range problem.TestCases {
		sb.WriteString(fmt.Sprintf("    # Test case %d\n", i+1))
		sb.WriteString("    try:\n")

		// Parse inputs
		var inputs []TestInput
		if err := json.Unmarshal(tc.Inputs, &inputs); err != nil {
			return "", fmt.Errorf("failed to parse test case %d inputs: %w", i+1, err)
		}

		// Validate input count
		if len(inputs) != len(paramTypes) {
			return "", fmt.Errorf("test case %d: expected %d parameters but got %d inputs",
				i+1, len(paramTypes), len(inputs))
		}

		// Generate input variables
		for j, input := range inputs {
			value := formatPythonValue(input.Value, input.Type)
			sb.WriteString(fmt.Sprintf("        %s = %s\n", paramNames[j], value))
		}

		// Call function
		sb.WriteString(fmt.Sprintf("        result = %s(%s)\n",
			functionName, strings.Join(paramNames, ", ")))

		// Output result as JSON
		sb.WriteString("        print(json.dumps(result))\n")
		sb.WriteString("    except Exception as e:\n")
		sb.WriteString("        print(json.dumps({\"error\": str(e)}))\n\n")
	}

	return sb.String(), nil
}

// convertToPythonType converts generic type to Python type annotation
func convertToPythonType(genericType string) string {
	typeMap := map[string]string{
		"int":      "int",
		"long":     "int",
		"double":   "float",
		"float":    "float",
		"bool":     "bool",
		"string":   "str",
		"char":     "str",
		"int[]":    "List[int]",
		"string[]": "List[str]",
		"double[]": "List[float]",
		"int[][]":  "List[List[int]]",
		"void":     "None",
	}

	if pyType, ok := typeMap[genericType]; ok {
		return pyType
	}
	return "Any" // fallback
}
