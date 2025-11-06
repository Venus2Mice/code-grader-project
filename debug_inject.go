package main

import (
	"fmt"
	"strings"
)

func main() {
	harness := `import java.util.*;
import com.google.gson.Gson;

class Solution {
    // USER_CODE_START
    public void reverseString(char[] s) {
        // STUDENT_CODE_HERE
    }
    // USER_CODE_END

    public static void main(String[] args) {
        Solution solution = new Solution();
    }
}`

	userCode := `int left = 0, right = s.length - 1;
        while (left < right) {
            char temp = s[left];
            s[left++] = s[right];
            s[right--] = temp;
        }`

	result := injectUserCode(harness, userCode, "java")
	fmt.Println("=== RESULT ===")
	fmt.Println(result)
}

func injectUserCode(harness string, userCode string, language string) string {
	placeholder := "// STUDENT_CODE_HERE"

	// Find and replace the placeholder line
	lines := strings.Split(harness, "\n")
	for i, line := range lines {
		if strings.Contains(line, placeholder) {
			// Get indentation from placeholder line
			indent := getIndentation(line)

			// Indent user code to match
			indentedCode := indentCode(strings.TrimSpace(userCode), indent)

			// Replace entire placeholder line with indented user code
			lines[i] = indentedCode
			break
		}
	}

	return strings.Join(lines, "\n")
}

func getIndentation(line string) string {
	for i, char := range line {
		if char != ' ' && char != '\t' {
			return line[:i]
		}
	}
	return ""
}

func indentCode(code string, indent string) string {
	lines := strings.Split(code, "\n")
	for i, line := range lines {
		if strings.TrimSpace(line) != "" {
			lines[i] = indent + line
		} else {
			lines[i] = "" // Keep empty lines empty
		}
	}
	return strings.Join(lines, "\n")
}
