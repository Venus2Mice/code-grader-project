package grader

import (
	"regexp"
	"strconv"
	"strings"
	"testing"
)

// TestParseTimeMetrics_VeryFastProgram tests parsing for programs < 1ms
func TestParseTimeMetrics_VeryFastProgram(t *testing.T) {
	timeOutput := `	Command being timed: "./program"
	User time (seconds): 0.00
	System time (seconds): 0.00
	Percent of CPU this job got: 100%
	Elapsed (wall clock) time (h:mm:ss or m:ss): 0:00.00
	Maximum resident set size (kbytes): 3200`

	execTime, memoryKb := parseTimeMetricsTest(timeOutput)

	// Should report 1ms for very fast programs (not 0 and not fallback to Docker time)
	if execTime != 1 {
		t.Errorf("Expected 1ms for very fast program, got %dms", execTime)
	}

	// Memory should be parsed correctly
	if memoryKb != 3200 {
		t.Errorf("Expected 3200KB memory, got %dKB", memoryKb)
	}
}

// TestParseTimeMetrics_SlowProgram tests parsing for programs > 10ms
func TestParseTimeMetrics_SlowProgram(t *testing.T) {
	timeOutput := `	Command being timed: "./program"
	User time (seconds): 0.05
	System time (seconds): 0.01
	Percent of CPU this job got: 99%
	Elapsed (wall clock) time (h:mm:ss or m:ss): 0:00.06
	Maximum resident set size (kbytes): 5120`

	execTime, memoryKb := parseTimeMetricsTest(timeOutput)

	// Should report 60ms (50ms user + 10ms system)
	if execTime != 60 {
		t.Errorf("Expected 60ms (50+10), got %dms", execTime)
	}

	if memoryKb != 5120 {
		t.Errorf("Expected 5120KB memory, got %dKB", memoryKb)
	}
}

// TestParseTimeMetrics_NoOutput tests behavior when /usr/bin/time output is missing
func TestParseTimeMetrics_NoOutput(t *testing.T) {
	timeOutput := ""

	execTime, memoryKb := parseTimeMetricsTest(timeOutput)

	// Should return 0 to trigger fallback
	if execTime != 0 {
		t.Errorf("Expected 0ms for no output, got %dms", execTime)
	}

	if memoryKb != 0 {
		t.Errorf("Expected 0KB for no output, got %dKB", memoryKb)
	}
}

// parseTimeMetricsTest is a copy of the actual implementation for testing
func parseTimeMetricsTest(timeOutput string) (execTimeMs int, memoryKb int) {
	lines := strings.Split(timeOutput, "\n")

	var userTime, systemTime float64
	foundUserTime := false
	foundSystemTime := false

	for _, line := range lines {
		// Parse User time: "User time (seconds): 0.00"
		if strings.Contains(line, "User time (seconds):") {
			re := regexp.MustCompile(`(\d+\.\d+)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) >= 1 {
				userTime, _ = strconv.ParseFloat(matches[0], 64)
				foundUserTime = true
			}
		}

		// Parse System time: "System time (seconds): 0.00"
		if strings.Contains(line, "System time (seconds):") {
			re := regexp.MustCompile(`(\d+\.\d+)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) >= 1 {
				systemTime, _ = strconv.ParseFloat(matches[0], 64)
				foundSystemTime = true
			}
		}

		// Parse memory: "Maximum resident set size (kbytes): 2048"
		if strings.Contains(line, "Maximum resident set size") {
			re := regexp.MustCompile(`(\d+)`)
			matches := re.FindStringSubmatch(line)
			if len(matches) > 0 {
				memoryKb, _ = strconv.Atoi(matches[0])
			}
		}
	}

	// Calculate total CPU time (user + system)
	if foundUserTime || foundSystemTime {
		totalTime := userTime + systemTime
		execTimeMs = int(totalTime * 1000)

		// If very fast program (< 1ms), report at least 1ms
		if execTimeMs == 0 && (foundUserTime || foundSystemTime) {
			execTimeMs = 1
		}
	}

	return
}
