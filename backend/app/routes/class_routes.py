from flask import Blueprint, request, jsonify
from ..models import db, Class, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..decorators import role_required

class_bp = Blueprint('classes', __name__, url_prefix='/api/classes')

@class_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher')
def create_class():
    """Tạo một lớp học mới (chỉ cho teacher)."""
    data = request.get_json()
    name = data.get('name')
    course_code = data.get('course_code')
    description = data.get('description')  # NEW: Accept description
    
    if not name:
        return jsonify({"msg": "Class name is required"}), 400
    
    teacher_id = get_jwt_identity()
    
    new_class = Class(
        name=name,
        course_code=course_code,
        description=description,  # NEW: Set description
        teacher_id=teacher_id
    )
    
    db.session.add(new_class)
    db.session.commit()
    
    return jsonify({
        "id": new_class.id,
        "name": new_class.name,
        "course_code": new_class.course_code,
        "description": new_class.description,  # NEW: Return description
        "invite_code": new_class.invite_code
    }), 201

@class_bp.route('', methods=['GET'])
@jwt_required()
def get_my_classes():
    """Lấy danh sách các lớp học mà user đang tham gia hoặc giảng dạy."""
    from ..models import Problem, Submission
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role.name == 'teacher':
        classes = Class.query.filter_by(teacher_id=user_id).all()
    else: # student
        classes = user.classes_joined
    
    class_list = []
    for c in classes:
        class_data = {
            "id": c.id, 
            "name": c.name, 
            "code": c.course_code or c.invite_code,  # Use course_code or invite_code as display code
            "course_code": c.course_code,
            "description": c.description,
            "teacher_name": c.teacher.full_name,
            "student_count": len(c.students)
        }
        
        # For students, add problem statistics
        if user.role.name == 'student':
            problems = Problem.query.filter_by(class_id=c.id).all()
            total_problems = len(problems)
            completed_problems = 0
            
            for problem in problems:
                # Check if student has any 100% submission for this problem (only actual submissions)
                submissions = Submission.query.filter_by(
                    problem_id=problem.id,
                    student_id=user_id,
                    is_test=False
                ).all()
                
                for submission in submissions:
                    total_points = sum(tc.points for tc in problem.test_cases)
                    if total_points > 0:
                        earned_points = sum(
                            tc.points for tc in problem.test_cases
                            if any(r.status in ['Passed', 'Accepted'] and r.test_case_id == tc.id for r in submission.results)
                        )
                        score = round((earned_points / total_points * 100))
                        if score == 100:
                            completed_problems += 1
                            break  # Count each problem only once
            
            class_data["problems_done"] = completed_problems
            class_data["problems_todo"] = total_problems - completed_problems
            class_data["total_problems"] = total_problems
        
        class_list.append(class_data)
        
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


# NEW ENDPOINTS for Frontend Integration

@class_bp.route('/<int:class_id>', methods=['GET'])
@jwt_required()
def get_class_details(class_id):
    """Lấy chi tiết đầy đủ của một class."""
    target_class = Class.query.get_or_404(class_id)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Check if user has access (teacher or student of the class)
    is_teacher = str(target_class.teacher_id) == user_id
    is_student = target_class in user.classes_joined
    
    if not (is_teacher or is_student):
        return jsonify({"msg": "Forbidden - You don't have access to this class"}), 403
    
    # Get problems for this class
    problems_data = []
    for problem in target_class.problems:
        problems_data.append({
            "id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "difficulty": problem.difficulty,
            "grading_mode": problem.grading_mode,
            "time_limit_ms": problem.time_limit_ms,
            "memory_limit_kb": problem.memory_limit_kb,
            "created_at": problem.created_at.isoformat() if problem.created_at else None
        })
    
    return jsonify({
        "id": target_class.id,
        "name": target_class.name,
        "course_code": target_class.course_code,
        "description": target_class.description,
        "invite_code": target_class.invite_code if is_teacher else None,  # Only teacher sees invite code
        "teacher": {
            "id": target_class.teacher.id,
            "name": target_class.teacher.full_name,
            "email": target_class.teacher.email
        },
        "student_count": len(target_class.students),
        "problems": problems_data,  # Add problems list
        "created_at": target_class.created_at.isoformat() if target_class.created_at else None
    }), 200


@class_bp.route('/<int:class_id>/students', methods=['GET'])
@jwt_required()
def get_class_students(class_id):
    """Lấy danh sách students trong class (chỉ teacher hoặc students của class)."""
    target_class = Class.query.get_or_404(class_id)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Check access
    is_teacher = str(target_class.teacher_id) == user_id
    is_student = target_class in user.classes_joined
    
    if not (is_teacher or is_student):
        return jsonify({"msg": "Forbidden"}), 403
    
    # Get enrollment info from class_members table
    from sqlalchemy import select
    students_data = []
    for student in target_class.students:
        # Try to get enrollment date (would need to query class_members table)
        students_data.append({
            "id": student.id,
            "full_name": student.full_name,  # Use full_name for consistency
            "email": student.email,
            "enrolled_at": student.created_at.isoformat() if student.created_at else None
        })
    
    return jsonify(students_data), 200


@class_bp.route('/<int:class_id>', methods=['PUT'])
@jwt_required()
@role_required('teacher')
def update_class(class_id):
    """Cập nhật thông tin class (chỉ teacher)."""
    target_class = Class.query.get_or_404(class_id)
    teacher_id = get_jwt_identity()
    
    if str(target_class.teacher_id) != teacher_id:
        return jsonify({"msg": "Forbidden"}), 403
    
    data = request.get_json()
    
    # Update fields if provided
    if 'name' in data:
        target_class.name = data['name']
    if 'course_code' in data:
        target_class.course_code = data['course_code']
    if 'description' in data:
        target_class.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        "id": target_class.id,
        "name": target_class.name,
        "course_code": target_class.course_code,
        "description": target_class.description
    }), 200


@class_bp.route('/<int:class_id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher')
def delete_class(class_id):
    """Xóa class (chỉ teacher)."""
    target_class = Class.query.get_or_404(class_id)
    teacher_id = get_jwt_identity()
    
    if str(target_class.teacher_id) != teacher_id:
        return jsonify({"msg": "Forbidden"}), 403
    
    db.session.delete(target_class)
    db.session.commit()
    
    return jsonify({"msg": "Class deleted successfully"}), 200