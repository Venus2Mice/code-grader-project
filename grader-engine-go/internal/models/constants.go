package models

// Status constants - MUST be synchronized with backend constants.py
// These values are used in grading results sent to backend

const (
	// Pre-grading status
	StatusPending = "Pending"

	// Success status
	StatusAccepted = "Accepted"

	// Failure statuses
	StatusWrongAnswer         = "Wrong Answer"
	StatusCompileError        = "Compile Error"
	StatusRuntimeError        = "Runtime Error"
	StatusTimeLimitExceeded   = "Time Limit Exceeded"
	StatusMemoryLimitExceeded = "Memory Limit Exceeded"
	StatusOutputLimitExceeded = "Output Limit Exceeded"
	StatusSystemError         = "System Error"

	// Runtime error subtypes
	StatusSegmentationFault  = "Segmentation Fault"
	StatusFloatingPointError = "Floating Point Exception"
	StatusStackOverflow      = "Stack Overflow"
	StatusAbortSignal        = "Abort Signal"
	StatusNullPointer        = "Null Pointer Exception"
	StatusIndexError         = "Index Error"
	StatusArithmeticError    = "Arithmetic Error"
)

// IsSuccessStatus checks if a status indicates successful execution
func IsSuccessStatus(status string) bool {
	return status == StatusAccepted
}

// IsErrorStatus checks if a status indicates an error
func IsErrorStatus(status string) bool {
	errorStatuses := map[string]bool{
		StatusCompileError:        true,
		StatusRuntimeError:        true,
		StatusTimeLimitExceeded:   true,
		StatusMemoryLimitExceeded: true,
		StatusOutputLimitExceeded: true,
		StatusSystemError:         true,
		StatusSegmentationFault:   true,
		StatusFloatingPointError:  true,
		StatusStackOverflow:       true,
		StatusAbortSignal:         true,
		StatusNullPointer:         true,
		StatusIndexError:          true,
		StatusArithmeticError:     true,
	}
	return errorStatuses[status]
}
