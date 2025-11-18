package analyzer

import (
	"log"

	"github.com/docker/docker/client"
)

// Factory provides analyzer instances based on language
type Factory struct {
	containerID  string
	dockerClient *client.Client
}

// NewFactory creates a new analyzer factory
func NewFactory(containerID string, dockerClient *client.Client) *Factory {
	return &Factory{
		containerID:  containerID,
		dockerClient: dockerClient,
	}
}

// GetAnalyzer returns the appropriate analyzer for the given language
func (f *Factory) GetAnalyzer(language string) (CodeAnalyzer, error) {
	switch language {
	case "python":
		return NewPythonAnalyzer(f.containerID, f.dockerClient), nil
	case "cpp", "c++":
		return NewCppAnalyzer(f.containerID, f.dockerClient), nil
	case "java":
		return NewJavaAnalyzer(f.containerID, f.dockerClient), nil
	default:
		log.Printf("[Analyzer] Unsupported language: %s, returning NoOpAnalyzer", language)
		return NewNoOpAnalyzer(), nil
	}
}

// NoOpAnalyzer is a no-operation analyzer for unsupported languages
type NoOpAnalyzer struct{}

// NewNoOpAnalyzer creates a no-op analyzer
func NewNoOpAnalyzer() *NoOpAnalyzer {
	return &NoOpAnalyzer{}
}

// AnalyzeCode returns default/empty analysis result
func (n *NoOpAnalyzer) AnalyzeCode(sourceCode string, language string) (*AnalysisResult, error) {
	log.Printf("[Analyzer] No-op analyzer for language: %s", language)
	
	// Return neutral scores
	return &AnalysisResult{
		QualityScore:    100, // Default: assume quality is good
		ComplexityScore: 100,
		StyleScore:      100,
		SecurityScore:   100,
		Issues:          []Issue{},
		Metrics: ComplexityMetrics{
			CyclomaticComplexity: 1,
			MaxNestingDepth:      1,
			FunctionLength:       10,
			CommentLines:         0,
		},
	}, nil
}

// ShouldAnalyze checks if quality analysis should run for this language
func ShouldAnalyze(language string) bool {
	switch language {
	case "python", "cpp", "c++", "java":
		return true
	default:
		return false
	}
}
