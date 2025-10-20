/**
 * Frontend Logger Utility
 * 
 * A centralized logging system that:
 * - COMPLETELY DISABLED in production (no console output)
 * - Only logs in development mode
 * - Prevents sensitive data leakage
 * - Provides structured logging with levels
 * - Easy to integrate with external logging services
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment: boolean
  private minLevel: LogLevel
  private isEnabled: boolean

  constructor() {
    // Multiple checks to ensure we're really in development
    this.isDevelopment = 
      process.env.NODE_ENV === 'development' || 
      (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    
    // In production, COMPLETELY disable logging
    this.isEnabled = this.isDevelopment
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR
  }

  /**
   * Check if logging is enabled (production safety)
   */
  private canLog(): boolean {
    return this.isEnabled
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveKeys = ['token', 'password', 'authorization', 'secret', 'apiKey', 'api_key', 'access_token', 'refresh_token']
    const sanitized = Array.isArray(data) ? [...data] : { ...data }

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key])
      }
    }

    return sanitized
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(this.sanitize(context))}` : ''
    return `[${timestamp}] [${level}] ${message}${contextStr}`
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.canLog()) return false
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    console.debug(this.formatMessage(LogLevel.DEBUG, message, context))
  }

  /**
   * Log info messages (development only)
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    console.log(this.formatMessage(LogLevel.INFO, message, context))
  }

  /**
   * Log warning messages (development only, production sends to external service)
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    console.warn(this.formatMessage(LogLevel.WARN, message, context))
  }

  /**
   * Log error messages
   * In production: completely silent in console, can send to external service
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (!this.canLog()) {
      // In production: Silent in console, but can send to Sentry/LogRocket here
      // Example: Sentry.captureException(error, { extra: context })
      return
    }

    const errorDetails: LogContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        name: error.name,
      } : error,
    }

    console.error(this.formatMessage(LogLevel.ERROR, message, errorDetails))
  }

  /**
   * Group logs together (development only)
   */
  group(label: string, callback: () => void): void {
    if (!this.canLog()) return
    console.group(label)
    callback()
    console.groupEnd()
  }

  /**
   * Measure execution time (development only)
   */
  time(label: string): void {
    if (!this.canLog()) return
    console.time(label)
  }

  timeEnd(label: string): void {
    if (!this.canLog()) return
    console.timeEnd(label)
  }

  /**
   * Log table data (development only)
   */
  table(data: any): void {
    if (!this.canLog()) return
    console.table(this.sanitize(data))
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience methods
export default logger
