"""
Centralized Error Handlers for Flask Application
Handles all exceptions and returns consistent JSON responses
"""

from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from jwt.exceptions import PyJWTError
from .exceptions import APIException
import traceback


def register_error_handlers(app):
    """Register all error handlers with the Flask app"""
    
    @app.errorhandler(APIException)
    def handle_api_exception(error):
        """Handle custom API exceptions"""
        current_app.logger.error(f"API Exception: {error.message}")
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle werkzeug HTTP exceptions"""
        current_app.logger.warning(f"HTTP Exception: {error.code} - {error.description}")
        response = jsonify({
            'status': 'error',
            'message': error.description,
            'code': error.code
        })
        response.status_code = error.code
        return response
    
    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        """Handle database integrity errors (duplicates, foreign keys, etc.)"""
        current_app.logger.error(f"Database Integrity Error: {str(error)}")
        
        # Parse common integrity errors
        error_msg = str(error.orig)
        if 'duplicate key' in error_msg.lower() or 'unique constraint' in error_msg.lower():
            message = "A record with this information already exists"
        elif 'foreign key' in error_msg.lower():
            message = "Referenced resource does not exist"
        elif 'not null' in error_msg.lower():
            message = "Required field is missing"
        else:
            message = "Database constraint violation"
        
        response = jsonify({
            'status': 'error',
            'message': message,
            'details': str(error.orig) if app.debug else None
        })
        response.status_code = 409
        return response
    
    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(error):
        """Handle general SQLAlchemy errors"""
        current_app.logger.error(f"SQLAlchemy Error: {str(error)}", exc_info=True)
        
        response = jsonify({
            'status': 'error',
            'message': 'Database operation failed',
            'details': str(error) if app.debug else None
        })
        response.status_code = 500
        return response
    
    @app.errorhandler(PyJWTError)
    def handle_jwt_error(error):
        """Handle JWT-related errors"""
        current_app.logger.warning(f"JWT Error: {str(error)}")
        
        response = jsonify({
            'status': 'error',
            'message': 'Invalid or expired token',
            'details': str(error) if app.debug else None
        })
        response.status_code = 401
        return response
    
    @app.errorhandler(ValueError)
    def handle_value_error(error):
        """Handle value errors (usually from validation)"""
        current_app.logger.warning(f"Value Error: {str(error)}")
        
        response = jsonify({
            'status': 'error',
            'message': 'Invalid input value',
            'details': str(error)
        })
        response.status_code = 400
        return response
    
    @app.errorhandler(KeyError)
    def handle_key_error(error):
        """Handle missing key errors"""
        current_app.logger.warning(f"Key Error: {str(error)}")
        
        response = jsonify({
            'status': 'error',
            'message': f'Missing required field: {str(error)}'
        })
        response.status_code = 400
        return response
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors"""
        response = jsonify({
            'status': 'error',
            'message': 'The requested resource was not found'
        })
        response.status_code = 404
        return response
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 errors"""
        response = jsonify({
            'status': 'error',
            'message': 'Method not allowed for this endpoint'
        })
        response.status_code = 405
        return response
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 errors"""
        current_app.logger.error(f"Internal Server Error: {str(error)}", exc_info=True)
        
        response = jsonify({
            'status': 'error',
            'message': 'An internal server error occurred',
            'details': str(error) if app.debug else None
        })
        response.status_code = 500
        return response
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Catch-all handler for unexpected errors"""
        current_app.logger.critical(
            f"Unexpected Error: {str(error)}\n{traceback.format_exc()}"
        )
        
        response = jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred',
            'type': type(error).__name__,
            'details': str(error) if app.debug else None
        })
        response.status_code = 500
        return response


def handle_validation_error(errors):
    """
    Helper function to format validation errors
    Used with marshmallow or custom validation
    """
    return jsonify({
        'status': 'error',
        'message': 'Validation failed',
        'errors': errors
    }), 400
