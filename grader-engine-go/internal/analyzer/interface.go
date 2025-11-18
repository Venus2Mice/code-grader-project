package analyzer

// CodeAnalyzer interface for static code analysis
type CodeAnalyzer interface {
	AnalyzeCode(sourceCode string, language string) (*AnalysisResult, error)
}

// AnalysisResult represents the complete code quality analysis
type AnalysisResult struct {
	QualityScore    int               `json:"quality_score"`
	ComplexityScore int               `json:"complexity_score"`
	StyleScore      int               `json:"style_score"`
	SecurityScore   int               `json:"security_score"`
	Issues          []Issue           `json:"issues"`
	Metrics         ComplexityMetrics `json:"metrics"`
}

// Issue represents a code quality issue (style, complexity, security)
type Issue struct {
	Line     int    `json:"line"`
	Column   int    `json:"column,omitempty"`
	Severity string `json:"severity"` // "error", "warning", "info"
	Category string `json:"category"` // "style", "complexity", "security", "best-practice"
	Message  string `json:"message"`
	Code     string `json:"code,omitempty"` // Rule code (e.g., "C0103", "E501")
}

// ComplexityMetrics holds various code complexity measurements
type ComplexityMetrics struct {
	CyclomaticComplexity int     `json:"cyclomatic_complexity"` // McCabe complexity
	CognitiveComplexity  int     `json:"cognitive_complexity,omitempty"`
	MaxNestingDepth      int     `json:"max_nesting_depth"`
	FunctionLength       int     `json:"function_length"` // Lines of code
	CommentLines         int     `json:"comment_lines"`
	MaintainabilityIndex float64 `json:"maintainability_index,omitempty"` // 0-100 scale
}

// CalculateQualityScore computes overall quality score from analysis results
// Weights: Complexity 40%, Style 30%, Security 20%, Documentation 10%
func (r *AnalysisResult) CalculateQualityScore() int {
	// Calculate weighted average
	qualityScore := float64(r.ComplexityScore)*0.4 +
		float64(r.StyleScore)*0.3 +
		float64(r.SecurityScore)*0.2 +
		float64(calculateDocScore(r.Metrics.CommentLines))*0.1

	// Clamp to 0-100
	if qualityScore < 0 {
		qualityScore = 0
	}
	if qualityScore > 100 {
		qualityScore = 100
	}

	return int(qualityScore)
}

// calculateDocScore returns documentation score based on comment lines
func calculateDocScore(commentLines int) int {
	if commentLines == 0 {
		return 50 // Baseline - no comments
	}
	if commentLines >= 5 {
		return 100 // Good documentation
	}
	// Linear interpolation between 50-100 for 1-5 comment lines
	return 50 + (commentLines * 10)
}

// CountIssuesBySeverity returns count of issues by severity level
func (r *AnalysisResult) CountIssuesBySeverity(severity string) int {
	count := 0
	for _, issue := range r.Issues {
		if issue.Severity == severity {
			count++
		}
	}
	return count
}

// CountIssuesByCategory returns count of issues by category
func (r *AnalysisResult) CountIssuesByCategory(category string) int {
	count := 0
	for _, issue := range r.Issues {
		if issue.Category == category {
			count++
		}
	}
	return count
}

// HasCriticalIssues checks if there are any critical security or error issues
func (r *AnalysisResult) HasCriticalIssues() bool {
	for _, issue := range r.Issues {
		if issue.Severity == "error" || (issue.Category == "security" && issue.Severity == "warning") {
			return true
		}
	}
	return false
}
