package analyzer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"github.com/docker/docker/client"
)

// PythonAnalyzer performs static analysis on Python code
type PythonAnalyzer struct {
	containerID string
	cli         *client.Client
}

// NewPythonAnalyzer creates a new Python code analyzer
func NewPythonAnalyzer(containerID string, dockerClient *client.Client) *PythonAnalyzer {
	return &PythonAnalyzer{
		containerID: containerID,
		cli:         dockerClient,
	}
}

// AnalyzeCode performs comprehensive Python code analysis
func (p *PythonAnalyzer) AnalyzeCode(sourceCode string, language string) (*AnalysisResult, error) {
	log.Printf("[Analyzer] Starting Python code analysis...")

	result := &AnalysisResult{
		Issues:  []Issue{},
		Metrics: ComplexityMetrics{},
	}

	// Write source code to container
	if err := p.writeCodeToContainer(sourceCode); err != nil {
		return nil, fmt.Errorf("failed to write code to container: %w", err)
	}

	// Run pylint for style and error detection
	pylintIssues, err := p.runPylint()
	if err != nil {
		log.Printf("[Analyzer] Pylint warning: %v", err)
	}
	result.Issues = append(result.Issues, pylintIssues...)

	// Run radon for complexity metrics
	metrics, err := p.runRadon()
	if err != nil {
		log.Printf("[Analyzer] Radon warning: %v", err)
	} else {
		result.Metrics = metrics
	}

	// Run bandit for security analysis
	securityIssues, err := p.runBandit()
	if err != nil {
		log.Printf("[Analyzer] Bandit warning: %v", err)
	}
	result.Issues = append(result.Issues, securityIssues...)

	// Calculate scores
	result.ComplexityScore = p.calculateComplexityScore(result.Metrics)
	result.StyleScore = p.calculateStyleScore(result.Issues)
	result.SecurityScore = p.calculateSecurityScore(result.Issues)
	result.QualityScore = result.CalculateQualityScore()

	log.Printf("[Analyzer] Python analysis complete: Quality=%d, Complexity=%d, Style=%d, Security=%d",
		result.QualityScore, result.ComplexityScore, result.StyleScore, result.SecurityScore)

	return result, nil
}

// writeCodeToContainer writes source code to a file in the container
func (p *PythonAnalyzer) writeCodeToContainer(sourceCode string) error {
	// Escape single quotes for bash
	escapedCode := strings.ReplaceAll(sourceCode, "'", "'\\''")
	cmd := fmt.Sprintf("echo '%s' > /sandbox/analysis_code.py", escapedCode)

	return execCommand(context.Background(), p.cli, p.containerID, []string{"sh", "-c", cmd})
}

// runPylint executes pylint and parses output
func (p *PythonAnalyzer) runPylint() ([]Issue, error) {
	// Run pylint with JSON output format
	output, err := execCommandWithOutput(
		context.Background(),
		p.cli,
		p.containerID,
		[]string{"pylint", "--output-format=json", "--disable=C0114,C0115,C0116", "/sandbox/analysis_code.py"},
	)

	// Pylint returns non-zero exit code if issues found, but output is still valid
	if err != nil && output == "" {
		return nil, err
	}

	// Parse JSON output
	var pylintOutput []struct {
		Type      string `json:"type"`
		Module    string `json:"module"`
		Line      int    `json:"line"`
		Column    int    `json:"column"`
		Message   string `json:"message"`
		Symbol    string `json:"symbol"`
		MessageID string `json:"message-id"`
	}

	if err := json.Unmarshal([]byte(output), &pylintOutput); err != nil {
		// If JSON parsing fails, try to parse text output
		return p.parsePylintText(output), nil
	}

	issues := []Issue{}
	for _, item := range pylintOutput {
		severity := "info"
		switch item.Type {
		case "error", "fatal":
			severity = "error"
		case "warning":
			severity = "warning"
		case "convention", "refactor":
			severity = "info"
		}

		issues = append(issues, Issue{
			Line:     item.Line,
			Column:   item.Column,
			Severity: severity,
			Category: "style",
			Message:  item.Message,
			Code:     item.MessageID,
		})
	}

	return issues, nil
}

// parsePylintText parses text-format pylint output (fallback)
func (p *PythonAnalyzer) parsePylintText(output string) []Issue {
	issues := []Issue{}
	// Format: "analysis_code.py:10:0: C0103: Variable name doesn't conform to snake_case"
	re := regexp.MustCompile(`analysis_code\.py:(\d+):(\d+): ([CEFRW])(\d+): (.+)`)
	
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		matches := re.FindStringSubmatch(line)
		if len(matches) == 6 {
			lineNum, _ := strconv.Atoi(matches[1])
			colNum, _ := strconv.Atoi(matches[2])
			typeCode := matches[3]
			
			severity := "info"
			switch typeCode {
			case "E", "F":
				severity = "error"
			case "W":
				severity = "warning"
			case "C", "R":
				severity = "info"
			}

			issues = append(issues, Issue{
				Line:     lineNum,
				Column:   colNum,
				Severity: severity,
				Category: "style",
				Message:  matches[5],
				Code:     typeCode + matches[4],
			})
		}
	}

	return issues
}

