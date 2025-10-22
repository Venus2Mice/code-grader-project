package grader

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"grader-engine-go/internal/models"
)

// parseTestCaseInput attempts to parse test case input as JSON array.
// If JSON parsing fails, it treats the input as space-separated values
// and converts them into appropriate JSON types.
func parseTestCaseInput(inputStr string) ([]interface{}, error) {
	// Try to parse as JSON array first
	var args []interface{}
	if err := json.Unmarshal([]byte(inputStr), &args); err == nil {
		// Successfully parsed as JSON
		return args, nil
	}

	// If JSON parsing fails, try treating it as space-separated values
	// Convert "5 10" to [5, 10] or "hello world" to ["hello", "world"]
	parts := strings.Fields(inputStr)
	if len(parts) == 0 {
		return []interface{}{}, nil
	}

	// Try to convert each part to a number, otherwise keep as string
	for _, part := range parts {
		// Try parsing as integer
		if intVal, err := parseInt(part); err == nil {
			args = append(args, intVal)
		} else if floatVal, err := parseFloat(part); err == nil {
			// Try parsing as float
			args = append(args, floatVal)
		} else {
			// Keep as string
			args = append(args, part)
		}
	}

	return args, nil
}

// parseInt tries to parse a string as an integer
func parseInt(s string) (int64, error) {
	var result int64
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}

// parseFloat tries to parse a string as a float
func parseFloat(s string) (float64, error) {
	var result float64
	_, err := fmt.Sscanf(s, "%f", &result)
	return result, err
}

// generateCppTestHarness generates C++ test harness with main() that calls user function
func (s *Service) generateCppTestHarness(problem *models.Problem, userCode string) (string, error) {
	// Extract function signature and name
	funcSig := problem.FunctionSignature
	if funcSig == "" {
		return "", fmt.Errorf("function signature not found in problem")
	}

	// Extract function name from signature using regex
	// Matches: "return_type function_name(params)"
	re := regexp.MustCompile(`\s+(\w+)\s*\(`)
	matches := re.FindStringSubmatch(funcSig)
	if len(matches) < 2 {
		return "", fmt.Errorf("could not extract function name from signature: %s", funcSig)
	}
	functionName := matches[1]

	// Parse test cases to generate test code
	testCalls := []string{}
	for i, tc := range problem.TestCases {
		// Parse input - handles both JSON arrays and space-separated values
		args, err := parseTestCaseInput(tc.InputData)
		if err != nil {
			return "", fmt.Errorf("failed to parse test case %d input: %w", i, err)
		}

		// Build function call string
		argStrings := []string{}
		for _, arg := range args {
			argStrings = append(argStrings, formatCppValue(arg))
		}

		callStr := fmt.Sprintf(`
	// Test case %d
	{
		auto result = %s(%s);
		cout << result << endl;
	}`, i+1, functionName, strings.Join(argStrings, ", "))

		testCalls = append(testCalls, callStr)
	}

	// Generate complete test harness
	harness := fmt.Sprintf(`#include <iostream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

// User code
%s

// Auto-generated test harness
int main() {
	ios_base::sync_with_stdio(false);
	cin.tie(nullptr);
	
%s
	
	return 0;
}
`, userCode, strings.Join(testCalls, "\n"))

	return harness, nil
}

// generatePythonTestHarness generates Python test harness using exec() with globals
func (s *Service) generatePythonTestHarness(problem *models.Problem, userCode string) (string, error) {
	// Extract function name from signature
	funcSig := problem.FunctionSignature
	if funcSig == "" {
		return "", fmt.Errorf("function signature not found in problem")
	}

	// Extract function name from signature using regex
	// Matches: "def function_name(...)" or similar patterns
	re := regexp.MustCompile(`\s+(\w+)\s*\(`)
	matches := re.FindStringSubmatch(funcSig)
	if len(matches) < 2 {
		return "", fmt.Errorf("could not extract function name from signature: %s", funcSig)
	}
	funcName := matches[1]

	// Parse test cases to generate test code
	testCalls := []string{}
	for i, tc := range problem.TestCases {
		// Parse input - handles both JSON arrays and space-separated values
		args, err := parseTestCaseInput(tc.InputData)
		if err != nil {
			return "", fmt.Errorf("failed to parse test case %d input: %w", i, err)
		}

		// Build function call string
		argStrings := []string{}
		for _, arg := range args {
			argStrings = append(argStrings, formatPythonValue(arg))
		}

		callStr := fmt.Sprintf(`    # Test case %d
    result = %s(%s)
    print(result)`, i+1, funcName, strings.Join(argStrings, ", "))

		testCalls = append(testCalls, callStr)
	}

	// Generate complete test harness
	harness := fmt.Sprintf(`#!/usr/bin/env python3
# User code
%s

# Auto-generated test harness
if __name__ == '__main__':
%s
`, userCode, strings.Join(testCalls, "\n"))

	return harness, nil
}

