"""
Logging Configuration for Code Grader Application
Provides structured logging with rotation and multiple handlers
"""

import logging
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
import os
from datetime import datetime


def setup_logging(app):
    """Configure logging for the application"""
    
    # Create logs directory if it doesn't exist
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    # Set logging level based on environment
    log_level = logging.DEBUG if app.debug else logging.INFO
    app.logger.setLevel(log_level)
    
    # Remove default handlers
    app.logger.handlers.clear()
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s (%(funcName)s:%(lineno)d): %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    simple_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console Handler (for development)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if app.debug else logging.INFO)
    console_handler.setFormatter(simple_formatter)
    app.logger.addHandler(console_handler)
    
    # General Application Log - Rotating by size
    app_log_file = os.path.join(logs_dir, 'app.log')
    app_handler = RotatingFileHandler(
        app_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    app_handler.setLevel(logging.INFO)
    app_handler.setFormatter(detailed_formatter)
    app.logger.addHandler(app_handler)
    
    # Error Log - Only errors and critical
    error_log_file = os.path.join(logs_dir, 'error.log')
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    app.logger.addHandler(error_handler)
    
    # Daily rotating log for audit trail
    audit_log_file = os.path.join(logs_dir, 'audit.log')
    audit_handler = TimedRotatingFileHandler(
        audit_log_file,
        when='midnight',
        interval=1,
        backupCount=30  # Keep 30 days
    )
    audit_handler.setLevel(logging.INFO)
    audit_handler.setFormatter(detailed_formatter)
    app.logger.addHandler(audit_handler)
    
    # Log startup message
    app.logger.info('='*60)
    app.logger.info(f'Code Grader Application Started')
    app.logger.info(f'Environment: {"Development" if app.debug else "Production"}')
    app.logger.info(f'Log Level: {logging.getLevelName(log_level)}')
    app.logger.info('='*60)
    
    return app.logger


class RequestLogger:
    """Middleware to log all HTTP requests"""
    
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        """Log request details"""
        from flask import request, g
        import time
        
        # Record start time
        g.start_time = time.time()
        
        def custom_start_response(status, headers, exc_info=None):
            """Custom response handler to log response details"""
            # Calculate request duration
            duration = time.time() - g.start_time
            
            # Log request details
            self.app.logger.info(
                f'{request.method} {request.path} - '
                f'Status: {status.split()[0]} - '
                f'Duration: {duration:.3f}s - '
                f'IP: {request.remote_addr}'
            )
            
            return start_response(status, headers, exc_info)
        
        return self.app(environ, custom_start_response)


def log_user_activity(user_id, action, details=None):
    """
    Log user activity for audit trail
    
    Args:
        user_id: ID of the user performing the action
        action: Description of the action
        details: Additional details (dict)
    """
    from flask import current_app, request
    
    log_message = f'User {user_id} - {action}'
    if details:
        log_message += f' - Details: {details}'
    log_message += f' - IP: {request.remote_addr if request else "N/A"}'
    
    current_app.logger.info(log_message)


def log_security_event(event_type, details, severity='WARNING'):
    """
    Log security-related events
    
    Args:
        event_type: Type of security event
        details: Event details
        severity: Log level (WARNING, ERROR, CRITICAL)
    """
    from flask import current_app, request
    
    log_message = f'SECURITY EVENT - {event_type}: {details}'
    if request:
        log_message += f' - IP: {request.remote_addr}'
    
    if severity == 'CRITICAL':
        current_app.logger.critical(log_message)
    elif severity == 'ERROR':
        current_app.logger.error(log_message)
    else:
        current_app.logger.warning(log_message)


def log_database_operation(operation, table, record_id=None, success=True):
    """
    Log database operations for debugging
    
    Args:
        operation: Type of operation (CREATE, UPDATE, DELETE)
        table: Table name
        record_id: ID of the affected record
        success: Whether operation was successful
    """
    from flask import current_app
    
    status = 'SUCCESS' if success else 'FAILED'
    log_message = f'DB {operation} on {table}'
    if record_id:
        log_message += f' (ID: {record_id})'
    log_message += f' - {status}'
    
    if success:
        current_app.logger.debug(log_message)
    else:
        current_app.logger.error(log_message)
