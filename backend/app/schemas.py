"""
Input Validation Schemas using Marshmallow
Provides structured validation for API requests
"""

from marshmallow import Schema, fields, validate, ValidationError, validates, validates_schema
import re
from .constants import (
    SUPPORTED_LANGUAGES, 
    DEFAULT_LANGUAGE, 
    ALL_DIFFICULTIES, 
    DIFFICULTY_MEDIUM,
    MIN_TIME_LIMIT_MS, 
    MAX_TIME_LIMIT_MS,
    MIN_MEMORY_LIMIT_KB, 
    MAX_MEMORY_LIMIT_KB,
    DEFAULT_TIME_LIMIT_MS,
    DEFAULT_MEMORY_LIMIT_KB,
    MIN_TEST_CASE_POINTS,
    MAX_TEST_CASE_POINTS,
    DEFAULT_TEST_CASE_POINTS,
    MSG_INVALID_LANGUAGE,
    MSG_INVALID_DIFFICULTY
)


class UserRegistrationSchema(Schema):
    """Schema for user registration"""
    full_name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100),
        error_messages={'required': 'Full name is required'}
    )
    email = fields.Email(
        required=True,
        error_messages={'required': 'Email is required', 'invalid': 'Invalid email format'}
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=6, max=128),
        error_messages={'required': 'Password is required'}
    )
    role = fields.Str(
        missing='student',
        validate=validate.OneOf(['student', 'teacher']),
        error_messages={'validator_failed': 'Role must be either student or teacher'}
    )
    
    @validates('password')
    def validate_password(self, value):
        """Validate password strength"""
        if not any(char.isdigit() for char in value):
            raise ValidationError('Password must contain at least one digit')
        if not any(char.isalpha() for char in value):
            raise ValidationError('Password must contain at least one letter')


class UserLoginSchema(Schema):
    """Schema for user login"""
    email = fields.Email(
        required=True,
        error_messages={'required': 'Email is required', 'invalid': 'Invalid email format'}
    )
    password = fields.Str(
        required=True,
        error_messages={'required': 'Password is required'}
    )


class SubmissionCreateSchema(Schema):
    """Schema for creating a submission"""
    problem_id = fields.Int(
        required=True,
        validate=validate.Range(min=1),
        error_messages={'required': 'Problem ID is required'}
    )
    source_code = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100000),
        error_messages={'required': 'Source code is required'}
    )
    language = fields.Str(
        missing=DEFAULT_LANGUAGE,
        validate=validate.OneOf(SUPPORTED_LANGUAGES),
        error_messages={'validator_failed': MSG_INVALID_LANGUAGE}
    )
    is_test = fields.Bool(missing=False)
    
    @validates('source_code')
    def validate_source_code(self, value):
        """Validate source code is not empty or just whitespace"""
        if not value.strip():
            raise ValidationError('Source code cannot be empty or only whitespace')


class ClassCreateSchema(Schema):
    """Schema for creating a class"""
    name = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=100),
        error_messages={'required': 'Class name is required'}
    )
    description = fields.Str(
        missing='',
        validate=validate.Length(max=500)
    )
    join_code = fields.Str(
        missing=None,
        validate=validate.Length(min=6, max=20)
    )
    
    @validates('join_code')
    def validate_join_code(self, value):
        """Validate join code format"""
        if value and not re.match(r'^[A-Z0-9-]+$', value):
            raise ValidationError('Join code must contain only uppercase letters, numbers, and hyphens')


