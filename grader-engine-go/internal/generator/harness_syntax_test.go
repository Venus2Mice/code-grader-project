package generator

import (
	"encoding/json"
	"strings"
	"testing"

	"grader-engine-go/internal/models"
)

// setupComplexProblem creates a sample problem with various data types
func setupComplexProblem(t *testing.T) *models.Problem {
	// Test cases with varied types
	testCases := []models.TestCase{
		{
			Inputs: json.RawMessage(`[
				{"type": "string[]", "value": ["apple", "banana", "cherry"]},
				{"type": "double", "value": 3.14},
				{"type": "bool", "value": true}
			]`),
			ExpectedOutput: json.RawMessage(`{"type": "string", "value": "processed"}`),
		},
		{
			Inputs: json.RawMessage(`[
				{"type": "string[]", "value": []},
				{"type": "double", "value": -10.5},
				{"type": "bool", "value": false}
			]`),
			ExpectedOutput: json.RawMessage(`{"type": "string", "value": "empty"}`),
		},
	}

	return &models.Problem{
		FunctionSignature: "def processData(items: List[str], value: float, active: bool) -> str:",
		TestCases:         testCases,
	}
}

// setupSimpleProblem creates a simple problem with basic types
func setupSimpleProblem() *models.Problem {
	testCases := []models.TestCase{
		{
			Inputs: json.RawMessage(`[
				{"type": "int[]", "value": [1, 2, 3, 4, 5]},
				{"type": "int", "value": 9}
			]`),
			ExpectedOutput: json.RawMessage(`{"type": "int[]", "value": [0, 1]}`),
		},
	}

	return &models.Problem{
		FunctionSignature: "def twoSum(nums: List[int], target: int) -> List[int]:",
		TestCases:         testCases,
	}
}

// TestGeneratePythonSyntax checks the syntax of the generated Python harness.
func TestGeneratePythonSyntax(t *testing.T) {
	problem := setupComplexProblem(t)
	harness, err := GenerateTestHarness(problem, "python")
	if err != nil {
		t.Fatalf("Failed to generate Python harness: %v", err)
	}

	t.Log("\n=== Generated Python Code ===\n" + harness)

	// Basic validation: ensure it's not empty and contains key elements
	if harness == "" {
		t.Error("Generated Python harness is empty.")
	}
	if !strings.Contains(harness, "def processData(items: List[str], value: float, active: bool) -> str:") {
		t.Error("Python harness is missing the function signature.")
	}
	if !strings.Contains(harness, "import json") {
		t.Error("Python harness is missing 'import json'.")
	}
	if !strings.Contains(harness, "print(json.dumps(result))") {
		t.Error("Python harness is missing the JSON output print statement.")
	}
	if !strings.Contains(harness, "# USER_CODE_START") {
		t.Error("Python harness is missing USER_CODE_START marker.")
	}
	if !strings.Contains(harness, "# USER_CODE_END") {
		t.Error("Python harness is missing USER_CODE_END marker.")
	}
}

// TestGenerateCppSyntax checks the syntax of the generated C++ harness.
func TestGenerateCppSyntax(t *testing.T) {
	problem := setupComplexProblem(t)
	harness, err := GenerateTestHarness(problem, "cpp")
	if err != nil {
		t.Fatalf("Failed to generate C++ harness: %v", err)
	}

	t.Log("\n=== Generated C++ Code ===\n" + harness)

	// Basic validation
	if harness == "" {
		t.Error("Generated C++ harness is empty.")
	}
	if !strings.Contains(harness, "#include <nlohmann/json.hpp>") {
		t.Error("C++ harness is missing nlohmann/json include.")
	}
	if !strings.Contains(harness, "cout << j.dump() << endl;") {
		t.Error("C++ harness is missing the JSON dump statement.")
	}
	if !strings.Contains(harness, "vector<string> items = {\"apple\", \"banana\", \"cherry\"};") {
		t.Error("C++ harness failed to correctly generate string vector.")
	}
	if !strings.Contains(harness, "// USER_CODE_START") {
		t.Error("C++ harness is missing USER_CODE_START marker.")
	}
	if !strings.Contains(harness, "// USER_CODE_END") {
		t.Error("C++ harness is missing USER_CODE_END marker.")
	}
	if !strings.Contains(harness, "nlohmann::json j = result;") {
		t.Error("C++ harness is missing JSON conversion statement.")
	}
}

