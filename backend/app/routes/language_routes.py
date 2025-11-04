"""
Language Routes - API endpoints for language preference management

This module provides endpoints for:
1. Getting user's language preference
2. Updating user's language preference
3. Getting localized problem content based on user preference

Routes:
- GET    /api/language/preference     - Get current user's language preference
- PUT    /api/language/preference     - Update current user's language preference
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User

language_bp = Blueprint('language', __name__, url_prefix='/api/language')

@language_bp.route('/preference', methods=['GET'])
@jwt_required()
def get_language_preference():
    """
    Get the current user's language preference
    
    Returns:
        200: {"language": "en"} or {"language": "vi"}
        404: User not found
        500: Internal server error
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"msg": "User not found"}), 404
        
        return jsonify({
            "language": user.language,
            "user_id": user.id,
            "email": user.email
        }), 200
        
    except Exception as e:
        return jsonify({"msg": "Failed to get language preference"}), 500


@language_bp.route('/preference', methods=['PUT'])
@jwt_required()
def update_language_preference():
    """
    Update the current user's language preference
    
    Request Body:
        {
            "language": "en" | "vi"
        }
    
    Returns:
        200: {"language": "en", "message": "Language preference updated"}
        400: Invalid language value
        404: User not found
        500: Internal server error
    """
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        if not data or 'language' not in data:
            return jsonify({"msg": "Language field is required"}), 400
        
        language = data.get('language', '').lower()
        
        # Validate language value
        if language not in ['en', 'vi']:
            return jsonify({
                "msg": "Invalid language. Supported languages: 'en', 'vi'"
            }), 400
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"msg": "User not found"}), 404
        
        # Update language preference
        old_language = user.language
        user.language = language
        db.session.commit()
        
        return jsonify({
            "language": user.language,
            "message": "Language preference updated successfully",
            "previous_language": old_language
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to update language preference"}), 500


@language_bp.route('/supported', methods=['GET'])
def get_supported_languages():
    """
    Get list of supported languages
    
    Returns:
        200: List of supported languages with metadata
    """
    supported_languages = [
        {
            "code": "en",
            "name": "English",
            "native_name": "English",
            "flag": "🇬🇧"
        },
        {
            "code": "vi",
            "name": "Vietnamese",
            "native_name": "Tiếng Việt",
            "flag": "🇻🇳"
        }
    ]
    
    return jsonify({
        "languages": supported_languages,
        "default": "en"
    }), 200
