from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from .models import User

def role_required(role_name):
    """
    Decorator to require a specific role for accessing an endpoint.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Get the current user's identity from the JWT
            current_user_id = get_jwt_identity()
            # Fetch the user from the database
            user = User.query.get(current_user_id)

            # Check if the user exists and has the required role
            if not user or user.role.name != role_name:
                # If not authorized, return a 403 Forbidden response
                return jsonify({"msg": f"'{role_name}' role required"}), 403 # 403 Forbidden

            # If the user has the required role, proceed with the original function
            return fn(*args, **kwargs)
        return wrapper
    return decorator