// generateJavaTestHarness generates Java test harness with reflection to invoke user method
func (s *Service) generateJavaTestHarness(problem *models.Problem, userCode string) (string, error) {
	// Extract function name from signature
	funcSig := problem.FunctionSignature
	if funcSig == "" {
		return "", fmt.Errorf("function signature not found in problem")
	}

	// Extract function name from signature using regex
	// Matches: "return_type function_name(...)"
	re := regexp.MustCompile(`\s+(\w+)\s*\(`)
	matches := re.FindStringSubmatch(funcSig)
	if len(matches) < 2 {
		return "", fmt.Errorf("could not extract function name from signature: %s", funcSig)
	}
	funcName := matches[1]

	// Extract class name from user code
	className := extractJavaClassName(userCode)
	if className == "" {
		className = "Solution" // Default class name
	}

	// Parse test cases to generate test code
	testCalls := []string{}
	for i, tc := range problem.TestCases {
		// Parse input - handles both JSON arrays and space-separated values
		args, err := parseTestCaseInput(tc.InputData)
		if err != nil {
			return "", fmt.Errorf("failed to parse test case %d input: %w", i, err)
		}

		// Build function call string
		argStrings := []string{}
		for _, arg := range args {
			argStrings = append(argStrings, formatJavaValue(arg))
		}

		callStr := fmt.Sprintf(`        // Test case %d
        result = solution.%s(%s);
        System.out.println(result);`, i+1, funcName, strings.Join(argStrings, ", "))

		testCalls = append(testCalls, callStr)
	}

	// Generate complete test harness
	harness := fmt.Sprintf(`// User code
%s

// Auto-generated test harness
public class Main {
    public static void main(String[] args) {
        %s solution = new %s();
        Object result;
        
%s
    }
}
`, userCode, className, className, strings.Join(testCalls, "\n"))

	return harness, nil
}

// formatCppValue converts Go interface{} to C++ literal string
func formatCppValue(val interface{}) string {
	switch v := val.(type) {
	case string:
		return fmt.Sprintf(`"%s"`, v)
	case float64:
		if v == float64(int64(v)) {
			return fmt.Sprintf("%d", int64(v))
		}
		return fmt.Sprintf("%f", v)
	case bool:
		if v {
			return "true"
		}
		return "false"
	case []interface{}:
		// Handle arrays/vectors
		elements := []string{}
		for _, elem := range v {
			elements = append(elements, formatCppValue(elem))
		}
		return fmt.Sprintf("{%s}", strings.Join(elements, ", "))
	default:
		return fmt.Sprintf("%v", v)
	}
}

// formatPythonValue converts Go interface{} to Python literal string
func formatPythonValue(val interface{}) string {
	switch v := val.(type) {
	case string:
		return fmt.Sprintf(`"%s"`, v)
	case float64:
		if v == float64(int64(v)) {
			return fmt.Sprintf("%d", int64(v))
		}
		return fmt.Sprintf("%f", v)
	case bool:
		if v {
			return "True"
		}
		return "False"
	case []interface{}:
		// Handle lists
		elements := []string{}
		for _, elem := range v {
			elements = append(elements, formatPythonValue(elem))
		}
		return fmt.Sprintf("[%s]", strings.Join(elements, ", "))
	case nil:
		return "None"
	default:
		return fmt.Sprintf("%v", v)
	}
}

// formatJavaValue converts Go interface{} to Java literal string
func formatJavaValue(val interface{}) string {
	switch v := val.(type) {
	case string:
		return fmt.Sprintf(`"%s"`, v)
	case float64:
		if v == float64(int64(v)) {
			return fmt.Sprintf("%d", int64(v))
		}
		return fmt.Sprintf("%f", v)
	case bool:
		if v {
			return "true"
		}
		return "false"
	case []interface{}:
		// Handle arrays
		elements := []string{}
		for _, elem := range v {
			elements = append(elements, formatJavaValue(elem))
		}
		return fmt.Sprintf("new Object[]{%s}", strings.Join(elements, ", "))
	case nil:
		return "null"
	default:
		return fmt.Sprintf("%v", v)
	}
}

// extractJavaClassName extracts the public class name from Java source code
func extractJavaClassName(code string) string {
	re := regexp.MustCompile(`public\s+class\s+(\w+)`)
	matches := re.FindStringSubmatch(code)
	if len(matches) > 1 {
		return matches[1]
	}

	// Fallback: look for any class declaration
	re = regexp.MustCompile(`class\s+(\w+)`)
	matches = re.FindStringSubmatch(code)
	if len(matches) > 1 {
		return matches[1]
	}

	return ""
}