class ProblemCreateSchema(Schema):
    """Schema for creating a problem with LeetCode-style format"""
    title = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=200),
        error_messages={'required': 'Problem title is required'}
    )
    description = fields.Str(
        required=True,
        validate=validate.Length(min=10),
        error_messages={'required': 'Problem description is required'}
    )
    class_id = fields.Int(
        required=True,
        validate=validate.Range(min=1),
        error_messages={'required': 'Class ID is required'}
    )
    language = fields.Str(
        missing=DEFAULT_LANGUAGE,
        validate=validate.OneOf(SUPPORTED_LANGUAGES),
        error_messages={'validator_failed': MSG_INVALID_LANGUAGE}
    )
    function_signature = fields.Str(
        required=True,
        validate=validate.Length(min=5),
        error_messages={'required': 'Function signature is required'}
    )
    difficulty = fields.Str(
        missing=DIFFICULTY_MEDIUM,
        validate=validate.OneOf(ALL_DIFFICULTIES),
        error_messages={'validator_failed': MSG_INVALID_DIFFICULTY}
    )
    time_limit_ms = fields.Int(
        missing=DEFAULT_TIME_LIMIT_MS,
        validate=validate.Range(min=MIN_TIME_LIMIT_MS, max=MAX_TIME_LIMIT_MS),
        error_messages={'validator_failed': f'Time limit must be between {MIN_TIME_LIMIT_MS}ms and {MAX_TIME_LIMIT_MS}ms'}
    )
    memory_limit_kb = fields.Int(
        missing=DEFAULT_MEMORY_LIMIT_KB,
        validate=validate.Range(min=MIN_MEMORY_LIMIT_KB, max=MAX_MEMORY_LIMIT_KB),
        error_messages={'validator_failed': f'Memory limit must be between {MIN_MEMORY_LIMIT_KB//1024}MB and {MAX_MEMORY_LIMIT_KB//1024}MB'}
    )


class TestCaseInputSchema(Schema):
    """Schema for a single test case input parameter"""
    type = fields.Str(required=True)  # e.g., "int", "int[]", "string"
    value = fields.Raw(required=True)  # Can be any JSON type


class TestCaseOutputSchema(Schema):
    """Schema for test case expected output"""
    type = fields.Str(required=True)
    value = fields.Raw(required=True)


class TestCaseCreateSchema(Schema):
    """Schema for creating a test case with structured inputs"""
    problem_id = fields.Int(
        required=True,
        validate=validate.Range(min=1),
        error_messages={'required': 'Problem ID is required'}
    )
    inputs = fields.List(
        fields.Nested(TestCaseInputSchema),
        required=True,
        error_messages={'required': 'Inputs array is required'}
    )
    expected_output = fields.Nested(
        TestCaseOutputSchema,
        required=True,
        error_messages={'required': 'Expected output is required'}
    )
    is_hidden = fields.Bool(missing=False)
    points = fields.Int(
        missing=DEFAULT_TEST_CASE_POINTS,
        validate=validate.Range(min=MIN_TEST_CASE_POINTS, max=MAX_TEST_CASE_POINTS),
        error_messages={'validator_failed': f'Points must be between {MIN_TEST_CASE_POINTS} and {MAX_TEST_CASE_POINTS}'}
    )


class PaginationSchema(Schema):
    """Schema for pagination parameters"""
    page = fields.Int(
        missing=1,
        validate=validate.Range(min=1),
        error_messages={'validator_failed': 'Page must be a positive integer'}
    )
    per_page = fields.Int(
        missing=20,
        validate=validate.Range(min=1, max=100),
        error_messages={'validator_failed': 'Per page must be between 1 and 100'}
    )


# Helper function to validate request data
def validate_request_data(schema_class, data):
    """
    Validate request data against a schema
    
    Args:
        schema_class: Marshmallow schema class
        data: Data to validate
    
    Returns:
        Validated data
    
    Raises:
        ValidationError: If validation fails
    """
    schema = schema_class()
    try:
        return schema.load(data)
    except ValidationError as err:
        # Re-raise with formatted errors
        from ..exceptions import ValidationError as CustomValidationError
        raise CustomValidationError(
            'Validation failed',
            payload={'errors': err.messages}
        )


# Example usage in routes:
"""
from .schemas import UserRegistrationSchema, validate_request_data

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    validated_data = validate_request_data(UserRegistrationSchema, data)
    
    # Now use validated_data which is guaranteed to be valid
    full_name = validated_data['full_name']
    email = validated_data['email']
    password = validated_data['password']
    role_name = validated_data['role']
    ...
"""
