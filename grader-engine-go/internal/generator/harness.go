package generator

import (
	"encoding/json"
	"fmt"
	"strings"

	"grader-engine-go/internal/models"
	"grader-engine-go/internal/parser"
)

// TestInput represents a test case input parameter
type TestInput struct {
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

// TestOutput represents expected output
type TestOutput struct {
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

// GenerateTestHarness creates test harness code based on language
func GenerateTestHarness(problem *models.Problem, language string) (string, error) {
	// Parse function signature - ALWAYS parse as Python first since DB stores Python syntax
	sig, err := parser.ParseSignature(problem.FunctionSignature, "python")
	if err != nil {
		return "", fmt.Errorf("failed to parse signature: %w", err)
	}

	// Update signature language to target language for proper type handling
	sig.Language = language

	switch language {
	case "python":
		return generatePythonHarness(problem, sig)
	case "cpp":
		return generateCppHarness(problem, sig)
	case "java":
		return generateJavaHarness(problem, sig)
	default:
		return "", fmt.Errorf("unsupported language: %s", language)
	}
}

// generatePythonHarness generates Python test harness
func generatePythonHarness(problem *models.Problem, sig *parser.FunctionSignature) (string, error) {
	var sb strings.Builder

	// Imports
	sb.WriteString("import json\n")
	sb.WriteString("import sys\n")
	sb.WriteString("from typing import List, Optional\n\n")

	// Convert signature to Python and generate user code placeholder
	pythonSig := parser.ConvertSignatureToLanguage(sig, "python")
	sb.WriteString("# USER_CODE_START\n")
	sb.WriteString(pythonSig + "\n")
	sb.WriteString("    pass\n")
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

		// Validate input count matches parameter count
		if len(inputs) != len(sig.Parameters) {
			return "", fmt.Errorf("test case %d: expected %d parameters but got %d inputs",
				i+1, len(sig.Parameters), len(inputs))
		}

		// Generate input variables
		for j, input := range inputs {
			paramName := sig.Parameters[j].Name
			value := formatPythonValue(input.Value, input.Type)
			sb.WriteString(fmt.Sprintf("        %s = %s\n", paramName, value))
		}

		// Call function
		paramNames := []string{}
		for _, param := range sig.Parameters {
			paramNames = append(paramNames, param.Name)
		}
		sb.WriteString(fmt.Sprintf("        result = %s(%s)\n",
			sig.FunctionName, strings.Join(paramNames, ", ")))

		// Output result as JSON
		sb.WriteString("        print(json.dumps(result))\n")
		sb.WriteString("    except Exception as e:\n")
		sb.WriteString("        print(json.dumps({\"error\": str(e)}))\n\n")
	}

	return sb.String(), nil
}

// generateCppHarness generates C++ test harness
func generateCppHarness(problem *models.Problem, sig *parser.FunctionSignature) (string, error) {
	var sb strings.Builder

	// Includes - only use standard library
	sb.WriteString("#include <iostream>\n")
	sb.WriteString("#include <vector>\n")
	sb.WriteString("#include <string>\n")
	sb.WriteString("#include <sstream>\n")
	sb.WriteString("#include <iomanip>\n\n")
	sb.WriteString("using namespace std;\n\n")

	// Convert signature to C++ syntax
	cppSig := parser.ConvertSignatureToLanguage(sig, "cpp")

	// User code placeholder
	sb.WriteString("// USER_CODE_START\n")
	sb.WriteString(cppSig + " {\n")
	sb.WriteString("    // Student implementation\n")
	sb.WriteString("}\n")
	sb.WriteString("// USER_CODE_END\n\n")

	// Main function
	sb.WriteString("int main() {\n")
	sb.WriteString("    ios_base::sync_with_stdio(false);\n")
	sb.WriteString("    cin.tie(nullptr);\n\n")

	// Generate test cases
	for i, tc := range problem.TestCases {
		sb.WriteString(fmt.Sprintf("    // Test case %d\n", i+1))
		sb.WriteString("    {\n")

		// Parse inputs
		var inputs []TestInput
		if err := json.Unmarshal(tc.Inputs, &inputs); err != nil {
			return "", fmt.Errorf("failed to parse test case %d inputs: %w", i+1, err)
		}

		// Validate input count matches parameter count
		if len(inputs) != len(sig.Parameters) {
			return "", fmt.Errorf("test case %d: expected %d parameters but got %d inputs",
				i+1, len(sig.Parameters), len(inputs))
		}

		// Generate input variables
		for j, input := range inputs {
			paramName := sig.Parameters[j].Name
			paramType := sig.Parameters[j].Type
			value := formatCppValue(input.Value, input.Type)
			sb.WriteString(fmt.Sprintf("        %s %s = %s;\n", paramType, paramName, value))
		}

		// Call function
		paramNames := []string{}
		for _, param := range sig.Parameters {
			paramNames = append(paramNames, param.Name)
		}
		sb.WriteString(fmt.Sprintf("        auto result = %s(%s);\n",
			sig.FunctionName, strings.Join(paramNames, ", ")))

		// Output result - simple format
		sb.WriteString("        cout << result << endl;\n")
		sb.WriteString("    }\n\n")
	}

	sb.WriteString("    return 0;\n")
	sb.WriteString("}\n")

	return sb.String(), nil
}

// generateJavaHarness generates Java test harness
func generateJavaHarness(problem *models.Problem, sig *parser.FunctionSignature) (string, error) {
	var sb strings.Builder

	// Imports
	sb.WriteString("import com.google.gson.Gson;\n")
	sb.WriteString("import java.util.*;\n\n")

	// Convert signature to Java syntax
	javaSig := parser.ConvertSignatureToLanguage(sig, "java")

	// Solution class with user code
	sb.WriteString("class Solution {\n")
	sb.WriteString("    // USER_CODE_START\n")
	sb.WriteString("    " + javaSig + " {\n")
	sb.WriteString("        // Student implementation\n")
	if strings.Contains(sig.ReturnType, "[]") {
		javaReturnType := parser.ConvertSignatureToLanguage(sig, "java")
		// Extract just the return type
		returnTypeStart := strings.Index(javaReturnType, "public ") + 7
		returnTypeEnd := strings.Index(javaReturnType[returnTypeStart:], " ")
		if returnTypeEnd != -1 {
			returnType := javaReturnType[returnTypeStart : returnTypeStart+returnTypeEnd]
			sb.WriteString("        return new " + strings.ReplaceAll(returnType, "[]", "[0]") + ";\n")
		} else {
			sb.WriteString("        return null;\n")
		}
	} else {
		sb.WriteString("        return null;\n")
	}
	sb.WriteString("    }\n")
	sb.WriteString("    // USER_CODE_END\n")
	sb.WriteString("}\n\n")

	// Main class
	sb.WriteString("public class Main {\n")
	sb.WriteString("    public static void main(String[] args) {\n")
	sb.WriteString("        Gson gson = new Gson();\n")
	sb.WriteString("        Solution solution = new Solution();\n\n")

	// Generate test cases
	for i, tc := range problem.TestCases {
		sb.WriteString(fmt.Sprintf("        // Test case %d\n", i+1))
		sb.WriteString("        try {\n")

		// Parse inputs
		var inputs []TestInput
		if err := json.Unmarshal(tc.Inputs, &inputs); err != nil {
			return "", fmt.Errorf("failed to parse test case %d inputs: %w", i+1, err)
		}

		// Validate input count matches parameter count
		if len(inputs) != len(sig.Parameters) {
			return "", fmt.Errorf("test case %d: expected %d parameters but got %d inputs",
				i+1, len(sig.Parameters), len(inputs))
		}

		// Generate input variables
		for j, input := range inputs {
			paramName := sig.Parameters[j].Name
			paramType := sig.Parameters[j].Type
			value := formatJavaValue(input.Value, input.Type)
			sb.WriteString(fmt.Sprintf("            %s %s = %s;\n", paramType, paramName, value))
		}

		// Call function
		paramNames := []string{}
		for _, param := range sig.Parameters {
			paramNames = append(paramNames, param.Name)
		}
		sb.WriteString(fmt.Sprintf("            var result = solution.%s(%s);\n",
			sig.FunctionName, strings.Join(paramNames, ", ")))

		// Output result as JSON
		sb.WriteString("            System.out.println(gson.toJson(result));\n")
		sb.WriteString("        } catch (Exception e) {\n")
		sb.WriteString("            System.out.println(\"{\\\"error\\\":\\\"\" + e.getMessage() + \"\\\"}\");\n")
		sb.WriteString("        }\n\n")
	}

	sb.WriteString("    }\n")
	sb.WriteString("}\n")

	return sb.String(), nil
}

// formatPythonValue formats value for Python code
func formatPythonValue(value interface{}, typ string) string {
	switch v := value.(type) {
	case []interface{}:
		items := []string{}
		for _, item := range v {
			items = append(items, formatPythonValue(item, ""))
		}
		return "[" + strings.Join(items, ", ") + "]"
	case string:
		return fmt.Sprintf("\"%s\"", v)
	case float64:
		if float64(int(v)) == v {
			return fmt.Sprintf("%d", int(v))
		}
		return fmt.Sprintf("%f", v)
	case bool:
		if v {
			return "True"
		}
		return "False"
	default:
		return fmt.Sprintf("%v", v)
	}
}

// formatCppValue formats value for C++ code
func formatCppValue(value interface{}, typ string) string {
	switch v := value.(type) {
	case []interface{}:
		items := []string{}
		for _, item := range v {
			items = append(items, formatCppValue(item, ""))
		}
		return "{" + strings.Join(items, ", ") + "}"
	case string:
		return fmt.Sprintf("\"%s\"", v)
	case float64:
		if float64(int(v)) == v {
			return fmt.Sprintf("%d", int(v))
		}
		return fmt.Sprintf("%f", v)
	case bool:
		if v {
			return "true"
		}
		return "false"
	default:
		return fmt.Sprintf("%v", v)
	}
}

// formatJavaValue formats value for Java code
func formatJavaValue(value interface{}, typ string) string {
	switch v := value.(type) {
	case []interface{}:
		items := []string{}
		for _, item := range v {
			items = append(items, formatJavaValue(item, ""))
		}
		if strings.Contains(typ, "int[]") {
			return "new int[]{" + strings.Join(items, ", ") + "}"
		}
		return "{" + strings.Join(items, ", ") + "}"
	case string:
		return fmt.Sprintf("\"%s\"", v)
	case float64:
		if float64(int(v)) == v {
			return fmt.Sprintf("%d", int(v))
		}
		return fmt.Sprintf("%f", v)
	case bool:
		if v {
			return "true"
		}
		return "false"
	default:
		return fmt.Sprintf("%v", v)
	}
}
