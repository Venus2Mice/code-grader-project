from flask import Blueprint, jsonify, request
from ..models import User, Role, db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..exceptions import (
    ValidationError, 
    AuthenticationError, 
    DuplicateResourceError,
    ResourceNotFoundError
)
from ..logging_config import log_user_activity, log_security_event

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    role_name = data.get('role', 'student') #set default is student

    # Validate required fields
    if not all([full_name, email, password]):
        raise ValidationError('Missing required fields: full_name, email, and password are required')
    
    # Check for duplicate email
    if User.query.filter_by(email=email).first():
        log_security_event('DUPLICATE_REGISTRATION', f'Email: {email}', 'WARNING')
        raise DuplicateResourceError(f'Email {email} is already registered')
    
    # Validate role
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        raise ValidationError(f'Invalid role: {role_name}')

    # Create new user
    new_user = User(full_name=full_name, email=email, role_id=role.id)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    log_user_activity(new_user.id, 'USER_REGISTERED', {'email': email, 'role': role_name})
    
    return jsonify({
        'status': 'success',
        'message': 'User registered successfully',
        'data': {'user_id': new_user.id, 'email': email}
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate required fields
    if not all([email, password]):
        raise ValidationError('Missing required fields: email and password are required')
    
    user = User.query.filter_by(email=email).first()

    # Verify credentials
    if not user or not user.check_password(password):
        log_security_event('FAILED_LOGIN', f'Email: {email}', 'WARNING')
        raise AuthenticationError('Invalid email or password')
    
    # Create JWT token
    access_token = create_access_token(identity=str(user.id))
    
    log_user_activity(user.id, 'USER_LOGGED_IN', {'email': email})
    
    return jsonify({
        'status': 'success',
        'message': 'Login successful',
        'data': {
            'access_token': access_token,
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'role': user.role.name
            }
        }
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        raise ResourceNotFoundError('User profile not found')
    
    return jsonify({
        'status': 'success',
        'data': {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role.name
        }
    }), 200