package generator

import (
	"strings"
)

// InjectUserCode replaces STUDENT_CODE_HERE placeholder with actual user code
// SIMPLIFIED: Extracts function body if user submits complete function with signature
// Replaces the entire line containing the placeholder with student code
func InjectUserCode(harness string, userCode string, language string) string {
	placeholder := ""

	switch language {
	case "python":
		placeholder = "# STUDENT_CODE_HERE"
		// For Python, if user code starts with "def ", extract only the body
		userCode = extractPythonFunctionBody(userCode)
	case "cpp", "java":
		placeholder = "// STUDENT_CODE_HERE"
		// For C++/Java, if user code has method signature, extract only the body
		userCode = extractMethodBody(userCode, language)
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

// extractMethodBody extracts the body from a complete method/function declaration
// E.g., for Java/C++: "public void foo() { body }" -> "body"
func extractMethodBody(code string, language string) string {
	code = strings.TrimSpace(code)

	// Find first opening brace
	braceIdx := strings.Index(code, "{")
	if braceIdx == -1 {
		// No braces found, return as-is (already just body)
		return code
	}

	// Extract everything after first { and before last }
	lastBraceIdx := strings.LastIndex(code, "}")
	if lastBraceIdx == -1 {
		lastBraceIdx = len(code)
	}

	body := code[braceIdx+1 : lastBraceIdx]
	return strings.TrimSpace(body)
}

// extractPythonFunctionBody extracts the body from a Python function definition
// E.g., "def foo():\n    body" -> "body"
func extractPythonFunctionBody(code string) string {
	code = strings.TrimSpace(code)
	lines := strings.Split(code, "\n")

	// Check if first line is a function definition
	if len(lines) == 0 || !strings.HasPrefix(strings.TrimSpace(lines[0]), "def ") {
		// Not a function definition, return as-is
		return code
	}

	// Skip the def line and extract the body
	if len(lines) <= 1 {
		return ""
	}

	// Get body lines (skip first line with "def")
	bodyLines := lines[1:]

	// Remove common indentation from body
	return dedent(strings.Join(bodyLines, "\n"))
}

// dedent removes common leading whitespace from all lines
func dedent(code string) string {
	lines := strings.Split(code, "\n")
	if len(lines) == 0 {
		return code
	}

	// Find minimum indentation (excluding empty lines)
	minIndent := -1
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		indent := len(line) - len(strings.TrimLeft(line, " \t"))
		if minIndent == -1 || indent < minIndent {
			minIndent = indent
		}
	}

	if minIndent <= 0 {
		return code
	}

	// Remove common indentation
	for i, line := range lines {
		if strings.TrimSpace(line) != "" && len(line) >= minIndent {
			lines[i] = line[minIndent:]
		}
	}

	return strings.Join(lines, "\n")
}
