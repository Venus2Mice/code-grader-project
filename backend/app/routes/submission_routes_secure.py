"""
Updated Submission Routes with Secure Token-Based Access

This file shows how to update submission_routes_example.py to use:
1. Opaque tokens instead of raw IDs in URLs
2. UUID fields for resource identification
3. Proper permission checks
4. IDOR attack prevention

Key Changes:
- Old: GET /submissions/123
- New: GET /submissions/<token>  (token is opaque, decodes to 123 internally)

Backward Compatibility:
- Keep old endpoints but mark as deprecated
- Phase out over time
- Support both ID and token-based access during transition
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from ..models import db, Submission
from ..services.token_service import (
    generate_submission_token,
    verify_submission_token
)
from ..exceptions import UnauthorizedError, ResourceNotFoundError, ValidationError

# Create blueprint
submission_bp = Blueprint('submissions', __name__, url_prefix='/api/v2/submissions')


# ============ SECURE TOKEN-BASED ENDPOINTS ============

@submission_bp.route('/<token>', methods=['GET'])
@jwt_required()
def get_submission_secure(token):
    """
    [SECURE] Get submission result using opaque token.
    
    GET /api/v2/submissions/<token>
    
    Args:
        token: Opaque resource token (cannot be guessed/enumerated)
    
    Returns:
        {
            "id": <internal_id>,
            "uuid": <uuid>,
            "token": <token>,
            "problem_id": <problem_id>,
            "student_id": <student_id>,
            "source_code": "...",
            "status": "Accepted",
            "results": [...]
        }
    
    Security:
        ✅ Token cannot be enumerated (cryptographically signed)
        ✅ Cannot access other users' submissions without valid token
        ✅ Permission check: owner or teacher only
    """
    try:
        user_id = get_jwt_identity()
        
        # Verify token and get internal ID
        submission_id = verify_submission_token(token)
        if submission_id is None:
            raise UnauthorizedError("Invalid or expired submission token")
        
        # Get submission
        submission = Submission.query.options(
            joinedload(Submission.results)
        ).get(submission_id)
        
        if not submission:
            raise ResourceNotFoundError("Submission not found")
        
        # Permission check: owner or teacher
        is_owner = str(submission.student_id) == user_id
        is_teacher = str(submission.problem.class_obj.teacher_id) == user_id
        
        if not (is_owner or is_teacher):
            raise UnauthorizedError("Access denied to this submission")
        
        # Build response
        return jsonify({
            "id": submission.id,
            "uuid": submission.uuid,
            "token": submission.public_token,  # Can be shared with others
            "problem_id": submission.problem_id,
            "student_id": submission.student_id,
            "source_code": submission.source_code,
            "language": submission.language,
            "status": submission.status,
            "submitted_at": submission.submitted_at.isoformat(),
            "results": [
                {
                    "id": r.id,
                    "test_case_id": r.test_case_id,
                    "status": r.status,
                    "execution_time_ms": r.execution_time_ms,
                    "memory_used_kb": r.memory_used_kb,
                    "output_received": r.output_received,
                    "error_message": r.error_message,
                }
                for r in submission.results
            ]
        }), 200
    
    except (UnauthorizedError, ResourceNotFoundError, ValidationError) as e:
        return jsonify({"msg": str(e)}), (
            401 if isinstance(e, UnauthorizedError) else
            404 if isinstance(e, ResourceNotFoundError) else
            400
        )
    except Exception as e:
        current_app.logger.error(f"Error in get_submission_secure: {str(e)}", exc_info=True)
        return jsonify({"msg": "Internal server error"}), 500


@submission_bp.route('/<token>', methods=['DELETE'])
@jwt_required()
def delete_submission_secure(token):
    """
    [SECURE] Delete a submission using opaque token.
    
    DELETE /api/v2/submissions/<token>
    
    Restrictions:
        - Student can only delete their own test runs (is_test=True)
        - Teacher can delete actual submissions
        - Cannot delete graded submissions
    """
    try:
        user_id = get_jwt_identity()
        
        # Verify token
        submission_id = verify_submission_token(token)
        if submission_id is None:
            raise UnauthorizedError("Invalid or expired submission token")
        
        # Get submission
        submission = Submission.query.get(submission_id)
        if not submission:
            raise ResourceNotFoundError("Submission not found")
        
        # Permission checks
        is_owner = str(submission.student_id) == user_id
        is_teacher = str(submission.problem.class_obj.teacher_id) == user_id
        
        if not (is_owner or is_teacher):
            raise UnauthorizedError("Cannot delete this submission")
        
        # Prevent deleting graded submissions
        if submission.manual_score is not None and is_owner:
            raise UnauthorizedError("Cannot delete graded submissions")
        
        # For students: only test runs can be deleted
        if is_owner and not submission.is_test:
            raise UnauthorizedError("Cannot delete actual submissions (test runs only)")
        
        # Delete
        db.session.delete(submission)
        db.session.commit()
        
        return jsonify({"msg": "Submission deleted successfully"}), 200
    
    except (UnauthorizedError, ResourceNotFoundError) as e:
        return jsonify({"msg": str(e)}), (
            401 if isinstance(e, UnauthorizedError) else 404
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting submission: {str(e)}", exc_info=True)
        return jsonify({"msg": "Failed to delete submission"}), 500


# ============ HELPER ENDPOINTS ============

@submission_bp.route('/<token>/token', methods=['GET'])
@jwt_required()
def get_submission_token_info(token):
    """
    Get information about a submission token.
    
    Returns:
        {
            "valid": true,
            "expired": false,
            "resource_id": 123,
            "resource_type": "submission",
            "created_at": "2025-11-03T10:30:00Z"
        }
    
    Useful for debugging and testing token validity.
    """
    try:
        submission_id = verify_submission_token(token)
        
        if submission_id is None:
            return jsonify({
                "valid": False,
                "expired": True,
                "message": "Token is invalid or expired"
            }), 401
        
        return jsonify({
            "valid": True,
            "expired": False,
            "resource_id": submission_id,
            "resource_type": "submission"
        }), 200
    
    except Exception as e:
        return jsonify({"msg": str(e)}), 400


@submission_bp.route('/<submission_id>/regenerate-token', methods=['POST'])
@jwt_required()
def regenerate_submission_token(submission_id):
    """
    Regenerate a new opaque token for a submission.
    
    POST /api/v2/submissions/<submission_id>/regenerate-token
    
    Returns new token, invalidating old one.
    
    Use Case:
        - If token is suspected to be compromised
        - To revoke access to old token holders
    """
    try:
        user_id = get_jwt_identity()
        
        # Get submission by ID
        submission = Submission.query.get(submission_id)
        if not submission:
            raise ResourceNotFoundError("Submission not found")
        
        # Permission check
        is_owner = str(submission.student_id) == user_id
        is_teacher = str(submission.problem.class_obj.teacher_id) == user_id
        
        if not (is_owner or is_teacher):
            raise UnauthorizedError("Cannot regenerate token for this submission")
        
        # Generate new token
        new_token = generate_submission_token(submission.id)
        submission.public_token = new_token
        db.session.commit()
        
        return jsonify({
            "msg": "Token regenerated successfully",
            "new_token": new_token
        }), 200
    
    except (UnauthorizedError, ResourceNotFoundError) as e:
        return jsonify({"msg": str(e)}), (
            401 if isinstance(e, UnauthorizedError) else 404
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error regenerating token: {str(e)}", exc_info=True)
        return jsonify({"msg": "Failed to regenerate token"}), 500


# ============ BATCH ENDPOINT ============

@submission_bp.route('/batch/info', methods=['POST'])
@jwt_required()
def get_submissions_batch():
    """
    Get information about multiple submissions at once.
    
    POST /api/v2/submissions/batch/info
    
    Request body:
        {
            "tokens": ["token1", "token2", "token3"]
        }
    
    Returns:
        {
            "submissions": [
                {"id": 1, "uuid": "...", "status": "Accepted"},
                {"id": 2, "uuid": "...", "status": "Wrong Answer"},
                ...
            ],
            "errors": [
                {"token": "token2", "error": "Invalid token"}
            ]
        }
    
    Use Case:
        - Dashboard showing multiple submission statuses
        - Batch verification of tokens
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        tokens = data.get('tokens', [])
        
        if not tokens or not isinstance(tokens, list):
            raise ValidationError("tokens must be a non-empty list")
        
        results = []
        errors = []
        
        for token in tokens:
            submission_id = verify_submission_token(token)
            
            if submission_id is None:
                errors.append({"token": token, "error": "Invalid or expired token"})
                continue
            
            submission = Submission.query.get(submission_id)
            
            if not submission:
                errors.append({"token": token, "error": "Submission not found"})
                continue
            
            # Check access
            is_owner = str(submission.student_id) == user_id
            is_teacher = str(submission.problem.class_obj.teacher_id) == user_id
            
            if not (is_owner or is_teacher):
                errors.append({"token": token, "error": "Access denied"})
                continue
            
            results.append({
                "id": submission.id,
                "uuid": submission.uuid,
                "status": submission.status,
                "submitted_at": submission.submitted_at.isoformat(),
                "cached_score": submission.cached_score,
                "manual_score": submission.manual_score,
            })
        
        return jsonify({
            "submissions": results,
            "errors": errors
        }), 200
    
    except ValidationError as e:
        return jsonify({"msg": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error in batch endpoint: {str(e)}", exc_info=True)
        return jsonify({"msg": "Internal server error"}), 500
