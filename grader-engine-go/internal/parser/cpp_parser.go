package parser

import (
	"fmt"
	"regexp"
	"strings"
)

// CppParser parses C++ code
type CppParser struct{}

// Parse extracts components from C++ code
func (p *CppParser) Parse(sourceCode string) (*ParsedCode, error) {
	parsed := &ParsedCode{
		Language:     "cpp",
		Imports:      []string{},
		Functions:    []FunctionDef{},
		OriginalCode: sourceCode,
	}

	lines := strings.Split(sourceCode, "\n")

	// Extract includes
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "#include") {
			parsed.Imports = append(parsed.Imports, trimmed)
		}
	}

	// Extract functions
	functions, err := p.extractCppFunctions(sourceCode)
	if err != nil {
		return nil, err
	}
	parsed.Functions = functions

	// Extract main function
	mainFunc := p.extractMainFunction(sourceCode)
	parsed.MainBlock = mainFunc

	return parsed, nil
}

// extractCppFunctions finds all function definitions
// Handles: returnType functionName(type1 param1, type2 param2) { ... }
func (p *CppParser) extractCppFunctions(sourceCode string) ([]FunctionDef, error) {
	functions := []FunctionDef{}

	// Remove comments first
	sourceCode = p.removeComments(sourceCode)

	// Regex to match function definitions
	// Matches: returnType functionName(params) {
	funcDefRegex := regexp.MustCompile(`\b(\w+(?:<[^>]+>)?(?:\s*&)?)\s+(\w+)\s*\(([^)]*)\)\s*\{`)

	matches := funcDefRegex.FindAllStringSubmatchIndex(sourceCode, -1)

	for _, match := range matches {
		returnType := sourceCode[match[2]:match[3]]
		funcName := sourceCode[match[4]:match[5]]
		paramsStr := sourceCode[match[6]:match[7]]

		// Skip main function
		if funcName == "main" {
			continue
		}

		// Parse parameters
		paramTypes, paramNames := p.parseParameters(paramsStr)

		// Extract function body
		startIdx := match[0]
		endIdx := p.findFunctionEnd(sourceCode, match[1])
		body := sourceCode[startIdx:endIdx]

		functions = append(functions, FunctionDef{
			Name:       funcName,
			ReturnType: p.normalizeType(returnType),
			ParamTypes: paramTypes,
			ParamNames: paramNames,
			Body:       body,
			StartLine:  0, // We'd need to count lines to get accurate line numbers
			EndLine:    0,
		})
	}

	return functions, nil
}

// removeComments removes C++ comments
func (p *CppParser) removeComments(code string) string {
	// Remove single-line comments
	singleLineRegex := regexp.MustCompile(`//[^\n]*`)
	code = singleLineRegex.ReplaceAllString(code, "")

	// Remove multi-line comments
	multiLineRegex := regexp.MustCompile(`/\*[\s\S]*?\*/`)
	code = multiLineRegex.ReplaceAllString(code, "")

	return code
}

// parseParameters parses C++ function parameters
// Example: "int a, vector<int>& nums, int target" -> (["int", "int[]", "int"], ["a", "nums", "target"])
func (p *CppParser) parseParameters(paramsStr string) ([]string, []string) {
	paramsStr = strings.TrimSpace(paramsStr)
	if paramsStr == "" {
		return []string{}, []string{}
	}

	paramTypes := []string{}
	paramNames := []string{}

	// Split by comma (respecting angle brackets)
	params := p.smartSplit(paramsStr, ',')

	for _, param := range params {
		param = strings.TrimSpace(param)
		if param == "" {
			continue
		}

		// Parse: "type name" or "type& name" or "const type& name"
		parts := strings.Fields(param)
		if len(parts) >= 2 {
			// Last part is the name, everything else is the type
			name := parts[len(parts)-1]
			typeStr := strings.Join(parts[:len(parts)-1], " ")

			// Remove const, &, *, etc. for type normalization
			typeStr = strings.ReplaceAll(typeStr, "const", "")
			typeStr = strings.ReplaceAll(typeStr, "&", "")
			typeStr = strings.ReplaceAll(typeStr, "*", "")
			typeStr = strings.TrimSpace(typeStr)

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
func (p *CppParser) smartSplit(s string, delim rune) []string {
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

// normalizeType converts C++ types to standard format
// vector<int> -> int[], vector<vector<int>> -> int[][], etc.
func (p *CppParser) normalizeType(typeStr string) string {
	typeStr = strings.TrimSpace(typeStr)

	// Handle vector<T> -> T[]
	if strings.HasPrefix(typeStr, "vector<") {
		inner := typeStr[7 : len(typeStr)-1]
		innerNormalized := p.normalizeType(inner)
		return innerNormalized + "[]"
	}

	// Handle string
	if typeStr == "string" {
		return "string"
	}

	// Handle basic types
	typeMap := map[string]string{
		"int":    "int",
		"long":   "long",
		"float":  "float",
		"double": "double",
		"bool":   "bool",
		"char":   "char",
		"void":   "void",
	}

	if normalized, ok := typeMap[typeStr]; ok {
		return normalized
	}

	return typeStr
}

// findFunctionEnd finds the closing brace of a function
func (p *CppParser) findFunctionEnd(sourceCode string, startIdx int) int {
	depth := 0
	inString := false
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

		if ch == '"' || ch == '\'' {
			inString = !inString
			continue
		}

		if inString {
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

// extractMainFunction extracts the main function if present
func (p *CppParser) extractMainFunction(sourceCode string) string {
	mainRegex := regexp.MustCompile(`int\s+main\s*\([^)]*\)\s*\{`)
	match := mainRegex.FindStringIndex(sourceCode)

	if match != nil {
		startIdx := match[0]
		endIdx := p.findFunctionEnd(sourceCode, match[1])
		return sourceCode[startIdx:endIdx]
	}

	return ""
}

// MatchFunction finds a function matching the expected signature
func (p *CppParser) MatchFunction(parsed *ParsedCode, expectedReturnType string, expectedParamTypes []string) (*FunctionDef, error) {
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

	return nil, fmt.Errorf("no function found matching signature: %s (%v). Found functions: %s",
		normalizedExpectedReturn, normalizedExpectedParams, p.formatFoundFunctions(parsed.Functions))
}

// formatFoundFunctions creates a readable string of found functions
func (p *CppParser) formatFoundFunctions(functions []FunctionDef) string {
	if len(functions) == 0 {
		return "none"
	}

	result := []string{}
	for _, fn := range functions {
		result = append(result, fmt.Sprintf("%s %s(%v)", fn.ReturnType, fn.Name, fn.ParamTypes))
	}
	return strings.Join(result, ", ")
}

// ExtractFunctionBody extracts just the function body
func (p *CppParser) ExtractFunctionBody(funcDef *FunctionDef) string {
	return funcDef.Body
}
