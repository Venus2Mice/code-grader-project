package generator

import (
	"encoding/json"
	"strings"
	"testing"

	"grader-engine-go/internal/models"
)

func TestGenerateAndInjectFullFlow(t *testing.T) {
	// Create a problem similar to Two Sum
	problem := &models.Problem{
		FunctionName: "twoSum",
		TestCases: []models.TestCase{
			{
				Inputs: json.RawMessage(`[
					{"type": "int[]", "value": [2, 7, 11, 15]},
					{"type": "int", "value": 9}
				]`),
				ExpectedOutput: json.RawMessage(`{"type": "int[]", "value": [0, 1]}`),
			},
		},
	}

	studentCode := `seen = {}
for i, num in enumerate(param0):
    complement = param1 - num
    if complement in seen:
        return [seen[complement], i]
    seen[num] = i
return []`

	t.Run("Python full flow", func(t *testing.T) {
		// Generate harness
		harness, err := GenerateTestHarness(problem, "python")
		if err != nil {
			t.Fatalf("Failed to generate harness: %v", err)
		}

		// Check harness structure
		if !strings.Contains(harness, "def twoSum(param0: List[int], param1: int) -> List[int]:") {
			t.Error("Missing function signature")
		}
		if !strings.Contains(harness, "# STUDENT_CODE_HERE") {
			t.Error("Missing student code placeholder")
		}
		if !strings.Contains(harness, "result = twoSum(param0, param1)") {
			t.Error("Missing function call")
		}

		// Inject student code
		finalCode := InjectUserCode(harness, studentCode, "python")

		// Check injection
		if !strings.Contains(finalCode, "seen = {}") {
			t.Error("Student code not injected")
		}
		if strings.Contains(finalCode, "# STUDENT_CODE_HERE") {
			t.Error("Placeholder not replaced")
		}
		if !strings.Contains(finalCode, "    seen = {}") {
			t.Error("Indentation not preserved")
		}

		t.Logf("Generated harness:\n%s", harness)
		t.Logf("\nFinal code:\n%s", finalCode)
	})

	t.Run("C++ full flow", func(t *testing.T) {
		// Generate harness
		harness, err := GenerateTestHarness(problem, "cpp")
		if err != nil {
			t.Fatalf("Failed to generate harness: %v", err)
		}

		// Check harness structure
		if !strings.Contains(harness, "vector<int> twoSum(const vector<int>& param0, int param1)") {
			t.Error("Missing function signature")
		}
		if !strings.Contains(harness, "// STUDENT_CODE_HERE") {
			t.Error("Missing student code placeholder")
		}

		cppStudentCode := `unordered_map<int, int> seen;
for (int i = 0; i < param0.size(); i++) {
    int complement = param1 - param0[i];
    if (seen.count(complement)) {
        return {seen[complement], i};
    }
    seen[param0[i]] = i;
}
return {};`

		// Inject student code
		finalCode := InjectUserCode(harness, cppStudentCode, "cpp")

		// Check injection
		if !strings.Contains(finalCode, "unordered_map<int, int> seen;") {
			t.Error("Student code not injected")
		}

		t.Logf("Generated C++ harness:\n%s", harness)
	})

	t.Run("Java full flow", func(t *testing.T) {
		// Generate harness
		harness, err := GenerateTestHarness(problem, "java")
		if err != nil {
			t.Fatalf("Failed to generate harness: %v", err)
		}

		// Check harness structure
		if !strings.Contains(harness, "public int[] twoSum(int[] param0, int param1)") {
			t.Error("Missing function signature")
		}
		if !strings.Contains(harness, "// STUDENT_CODE_HERE") {
			t.Error("Missing student code placeholder")
		}

		javaStudentCode := `Map<Integer, Integer> seen = new HashMap<>();
for (int i = 0; i < param0.length; i++) {
    int complement = param1 - param0[i];
    if (seen.containsKey(complement)) {
        return new int[]{seen.get(complement), i};
    }
    seen.put(param0[i], i);
}
return new int[]{};`

		// Inject student code
		finalCode := InjectUserCode(harness, javaStudentCode, "java")

		// Check injection
		if !strings.Contains(finalCode, "Map<Integer, Integer> seen") {
			t.Error("Student code not injected")
		}

		t.Logf("Generated Java harness:\n%s", harness)
	})
}

func TestGenerateHarnessWithVoidReturn(t *testing.T) {
	problem := &models.Problem{
		FunctionName: "reverseString",
		TestCases: []models.TestCase{
			{
				Inputs: json.RawMessage(`[
					{"type": "string[]", "value": ["h","e","l","l","o"]}
				]`),
				ExpectedOutput: json.RawMessage(`{"type": "void", "value": null}`),
			},
		},
	}

	t.Run("Python void return", func(t *testing.T) {
		harness, err := GenerateTestHarness(problem, "python")
		if err != nil {
			t.Fatalf("Failed: %v", err)
		}

		if !strings.Contains(harness, "-> None:") {
			t.Error("Should have None return type")
		}
	})

	t.Run("C++ void return", func(t *testing.T) {
		harness, err := GenerateTestHarness(problem, "cpp")
		if err != nil {
			t.Fatalf("Failed: %v", err)
		}

		if !strings.Contains(harness, "void reverseString") {
			t.Error("Should have void return type")
		}
		if !strings.Contains(harness, "cout << \"null\"") {
			t.Error("Should output null for void functions")
		}
	})

	t.Run("Java void return", func(t *testing.T) {
		harness, err := GenerateTestHarness(problem, "java")
		if err != nil {
			t.Fatalf("Failed: %v", err)
		}

		if !strings.Contains(harness, "public void reverseString") {
			t.Error("Should have void return type")
		}
		if !strings.Contains(harness, "System.out.println(\"null\")") {
			t.Error("Should output null for void methods")
		}
	})
}
