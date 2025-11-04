"""
Decorators Package

This package contains custom Flask decorators for:
- Language/i18n context injection
- Role-based access control (re-exported from parent module)
"""

from .language import with_user_language, get_request_language

# Re-export role_required from parent module for backward compatibility
import sys
import os
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)
from app.decorators import role_required

__all__ = [
    'role_required',
    'with_user_language',
    'get_request_language'
]
