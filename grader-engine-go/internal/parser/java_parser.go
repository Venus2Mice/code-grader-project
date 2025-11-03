package parser

import (
	"fmt"
	"regexp"
	"strings"
)

// JavaParser parses Java code
type JavaParser struct{}

// Parse extracts components from Java code
func (p *JavaParser) Parse(sourceCode string) (*ParsedCode, error) {
	parsed := &ParsedCode{
		Language:     "java",
		Imports:      []string{},
		Functions:    []FunctionDef{},
		OriginalCode: sourceCode,
	}

	lines := strings.Split(sourceCode, "\n")

	// Extract imports
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "import ") {
			parsed.Imports = append(parsed.Imports, trimmed)
		}
	}

	// Extract methods (Java functions are methods in classes)
	methods, err := p.extractJavaMethods(sourceCode)
	if err != nil {
		return nil, err
	}
	parsed.Functions = methods

	// Extract main method
	mainMethod := p.extractMainMethod(sourceCode)
	parsed.MainBlock = mainMethod

	return parsed, nil
}

// extractJavaMethods finds all method definitions in Java code
// Handles: public/private/protected returnType methodName(params) { ... }
func (p *JavaParser) extractJavaMethods(sourceCode string) ([]FunctionDef, error) {
	methods := []FunctionDef{}

	// Remove comments
	sourceCode = p.removeComments(sourceCode)

	// Regex to match method definitions
	// Matches: [modifiers] returnType methodName(params) {
	methodRegex := regexp.MustCompile(`\b(public|private|protected)?\s*(static)?\s*(\w+(?:<[^>]+>)?(?:\[\])*)\s+(\w+)\s*\(([^)]*)\)\s*\{`)

	matches := methodRegex.FindAllStringSubmatchIndex(sourceCode, -1)

	for _, match := range matches {
		returnType := strings.TrimSpace(sourceCode[match[6]:match[7]])
		methodName := sourceCode[match[8]:match[9]]
		paramsStr := sourceCode[match[10]:match[11]]

		// Skip main method
		if methodName == "main" {
			continue
		}

		// Parse parameters
		paramTypes, paramNames := p.parseParameters(paramsStr)

		// Extract method body
		startIdx := match[0]
		endIdx := p.findMethodEnd(sourceCode, match[1])
		body := sourceCode[startIdx:endIdx]

		methods = append(methods, FunctionDef{
			Name:       methodName,
			ReturnType: p.normalizeType(returnType),
			ParamTypes: paramTypes,
			ParamNames: paramNames,
			Body:       body,
			StartLine:  0,
			EndLine:    0,
		})
	}

	return methods, nil
}

// removeComments removes Java comments
func (p *JavaParser) removeComments(code string) string {
	// Remove single-line comments
	singleLineRegex := regexp.MustCompile(`//[^\n]*`)
	code = singleLineRegex.ReplaceAllString(code, "")

	// Remove multi-line comments
	multiLineRegex := regexp.MustCompile(`/\*[\s\S]*?\*/`)
	code = multiLineRegex.ReplaceAllString(code, "")

	return code
}

// parseParameters parses Java method parameters
// Example: "int a, int[] nums, int target" -> (["int", "int[]", "int"], ["a", "nums", "target"])
func (p *JavaParser) parseParameters(paramsStr string) ([]string, []string) {
	paramsStr = strings.TrimSpace(paramsStr)
	if paramsStr == "" {
		return []string{}, []string{}
	}

	paramTypes := []string{}
	paramNames := []string{}

	// Split by comma (respecting angle brackets for generics)
	params := p.smartSplit(paramsStr, ',')

	for _, param := range params {
		param = strings.TrimSpace(param)
		if param == "" {
			continue
		}

		// Parse: "Type name" or "Type[] name" or "List<Type> name"
		parts := strings.Fields(param)
		if len(parts) >= 2 {
			// Last part is the name, everything else is the type
			name := parts[len(parts)-1]
			typeStr := strings.Join(parts[:len(parts)-1], " ")

			paramNames = append(paramNames, name)
			paramTypes = append(paramTypes, p.normalizeType(typeStr))
		} else if len(parts) == 1 {
			// Just type, no name
			paramNames = append(paramNames, "param"+fmt.Sprint(len(paramNames)))
			paramTypes = append(paramTypes, p.normalizeType(parts[0]))
		}
	}

	return paramTypes, paramNames
}

// smartSplit splits by delimiter but respects angle brackets
func (p *JavaParser) smartSplit(s string, delim rune) []string {
	result := []string{}
	current := ""
	depth := 0

	for _, ch := range s {
		if ch == '<' || ch == '(' {
			depth++
		} else if ch == '>' || ch == ')' {
			depth--
		}

		if ch == delim && depth == 0 {
			result = append(result, current)
			current = ""
		} else {
			current += string(ch)
		}
	}

	if current != "" {
		result = append(result, current)
	}

	return result
}

