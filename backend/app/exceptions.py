"""
Custom Exception Classes for Code Grader Application
Provides structured error handling with appropriate HTTP status codes
"""

class APIException(Exception):
    """Base exception class for all API errors"""
    status_code = 500
    message = "An error occurred"
    
    def __init__(self, message=None, status_code=None, payload=None):
        super().__init__()
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
    
    def to_dict(self):
        """Convert exception to dictionary for JSON response"""
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status'] = 'error'
        return rv


class ValidationError(APIException):
    """Raised when request validation fails"""
    status_code = 400
    message = "Validation error"


class AuthenticationError(APIException):
    """Raised when authentication fails"""
    status_code = 401
    message = "Authentication failed"


class UnauthorizedError(APIException):
    """Raised when user lacks required permissions"""
    status_code = 403
    message = "You don't have permission to access this resource"


class ResourceNotFoundError(APIException):
    """Raised when requested resource doesn't exist"""
    status_code = 404
    message = "Resource not found"


class DuplicateResourceError(APIException):
    """Raised when trying to create a duplicate resource"""
    status_code = 409
    message = "Resource already exists"


class DatabaseError(APIException):
    """Raised when database operation fails"""
    status_code = 500
    message = "Database operation failed"


class ExternalServiceError(APIException):
    """Raised when external service (RabbitMQ, etc.) fails"""
    status_code = 503
    message = "External service unavailable"


class RateLimitExceeded(APIException):
    """Raised when rate limit is exceeded"""
    status_code = 429
    message = "Rate limit exceeded. Please try again later."


class InvalidTokenError(APIException):
    """Raised when JWT token is invalid or expired"""
    status_code = 401
    message = "Invalid or expired token"


class FileUploadError(APIException):
    """Raised when file upload fails"""
    status_code = 400
    message = "File upload failed"


class SubmissionError(APIException):
    """Raised when submission processing fails"""
    status_code = 422
    message = "Submission processing failed"
