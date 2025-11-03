package generator

import (
	"encoding/json"
	"fmt"
	"strings"

	"grader-engine-go/internal/models"
)

// generateJavaHarnessV2 generates simplified Java harness with type inference
func generateJavaHarnessV2(problem *models.Problem, functionName string, paramTypes []string, returnType string, paramNames []string) (string, error) {
	var sb strings.Builder

	// Class declaration
	sb.WriteString("import java.util.*;\n")
	sb.WriteString("import com.google.gson.Gson;\n\n")
	sb.WriteString("class Solution {\n")

	// Use provided parameter names, or generate defaults
	if len(paramNames) == 0 {
		paramNames = make([]string, len(paramTypes))
		for i := range paramTypes {
			paramNames[i] = fmt.Sprintf("param%d", i)
		}
	}

	// Convert types to Java syntax
	javaParamTypes := make([]string, len(paramTypes))
	for i, t := range paramTypes {
		javaParamTypes[i] = convertToJavaType(t)
	}
	javaReturnType := convertToJavaType(returnType)

	// User code placeholder
	sb.WriteString("    // USER_CODE_START\n")
	sb.WriteString(fmt.Sprintf("    public %s %s(", javaReturnType, functionName))
	for i, paramName := range paramNames {
		if i > 0 {
			sb.WriteString(", ")
		}
		sb.WriteString(fmt.Sprintf("%s %s", javaParamTypes[i], paramName))
	}
	sb.WriteString(") {\n")
	sb.WriteString("        // STUDENT_CODE_HERE\n")
	sb.WriteString("    }\n")
	sb.WriteString("    // USER_CODE_END\n")

	// Main method
	sb.WriteString("\n    public static void main(String[] args) {\n")
	sb.WriteString("        Solution solution = new Solution();\n")
	sb.WriteString("        Gson gson = new Gson();\n\n")

	// Generate test cases
	for i, tc := range problem.TestCases {
		sb.WriteString(fmt.Sprintf("        // Test case %d\n", i+1))
		sb.WriteString("        try {\n")

		// Parse inputs
		var inputs []TestInput
		if err := json.Unmarshal(tc.Inputs, &inputs); err != nil {
			return "", fmt.Errorf("failed to parse test case %d inputs: %w", i+1, err)
		}

		// Validate input count
		if len(inputs) != len(paramTypes) {
			return "", fmt.Errorf("test case %d: expected %d parameters but got %d inputs.\n"+
				"Problem definition: function_name='%s', parameters=%v\n"+
				"Test case inputs: %s\n"+
				"HINT: Make sure the problem's 'parameters' field matches the number of test case inputs",
				i+1, len(paramTypes), len(inputs), functionName, paramNames, string(tc.Inputs))
		}

		// Generate input variables
		for j, input := range inputs {
			declaration := generateJavaVarDeclaration(paramNames[j], javaParamTypes[j], input.Value, input.Type)
			sb.WriteString(fmt.Sprintf("            %s\n", declaration))
		}

		// Call function and print result
		if returnType == "void" {
			sb.WriteString(fmt.Sprintf("            solution.%s(%s);\n", functionName, strings.Join(paramNames, ", ")))
			sb.WriteString("            System.out.println(\"null\");\n")
		} else {
			sb.WriteString(fmt.Sprintf("            %s result = solution.%s(%s);\n",
				javaReturnType, functionName, strings.Join(paramNames, ", ")))
			sb.WriteString("            System.out.println(gson.toJson(result));\n")
		}

		sb.WriteString("        } catch (Exception e) {\n")
		sb.WriteString("            System.out.println(\"{\\\"error\\\": \\\"\" + e.getMessage() + \"\\\"}\");\n")
		sb.WriteString("        }\n\n")
	}

	sb.WriteString("    }\n")
	sb.WriteString("}\n")

	return sb.String(), nil
}

// convertToJavaType converts generic type to Java type
func convertToJavaType(genericType string) string {
	typeMap := map[string]string{
		"int":      "int",
		"long":     "long",
		"double":   "double",
		"float":    "float",
		"bool":     "boolean",
		"string":   "String",
		"char":     "char",
		"int[]":    "int[]",
		"string[]": "String[]",
		"double[]": "double[]",
		"int[][]":  "int[][]",
		"void":     "void",
	}

	if javaType, ok := typeMap[genericType]; ok {
		return javaType
	}
	return "Object" // fallback
}

// getDefaultJavaValue returns default value for Java type
func getDefaultJavaValue(javaType string) string {
	if strings.Contains(javaType, "[]") {
		return "new " + javaType + "{}"
	}

	switch javaType {
	case "int", "long":
		return "0"
	case "double", "float":
		return "0.0"
	case "boolean":
		return "false"
	case "String":
		return "\"\""
	case "char":
		return "'\\0'"
	default:
		return "null"
	}
}

// generateJavaVarDeclaration generates Java variable declaration with initialization
func generateJavaVarDeclaration(varName, javaType string, value interface{}, genericType string) string {
	formatted := formatJavaValue(value, genericType)
	return fmt.Sprintf("%s %s = %s;", javaType, varName, formatted)
}
