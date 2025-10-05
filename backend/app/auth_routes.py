from flask import Blueprint, jsonify, request
from .models import User, Role, db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    role_name = data.get('role', 'student') #set default is student

    if not all([full_name, email, password]):
        return jsonify({'message': 'Missing required fields'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({'message': 'Invalid role'}), 400

    new_user = User(full_name=full_name, email=email, role_id=role.id)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'message': 'Missing required fields'}), 400
    
    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        #Create JWT token
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token), 200
    
    return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user:
        return jsonify({
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role.name
        }), 200
    return jsonify({'message': 'User not found'}), 404