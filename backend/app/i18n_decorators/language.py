"""
Language Context Decorator

This module provides a decorator to inject user's preferred language into Flask's g object.
The language is determined from:
1. User's stored preference (if authenticated)
2. Accept-Language header (fallback)
3. Default to 'en' if neither is available

Usage:
    @with_user_language
    def get_problem(problem_id):
        lang = g.language  # Access user's preferred language
        problem = Problem.query.get(problem_id)
        title = problem.get_title(lang)
        ...
"""

from functools import wraps
from flask import request, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models import User

def with_user_language(f):
    """
    Decorator to inject user's preferred language into Flask's g object
    
    Priority order:
    1. Authenticated user's language preference from database
    2. Accept-Language header from request
    3. Default to 'en'
    
    The language is accessible via g.language in the decorated function
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Default language
        lang = 'en'
        
        # Try to get language from Accept-Language header first
        accept_language = request.headers.get('Accept-Language', '')
        if accept_language:
            # Parse Accept-Language header (e.g., "en-US,en;q=0.9,vi;q=0.8")
            # Take the first language code
            lang_code = accept_language.split(',')[0].split('-')[0].split(';')[0].lower()
            if lang_code in ['en', 'vi']:
                lang = lang_code
        
        # Try to get authenticated user's preference (overrides header)
        try:
            # Verify JWT without raising exception if not present
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            
            if user_id:
                user = User.query.get(user_id)
                if user and user.language:
                    lang = user.language
        except Exception:
            # If JWT verification fails or user not found, continue with header/default
            pass
        
        # Store language in Flask's g object for use in the request context
        g.language = lang
        
        return f(*args, **kwargs)
    
    return decorated_function


def get_request_language():
    """
    Helper function to get the language for the current request
    
    Returns:
        str: Language code ('en' or 'vi')
    """
    return getattr(g, 'language', 'en')
