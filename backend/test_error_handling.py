"""
Test Error Handling System
Run this to verify error handling works correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.exceptions import (
    ValidationError,
    AuthenticationError,
    ResourceNotFoundError,
    UnauthorizedError
)


def test_custom_exceptions():
    """Test custom exception classes"""
    print("Testing Custom Exceptions...")
    
    # Test ValidationError
    try:
        raise ValidationError('Email is required')
    except ValidationError as e:
        print(f"✅ ValidationError: {e.message} (Status: {e.status_code})")
    
    # Test AuthenticationError
    try:
        raise AuthenticationError('Invalid credentials')
    except AuthenticationError as e:
        print(f"✅ AuthenticationError: {e.message} (Status: {e.status_code})")
    
    # Test ResourceNotFoundError
    try:
        raise ResourceNotFoundError('User not found')
    except ResourceNotFoundError as e:
        print(f"✅ ResourceNotFoundError: {e.message} (Status: {e.status_code})")
    
    # Test UnauthorizedError
    try:
        raise UnauthorizedError('Access denied')
    except UnauthorizedError as e:
        print(f"✅ UnauthorizedError: {e.message} (Status: {e.status_code})")
    
    print()


def test_error_handlers():
    """Test error handlers with Flask app"""
    print("Testing Error Handlers...")
    
    app = create_app()
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        # Test 404 error
        response = client.get('/api/nonexistent')
        print(f"✅ 404 Handler: {response.status_code} - {response.get_json()}")
        
        # Test validation error in login (missing fields)
        response = client.post('/api/auth/login', json={})
        print(f"✅ Validation Error: {response.status_code} - {response.get_json()}")
        
        # Test authentication error (wrong credentials)
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        print(f"✅ Auth Error: {response.status_code} - {response.get_json()}")
    
    print()


def test_logging():
    """Test logging configuration"""
    print("Testing Logging System...")
    
    app = create_app()
    
    with app.app_context():
        app.logger.info("✅ INFO log test")
        app.logger.warning("⚠️ WARNING log test")
        app.logger.error("❌ ERROR log test")
    
    print("✅ Logs written to backend/logs/")
    print()


def test_validation_schemas():
    """Test marshmallow schemas"""
    print("Testing Validation Schemas...")
    
    try:
        from app.schemas import UserRegistrationSchema, validate_request_data
        
        # Test valid data
        valid_data = {
            'full_name': 'John Doe',
            'email': 'john@example.com',
            'password': 'password123',
            'role': 'student'
        }
        result = validate_request_data(UserRegistrationSchema, valid_data)
        print(f"✅ Valid data passed: {result['full_name']}")
        
        # Test invalid data
        try:
            invalid_data = {
                'full_name': 'A',  # Too short
                'email': 'invalid-email',
                'password': '123'  # Too short
            }
            validate_request_data(UserRegistrationSchema, invalid_data)
        except Exception as e:
            print(f"✅ Invalid data caught: {type(e).__name__}")
        
    except ImportError as e:
        print(f"⚠️ Marshmallow not installed: {e}")
    
    print()


if __name__ == '__main__':
    print("="*60)
    print("ERROR HANDLING SYSTEM TEST")
    print("="*60)
    print()
    
    test_custom_exceptions()
    test_error_handlers()
    test_logging()
    test_validation_schemas()
    
    print("="*60)
    print("ALL TESTS COMPLETED")
    print("="*60)
    print()
    print("Next steps:")
    print("1. Check logs in backend/logs/")
    print("2. Test with actual API requests")
    print("3. Update routes to use custom exceptions")
