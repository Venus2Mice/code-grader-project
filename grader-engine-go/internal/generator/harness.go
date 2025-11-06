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
// NEW: Uses explicit problem definition when available, falls back to type inference from test cases
func GenerateTestHarness(problem *models.Problem, language string) (string, error) {
	// Try to use explicit definition first (NEW)
	functionName, paramTypes, returnType, paramNames, err := GetSignatureFromProblemDefinition(problem)

	if err != nil {
		// Fallback: infer from test cases
		var inferErr error
		functionName, paramTypes, returnType, inferErr = InferSignatureFromTestCases(problem)
		if inferErr != nil {
			return "", fmt.Errorf("failed to determine function signature: %w", inferErr)
		}
		// Generate default parameter names
		paramNames = make([]string, len(paramTypes))
		for i := range paramNames {
			paramNames[i] = fmt.Sprintf("param%d", i)
		}
	}

	switch language {
	case "python":
		return generatePythonHarnessV2(problem, functionName, paramTypes, returnType, paramNames)
	case "cpp":
		return generateCppHarnessV2(problem, functionName, paramTypes, returnType, paramNames)
	case "java":
		return generateJavaHarnessV2(problem, functionName, paramTypes, returnType, paramNames)
	default:
		return "", fmt.Errorf("unsupported language: %s", language)
	}
} // detectSignatureLanguage detects the language format of a function signature
func detectSignatureLanguage(signature string) string {
	signature = strings.TrimSpace(signature)

	// Python: starts with "def " and has "->"
	if strings.HasPrefix(signature, "def ") {
		return "python"
	}

	// Java: contains "public", "private", or "protected"
	if strings.Contains(signature, "public ") ||
		strings.Contains(signature, "private ") ||
		strings.Contains(signature, "protected ") {
		return "java"
	}

	// C++: return type before function name, ends with ; or has no access modifiers
	// Examples: "bool isPalindrome(int x);", "vector<int> twoSum(vector<int>& nums, int target)"
	// Heuristic: if it doesn't start with def/public/private/protected, assume C++
	return "cpp"
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

		// FIX #4: Validate expected output can be parsed
		var expectedOutput TestOutput
		if err := json.Unmarshal(tc.ExpectedOutput, &expectedOutput); err != nil {
			return "", fmt.Errorf("test case %d: failed to parse expected output: %w",
				i+1, err)
		}

		// FIX #4: Validate expected output has required fields
		if expectedOutput.Type == "" || expectedOutput.Value == nil {
			return "", fmt.Errorf("test case %d: expected output has missing type or value",
				i+1)
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
	// JSON serialization for outputs
	sb.WriteString("#include <nlohmann/json.hpp>\n\n")
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
			// Convert generic type (e.g., int[], string[]) to proper C++ type (e.g., vector<int>)
			paramType := genericToCppType(sig.Parameters[j].Type)
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

		// Output result as JSON using nlohmann::json
		sb.WriteString("        nlohmann::json j = result;\n")
		sb.WriteString("        cout << j.dump() << endl;\n")
		sb.WriteString("    }\n\n")
	}

	sb.WriteString("    return 0;\n")
	sb.WriteString("}\n")

	return sb.String(), nil
}

// genericToCppType converts a generic type string to a valid C++ type representation
// Mirrors the mapping used by parser.genericTypeToCpp
func genericToCppType(t string) string {
	switch t {
	case "int":
		return "int"
	case "long":
		return "long long"
	case "double":
		return "double"
	case "float":
		return "float"
	case "bool":
		return "bool"
	case "string":
		return "string"
	case "char":
		return "char"
	case "int[]":
		return "vector<int>"
	case "string[]":
		return "vector<string>"
	case "double[]":
		return "vector<double>"
	case "int[][]":
		return "vector<vector<int>>"
	default:
		// Fallback: return as-is to avoid crashing generation; better than empty
		return t
	}
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
			// Convert generic type to proper Java type
			paramType := genericToJavaType(sig.Parameters[j].Type)
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
	// Handle array types recursively: int[], double[], String[], char[], int[][], etc.
	if isJavaArrayType(typ) {
		dims := javaArrayDims(typ)
		base := javaArrayBaseType(typ)
		// Convert generic base type to Java type
		javaBase := genericToJavaType(base)

		// Expect value to be []interface{} for arrays
		if arr, ok := value.([]interface{}); ok {
			// Leaf dimension
			if dims == 1 {
				elems := make([]string, 0, len(arr))
				for _, item := range arr {
					elems = append(elems, formatJavaValue(item, base))
				}
				return fmt.Sprintf("new %s[]{%s}", javaBase, strings.Join(elems, ", "))
			}

			// Nested dimensions: build children with one-less dimension
			childTyp := base + strings.Repeat("[]", dims-1)
			children := make([]string, 0, len(arr))
			for _, child := range arr {
				children = append(children, formatJavaValue(child, childTyp))
			}
			return fmt.Sprintf("new %s%s{%s}", javaBase, strings.Repeat("[]", dims), strings.Join(children, ", "))
		}
		// Fallback: empty array of given type
		return fmt.Sprintf("new %s%s{}", javaBase, strings.Repeat("[]", dims))
	}

	switch v := value.(type) {
	case string:
		// If type is char, use single quotes; otherwise double quotes for String
		if typ == "char" {
			if len(v) == 1 {
				return fmt.Sprintf("'%s'", v)
			}
			// If string length > 1 but type is char, take first char
			return fmt.Sprintf("'%c'", v[0])
		}
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
	case []interface{}:
		// No type provided, emit simple array literal when possible
		items := []string{}
		for _, item := range v {
			items = append(items, formatJavaValue(item, ""))
		}
		return "{" + strings.Join(items, ", ") + "}"
	default:
		return fmt.Sprintf("%v", v)
	}
}

// Helpers for Java array types
func isJavaArrayType(typ string) bool {
	return strings.HasSuffix(typ, "[]")
}

func javaArrayDims(typ string) int {
	count := 0
	for strings.HasSuffix(typ, "[]") {
		count++
		typ = strings.TrimSuffix(typ, "[]")
	}
	return count
}

func javaArrayBaseType(typ string) string {
	for strings.HasSuffix(typ, "[]") {
		typ = strings.TrimSuffix(typ, "[]")
	}
	return typ
}

// genericToJavaType converts a generic type string to a valid Java type
// Similar to parser.genericTypeToJava but kept local to avoid circular dependency
func genericToJavaType(t string) string {
	switch t {
	case "int":
		return "int"
	case "long":
		return "long"
	case "double":
		return "double"
	case "float":
		return "float"
	case "bool":
		return "boolean"
	case "string":
		return "String"
	case "char":
		return "char"
	case "char[]":
		return "char[]"
	case "int[]":
		return "int[]"
	case "string[]":
		return "String[]"
	case "double[]":
		return "double[]"
	case "int[][]":
		return "int[][]"
	case "string[][]":
		return "String[][]"
	case "double[][]":
		return "double[][]"
	default:
		// For unknown types, capitalize first letter if it looks like an object type
		if len(t) > 0 && t[0] >= 'a' && t[0] <= 'z' && !strings.Contains(t, "[") {
			return strings.ToUpper(t[:1]) + t[1:]
		}
		return t
	}
}
