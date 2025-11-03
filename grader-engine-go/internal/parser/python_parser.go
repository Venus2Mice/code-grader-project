package parser

import (
	"fmt"
	"regexp"
	"strings"
)

// PythonParser parses Python code
type PythonParser struct{}

// Parse extracts components from Python code
func (p *PythonParser) Parse(sourceCode string) (*ParsedCode, error) {
	parsed := &ParsedCode{
		Language:     "python",
		Imports:      []string{},
		Functions:    []FunctionDef{},
		OriginalCode: sourceCode,
	}

	lines := strings.Split(sourceCode, "\n")

	// Extract imports
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "import ") || strings.HasPrefix(trimmed, "from ") {
			parsed.Imports = append(parsed.Imports, trimmed)
		}
	}

	// Extract functions
	functions, err := p.extractPythonFunctions(sourceCode)
	if err != nil {
		return nil, err
	}
	parsed.Functions = functions

	// Extract main block (if __name__ == "__main__":)
	mainBlock := p.extractMainBlock(sourceCode)
	parsed.MainBlock = mainBlock

	return parsed, nil
}

// extractPythonFunctions finds all function definitions in Python code
func (p *PythonParser) extractPythonFunctions(sourceCode string) ([]FunctionDef, error) {
	functions := []FunctionDef{}
	lines := strings.Split(sourceCode, "\n")

	// Regex to match: def functionName(param1: type1, param2: type2) -> returnType:
	// Also handles: def functionName(param1, param2):
	funcDefRegex := regexp.MustCompile(`^\s*def\s+(\w+)\s*\((.*?)\)\s*(?:->\s*(.+?))?\s*:`)

	i := 0
	for i < len(lines) {
		line := lines[i]
		matches := funcDefRegex.FindStringSubmatch(line)

		if matches != nil {
			funcName := matches[1]
			paramsStr := matches[2]
			returnTypeStr := matches[3] // may be empty

			// Skip if this is inside main block
			if strings.Contains(sourceCode[:strings.Index(sourceCode, line)], "if __name__") {
				i++
				continue
			}

			// Parse parameters
			paramTypes, paramNames := p.parseParameters(paramsStr)

			// Parse return type
			returnType := strings.TrimSpace(returnTypeStr)
			if returnType == "" {
				returnType = "void" // No type annotation
			}

			// Extract function body
			startLine := i
			endLine := p.findFunctionEnd(lines, i)

			// Build function body
			bodyLines := []string{}
			for j := startLine; j <= endLine && j < len(lines); j++ {
				bodyLines = append(bodyLines, lines[j])
			}
			body := strings.Join(bodyLines, "\n")

			functions = append(functions, FunctionDef{
				Name:       funcName,
				ReturnType: p.normalizeType(returnType),
				ParamTypes: paramTypes,
				ParamNames: paramNames,
				Body:       body,
				StartLine:  startLine,
				EndLine:    endLine,
			})

			i = endLine + 1
		} else {
			i++
		}
	}

	return functions, nil
}

// parseParameters parses Python function parameters
// Examples: "a: int, b: int" -> (["int", "int"], ["a", "b"])
//
//	"nums: List[int], target: int" -> (["int[]", "int"], ["nums", "target"])
//	"a, b" -> (["any", "any"], ["a", "b"]) - no type hints
func (p *PythonParser) parseParameters(paramsStr string) ([]string, []string) {
	paramsStr = strings.TrimSpace(paramsStr)
	if paramsStr == "" {
		return []string{}, []string{}
	}

	paramTypes := []string{}
	paramNames := []string{}

	// Split by comma (but be careful with nested types like List[int])
	params := p.smartSplit(paramsStr, ',')

	for _, param := range params {
		param = strings.TrimSpace(param)
		if param == "" {
			continue
		}

		// Check if has type annotation: "name: type"
		if strings.Contains(param, ":") {
			parts := strings.SplitN(param, ":", 2)
			name := strings.TrimSpace(parts[0])
			typeStr := strings.TrimSpace(parts[1])

			paramNames = append(paramNames, name)
			paramTypes = append(paramTypes, p.normalizeType(typeStr))
		} else {
			// No type annotation
			paramNames = append(paramNames, param)
			paramTypes = append(paramTypes, "any")
		}
	}

	return paramTypes, paramNames
}

