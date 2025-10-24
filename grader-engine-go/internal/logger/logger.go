package logger

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

// Level represents log level
type Level string

const (
	DEBUG Level = "DEBUG"
	INFO  Level = "INFO"
	WARN  Level = "WARN"
	ERROR Level = "ERROR"
	FATAL Level = "FATAL"
)

// Logger provides structured logging
type Logger struct {
	level     Level
	useJSON   bool
	prefix    string
	stdLogger *log.Logger
}

// Fields represents structured log fields
type Fields map[string]interface{}

// New creates a new structured logger
func New(prefix string) *Logger {
	useJSON := os.Getenv("LOG_FORMAT") == "json"
	level := getLogLevel(os.Getenv("LOG_LEVEL"))

	return &Logger{
		level:     level,
		useJSON:   useJSON,
		prefix:    prefix,
		stdLogger: log.New(os.Stdout, "", 0),
	}
}

// Default logger for quick use
var defaultLogger = New("")

// getLogLevel parses log level from string
func getLogLevel(levelStr string) Level {
	switch levelStr {
	case "DEBUG":
		return DEBUG
	case "INFO":
		return INFO
	case "WARN":
		return WARN
	case "ERROR":
		return ERROR
	case "FATAL":
		return FATAL
	default:
		return INFO
	}
}

// shouldLog checks if message should be logged based on level
func (l *Logger) shouldLog(level Level) bool {
	levels := map[Level]int{
		DEBUG: 0,
		INFO:  1,
		WARN:  2,
		ERROR: 3,
		FATAL: 4,
	}
	return levels[level] >= levels[l.level]
}

// log performs the actual logging
func (l *Logger) log(level Level, msg string, fields Fields) {
	if !l.shouldLog(level) {
		return
	}

	if l.useJSON {
		l.logJSON(level, msg, fields)
	} else {
		l.logText(level, msg, fields)
	}
}

// logJSON outputs structured JSON logs
func (l *Logger) logJSON(level Level, msg string, fields Fields) {
	entry := map[string]interface{}{
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"level":     level,
		"message":   msg,
	}

	if l.prefix != "" {
		entry["component"] = l.prefix
	}

	// Add custom fields
	for k, v := range fields {
		entry[k] = v
	}

	jsonBytes, _ := json.Marshal(entry)
	l.stdLogger.Println(string(jsonBytes))
}

// logText outputs human-readable logs (default)
func (l *Logger) logText(level Level, msg string, fields Fields) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")

	var icon string
	switch level {
	case DEBUG:
		icon = "🔍"
	case INFO:
		icon = "ℹ️"
	case WARN:
		icon = "⚠️"
	case ERROR:
		icon = "❌"
	case FATAL:
		icon = "💀"
	}

	prefix := ""
	if l.prefix != "" {
		prefix = fmt.Sprintf("[%s] ", l.prefix)
	}

	fieldsStr := ""
	if len(fields) > 0 {
		fieldsStr = " " + formatFields(fields)
	}

	l.stdLogger.Printf("%s %s %s%s%s", timestamp, icon, prefix, msg, fieldsStr)
}

// formatFields formats fields for text output
func formatFields(fields Fields) string {
	if len(fields) == 0 {
		return ""
	}

	result := ""
	for k, v := range fields {
		result += fmt.Sprintf("%s=%v ", k, v)
	}
	return result
}

// Debug logs debug message
func (l *Logger) Debug(msg string, fields ...Fields) {
	f := mergeFields(fields...)
	l.log(DEBUG, msg, f)
}

// Info logs info message
func (l *Logger) Info(msg string, fields ...Fields) {
	f := mergeFields(fields...)
	l.log(INFO, msg, f)
}

// Warn logs warning message
func (l *Logger) Warn(msg string, fields ...Fields) {
	f := mergeFields(fields...)
	l.log(WARN, msg, f)
}

// Error logs error message
func (l *Logger) Error(msg string, fields ...Fields) {
	f := mergeFields(fields...)
	l.log(ERROR, msg, f)
}

// Fatal logs fatal message and exits
func (l *Logger) Fatal(msg string, fields ...Fields) {
	f := mergeFields(fields...)
	l.log(FATAL, msg, f)
	os.Exit(1)
}

// mergeFields combines multiple Fields maps
func mergeFields(fields ...Fields) Fields {
	result := make(Fields)
	for _, f := range fields {
		for k, v := range f {
			result[k] = v
		}
	}
	return result
}

// Package-level convenience functions
func Debug(msg string, fields ...Fields) { defaultLogger.Debug(msg, fields...) }
func Info(msg string, fields ...Fields)  { defaultLogger.Info(msg, fields...) }
func Warn(msg string, fields ...Fields)  { defaultLogger.Warn(msg, fields...) }
func Error(msg string, fields ...Fields) { defaultLogger.Error(msg, fields...) }
func Fatal(msg string, fields ...Fields) { defaultLogger.Fatal(msg, fields...) }
