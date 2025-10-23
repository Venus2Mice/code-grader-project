package parser

import (
	"fmt"
	"strings"
)

// ParameterInfo represents a function parameter
type ParameterInfo struct {
	Name string
	Type string
}

// FunctionSignature represents parsed function information
type FunctionSignature struct {
	FunctionName string
	Parameters   []ParameterInfo
	ReturnType   string
	Language     string
}

// ParseSignature extracts function information from signature string
func ParseSignature(signature string, language string) (*FunctionSignature, error) {
	signature = strings.TrimSpace(signature)

	switch language {
	case "python":
		return parsePythonSignature(signature)
	case "cpp":
		return parseCppSignature(signature)
	case "java":
		return parseJavaSignature(signature)
	default:
		return nil, fmt.Errorf("unsupported language: %s", language)
	}
}

// parsePythonSignature parses Python function signature
// Example: def twoSum(nums: List[int], target: int) -> List[int]:
func parsePythonSignature(signature string) (*FunctionSignature, error) {
	// Remove 'def ' prefix and trailing ':'
	signature = strings.TrimPrefix(signature, "def ")
	signature = strings.TrimSuffix(strings.TrimSpace(signature), ":")

	// Extract function name
	nameEnd := strings.Index(signature, "(")
	if nameEnd == -1 {
		return nil, fmt.Errorf("invalid Python signature: missing '('")
	}
	funcName := strings.TrimSpace(signature[:nameEnd])

	// Extract parameters and return type
	paramsStart := nameEnd + 1
	paramsEnd := strings.Index(signature, ")")
	if paramsEnd == -1 {
		return nil, fmt.Errorf("invalid Python signature: missing ')'")
	}

	paramsStr := signature[paramsStart:paramsEnd]
	returnTypeStr := ""

	// Check for return type annotation
	if strings.Contains(signature[paramsEnd:], "->") {
		returnParts := strings.Split(signature[paramsEnd:], "->")
		if len(returnParts) > 1 {
			returnTypeStr = strings.TrimSpace(returnParts[1])
		}
	}

	// Parse parameters
	params := []ParameterInfo{}
	if strings.TrimSpace(paramsStr) != "" {
		paramList := strings.Split(paramsStr, ",")
		for _, param := range paramList {
			param = strings.TrimSpace(param)
			if param == "" || param == "self" {
				continue
			}

			// Split by ':'
			parts := strings.Split(param, ":")
			if len(parts) == 2 {
				paramName := strings.TrimSpace(parts[0])
				paramType := strings.TrimSpace(parts[1])
				params = append(params, ParameterInfo{
					Name: paramName,
					Type: paramType,
				})
			} else {
				// No type annotation
				params = append(params, ParameterInfo{
					Name: strings.TrimSpace(parts[0]),
					Type: "Any",
				})
			}
		}
	}

	return &FunctionSignature{
		FunctionName: funcName,
		Parameters:   params,
		ReturnType:   returnTypeStr,
		Language:     "python",
	}, nil
}

// parseCppSignature parses C++ function signature
// Example: vector<int> twoSum(vector<int>& nums, int target)
func parseCppSignature(signature string) (*FunctionSignature, error) {
	signature = strings.TrimSpace(signature)

	// Find the function name by looking for the opening parenthesis
	paramsStart := strings.Index(signature, "(")
	if paramsStart == -1 {
		return nil, fmt.Errorf("invalid C++ signature: missing '('")
	}

	// Everything before '(' contains return type and function name
	beforeParams := strings.TrimSpace(signature[:paramsStart])

	// Split by whitespace to separate return type and function name
	parts := strings.Fields(beforeParams)
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid C++ signature format")
	}

	// Last part is function name, everything before is return type
	funcName := parts[len(parts)-1]
	returnType := strings.Join(parts[:len(parts)-1], " ")

	// Extract parameters
	paramsEnd := strings.LastIndex(signature, ")")
	if paramsEnd == -1 {
		return nil, fmt.Errorf("invalid C++ signature: missing ')'")
	}

	paramsStr := signature[paramsStart+1 : paramsEnd]

	// Parse parameters
	params := []ParameterInfo{}
	if strings.TrimSpace(paramsStr) != "" {
		paramList := splitCppParams(paramsStr)
		for _, param := range paramList {
			param = strings.TrimSpace(param)
			if param == "" {
				continue
			}

			// Parse parameter (handle references and pointers)
			paramParts := strings.Fields(param)
			if len(paramParts) >= 2 {
				paramName := paramParts[len(paramParts)-1]
				paramType := strings.Join(paramParts[:len(paramParts)-1], " ")

				params = append(params, ParameterInfo{
					Name: paramName,
					Type: paramType,
				})
			}
		}
	}

	return &FunctionSignature{
		FunctionName: funcName,
		Parameters:   params,
		ReturnType:   returnType,
		Language:     "cpp",
	}, nil
}