// smartSplit splits by delimiter but respects brackets
func (p *PythonParser) smartSplit(s string, delim rune) []string {
	result := []string{}
	current := ""
	depth := 0

	for _, ch := range s {
		if ch == '[' || ch == '(' {
			depth++
		} else if ch == ']' || ch == ')' {
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

// normalizeType converts Python types to standard format
// List[int] -> int[], Dict[str, int] -> map<string,int>, etc.
func (p *PythonParser) normalizeType(typeStr string) string {
	typeStr = strings.TrimSpace(typeStr)

	// Handle List[T] -> T[]
	if strings.HasPrefix(typeStr, "List[") || strings.HasPrefix(typeStr, "list[") {
		inner := typeStr[5 : len(typeStr)-1]
		innerNormalized := p.normalizeType(inner)
		return innerNormalized + "[]"
	}

	// Handle basic types
	typeMap := map[string]string{
		"int":   "int",
		"float": "double",
		"str":   "string",
		"bool":  "bool",
		"None":  "void",
	}

	if normalized, ok := typeMap[typeStr]; ok {
		return normalized
	}

	return typeStr
}

// findFunctionEnd finds where a Python function ends (based on indentation)
func (p *PythonParser) findFunctionEnd(lines []string, startLine int) int {
	if startLine >= len(lines) {
		return startLine
	}

	// Get indentation of function definition
	defLine := lines[startLine]
	defIndent := len(defLine) - len(strings.TrimLeft(defLine, " \t"))

	// Find where indentation returns to same or less level
	for i := startLine + 1; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)

		// Skip empty lines and comments
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		// Check indentation
		lineIndent := len(line) - len(strings.TrimLeft(line, " \t"))

		// If we hit a line with same or less indentation, function ended
		if lineIndent <= defIndent {
			return i - 1
		}
	}

	return len(lines) - 1
}

// extractMainBlock extracts the if __name__ == "__main__": block
func (p *PythonParser) extractMainBlock(sourceCode string) string {
	lines := strings.Split(sourceCode, "\n")

	for i, line := range lines {
		if strings.Contains(line, `if __name__`) && strings.Contains(line, `"__main__"`) {
			// Found main block, extract until end
			mainLines := []string{}
			for j := i; j < len(lines); j++ {
				mainLines = append(mainLines, lines[j])
			}
			return strings.Join(mainLines, "\n")
		}
	}

	return ""
}

// MatchFunction finds a function matching the expected signature
func (p *PythonParser) MatchFunction(parsed *ParsedCode, expectedReturnType string, expectedParamTypes []string) (*FunctionDef, error) {
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

		// Check if parameter types match (allow "any" to match anything)
		paramsMatch := true
		for j := 0; j < len(fn.ParamTypes); j++ {
			if fn.ParamTypes[j] != "any" && fn.ParamTypes[j] != normalizedExpectedParams[j] {
				paramsMatch = false
				break
			}
		}

		if !paramsMatch {
			continue
		}

		// Check return type (allow "void" or missing annotation to match anything)
		if fn.ReturnType != "void" && fn.ReturnType != normalizedExpectedReturn {
			continue
		}

		// Found a match!
		return fn, nil
	}

	return nil, fmt.Errorf("no function found matching signature: (%v) -> %s. Found functions: %s",
		normalizedExpectedParams, normalizedExpectedReturn, p.formatFoundFunctions(parsed.Functions))
}

// formatFoundFunctions creates a readable string of found functions for error messages
func (p *PythonParser) formatFoundFunctions(functions []FunctionDef) string {
	if len(functions) == 0 {
		return "none"
	}

	result := []string{}
	for _, fn := range functions {
		result = append(result, fmt.Sprintf("%s(%v) -> %s", fn.Name, fn.ParamTypes, fn.ReturnType))
	}
	return strings.Join(result, ", ")
}

// ExtractFunctionBody extracts just the function body for injection
func (p *PythonParser) ExtractFunctionBody(funcDef *FunctionDef) string {
	return funcDef.Body
}
