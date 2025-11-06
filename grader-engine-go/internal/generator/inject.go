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
		originalCode := userCode
		userCode = extractMethodBody(userCode, language)
		// DEBUG: Log if extraction happened
		if originalCode != userCode {
			// log.Printf("DEBUG: Extracted method body (length %d -> %d)", len(originalCode), len(userCode))
		}
	default:
		return harness
	}

	// Find and replace the placeholder line
	lines := strings.Split(harness, "\n")
	found := false
	for i, line := range lines {
		if strings.Contains(line, placeholder) {
			// Get indentation from placeholder line
			indent := getIndentation(line)

			// Indent user code to match
			indentedCode := indentCode(strings.TrimSpace(userCode), indent)

			// Replace entire placeholder line with indented user code
			lines[i] = indentedCode
			found = true
			break
		}
	}

	if !found {
		// Placeholder not found - this is a problem!
		// Return harness as-is but log warning would be here
		// For now, just return unchanged
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
// If code is already just a body (no method signature), return as-is
func extractMethodBody(code string, language string) string {
	code = strings.TrimSpace(code)

	// CRITICAL: Must distinguish between:
	// 1. Method signature: "public void foo(int x) { body }"
	// 2. Body code with control structures: "int x = 0; while (...) { ... }"

	// A method signature MUST have:
	// - Return type or visibility keyword at the START
	// - Method name followed by (...)
	// - Opening { after the ) with NO semicolon before the (

	// Find opening parenthesis and brace
	parenIdx := strings.Index(code, "(")
	braceIdx := strings.Index(code, "{")

	// If no braces, definitely just body
	if braceIdx == -1 {
		return code
	}

	// If no parenthesis, this is just body code
	if parenIdx == -1 {
		return code
	}

	// If parenthesis comes after brace, this is body code (e.g., "x = foo(); if (x) { }")
	if parenIdx > braceIdx {
		return code
	}

	// Check if there's a closing paren between opening paren and brace
	codeBeforeBrace := code[:braceIdx]
	closeParenIdx := strings.LastIndex(codeBeforeBrace, ")")

	// If pattern is NOT: ... ( ... ) ... { then it's just body
	if closeParenIdx <= parenIdx || closeParenIdx >= braceIdx {
		return code
	}

	// CRITICAL CHECK: If there's a semicolon BEFORE the first opening paren,
	// this is NOT a method signature. It's body code with statements.
	// E.g., "int x = 0; while (cond) { ... }"
	codeBeforeParen := code[:parenIdx]
	if strings.Contains(codeBeforeParen, ";") {
		return code // Has semicolon before paren → body code, not method signature
	}

	// Now check if this starts with method signature indicators
	// Get text before the opening parenthesis
	beforeParen := strings.TrimSpace(codeBeforeParen)

	// Method signatures start with visibility/modifier keywords or return types
	// Java/C++ method signature must have at least: returnType methodName
	// Check if first word is a known keyword
	keywords := []string{"public", "private", "protected", "static", "void", "int", "boolean", "String", "char", "double", "float", "long", "short", "byte"}

	firstWord := ""
	words := strings.Fields(beforeParen)
	if len(words) > 0 {
		firstWord = words[0]
	}

	// Check if first word is a method signature indicator
	isMethodSignature := false
	for _, keyword := range keywords {
		if firstWord == keyword {
			isMethodSignature = true
			break
		}
	}

	// Additional heuristic for C++: check if pattern is "type name" (2+ words before paren)
	if !isMethodSignature && language == "cpp" && len(words) >= 2 {
		// Could be: "int foo" or "void bar"
		// But NOT: "x.foo" or "foo->bar"
		if !strings.Contains(beforeParen, ".") && !strings.Contains(beforeParen, "->") {
			isMethodSignature = true
		}
	}

	if isMethodSignature {
		// Extract everything after first { and before last }
		lastBraceIdx := strings.LastIndex(code, "}")
		if lastBraceIdx == -1 {
			lastBraceIdx = len(code)
		}
		body := code[braceIdx+1 : lastBraceIdx]
		return strings.TrimSpace(body)
	}

	// Not a method signature, return as-is
	return code
} // extractPythonFunctionBody extracts the body from a Python function definition
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
