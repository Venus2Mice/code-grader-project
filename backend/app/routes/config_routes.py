"""
System-wide configuration and metadata endpoints
"""

from flask import Blueprint, jsonify, make_response
from ..constants import (
    SUPPORTED_LANGUAGES, 
    ALL_DIFFICULTIES, 
    DEFAULT_LANGUAGE,
    DEFAULT_TIME_LIMIT_MS,
    DEFAULT_MEMORY_LIMIT_KB
)

config_bp = Blueprint('config', __name__, url_prefix='/api/config')

def add_cache_headers(response, max_age=3600):
    """Add cache control headers to response"""
    response.headers['Cache-Control'] = f'public, max-age={max_age}'
    response.headers['Vary'] = 'Accept-Encoding'
    return response

@config_bp.route('/languages', methods=['GET'])
def get_supported_languages():
    """
    Get list of supported programming languages
    This list is synchronized with the worker's language registry
    Cached for 1 hour
    """
    response = make_response(jsonify({
        "languages": SUPPORTED_LANGUAGES,
        "default": DEFAULT_LANGUAGE
    }), 200)
    return add_cache_headers(response)


@config_bp.route('/difficulties', methods=['GET'])
def get_difficulties():
    """Get list of supported difficulty levels (cached for 1 hour)"""
    response = make_response(jsonify({
        "difficulties": ALL_DIFFICULTIES
    }), 200)
    return add_cache_headers(response)


@config_bp.route('/limits', methods=['GET'])
def get_default_limits():
    """Get default resource limits (cached for 1 hour)"""
    response = make_response(jsonify({
        "time_limit_ms": DEFAULT_TIME_LIMIT_MS,
        "memory_limit_kb": DEFAULT_MEMORY_LIMIT_KB
    }), 200)
    return add_cache_headers(response)


@config_bp.route('/metadata', methods=['GET'])
def get_system_metadata():
    """
    Get comprehensive system metadata
    Useful for frontend configuration
    Cached for 1 hour
    """
    response = make_response(jsonify({
        "languages": {
            "supported": SUPPORTED_LANGUAGES,
            "default": DEFAULT_LANGUAGE
        },
        "difficulties": ALL_DIFFICULTIES,
        "limits": {
            "default_time_ms": DEFAULT_TIME_LIMIT_MS,
            "default_memory_kb": DEFAULT_MEMORY_LIMIT_KB
        },
        "version": "1.0.0"
    }), 200)
    return add_cache_headers(response)
