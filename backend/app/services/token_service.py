"""
Token Service for generating and verifying opaque resource tokens.

This service provides:
1. Opaque token generation for resources (submissions, problems, classes, users)
2. Secure token verification with expiration and salt support
3. Mapping between tokens and internal IDs
"""

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app
from typing import Optional, Union


class TokenService:
    """
    Manages opaque tokens for resources using itsdangerous URLSafeTimedSerializer.
    
    Benefits:
    - Tokens are cryptographically signed
    - Cannot be forged without the SECRET_KEY
    - Can have expiration time
    - Human-readable and URL-safe
    - Prevents direct ID enumeration and IDOR attacks
    """
    
    # Default expiration times (in seconds)
    DEFAULT_TOKEN_EXPIRY = 86400 * 365  # 1 year (practically never expires)
    SHORT_TERM_EXPIRY = 3600  # 1 hour
    
    @staticmethod
    def _get_serializer(salt: str = 'resource-token') -> URLSafeTimedSerializer:
        """Get the serializer instance with a specific salt."""
        return URLSafeTimedSerializer(
            current_app.config['SECRET_KEY'],
            salt=salt
        )
    
    @staticmethod
    def generate_token(
        resource_id: int,
        resource_type: str,
        expiry_seconds: Optional[int] = None
    ) -> str:
        """
        Generate an opaque token for a resource.
        
        Args:
            resource_id: Internal database ID
            resource_type: Type of resource (e.g., 'submission', 'problem', 'class', 'user')
            expiry_seconds: Token expiration time in seconds (None = 1 year)
        
        Returns:
            URL-safe opaque token string
        
        Example:
            token = TokenService.generate_token(123, 'submission')
            # Returns: 'eyJpZCI6IDE ...' (long random string)
        """
        if expiry_seconds is None:
            expiry_seconds = TokenService.DEFAULT_TOKEN_EXPIRY
        
        serializer = TokenService._get_serializer(salt=f'{resource_type}-token')
        
        # Serialize both ID and type for extra security
        data = {
            'id': resource_id,
            'type': resource_type
        }
        
        token = serializer.dumps(data, expires_in=expiry_seconds)
        return token
    
    @staticmethod
    def verify_token(
        token: str,
        resource_type: str,
        max_age_seconds: Optional[int] = None
    ) -> Optional[int]:
        """
        Verify and decode an opaque token.
        
        Args:
            token: The token to verify
            resource_type: Expected resource type (for validation)
            max_age_seconds: Optional maximum age of token
        
        Returns:
            Internal resource ID if valid, None if invalid/expired
        
        Example:
            resource_id = TokenService.verify_token(token, 'submission')
            if resource_id is None:
                return jsonify({'msg': 'Invalid or expired token'}), 401
        """
        try:
            serializer = TokenService._get_serializer(salt=f'{resource_type}-token')
            data = serializer.loads(token, max_age=max_age_seconds)
            
            # Verify the type matches
            if data.get('type') != resource_type:
                return None
            
            return data.get('id')
        
        except SignatureExpired:
            # Token has expired
            return None
        except BadSignature:
            # Token is invalid or forged
            return None
        except Exception:
            # Any other error
            return None
    
    @staticmethod
    def batch_generate_tokens(
        resource_ids: list,
        resource_type: str,
        expiry_seconds: Optional[int] = None
    ) -> dict:
        """
        Generate tokens for multiple resources efficiently.
        
        Args:
            resource_ids: List of internal IDs
            resource_type: Type of resource
            expiry_seconds: Token expiration time
        
        Returns:
            Dictionary mapping {resource_id: token}
        
        Example:
            tokens = TokenService.batch_generate_tokens([1, 2, 3], 'problem')
            # Returns: {1: 'token1', 2: 'token2', 3: 'token3'}
        """
        return {
            rid: TokenService.generate_token(rid, resource_type, expiry_seconds)
            for rid in resource_ids
        }


# Convenience functions for different resource types

def generate_submission_token(submission_id: int) -> str:
    """Generate token for submission (1 year expiry)."""
    return TokenService.generate_token(submission_id, 'submission')


def verify_submission_token(token: str) -> Optional[int]:
    """Verify submission token."""
    return TokenService.verify_token(token, 'submission')


def generate_problem_token(problem_id: int) -> str:
    """Generate token for problem (1 year expiry)."""
    return TokenService.generate_token(problem_id, 'problem')


def verify_problem_token(token: str) -> Optional[int]:
    """Verify problem token."""
    return TokenService.verify_token(token, 'problem')


def generate_class_token(class_id: int) -> str:
    """Generate token for class (1 year expiry)."""
    return TokenService.generate_token(class_id, 'class')


def verify_class_token(token: str) -> Optional[int]:
    """Verify class token."""
    return TokenService.verify_token(token, 'class')


def generate_user_token(user_id: int) -> str:
    """Generate token for user (1 year expiry)."""
    return TokenService.generate_token(user_id, 'user')


def verify_user_token(token: str) -> Optional[int]:
    """Verify user token."""
    return TokenService.verify_token(token, 'user')
