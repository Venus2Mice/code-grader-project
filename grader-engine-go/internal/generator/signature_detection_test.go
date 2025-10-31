package generator

import (
	"testing"
)

// TestDetectSignatureLanguage tests the auto-detection of signature language
func TestDetectSignatureLanguage(t *testing.T) {
	tests := []struct {
		name      string
		signature string
		expected  string
	}{
		{
			name:      "Python signature with def and arrow",
			signature: "def twoSum(nums: List[int], target: int) -> List[int]:",
			expected:  "python",
		},
		{
			name:      "Python signature without type hints",
			signature: "def calculate(x, y):",
			expected:  "python",
		},
		{
			name:      "C++ signature with return type first",
			signature: "bool isPalindrome(int x);",
			expected:  "cpp",
		},
		{
			name:      "C++ signature with vector",
			signature: "vector<int> twoSum(vector<int>& nums, int target)",
			expected:  "cpp",
		},
		{
			name:      "C++ signature with templates",
			signature: "vector<vector<int>> generate(int numRows)",
			expected:  "cpp",
		},
		{
			name:      "Java signature with public modifier",
			signature: "public int[] twoSum(int[] nums, int target)",
			expected:  "java",
		},
		{
			name:      "Java signature with private modifier",
			signature: "private boolean isValid(String s)",
			expected:  "java",
		},
		{
			name:      "Java signature with protected modifier",
			signature: "protected void reverseString(char[] s)",
			expected:  "java",
		},
		{
			name:      "Java signature with public static",
			signature: "public static String longestCommonPrefix(String[] strs)",
			expected:  "java",
		},
		{
			name:      "C++ signature with long long",
			signature: "long long factorial(int n)",
			expected:  "cpp",
		},
		{
			name:      "C++ signature with string",
			signature: "string reverseString(string s)",
			expected:  "cpp",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := detectSignatureLanguage(tt.signature)
			if result != tt.expected {
				t.Errorf("detectSignatureLanguage(%q) = %q, expected %q",
					tt.signature, result, tt.expected)
			}
		})
	}
}

// TestDetectSignatureLanguageEdgeCases tests edge cases
func TestDetectSignatureLanguageEdgeCases(t *testing.T) {
	tests := []struct {
		name      string
		signature string
		expected  string
	}{
		{
			name:      "Empty signature defaults to C++",
			signature: "",
			expected:  "cpp",
		},
		{
			name:      "Whitespace only defaults to C++",
			signature: "   ",
			expected:  "cpp",
		},
		{
			name:      "C++ with spaces around semicolon",
			signature: "int add(int a, int b) ; ",
			expected:  "cpp",
		},
		{
			name:      "Python with extra whitespace",
			signature: "  def  add(a: int, b: int) -> int:  ",
			expected:  "python",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := detectSignatureLanguage(tt.signature)
			if result != tt.expected {
				t.Errorf("detectSignatureLanguage(%q) = %q, expected %q",
					tt.signature, result, tt.expected)
			}
		})
	}
}