// parseJavaSignature parses Java function signature
// Example: public int[] twoSum(int[] nums, int target)
func parseJavaSignature(signature string) (*FunctionSignature, error) {
	signature = strings.TrimSpace(signature)

	// Remove access modifiers
	signature = strings.TrimPrefix(signature, "public ")
	signature = strings.TrimPrefix(signature, "private ")
	signature = strings.TrimPrefix(signature, "protected ")
	signature = strings.TrimPrefix(signature, "static ")

	// Find the opening parenthesis
	paramsStart := strings.Index(signature, "(")
	if paramsStart == -1 {
		return nil, fmt.Errorf("invalid Java signature: missing '('")
	}

	// Everything before '(' contains return type and function name
	beforeParams := strings.TrimSpace(signature[:paramsStart])

	// Split to get return type and function name
	parts := strings.Fields(beforeParams)
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid Java signature format")
	}

	// Last part is function name, everything before is return type
	funcName := parts[len(parts)-1]
	returnType := strings.Join(parts[:len(parts)-1], " ")

	// Extract parameters
	paramsEnd := strings.Index(signature, ")")
	if paramsEnd == -1 {
		return nil, fmt.Errorf("invalid Java signature: missing ')'")
	}

	paramsStr := signature[paramsStart+1 : paramsEnd]

	// Parse parameters
	params := []ParameterInfo{}
	if strings.TrimSpace(paramsStr) != "" {
		paramList := strings.Split(paramsStr, ",")
		for _, param := range paramList {
			param = strings.TrimSpace(param)
			if param == "" {
				continue
			}

			// Parse parameter
			paramParts := strings.Fields(param)
			if len(paramParts) >= 2 {
				paramName := paramParts[len(paramParts)-1]
				paramType := strings.Join(paramParts[:len(paramParts)-1], " ")

				params = append(params, ParameterInfo{
					Name: paramName,
					Type: paramType,
				})
			}
		}
	}

	return &FunctionSignature{
		FunctionName: funcName,
		Parameters:   params,
		ReturnType:   returnType,
		Language:     "java",
	}, nil
}

// splitCppParams splits C++ parameters handling nested templates
func splitCppParams(params string) []string {
	result := []string{}
	current := ""
	depth := 0

	for _, char := range params {
		switch char {
		case '<':
			depth++
			current += string(char)
		case '>':
			depth--
			current += string(char)
		case ',':
			if depth == 0 {
				result = append(result, strings.TrimSpace(current))
				current = ""
			} else {
				current += string(char)
			}
		default:
			current += string(char)
		}
	}

	if current != "" {
		result = append(result, strings.TrimSpace(current))
	}

	return result
}

// TypeToGeneric converts language-specific type to generic type
func TypeToGeneric(langType string, language string) string {
	langType = strings.TrimSpace(langType)

	switch language {
	case "python":
		return pythonTypeToGeneric(langType)
	case "cpp":
		return cppTypeToGeneric(langType)
	case "java":
		return javaTypeToGeneric(langType)
	default:
		return langType
	}
}

func pythonTypeToGeneric(t string) string {
	typeMap := map[string]string{
		"int":             "int",
		"float":           "double",
		"str":             "string",
		"bool":            "bool",
		"List[int]":       "int[]",
		"List[str]":       "string[]",
		"List[float]":     "double[]",
		"List[List[int]]": "int[][]",
	}

	if generic, ok := typeMap[t]; ok {
		return generic
	}
	return t
}

func cppTypeToGeneric(t string) string {
	t = strings.ReplaceAll(t, "&", "")
	t = strings.ReplaceAll(t, "*", "")
	t = strings.TrimSpace(t)

	typeMap := map[string]string{
		"int":                 "int",
		"long long":           "long",
		"double":              "double",
		"float":               "float",
		"bool":                "bool",
		"string":              "string",
		"char":                "char",
		"vector<int>":         "int[]",
		"vector<string>":      "string[]",
		"vector<double>":      "double[]",
		"vector<vector<int>>": "int[][]",
	}

	if generic, ok := typeMap[t]; ok {
		return generic
	}
	return t
}

func javaTypeToGeneric(t string) string {
	typeMap := map[string]string{
		"int":      "int",
		"long":     "long",
		"double":   "double",
		"float":    "float",
		"boolean":  "bool",
		"String":   "string",
		"char":     "char",
		"int[]":    "int[]",
		"String[]": "string[]",
		"double[]": "double[]",
		"int[][]":  "int[][]",
	}

	if generic, ok := typeMap[t]; ok {
		return generic
	}
	return t
}
