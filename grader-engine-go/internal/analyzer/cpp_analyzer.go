package analyzer

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"github.com/docker/docker/client"
)

// CppAnalyzer performs static analysis on C++ code
type CppAnalyzer struct {
	containerID string
	cli         *client.Client
}

// NewCppAnalyzer creates a new C++ code analyzer
func NewCppAnalyzer(containerID string, dockerClient *client.Client) *CppAnalyzer {
	return &CppAnalyzer{
		containerID: containerID,
		cli:         dockerClient,
	}
}

// AnalyzeCode performs comprehensive C++ code analysis
func (c *CppAnalyzer) AnalyzeCode(sourceCode string, language string) (*AnalysisResult, error) {
	log.Printf("[Analyzer] Starting C++ code analysis...")

	result := &AnalysisResult{
		Issues:  []Issue{},
		Metrics: ComplexityMetrics{},
	}

	// Write source code to container
	if err := c.writeCodeToContainer(sourceCode); err != nil {
		return nil, fmt.Errorf("failed to write code to container: %w", err)
	}

	// Run cppcheck for static analysis
	cppcheckIssues, err := c.runCppcheck()
	if err != nil {
		log.Printf("[Analyzer] Cppcheck warning: %v", err)
	}
	result.Issues = append(result.Issues, cppcheckIssues...)

	// Run clang-tidy for style and modernization
	clangTidyIssues, err := c.runClangTidy()
	if err != nil {
		log.Printf("[Analyzer] Clang-tidy warning: %v", err)
	}
	result.Issues = append(result.Issues, clangTidyIssues...)

	// Analyze complexity (simple metrics from code)
	metrics := c.analyzeComplexity(sourceCode)
	result.Metrics = metrics

	// Calculate scores
	result.ComplexityScore = c.calculateComplexityScore(result.Metrics)
	result.StyleScore = c.calculateStyleScore(result.Issues)
	result.SecurityScore = c.calculateSecurityScore(result.Issues)
	result.QualityScore = result.CalculateQualityScore()

	log.Printf("[Analyzer] C++ analysis complete: Quality=%d, Complexity=%d, Style=%d, Security=%d",
		result.QualityScore, result.ComplexityScore, result.StyleScore, result.SecurityScore)

	return result, nil
}

// writeCodeToContainer writes source code to a file in the container
func (c *CppAnalyzer) writeCodeToContainer(sourceCode string) error {
	// Escape single quotes for bash
	escapedCode := strings.ReplaceAll(sourceCode, "'", "'\\''")
	cmd := fmt.Sprintf("echo '%s' > /sandbox/analysis_code.cpp", escapedCode)

	return execCommand(context.Background(), c.cli, c.containerID, []string{"sh", "-c", cmd})
}

// runCppcheck executes cppcheck for static analysis
func (c *CppAnalyzer) runCppcheck() ([]Issue, error) {
	output, _ := execCommandWithOutput(
		context.Background(),
		c.cli,
		c.containerID,
		[]string{"cppcheck", "--enable=all", "--xml", "--suppress=missingIncludeSystem", "/sandbox/analysis_code.cpp"},
	)

	// Cppcheck writes to stderr, so non-zero exit is expected
	if output == "" {
		return []Issue{}, nil
	}

	// Parse XML-like output (simple regex parsing)
	issues := []Issue{}
	
	// Pattern: <error ... line="10" severity="warning" msg="Variable 'x' is not used" .../>
	re := regexp.MustCompile(`<error[^>]*line="(\d+)"[^>]*severity="([^"]+)"[^>]*msg="([^"]+)"`)
	matches := re.FindAllStringSubmatch(output, -1)

	for _, match := range matches {
		if len(match) >= 4 {
			line, _ := strconv.Atoi(match[1])
			severityStr := match[2]
			message := match[3]

			severity := "info"
			category := "style"

			switch severityStr {
			case "error":
				severity = "error"
				category = "style"
			case "warning":
				severity = "warning"
				category = "style"
			case "style":
				severity = "info"
				category = "style"
			case "performance":
				severity = "warning"
				category = "best-practice"
			case "portability":
				severity = "info"
				category = "best-practice"
			}

			// Check if security-related
			if strings.Contains(strings.ToLower(message), "buffer") ||
				strings.Contains(strings.ToLower(message), "overflow") ||
				strings.Contains(strings.ToLower(message), "memory") {
				category = "security"
			}

			issues = append(issues, Issue{
				Line:     line,
				Severity: severity,
				Category: category,
				Message:  message,
				Code:     "cppcheck",
			})
		}
	}

	return issues, nil
}