// runRadon executes radon for complexity analysis
func (p *PythonAnalyzer) runRadon() (ComplexityMetrics, error) {
	// Run radon cc (cyclomatic complexity)
	ccOutput, err := execCommandWithOutput(
		context.Background(),
		p.cli,
		p.containerID,
		[]string{"radon", "cc", "-s", "-j", "/sandbox/analysis_code.py"},
	)
	if err != nil {
		return ComplexityMetrics{}, err
	}

	// Run radon raw (raw metrics)
	rawOutput, err := execCommandWithOutput(
		context.Background(),
		p.cli,
		p.containerID,
		[]string{"radon", "raw", "-s", "-j", "/sandbox/analysis_code.py"},
	)
	if err != nil {
		return ComplexityMetrics{}, err
	}

	metrics := ComplexityMetrics{}

	// Parse cyclomatic complexity
	var ccData map[string][]struct {
		Complexity int    `json:"complexity"`
		Lineno     int    `json:"lineno"`
		Name       string `json:"name"`
		Rank       string `json:"rank"`
	}
	if err := json.Unmarshal([]byte(ccOutput), &ccData); err == nil {
		maxComplexity := 0
		for _, functions := range ccData {
			for _, fn := range functions {
				if fn.Complexity > maxComplexity {
					maxComplexity = fn.Complexity
				}
			}
		}
		metrics.CyclomaticComplexity = maxComplexity
	}

	// Parse raw metrics
	var rawData map[string]struct {
		LOC     int `json:"loc"`
		LLOC    int `json:"lloc"`
		SLOC    int `json:"sloc"`
		Comments int `json:"comments"`
		Single  int `json:"single_comments"`
		Multi   int `json:"multi"`
		Blank   int `json:"blank"`
	}
	if err := json.Unmarshal([]byte(rawOutput), &rawData); err == nil {
		for _, data := range rawData {
			metrics.FunctionLength = data.SLOC
			metrics.CommentLines = data.Comments
			break // Only first file
		}
	}

	// Estimate nesting depth (simple heuristic based on complexity)
	if metrics.CyclomaticComplexity <= 5 {
		metrics.MaxNestingDepth = 1
	} else if metrics.CyclomaticComplexity <= 10 {
		metrics.MaxNestingDepth = 2
	} else if metrics.CyclomaticComplexity <= 20 {
		metrics.MaxNestingDepth = 3
	} else {
		metrics.MaxNestingDepth = 4
	}

	return metrics, nil
}

// runBandit executes bandit for security analysis
func (p *PythonAnalyzer) runBandit() ([]Issue, error) {
	output, err := execCommandWithOutput(
		context.Background(),
		p.cli,
		p.containerID,
		[]string{"bandit", "-f", "json", "-q", "/sandbox/analysis_code.py"},
	)

	// Bandit returns non-zero if issues found
	if err != nil && output == "" {
		return []Issue{}, nil // No issues
	}

	// Parse JSON output
	var banditOutput struct {
		Results []struct {
			LineNumber int    `json:"line_number"`
			TestID     string `json:"test_id"`
			TestName   string `json:"test_name"`
			IssueText  string `json:"issue_text"`
			IssueSeverity string `json:"issue_severity"`
		} `json:"results"`
	}

	if err := json.Unmarshal([]byte(output), &banditOutput); err != nil {
		return nil, err
	}

	issues := []Issue{}
	for _, result := range banditOutput.Results {
		severity := "warning"
		if result.IssueSeverity == "HIGH" {
			severity = "error"
		} else if result.IssueSeverity == "LOW" {
			severity = "info"
		}

		issues = append(issues, Issue{
			Line:     result.LineNumber,
			Severity: severity,
			Category: "security",
			Message:  result.IssueText,
			Code:     result.TestID,
		})
	}

	return issues, nil
}

// calculateComplexityScore scores complexity (lower complexity = higher score)
func (p *PythonAnalyzer) calculateComplexityScore(metrics ComplexityMetrics) int {
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

	// Clamp to 0-100
	if score < 0 {
		score = 0
	}
	return score
}

// calculateStyleScore scores based on style issues
func (p *PythonAnalyzer) calculateStyleScore(issues []Issue) int {
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
func (p *PythonAnalyzer) calculateSecurityScore(issues []Issue) int {
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