// TestGenerateJavaSyntax checks the syntax of the generated Java harness.
func TestGenerateJavaSyntax(t *testing.T) {
	problem := setupComplexProblem(t)
	harness, err := GenerateTestHarness(problem, "java")
	if err != nil {
		t.Fatalf("Failed to generate Java harness: %v", err)
	}

	t.Log("\n=== Generated Java Code ===\n" + harness)

	// Basic validation
	if harness == "" {
		t.Error("Generated Java harness is empty.")
	}
	if !strings.Contains(harness, "import com.google.gson.Gson;") {
		t.Error("Java harness is missing Gson import.")
	}
	if !strings.Contains(harness, "System.out.println(gson.toJson(result));") {
		t.Error("Java harness is missing the Gson toJson print statement.")
	}
	if !strings.Contains(harness, "new String[]{\"apple\", \"banana\", \"cherry\"}") {
		t.Error("Java harness failed to correctly generate String array.")
	}
	if !strings.Contains(harness, "// USER_CODE_START") {
		t.Error("Java harness is missing USER_CODE_START marker.")
	}
	if !strings.Contains(harness, "// USER_CODE_END") {
		t.Error("Java harness is missing USER_CODE_END marker.")
	}
	if !strings.Contains(harness, "class Solution") {
		t.Error("Java harness is missing Solution class.")
	}
	if !strings.Contains(harness, "public class Main") {
		t.Error("Java harness is missing Main class.")
	}
}

// TestGenerateCppTwoSum tests the C++ harness with TwoSum problem
func TestGenerateCppTwoSum(t *testing.T) {
	problem := setupSimpleProblem()
	harness, err := GenerateTestHarness(problem, "cpp")
	if err != nil {
		t.Fatalf("Failed to generate C++ harness: %v", err)
	}

	t.Log("\n=== Generated C++ Code (TwoSum) ===\n" + harness)

	// Validate int array generation
	if !strings.Contains(harness, "vector<int> nums = {1, 2, 3, 4, 5};") {
		t.Error("C++ harness failed to correctly generate int vector.")
	}
	if !strings.Contains(harness, "int target = 9;") {
		t.Error("C++ harness failed to correctly generate int variable.")
	}
}

// TestGenerateJavaTwoSum tests the Java harness with TwoSum problem
func TestGenerateJavaTwoSum(t *testing.T) {
	problem := setupSimpleProblem()
	harness, err := GenerateTestHarness(problem, "java")
	if err != nil {
		t.Fatalf("Failed to generate Java harness: %v", err)
	}

	t.Log("\n=== Generated Java Code (TwoSum) ===\n" + harness)

	// Validate int array generation
	if !strings.Contains(harness, "new int[]{1, 2, 3, 4, 5}") {
		t.Error("Java harness failed to correctly generate int array.")
	}
	if !strings.Contains(harness, "int target = 9;") {
		t.Error("Java harness failed to correctly generate int variable.")
	}
}

// TestGeneratePythonTwoSum tests the Python harness with TwoSum problem
func TestGeneratePythonTwoSum(t *testing.T) {
	problem := setupSimpleProblem()
	harness, err := GenerateTestHarness(problem, "python")
	if err != nil {
		t.Fatalf("Failed to generate Python harness: %v", err)
	}

	t.Log("\n=== Generated Python Code (TwoSum) ===\n" + harness)

	// Validate list generation
	if !strings.Contains(harness, "nums = [1, 2, 3, 4, 5]") {
		t.Error("Python harness failed to correctly generate list.")
	}
	if !strings.Contains(harness, "target = 9") {
		t.Error("Python harness failed to correctly generate int variable.")
	}
}
