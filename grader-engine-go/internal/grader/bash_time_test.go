package grader

import (
	"testing"
)

func TestParseBashTime(t *testing.T) {
	s := &Service{}

	tests := []struct {
		name     string
		input    string
		expected int
	}{
		{
			name:     "1 millisecond",
			input:    "real 0m0.001s\nuser 0m0.000s\nsys 0m0.000s",
			expected: 1,
		},
		{
			name:     "3 milliseconds",
			input:    "real 0m0.003s\nuser 0m0.000s\nsys 0m0.001s",
			expected: 3,
		},
		{
			name:     "150 milliseconds",
			input:    "real 0m0.150s\nuser 0m0.120s\nsys 0m0.030s",
			expected: 150,
		},
		{
			name:     "1.5 seconds",
			input:    "real 0m1.523s\nuser 0m1.200s\nsys 0m0.300s",
			expected: 1523,
		},
		{
			name:     "No match",
			input:    "some random text",
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := s.parseBashTime(tt.input)
			if result != tt.expected {
				t.Errorf("Expected %dms, got %dms", tt.expected, result)
			}
		})
	}
}
