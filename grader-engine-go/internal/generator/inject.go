package generator

import (
	"strings"
)

// InjectUserCode replaces placeholder with actual user code
func InjectUserCode(harness string, userCode string, language string) string {
	startMarker := ""
	endMarker := ""

	switch language {
	case "python":
		startMarker = "# USER_CODE_START"
		endMarker = "# USER_CODE_END"
	case "cpp":
		startMarker = "// USER_CODE_START"
		endMarker = "// USER_CODE_END"
	case "java":
		startMarker = "// USER_CODE_START"
		endMarker = "// USER_CODE_END"
	default:
		return harness
	}

	// Find markers
	startIdx := strings.Index(harness, startMarker)
	endIdx := strings.Index(harness, endMarker)

	if startIdx == -1 || endIdx == -1 {
		return harness
	}

	// Extract parts
	before := harness[:startIdx+len(startMarker)]
	after := harness[endIdx:]

	// Build result
	return before + "\n" + userCode + "\n" + after
}
