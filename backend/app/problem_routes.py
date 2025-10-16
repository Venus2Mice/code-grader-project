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
    difficulty = data.get('difficulty', 'medium')  # NEW: easy/medium/hard
    grading_mode = data.get('grading_mode', 'stdio')  # NEW: stdio/function
    function_signature = data.get('function_signature')  # NEW: For function mode
    time_limit_ms = data.get('time_limit_ms', 1000)
    memory_limit_kb = data.get('memory_limit_kb', 256000)
    test_cases = data.get('test_cases', []) # Nhận một danh sách test case

    if not title:
        return jsonify({"msg": "Problem title is required"}), 400
    
    # Validate difficulty
    if difficulty not in ['easy', 'medium', 'hard']:
        return jsonify({"msg": "Invalid difficulty. Must be easy, medium, or hard"}), 400
    
    # Validate grading_mode
    if grading_mode not in ['stdio', 'function']:
        return jsonify({"msg": "Invalid grading_mode. Must be stdio or function"}), 400
    
    # If function mode, require function_signature
    if grading_mode == 'function' and not function_signature:
        return jsonify({"msg": "function_signature is required for function grading mode"}), 400

    new_problem = Problem(
        title=title,
        description=description,
        difficulty=difficulty,  # NEW
        grading_mode=grading_mode,  # NEW
        function_signature=function_signature,  # NEW
        time_limit_ms=time_limit_ms,
        memory_limit_kb=memory_limit_kb,
        class_id=class_id
    )

    # Thêm các test case với points
    for tc_data in test_cases:
        new_tc = TestCase(
            input_data=tc_data.get('input'),
            expected_output=tc_data.get('output'),
            is_hidden=tc_data.get('is_hidden', False),
            points=tc_data.get('points', 10)  # NEW: Points support
        )
        new_problem.test_cases.append(new_tc)

    db.session.add(new_problem)
    db.session.commit()

    return jsonify({
        "id": new_problem.id, 
        "title": new_problem.title,
        "difficulty": new_problem.difficulty,  # NEW
        "grading_mode": new_problem.grading_mode  # NEW
    }), 201


# GET /api/classes/<int:class_id>/problems
# Tương tự, route này cũng được đính vào class_bp
@class_bp.route('/<int:class_id>/problems', methods=['GET'])
@jwt_required()
def get_problems_in_class(class_id):
    """Lấy danh sách các bài tập trong một lớp học."""
    # (Thêm logic kiểm tra xem user có phải là thành viên của lớp không)
    problems = Problem.query.filter_by(class_id=class_id).all()
    problem_list = [{
        "id": p.id, 
        "title": p.title,
        "difficulty": p.difficulty,  # NEW
        "grading_mode": p.grading_mode,  # NEW
        "time_limit_ms": p.time_limit_ms,
        "memory_limit_kb": p.memory_limit_kb,
        "created_at": p.created_at.isoformat() if p.created_at else None
    } for p in problems]
    return jsonify(problem_list)

# GET /api/problems/<int:problem_id>
# Route này thuộc về problem_bp
@problem_bp.route('/<int:problem_id>', methods=['GET'])
@jwt_required()
def get_problem_details(problem_id):
    """Lấy chi tiết một bài tập."""
    problem = Problem.query.get_or_404(problem_id)
    # (Thêm logic kiểm tra quyền truy cập)
    
    # Include test cases with points
    test_cases_data = [{
        "id": tc.id,
        "input": tc.input_data,
        "expected_output": tc.expected_output,
        "is_hidden": tc.is_hidden,
        "points": tc.points  # NEW
    } for tc in problem.test_cases]
    
    return jsonify({
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,  # NEW
        "grading_mode": problem.grading_mode,  # NEW
        "function_signature": problem.function_signature,  # NEW
        "time_limit_ms": problem.time_limit_ms,
        "memory_limit_kb": problem.memory_limit_kb,
        "test_cases": test_cases_data,  # NEW: Include test cases
        "created_at": problem.created_at.isoformat() if problem.created_at else None
    })


# NEW ENDPOINTS for Frontend Integration

@problem_bp.route('/<int:problem_id>/submissions', methods=['GET'])
@jwt_required()
def get_problem_submissions(problem_id):
    """Lấy tất cả submissions cho một problem (teacher view)."""
    problem = Problem.query.get_or_404(problem_id)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only teacher of the class can see all submissions
    if user.role.name != 'teacher' or str(problem.class_obj.teacher_id) != user_id:
        return jsonify({"msg": "Forbidden - Only teacher can view all submissions"}), 403
    
    from .models import Submission
    submissions = Submission.query.filter_by(problem_id=problem_id).order_by(Submission.submitted_at.desc()).all()
    
    submissions_data = []
    for submission in submissions:
        # Calculate score
        total_points = sum(tc.points for tc in problem.test_cases)
        earned_points = 0
        passed_tests = 0
        
        for result in submission.results:
            if result.status == 'Passed':
                passed_tests += 1
                test_case = next((tc for tc in problem.test_cases if tc.id == result.test_case_id), None)
                if test_case:
                    earned_points += test_case.points
        
        score = int((earned_points / total_points * 100)) if total_points > 0 else 0
        
        submissions_data.append({
            "id": submission.id,
            "student": {
                "id": submission.student.id,
                "name": submission.student.full_name,
                "email": submission.student.email
            },
            "status": submission.status,
            "score": score,
            "passed_tests": passed_tests,
            "total_tests": len(problem.test_cases),
            "language": submission.language,
            "submitted_at": submission.submitted_at.isoformat()
        })
    
    return jsonify(submissions_data), 200