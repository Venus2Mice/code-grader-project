"""
Constants for the grading system
Ensures synchronization between backend and worker
"""

# ============================================
# SUPPORTED LANGUAGES
# ============================================
# These languages MUST match the languages registered in worker's language registry
# Worker: grader-engine-go/internal/grader/language/registry.go
SUPPORTED_LANGUAGES = ['cpp', 'python', 'java']

# Default language for submissions
DEFAULT_LANGUAGE = 'cpp'


# ============================================
# SUBMISSION STATUSES
# ============================================
# These statuses are used by both backend and worker
# Worker sends these statuses in grading results

# Pre-grading status
STATUS_PENDING = 'Pending'

# Success status
STATUS_ACCEPTED = 'Accepted'

# Failure statuses
STATUS_WRONG_ANSWER = 'Wrong Answer'
STATUS_COMPILE_ERROR = 'Compile Error'
STATUS_RUNTIME_ERROR = 'Runtime Error'
STATUS_TIME_LIMIT_EXCEEDED = 'Time Limit Exceeded'
STATUS_MEMORY_LIMIT_EXCEEDED = 'Memory Limit Exceeded'
STATUS_OUTPUT_LIMIT_EXCEEDED = 'Output Limit Exceeded'
STATUS_SYSTEM_ERROR = 'System Error'

# Runtime error subtypes (sent by worker)
STATUS_SEGMENTATION_FAULT = 'Segmentation Fault'
STATUS_FLOATING_POINT_ERROR = 'Floating Point Exception'
STATUS_STACK_OVERFLOW = 'Stack Overflow'
STATUS_ABORT_SIGNAL = 'Abort Signal'
STATUS_NULL_POINTER = 'Null Pointer Exception'
STATUS_INDEX_ERROR = 'Index Error'
STATUS_ARITHMETIC_ERROR = 'Arithmetic Error'

# All valid statuses
ALL_STATUSES = [
    STATUS_PENDING,
    STATUS_ACCEPTED,
    STATUS_WRONG_ANSWER,
    STATUS_COMPILE_ERROR,
    STATUS_RUNTIME_ERROR,
    STATUS_TIME_LIMIT_EXCEEDED,
    STATUS_MEMORY_LIMIT_EXCEEDED,
    STATUS_OUTPUT_LIMIT_EXCEEDED,
    STATUS_SYSTEM_ERROR,
    STATUS_SEGMENTATION_FAULT,
    STATUS_FLOATING_POINT_ERROR,
    STATUS_STACK_OVERFLOW,
    STATUS_ABORT_SIGNAL,
    STATUS_NULL_POINTER,
    STATUS_INDEX_ERROR,
    STATUS_ARITHMETIC_ERROR,
]

# Error statuses (used for filtering)
ERROR_STATUSES = [
    STATUS_COMPILE_ERROR,
    STATUS_RUNTIME_ERROR,
    STATUS_TIME_LIMIT_EXCEEDED,
    STATUS_MEMORY_LIMIT_EXCEEDED,
    STATUS_OUTPUT_LIMIT_EXCEEDED,
    STATUS_SYSTEM_ERROR,
    STATUS_SEGMENTATION_FAULT,
    STATUS_FLOATING_POINT_ERROR,
    STATUS_STACK_OVERFLOW,
    STATUS_ABORT_SIGNAL,
    STATUS_NULL_POINTER,
    STATUS_INDEX_ERROR,
    STATUS_ARITHMETIC_ERROR,
]

# Statuses that indicate success (for scoring)
SUCCESS_STATUSES = [STATUS_ACCEPTED, 'Passed']  # Worker may send 'Passed' too


# ============================================
# PROBLEM DIFFICULTY LEVELS
# ============================================
DIFFICULTY_EASY = 'easy'
DIFFICULTY_MEDIUM = 'medium'
DIFFICULTY_HARD = 'hard'

ALL_DIFFICULTIES = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD]


# ============================================
# RESOURCE LIMITS
# ============================================
# Default limits (baseline for C++)
DEFAULT_TIME_LIMIT_MS = 1000
DEFAULT_MEMORY_LIMIT_KB = 256000

# Min/Max allowed limits
MIN_TIME_LIMIT_MS = 100
MAX_TIME_LIMIT_MS = 10000

MIN_MEMORY_LIMIT_KB = 1024  # 1 MB
MAX_MEMORY_LIMIT_KB = 1048576  # 1 GB


# ============================================
# RABBITMQ CONFIGURATION
# ============================================
RABBITMQ_QUEUE_NAME = 'grading_queue'
RABBITMQ_MAX_RETRIES = 3


# ============================================
# TEST CASE CONFIGURATION
# ============================================
# Default points for a test case
DEFAULT_TEST_CASE_POINTS = 10

# Min/Max points per test case
MIN_TEST_CASE_POINTS = 0
MAX_TEST_CASE_POINTS = 100


# ============================================
# API RESPONSE CODES
# ============================================
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_ACCEPTED = 202
HTTP_BAD_REQUEST = 400
HTTP_UNAUTHORIZED = 401
HTTP_FORBIDDEN = 403
HTTP_NOT_FOUND = 404
HTTP_CONFLICT = 409
HTTP_INTERNAL_ERROR = 500


# ============================================
# VALIDATION MESSAGES
# ============================================
MSG_INVALID_LANGUAGE = f"Invalid language. Supported: {', '.join(SUPPORTED_LANGUAGES)}"
MSG_INVALID_DIFFICULTY = f"Invalid difficulty. Must be one of: {', '.join(ALL_DIFFICULTIES)}"
MSG_INVALID_STATUS = "Invalid submission status"
MSG_REQUIRED_FIELD = "This field is required"
MSG_INVALID_FORMAT = "Invalid format"
