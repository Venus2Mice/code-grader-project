from flask import Blueprint, request, jsonify
from .models import db, Class, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from .decorators import role_required

class_bp = Blueprint('classes', __name__, url_prefix='/api/classes')

@class_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher')
def create_class():
    """Tạo một lớp học mới (chỉ cho teacher)."""
    data = request.get_json()
    name = data.get('name')
    course_code = data.get('course_code')
    
    if not name:
        return jsonify({"msg": "Class name is required"}), 400
    
    teacher_id = get_jwt_identity()
    
    new_class = Class(
        name=name,
        course_code=course_code,
        teacher_id=teacher_id
    )
    
    db.session.add(new_class)
    db.session.commit()
    
    return jsonify({
        "id": new_class.id,
        "name": new_class.name,
        "course_code": new_class.course_code,
        "invite_code": new_class.invite_code
    }), 201

@class_bp.route('', methods=['GET'])
@jwt_required()
def get_my_classes():
    """Lấy danh sách các lớp học mà user đang tham gia hoặc giảng dạy."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role.name == 'teacher':
        classes = Class.query.filter_by(teacher_id=user_id).all()
    else: # student
        classes = user.classes_joined
    
    class_list = [{
        "id": c.id, 
        "name": c.name, 
        "course_code": c.course_code,
        "teacher_name": c.teacher.full_name
        } for c in classes]
        
    return jsonify(class_list), 200

@class_bp.route('/join', methods=['POST'])
@jwt_required()
@role_required('student')
def join_class():
    """Học sinh tham gia lớp học bằng invite_code."""
    data = request.get_json()
    invite_code = data.get('invite_code')
    
    if not invite_code:
        return jsonify({"msg": "Invite code is required"}), 400
        
    class_to_join = Class.query.filter_by(invite_code=invite_code).first()
    
    if not class_to_join:
        return jsonify({"msg": "Invalid invite code"}), 404
        
    student_id = get_jwt_identity()
    student = User.query.get(student_id)
    
    if class_to_join in student.classes_joined:
        return jsonify({"msg": "You are already in this class"}), 409
        
    class_to_join.students.append(student)
    db.session.commit()
    
    return jsonify({"msg": f"Successfully joined class '{class_to_join.name}'"}), 200