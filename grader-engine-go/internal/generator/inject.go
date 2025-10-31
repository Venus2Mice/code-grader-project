package generator

import (
	"strings"
)

// InjectUserCode replaces STUDENT_CODE_HERE placeholder with actual user code
// SIMPLIFIED: No longer detects complete functions vs bodies
// Replaces the entire line containing the placeholder with student code
func InjectUserCode(harness string, userCode string, language string) string {
	placeholder := ""

	switch language {
	case "python":
		placeholder = "# STUDENT_CODE_HERE"
	case "cpp", "java":
		placeholder = "// STUDENT_CODE_HERE"
	default:
		return harness
	}

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

// getIndentation extracts leading whitespace from a line
func getIndentation(line string) string {
	for i, char := range line {
		if char != ' ' && char != '\t' {
			return line[:i]
		}
	}
	return ""
}

// indentCode adds indentation to each line of code
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
