package parser

import (
	"fmt"
)

// ParsedCode represents the structured components of submitted code
type ParsedCode struct {
	Language     string        // python, cpp, java
	Imports      []string      // import statements
	Functions    []FunctionDef // all function definitions found
	MainBlock    string        // main code block (if any)
	OriginalCode string        // original submitted code
	MatchedFunc  *FunctionDef  // the function that matches problem signature
}

// FunctionDef represents a function definition with its signature
type FunctionDef struct {
	Name       string   // function name (as written by student)
	ReturnType string   // return type (normalized: int, int[], string, etc.)
	ParamTypes []string // parameter types (normalized)
	ParamNames []string // parameter names (as written by student)
	Body       string   // function body (including definition line)
	StartLine  int      // line number where function starts
	EndLine    int      // line number where function ends
}

// CodeParser is the interface for language-specific parsers
type CodeParser interface {
	// Parse extracts structured components from source code
	Parse(sourceCode string) (*ParsedCode, error)

	// MatchFunction finds a function that matches the given signature
	// Returns the matched function or nil if not found
	MatchFunction(parsed *ParsedCode, expectedReturnType string, expectedParamTypes []string) (*FunctionDef, error)

	// ExtractFunctionBody extracts just the function body for injection
	ExtractFunctionBody(funcDef *FunctionDef) string
}

// GetParser returns the appropriate parser for the given language
func GetParser(language string) (CodeParser, error) {
	switch language {
	case "python":
		return &PythonParser{}, nil
	case "cpp":
		return &CppParser{}, nil
	case "java":
		return &JavaParser{}, nil
	default:
		return nil, fmt.Errorf("unsupported language: %s", language)
	}
}

// PreprocessCode is the main entry point for code preprocessing
// It parses the code and finds the function matching the problem signature
func PreprocessCode(sourceCode, language, expectedReturnType string, expectedParamTypes []string) (*ParsedCode, error) {
	parser, err := GetParser(language)
	if err != nil {
		return nil, err
	}

	// Parse the code
	parsed, err := parser.Parse(sourceCode)
	if err != nil {
		return nil, fmt.Errorf("failed to parse %s code: %w", language, err)
	}

	// Match function by signature
	matchedFunc, err := parser.MatchFunction(parsed, expectedReturnType, expectedParamTypes)
	if err != nil {
		return nil, fmt.Errorf("failed to find matching function: %w", err)
	}

	parsed.MatchedFunc = matchedFunc
	return parsed, nil
}

// NormalizeType converts various type representations to a standard format
// Examples: "vector<int>" -> "int[]", "List[int]" -> "int[]"
func NormalizeType(typeStr string, language string) string {
	// This will be implemented in language-specific parsers
	// For now, return as-is
	return typeStr
}