// normalizeType converts Java types to standard format
// int[] -> int[], List<Integer> -> int[], etc.
func (p *JavaParser) normalizeType(typeStr string) string {
	typeStr = strings.TrimSpace(typeStr)

	// Handle arrays: int[] -> int[]
	if strings.HasSuffix(typeStr, "[]") {
		baseType := typeStr[:len(typeStr)-2]
		return p.normalizeType(baseType) + "[]"
	}

	// Handle List<T> -> T[]
	if strings.HasPrefix(typeStr, "List<") || strings.HasPrefix(typeStr, "ArrayList<") {
		startIdx := strings.Index(typeStr, "<")
		inner := typeStr[startIdx+1 : len(typeStr)-1]
		innerNormalized := p.normalizeType(inner)
		return innerNormalized + "[]"
	}

	// Handle wrapper types
	typeMap := map[string]string{
		"int":       "int",
		"Integer":   "int",
		"long":      "long",
		"Long":      "long",
		"double":    "double",
		"Double":    "double",
		"float":     "float",
		"Float":     "float",
		"boolean":   "bool",
		"Boolean":   "bool",
		"char":      "char",
		"Character": "char",
		"String":    "string",
		"void":      "void",
	}

	if normalized, ok := typeMap[typeStr]; ok {
		return normalized
	}

	return typeStr
}

// findMethodEnd finds the closing brace of a method
func (p *JavaParser) findMethodEnd(sourceCode string, startIdx int) int {
	depth := 0
	inString := false
	inChar := false
	escapeNext := false

	for i := startIdx; i < len(sourceCode); i++ {
		ch := sourceCode[i]

		if escapeNext {
			escapeNext = false
			continue
		}

		if ch == '\\' {
			escapeNext = true
			continue
		}

		if ch == '"' && !inChar {
			inString = !inString
			continue
		}

		if ch == '\'' && !inString {
			inChar = !inChar
			continue
		}

		if inString || inChar {
			continue
		}

		if ch == '{' {
			depth++
		} else if ch == '}' {
			depth--
			if depth == 0 {
				return i + 1
			}
		}
	}

	return len(sourceCode)
}

// extractMainMethod extracts the main method if present
func (p *JavaParser) extractMainMethod(sourceCode string) string {
	mainRegex := regexp.MustCompile(`public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+\w+\s*\)\s*\{`)
	match := mainRegex.FindStringIndex(sourceCode)

	if match != nil {
		startIdx := match[0]
		endIdx := p.findMethodEnd(sourceCode, match[1])
		return sourceCode[startIdx:endIdx]
	}

	return ""
}

// MatchFunction finds a method matching the expected signature
func (p *JavaParser) MatchFunction(parsed *ParsedCode, expectedReturnType string, expectedParamTypes []string) (*FunctionDef, error) {
	normalizedExpectedReturn := p.normalizeType(expectedReturnType)
	normalizedExpectedParams := make([]string, len(expectedParamTypes))
	for i, pt := range expectedParamTypes {
		normalizedExpectedParams[i] = p.normalizeType(pt)
	}

	for i := range parsed.Functions {
		fn := &parsed.Functions[i]

		// Check if parameter count matches
		if len(fn.ParamTypes) != len(normalizedExpectedParams) {
			continue
		}

		// Check if parameter types match
		paramsMatch := true
		for j := 0; j < len(fn.ParamTypes); j++ {
			if fn.ParamTypes[j] != normalizedExpectedParams[j] {
				paramsMatch = false
				break
			}
		}

		if !paramsMatch {
			continue
		}

		// Check return type
		if fn.ReturnType != normalizedExpectedReturn {
			continue
		}

		// Found a match!
		return fn, nil
	}

	return nil, fmt.Errorf("no method found matching signature: %s (%v). Found methods: %s",
		normalizedExpectedReturn, normalizedExpectedParams, p.formatFoundMethods(parsed.Functions))
}

// formatFoundMethods creates a readable string of found methods
func (p *JavaParser) formatFoundMethods(methods []FunctionDef) string {
	if len(methods) == 0 {
		return "none"
	}

	result := []string{}
	for _, fn := range methods {
		result = append(result, fmt.Sprintf("%s %s(%v)", fn.ReturnType, fn.Name, fn.ParamTypes))
	}
	return strings.Join(result, ", ")
}

// ExtractFunctionBody extracts just the method body
func (p *JavaParser) ExtractFunctionBody(funcDef *FunctionDef) string {
	return funcDef.Body
}
