"""
Resource Access Control Decorators

Provides decorators for securing resource access:
1. @verify_resource_access - Verify user can access specific resource
2. @secure_resource_lookup - Automatically resolve token to resource
"""

from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..services.token_service import (
    verify_submission_token,
    verify_problem_token,
    verify_class_token,
    verify_user_token
)
from ..exceptions import UnauthorizedError, ResourceNotFoundError
from ..models import Submission, Problem, Class, User


class TokenVerifier:
    """Maps resource types to their token verifiers."""
    
    VERIFIERS = {
        'submission': verify_submission_token,
        'problem': verify_problem_token,
        'class': verify_class_token,
        'user': verify_user_token,
    }
    
    @staticmethod
    def verify(token: str, resource_type: str) -> int:
        """
        Verify a token and return the resource ID.
        
        Args:
            token: The opaque token
            resource_type: Type of resource
        
        Returns:
            Internal resource ID
        
        Raises:
            UnauthorizedError: If token is invalid or expired
        """
        if resource_type not in TokenVerifier.VERIFIERS:
            raise ValueError(f"Unknown resource type: {resource_type}")
        
        verifier = TokenVerifier.VERIFIERS[resource_type]
        resource_id = verifier(token)
        
        if resource_id is None:
            raise UnauthorizedError(f"Invalid or expired {resource_type} token")
        
        return resource_id


def verify_resource_ownership(
    resource_type: str,
    ownership_check
):
    """
    Decorator to verify user owns or has access to a resource.
    
    Args:
        resource_type: Type of resource (submission, problem, class)
        ownership_check: Function(resource, user_id) -> bool
    
    Example:
        def check_submission_access(submission, user_id):
            return str(submission.student_id) == user_id
        
        @app.route('/submissions/<token>')
        @jwt_required()
        @verify_resource_ownership('submission', check_submission_access)
        def get_submission(submission):
            return jsonify(...)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            
            # Get token from URL parameter or query string
            token = kwargs.get('token') or request.args.get('token')
            
            if not token:
                raise UnauthorizedError("Missing resource token")
            
            try:
                # Verify token and get resource ID
                resource_id = TokenVerifier.verify(token, resource_type)
                
                # Look up resource
                if resource_type == 'submission':
                    resource = Submission.query.get(resource_id)
                elif resource_type == 'problem':
                    resource = Problem.query.get(resource_id)
                elif resource_type == 'class':
                    resource = Class.query.get(resource_id)
                elif resource_type == 'user':
                    resource = User.query.get(resource_id)
                else:
                    raise ValueError(f"Unknown resource type: {resource_type}")
                
                if not resource:
                    raise ResourceNotFoundError(
                        f"{resource_type.capitalize()} not found"
                    )
                
                # Check ownership
                if not ownership_check(resource, user_id):
                    raise UnauthorizedError(
                        f"Access denied to this {resource_type}"
                    )
                
                # Pass resource to handler instead of token
                kwargs['resource'] = resource
                kwargs.pop('token', None)
                
                return f(*args, **kwargs)
            
            except UnauthorizedError as e:
                return jsonify({"msg": str(e)}), 401
            except ResourceNotFoundError as e:
                return jsonify({"msg": str(e)}), 404
        
        return decorated_function
    return decorator


# Ownership check functions
def check_submission_ownership(submission, user_id: str) -> bool:
    """Check if user owns submission or is the teacher."""
    is_owner = str(submission.student_id) == user_id
    is_teacher = str(submission.problem.class_obj.teacher_id) == user_id
    return is_owner or is_teacher


def check_problem_ownership(problem, user_id: str) -> bool:
    """Check if user is the teacher of the problem's class."""
    return str(problem.class_obj.teacher_id) == user_id


def check_class_ownership(class_obj, user_id: str) -> bool:
    """Check if user is the teacher of the class."""
    return str(class_obj.teacher_id) == user_id


def check_class_membership(class_obj, user_id: str) -> bool:
    """Check if user is member or teacher of the class."""
    is_teacher = str(class_obj.teacher_id) == user_id
    is_student = any(str(s.id) == user_id for s in class_obj.students)
    return is_teacher or is_student
