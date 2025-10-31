package generator

import (
	"strings"
	"testing"
)

func TestInjectUserCode(t *testing.T) {
	tests := []struct {
		name     string
		harness  string
		userCode string
		language string
		want     string
	}{
		{
			name: "Python - simple return",
			harness: `def solution(param0: int) -> int:
    # STUDENT_CODE_HERE
    pass`,
			userCode: "return param0 * 2",
			language: "python",
			want: `def solution(param0: int) -> int:
    return param0 * 2
    pass`,
		},
		{
			name: "Python - multi-line code",
			harness: `def solution(param0: List[int]) -> int:
    # STUDENT_CODE_HERE
    pass`,
			userCode: `result = 0
for x in param0:
    result += x
return result`,
			language: "python",
			want: `def solution(param0: List[int]) -> int:
    result = 0
    for x in param0:
        result += x
    return result
    pass`,
		},
		{
			name: "C++ - simple return",
			harness: `int solution(int param0) {
    // STUDENT_CODE_HERE
    return 0;
}`,
			userCode: "return param0 * 2;",
			language: "cpp",
			want: `int solution(int param0) {
    return param0 * 2;
    return 0;
}`,
		},
		{
			name: "Java - simple return",
			harness: `    public int solution(int param0) {
        // STUDENT_CODE_HERE
        return 0;
    }`,
			userCode: "return param0 * 2;",
			language: "java",
			want: `    public int solution(int param0) {
        return param0 * 2;
        return 0;
    }`,
		},
		{
			name: "No placeholder - returns unchanged",
			harness: `def solution(x):
    return x`,
			userCode: "return x * 2",
			language: "python",
			want: `def solution(x):
    return x`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := InjectUserCode(tt.harness, tt.userCode, tt.language)
			if got != tt.want {
				t.Errorf("InjectUserCode() mismatch\nGot:\n%s\n\nWant:\n%s", got, tt.want)
			}
		})
	}
}

func TestGetIndentation(t *testing.T) {
	tests := []struct {
		line string
		want string
	}{
		{"    code", "    "},
		{"\t\tcode", "\t\t"},
		{"  \t  code", "  \t  "},
		{"no indent", ""},
	}

	for _, tt := range tests {
		t.Run(tt.line, func(t *testing.T) {
			got := getIndentation(tt.line)
			if got != tt.want {
				t.Errorf("getIndentation(%q) = %q, want %q", tt.line, got, tt.want)
			}
		})
	}
}

func TestIndentCode(t *testing.T) {
	tests := []struct {
		name   string
		code   string
		indent string
		want   string
	}{
		{
			name:   "single line",
			code:   "return x",
			indent: "    ",
			want:   "    return x",
		},
		{
			name:   "multi-line",
			code:   "x = 1\nreturn x",
			indent: "    ",
			want:   "    x = 1\n    return x",
		},
		{
			name:   "with empty lines",
			code:   "x = 1\n\nreturn x",
			indent: "    ",
			want:   "    x = 1\n\n    return x",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := indentCode(tt.code, tt.indent)
			if got != tt.want {
				t.Errorf("indentCode() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestInjectUserCodeWithRealHarness(t *testing.T) {
	// Test with actual generated harness structure
	pythonHarness := `import json
import sys
from typing import List, Optional, Any

# USER_CODE_START
def twoSum(param0: List[int], param1: int) -> List[int]:
    # STUDENT_CODE_HERE
    pass
# USER_CODE_END

if __name__ == "__main__":
    # Test case 1
    try:
        param0 = [2, 7, 11, 15]
        param1 = 9
        result = twoSum(param0, param1)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
`

	studentCode := `seen = {}
for i, num in enumerate(param0):
    complement = param1 - num
    if complement in seen:
        return [seen[complement], i]
    seen[num] = i
return []`

	result := InjectUserCode(pythonHarness, studentCode, "python")

	// Check that student code is injected
	if !strings.Contains(result, "seen = {}") {
		t.Error("Student code not injected")
	}

	// Check indentation is preserved
	if !strings.Contains(result, "    seen = {}") {
		t.Error("Indentation not preserved")
	}

	// Check original structure remains
	if !strings.Contains(result, "if __name__") {
		t.Error("Original harness structure lost")
	}
}
