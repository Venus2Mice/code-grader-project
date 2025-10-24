# Structured Logger

## Overview
A lightweight structured logging package for the Go grader worker that supports both human-readable and JSON output formats.

## Features
- ✅ Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- ✅ Structured fields for better log analysis
- ✅ JSON output for production (parseable by log aggregators)
- ✅ Human-readable output for development
- ✅ Component-based logging with prefixes
- ✅ Configurable via environment variables
- ✅ Zero dependencies (uses standard library only)

## Configuration

### Environment Variables
- `LOG_LEVEL`: Set logging level (DEBUG, INFO, WARN, ERROR, FATAL). Default: INFO
- `LOG_FORMAT`: Set output format (`json` or `text`). Default: text

### Examples
```bash
# Development mode - human-readable
export LOG_LEVEL=DEBUG
export LOG_FORMAT=text

# Production mode - JSON for log aggregation
export LOG_LEVEL=INFO
export LOG_FORMAT=json
```

## Usage

### Basic Logging
```go
import "grader-engine-go/internal/logger"

// Simple messages
logger.Info("Server started")
logger.Error("Failed to connect")

// With structured fields
logger.Info("Request received", logger.Fields{
    "submission_id": 123,
    "language": "cpp",
    "user_id": 456,
})
```

### Component-based Logger
```go
// Create logger for specific component
log := logger.New("worker")

log.Info("Processing message", logger.Fields{
    "submission_id": 123,
})
// Output: 2025-10-24 10:30:45 ℹ️ [worker] Processing message submission_id=123
```

### Different Log Levels
```go
logger.Debug("Debug information")  // Only shown when LOG_LEVEL=DEBUG
logger.Info("Normal operation")
logger.Warn("Potential issue")
logger.Error("Error occurred")
logger.Fatal("Critical error")    // Exits with code 1
```

## Output Formats

### Text Format (Development)
```
2025-10-24 10:30:45 ℹ️ [worker] Processing submission submission_id=123 language=cpp
2025-10-24 10:30:46 ✅ [worker] Grading completed status=Accepted time_ms=234
2025-10-24 10:30:47 ❌ [pool] Container failed container_id=abc123
```

### JSON Format (Production)
```json
{"timestamp":"2025-10-24T10:30:45Z","level":"INFO","component":"worker","message":"Processing submission","submission_id":123,"language":"cpp"}
{"timestamp":"2025-10-24T10:30:46Z","level":"INFO","component":"worker","message":"Grading completed","status":"Accepted","time_ms":234}
{"timestamp":"2025-10-24T10:30:47Z","level":"ERROR","component":"pool","message":"Container failed","container_id":"abc123"}
```

## Migration from Standard `log`

### Before
```go
import "log"

log.Printf("Processing submission #%d", submissionID)
log.Printf("❌ Error: %v", err)
```

### After
```go
import "grader-engine-go/internal/logger"

logger.Info("Processing submission", logger.Fields{
    "submission_id": submissionID,
})
logger.Error("Processing failed", logger.Fields{
    "error": err.Error(),
})
```

## Benefits
1. **Searchable**: Fields can be indexed by log aggregators (ELK, Splunk, etc.)
2. **Filterable**: Easy to filter by submission_id, user_id, etc.
3. **Parseable**: JSON format is machine-readable
4. **Development-friendly**: Text format with emojis for quick visual scanning
5. **Production-ready**: Proper timestamps, levels, and structured data

## Best Practices
1. Use structured fields instead of formatting strings
2. Keep field names consistent across the codebase
3. Use INFO for normal operations
4. Use WARN for recoverable issues
5. Use ERROR for failures that need attention
6. Include context (submission_id, user_id, etc.) in fields
7. Don't log sensitive data (passwords, tokens, etc.)
