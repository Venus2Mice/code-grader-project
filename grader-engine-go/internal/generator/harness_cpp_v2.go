package generator

import (
	"encoding/json"
	"fmt"
	"strings"

	"grader-engine-go/internal/models"
)

// generateCppHarnessV2 generates simplified C++ harness with type inference
func generateCppHarnessV2(problem *models.Problem, functionName string, paramTypes []string, returnType string, paramNames []string) (string, error) {
	var sb strings.Builder

	// Includes
	sb.WriteString("#include <iostream>\n")
	sb.WriteString("#include <vector>\n")
	sb.WriteString("#include <string>\n")
	sb.WriteString("#include <sstream>\n")
	sb.WriteString("#include <iomanip>\n")
	sb.WriteString("#include <nlohmann/json.hpp>\n\n")
	sb.WriteString("using namespace std;\n\n")

	// Use provided parameter names, or generate defaults
	if len(paramNames) == 0 {
		paramNames = make([]string, len(paramTypes))
		for i := range paramTypes {
			paramNames[i] = fmt.Sprintf("param%d", i)
		}
	}

	// Convert types to C++ syntax
	cppParamTypes := make([]string, len(paramTypes))
	for i, t := range paramTypes {
		cppParamTypes[i] = convertToCppType(t)
	}
	cppReturnType := convertToCppType(returnType)

	// User code placeholder
	sb.WriteString("// USER_CODE_START\n")
	sb.WriteString(fmt.Sprintf("%s %s(", cppReturnType, functionName))
	for i, paramName := range paramNames {
		if i > 0 {
			sb.WriteString(", ")
		}
		// Use const reference for complex types
		paramType := cppParamTypes[i]
		if strings.Contains(paramType, "vector") || strings.Contains(paramType, "string") {
			sb.WriteString(fmt.Sprintf("const %s& %s", paramType, paramName))
		} else {
			sb.WriteString(fmt.Sprintf("%s %s", paramType, paramName))
		}
	}
	sb.WriteString(") {\n")
	sb.WriteString("    // STUDENT_CODE_HERE\n")
	sb.WriteString("}\n")
	sb.WriteString("// USER_CODE_END\n\n")

	// Main function
	sb.WriteString("int main() {\n")
	sb.WriteString("    ios_base::sync_with_stdio(false);\n")
	sb.WriteString("    cin.tie(nullptr);\n\n")

	// Generate test cases
	for i, tc := range problem.TestCases {
		sb.WriteString(fmt.Sprintf("    // Test case %d\n", i+1))
		sb.WriteString("    try {\n")

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
			declaration := generateCppVarDeclaration(paramNames[j], cppParamTypes[j], input.Value, input.Type)
			sb.WriteString(fmt.Sprintf("        %s\n", declaration))
		}

		// Call function and print result
		if returnType == "void" {
			sb.WriteString(fmt.Sprintf("        %s(%s);\n", functionName, strings.Join(paramNames, ", ")))
			sb.WriteString("        cout << \"null\" << endl;\n")
		} else {
			sb.WriteString(fmt.Sprintf("        auto result = %s(%s);\n", functionName, strings.Join(paramNames, ", ")))
			sb.WriteString("        cout << ")
			sb.WriteString(generateCppOutputCode("result", cppReturnType))
			sb.WriteString(" << endl;\n")
		}

		sb.WriteString("    } catch (const exception& e) {\n")
		sb.WriteString("        cout << \"{\\\"error\\\": \\\"\" << e.what() << \"\\\"}\" << endl;\n")
		sb.WriteString("    }\n\n")
	}

	sb.WriteString("    return 0;\n")
	sb.WriteString("}\n")

	return sb.String(), nil
}

// convertToCppType converts generic type to C++ type
func convertToCppType(genericType string) string {
	typeMap := map[string]string{
		"int":      "int",
		"long":     "long long",
		"double":   "double",
		"float":    "float",
		"bool":     "bool",
		"string":   "string",
		"char":     "char",
		"int[]":    "vector<int>",
		"string[]": "vector<string>",
		"double[]": "vector<double>",
		"int[][]":  "vector<vector<int>>",
		"void":     "void",
	}

	if cppType, ok := typeMap[genericType]; ok {
		return cppType
	}
	return "int" // fallback
}

// getDefaultCppValue returns default value for C++ type
func getDefaultCppValue(cppType string) string {
	if strings.Contains(cppType, "vector") {
		return "{}"
	}
	switch cppType {
	case "int", "long long":
		return "0"
	case "double", "float":
		return "0.0"
	case "bool":
		return "false"
	case "string":
		return "\"\""
	case "char":
		return "'\\0'"
	default:
		return "{}"
	}
}

// generateCppVarDeclaration generates C++ variable declaration with initialization
func generateCppVarDeclaration(varName, cppType string, value interface{}, genericType string) string {
	formatted := formatCppValue(value, genericType)
	return fmt.Sprintf("%s %s = %s;", cppType, varName, formatted)
}

// generateCppOutputCode generates code to output a C++ value
func generateCppOutputCode(varName, cppType string) string {
	// For vectors, use nlohmann::json
	if strings.Contains(cppType, "vector") {
		return fmt.Sprintf("nlohmann::json(%s).dump()", varName)
	}

	// For basic types
	switch cppType {
	case "string":
		return fmt.Sprintf("\"\\\"\" << %s << \"\\\"\"", varName)
	case "bool":
		return fmt.Sprintf("(%s ? \"true\" : \"false\")", varName)
	default:
		return varName
	}
}
