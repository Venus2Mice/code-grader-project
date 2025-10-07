from flask import Blueprint, request, jsonify
from .class_routes import class_bp 
from .models import db, Problem, Class, TestCase
from flask_jwt_extended import jwt_required, get_jwt_identity
from .decorators import role_required

# Blueprint này vẫn được tạo ra để chứa các route không lồng trong class
# Ví dụ: /api/problems/123
problem_bp = Blueprint('problems', __name__, url_prefix='/api/problems')

# Lưu ý: Endpoint này được lồng trong class_bp đã được import
# POST /api/classes/<int:class_id>/problems
@class_bp.route('/<int:class_id>/problems', methods=['POST'])
@jwt_required()
@role_required('teacher')
def create_problem_in_class(class_id):
    """Tạo bài tập mới trong một lớp học cụ thể."""
    target_class = Class.query.get_or_404(class_id)
    teacher_id = get_jwt_identity()

    # Đảm bảo teacher chỉ có thể tạo bài tập trong lớp của mình
    if str(target_class.teacher_id) != teacher_id:
        return jsonify({"msg": "Forbidden"}), 403

    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    time_limit_ms = data.get('time_limit_ms', 1000)
    memory_limit_kb = data.get('memory_limit_kb', 256000)
    test_cases = data.get('test_cases', []) # Nhận một danh sách test case

    if not title:
        return jsonify({"msg": "Problem title is required"}), 400

    new_problem = Problem(
        title=title,
        description=description,
        time_limit_ms=time_limit_ms,
        memory_limit_kb=memory_limit_kb,
        class_id=class_id
    )

    # Thêm các test case
    for tc_data in test_cases:
        new_tc = TestCase(
            input_data=tc_data.get('input'),
            expected_output=tc_data.get('output'),
            is_hidden=tc_data.get('is_hidden', False)
        )
        new_problem.test_cases.append(new_tc)

    db.session.add(new_problem)
    db.session.commit()

    return jsonify({"id": new_problem.id, "title": new_problem.title}), 201


# GET /api/classes/<int:class_id>/problems
# Tương tự, route này cũng được đính vào class_bp
@class_bp.route('/<int:class_id>/problems', methods=['GET'])
@jwt_required()
def get_problems_in_class(class_id):
    """Lấy danh sách các bài tập trong một lớp học."""
    # (Thêm logic kiểm tra xem user có phải là thành viên của lớp không)
    problems = Problem.query.filter_by(class_id=class_id).all()
    problem_list = [{"id": p.id, "title": p.title} for p in problems]
    return jsonify(problem_list)

# GET /api/problems/<int:problem_id>
# Route này thuộc về problem_bp
@problem_bp.route('/<int:problem_id>', methods=['GET'])
@jwt_required()
def get_problem_details(problem_id):
    """Lấy chi tiết một bài tập."""
    problem = Problem.query.get_or_404(problem_id)
    # (Thêm logic kiểm tra quyền truy cập)
    return jsonify({
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "time_limit_ms": problem.time_limit_ms,
        "memory_limit_kb": problem.memory_limit_kb
    })