// runClangTidy executes clang-tidy for style analysis
func (c *CppAnalyzer) runClangTidy() ([]Issue, error) {
	// Run clang-tidy with basic checks
	output, err := execCommandWithOutput(
		context.Background(),
		c.cli,
		c.containerID,
		[]string{"clang-tidy", "/sandbox/analysis_code.cpp", "--", "-std=c++17"},
	)

	// clang-tidy returns non-zero if issues found
	if err != nil && output == "" {
		return []Issue{}, nil
	}

	issues := []Issue{}

	// Pattern: "/sandbox/analysis_code.cpp:10:5: warning: variable 'x' is not used [clang-diagnostic-unused-variable]"
	re := regexp.MustCompile(`/sandbox/analysis_code\.cpp:(\d+):\d+: (warning|error|note): ([^\[]+)(?:\[([^\]]+)\])?`)
	matches := re.FindAllStringSubmatch(output, -1)

	for _, match := range matches {
		if len(match) >= 4 {
			line, _ := strconv.Atoi(match[1])
			severityStr := match[2]
			message := strings.TrimSpace(match[3])
			code := ""
			if len(match) >= 5 {
				code = match[4]
			}

			severity := "info"
			if severityStr == "error" {
				severity = "error"
			} else if severityStr == "warning" {
				severity = "warning"
			}

			// Skip notes (usually follow-up explanations)
			if severityStr == "note" {
				continue
			}

			issues = append(issues, Issue{
				Line:     line,
				Severity: severity,
				Category: "style",
				Message:  message,
				Code:     code,
			})
		}
	}

	return issues, nil
}

// analyzeComplexity performs simple complexity analysis on C++ code
func (c *CppAnalyzer) analyzeComplexity(sourceCode string) ComplexityMetrics {
	metrics := ComplexityMetrics{}

	lines := strings.Split(sourceCode, "\n")
	metrics.FunctionLength = len(lines)

	// Count control flow statements for cyclomatic complexity estimate
	controlFlowCount := 0
	maxNesting := 0
	currentNesting := 0
	commentLines := 0

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Count comments
		if strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "/*") {
			commentLines++
		}

		// Count control flow keywords
		if strings.Contains(trimmed, "if") ||
			strings.Contains(trimmed, "for") ||
			strings.Contains(trimmed, "while") ||
			strings.Contains(trimmed, "case") ||
			strings.Contains(trimmed, "&&") ||
			strings.Contains(trimmed, "||") {
			controlFlowCount++
		}

		// Estimate nesting by counting braces
		currentNesting += strings.Count(trimmed, "{")
		if currentNesting > maxNesting {
			maxNesting = currentNesting
		}
		currentNesting -= strings.Count(trimmed, "}")
		if currentNesting < 0 {
			currentNesting = 0
		}
	}

	// Cyclomatic complexity = edges - nodes + 2 (simplified: control flow + 1)
	metrics.CyclomaticComplexity = controlFlowCount + 1
	metrics.MaxNestingDepth = maxNesting
	metrics.CommentLines = commentLines

	return metrics
}

// calculateComplexityScore scores complexity (lower complexity = higher score)
func (c *CppAnalyzer) calculateComplexityScore(metrics ComplexityMetrics) int {
	score := 100

	// Penalize high cyclomatic complexity
	if metrics.CyclomaticComplexity > 10 {
		score -= (metrics.CyclomaticComplexity - 10) * 5
	}

	// Penalize deep nesting
	if metrics.MaxNestingDepth > 3 {
		score -= (metrics.MaxNestingDepth - 3) * 10
	}

	// Penalize very long functions
	if metrics.FunctionLength > 50 {
		score -= (metrics.FunctionLength - 50) / 5
	}

	if score < 0 {
		score = 0
	}
	return score
}

// calculateStyleScore scores based on style issues
func (c *CppAnalyzer) calculateStyleScore(issues []Issue) int {
	score := 100
	errorCount := 0
	warningCount := 0

	for _, issue := range issues {
		if issue.Category == "style" {
			if issue.Severity == "error" {
				errorCount++
			} else if issue.Severity == "warning" {
				warningCount++
			}
		}
	}

	score -= errorCount * 10
	score -= warningCount * 3

	if score < 0 {
		score = 0
	}
	return score
}

// calculateSecurityScore scores based on security issues
func (c *CppAnalyzer) calculateSecurityScore(issues []Issue) int {
	score := 100

	for _, issue := range issues {
		if issue.Category == "security" {
			if issue.Severity == "error" {
				score -= 25
			} else if issue.Severity == "warning" {
				score -= 15
			} else {
				score -= 5
			}
		}
	}

	if score < 0 {
		score = 0
	}
	return score
}
