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

// JavaAnalyzer performs static analysis on Java code
type JavaAnalyzer struct {
	containerID string
	cli         *client.Client
}

// NewJavaAnalyzer creates a new Java code analyzer
func NewJavaAnalyzer(containerID string, dockerClient *client.Client) *JavaAnalyzer {
	return &JavaAnalyzer{
		containerID: containerID,
		cli:         dockerClient,
	}
}

// AnalyzeCode performs comprehensive Java code analysis
func (j *JavaAnalyzer) AnalyzeCode(sourceCode string, language string) (*AnalysisResult, error) {
	log.Printf("[Analyzer] Starting Java code analysis...")

	result := &AnalysisResult{
		Issues:  []Issue{},
		Metrics: ComplexityMetrics{},
	}

	// Write source code to container
	if err := j.writeCodeToContainer(sourceCode); err != nil {
		return nil, fmt.Errorf("failed to write code to container: %w", err)
	}

	// Run checkstyle for style analysis
	checkstyleIssues, err := j.runCheckstyle()
	if err != nil {
		log.Printf("[Analyzer] Checkstyle warning: %v", err)
	}
	result.Issues = append(result.Issues, checkstyleIssues...)

	// Analyze complexity (simple metrics from code)
	metrics := j.analyzeComplexity(sourceCode)
	result.Metrics = metrics

	// Calculate scores
	result.ComplexityScore = j.calculateComplexityScore(result.Metrics)
	result.StyleScore = j.calculateStyleScore(result.Issues)
	result.SecurityScore = j.calculateSecurityScore(result.Issues)
	result.QualityScore = result.CalculateQualityScore()

	log.Printf("[Analyzer] Java analysis complete: Quality=%d, Complexity=%d, Style=%d, Security=%d",
		result.QualityScore, result.ComplexityScore, result.StyleScore, result.SecurityScore)

	return result, nil
}

// writeCodeToContainer writes source code to a file in the container
func (j *JavaAnalyzer) writeCodeToContainer(sourceCode string) error {
	// Escape single quotes for bash
	escapedCode := strings.ReplaceAll(sourceCode, "'", "'\\''")
	cmd := fmt.Sprintf("echo '%s' > /sandbox/Solution.java", escapedCode)

	return execCommand(context.Background(), j.cli, j.containerID, []string{"sh", "-c", cmd})
}

// runCheckstyle executes checkstyle for style analysis
func (j *JavaAnalyzer) runCheckstyle() ([]Issue, error) {
	// Create a simple checkstyle config (sun_checks is built-in)
	configXML := `<?xml version="1.0"?>
<!DOCTYPE module PUBLIC "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
  <module name="TreeWalker">
    <module name="NeedBraces"/>
    <module name="EmptyBlock"/>
    <module name="UnusedImports"/>
    <module name="RedundantImport"/>
    <module name="SimplifyBooleanExpression"/>
    <module name="SimplifyBooleanReturn"/>
    <module name="StringLiteralEquality"/>
    <module name="UpperEll"/>
    <module name="ArrayTypeStyle"/>
    <module name="OuterTypeFilename"/>
  </module>
</module>`

	// Write config to container
	escapedConfig := strings.ReplaceAll(configXML, "'", "'\\''")
	cmd := fmt.Sprintf("echo '%s' > /sandbox/checkstyle.xml", escapedConfig)
	if err := execCommand(context.Background(), j.cli, j.containerID, []string{"sh", "-c", cmd}); err != nil {
		return nil, err
	}

	// Run checkstyle
	output, err := execCommandWithOutput(
		context.Background(),
		j.cli,
		j.containerID,
		[]string{"java", "-jar", "/opt/checkstyle/checkstyle.jar", "-c", "/sandbox/checkstyle.xml", "/sandbox/Solution.java"},
	)

	// Checkstyle returns non-zero if issues found
	if err != nil && output == "" {
		return []Issue{}, nil
	}

	issues := []Issue{}

	// Pattern: "[WARN] /sandbox/Solution.java:10:5: 'if' construct must use '{}'s. [NeedBraces]"
	re := regexp.MustCompile(`\[(WARN|ERROR)\] /sandbox/Solution\.java:(\d+):(\d+): (.+?) \[([^\]]+)\]`)
	matches := re.FindAllStringSubmatch(output, -1)

	for _, match := range matches {
		if len(match) >= 6 {
			severityStr := match[1]
			line, _ := strconv.Atoi(match[2])
			col, _ := strconv.Atoi(match[3])
			message := strings.TrimSpace(match[4])
			code := match[5]

			severity := "info"
			if severityStr == "ERROR" {
				severity = "error"
			} else if severityStr == "WARN" {
				severity = "warning"
			}

			issues = append(issues, Issue{
				Line:     line,
				Column:   col,
				Severity: severity,
				Category: "style",
				Message:  message,
				Code:     code,
			})
		}
	}

	return issues, nil
}

// analyzeComplexity performs simple complexity analysis on Java code
func (j *JavaAnalyzer) analyzeComplexity(sourceCode string) ComplexityMetrics {
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
func (j *JavaAnalyzer) calculateComplexityScore(metrics ComplexityMetrics) int {
	score := 100

	// Penalize high cyclomatic complexity
	if metrics.CyclomaticComplexity > 10 {
		score -= (metrics.CyclomaticComplexity - 10) * 5
	}

	// Penalize deep nesting
	if metrics.MaxNestingDepth > 3 {
		score -= (metrics.MaxNestingDepth - 3) * 10
	}

	// Penalize very long methods
	if metrics.FunctionLength > 50 {
		score -= (metrics.FunctionLength - 50) / 5
	}

	if score < 0 {
		score = 0
	}
	return score
}

// calculateStyleScore scores based on style issues
func (j *JavaAnalyzer) calculateStyleScore(issues []Issue) int {
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
func (j *JavaAnalyzer) calculateSecurityScore(issues []Issue) int {
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
