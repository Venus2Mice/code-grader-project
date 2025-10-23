package parser

import (
	"testing"
)

func TestParsePythonSignature(t *testing.T) {
	tests := []struct {
		name           string
		signature      string
		expectedFunc   string
		expectedReturn string
		paramCount     int
	}{
		{
			name:           "Two Sum",
			signature:      "def twoSum(nums: List[int], target: int) -> List[int]:",
			expectedFunc:   "twoSum",
			expectedReturn: "List[int]",
			paramCount:     2,
		},
		{
			name:           "Simple Add",
			signature:      "def add(a: int, b: int) -> int:",
			expectedFunc:   "add",
			expectedReturn: "int",
			paramCount:     2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sig, err := ParseSignature(tt.signature, "python")
			if err != nil {
				t.Fatalf("ParseSignature() error = %v", err)
			}
			if sig.FunctionName != tt.expectedFunc {
				t.Errorf("FunctionName = %v, want %v", sig.FunctionName, tt.expectedFunc)
			}
			if sig.ReturnType != tt.expectedReturn {
				t.Errorf("ReturnType = %v, want %v", sig.ReturnType, tt.expectedReturn)
			}
			if len(sig.Parameters) != tt.paramCount {
				t.Errorf("Parameter count = %v, want %v", len(sig.Parameters), tt.paramCount)
			}
		})
	}
}

func TestParseCppSignature(t *testing.T) {
	tests := []struct {
		name           string
		signature      string
		expectedFunc   string
		expectedReturn string
		paramCount     int
	}{
		{
			name:           "Two Sum",
			signature:      "vector<int> twoSum(vector<int>& nums, int target)",
			expectedFunc:   "twoSum",
			expectedReturn: "vector<int>",
			paramCount:     2,
		},
		{
			name:           "Simple Add",
			signature:      "int add(int a, int b)",
			expectedFunc:   "add",
			expectedReturn: "int",
			paramCount:     2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sig, err := ParseSignature(tt.signature, "cpp")
			if err != nil {
				t.Fatalf("ParseSignature() error = %v", err)
			}
			if sig.FunctionName != tt.expectedFunc {
				t.Errorf("FunctionName = %v, want %v", sig.FunctionName, tt.expectedFunc)
			}
			if sig.ReturnType != tt.expectedReturn {
				t.Errorf("ReturnType = %v, want %v", sig.ReturnType, tt.expectedReturn)
			}
			if len(sig.Parameters) != tt.paramCount {
				t.Errorf("Parameter count = %v, want %v", len(sig.Parameters), tt.paramCount)
			}
		})
	}
}

func TestParseJavaSignature(t *testing.T) {
	tests := []struct {
		name           string
		signature      string
		expectedFunc   string
		expectedReturn string
		paramCount     int
	}{
		{
			name:           "Two Sum",
			signature:      "public int[] twoSum(int[] nums, int target)",
			expectedFunc:   "twoSum",
			expectedReturn: "int[]",
			paramCount:     2,
		},
		{
			name:           "Simple Add",
			signature:      "public int add(int a, int b)",
			expectedFunc:   "add",
			expectedReturn: "int",
			paramCount:     2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sig, err := ParseSignature(tt.signature, "java")
			if err != nil {
				t.Fatalf("ParseSignature() error = %v", err)
			}
			if sig.FunctionName != tt.expectedFunc {
				t.Errorf("FunctionName = %v, want %v", sig.FunctionName, tt.expectedFunc)
			}
			if sig.ReturnType != tt.expectedReturn {
				t.Errorf("ReturnType = %v, want %v", sig.ReturnType, tt.expectedReturn)
			}
			if len(sig.Parameters) != tt.paramCount {
				t.Errorf("Parameter count = %v, want %v", len(sig.Parameters), tt.paramCount)
			}
		})
	}
}

func TestTypeToGeneric(t *testing.T) {
	tests := []struct {
		name     string
		langType string
		language string
		expected string
	}{
		{"Python List[int]", "List[int]", "python", "int[]"},
		{"C++ vector<int>", "vector<int>", "cpp", "int[]"},
		{"Java int[]", "int[]", "java", "int[]"},
		{"Python int", "int", "python", "int"},
		{"C++ int", "int", "cpp", "int"},
		{"Java int", "int", "java", "int"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TypeToGeneric(tt.langType, tt.language)
			if result != tt.expected {
				t.Errorf("TypeToGeneric() = %v, want %v", result, tt.expected)
			}
		})
	}
}
