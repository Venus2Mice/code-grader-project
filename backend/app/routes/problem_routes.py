from flask import Blueprint, request, jsonify
from .class_routes import class_bp 
from ..models import db, Problem, Class, TestCase, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..decorators import role_required
import json

# Blueprint này vẫn được tạo ra để chứa các route không lồng trong class
# Ví dụ: /api/problems/123
problem_bp = Blueprint('problems', __name__, url_prefix='/api/problems')

# Lưu ý: Endpoint này được lồng trong class_bp đã được import
# POST /api/classes/<int:class_id>/problems
@class_bp.route('/<int:class_id>/problems', methods=['POST'])
@jwt_required()
@role_required('teacher')
def create_problem_in_class(class_id):
    """Create new problem in a class with LeetCode-style format."""
    target_class = Class.query.get_or_404(class_id)
    teacher_id = get_jwt_identity()

    if str(target_class.teacher_id) != teacher_id:
        return jsonify({"msg": "Forbidden"}), 403

    data = request.get_json()
    
    title = data.get('title')
    description = data.get('description')
    difficulty = data.get('difficulty', 'medium')
    function_signature = data.get('function_signature')
    time_limit_ms = data.get('time_limit_ms', 1000)
    memory_limit_kb = data.get('memory_limit_kb', 256000)
    test_cases = data.get('test_cases', [])

    if not title:
        return jsonify({"msg": "Problem title is required"}), 400
    
    if not function_signature:
        return jsonify({"msg": "Function signature is required"}), 400
    
    if difficulty not in ['easy', 'medium', 'hard']:
        return jsonify({"msg": "Invalid difficulty. Must be easy, medium, or hard"}), 400

    if not test_cases or len(test_cases) == 0:
        return jsonify({"msg": "At least one test case is required"}), 400
    
    # Validate test cases structure
    total_points = 0
    for tc_data in test_cases:
        if 'inputs' not in tc_data or 'expected_output' not in tc_data:
            return jsonify({"msg": "Each test case must have 'inputs' and 'expected_output'"}), 400
        
        points = tc_data.get('points', 10)
        if points < 0:
            return jsonify({"msg": "Test case points cannot be negative"}), 400
        
        total_points += points
    
    if total_points == 0:
        return jsonify({"msg": "Total points must be greater than 0"}), 400
    
    if total_points > 100:
        return jsonify({"msg": f"Total points ({total_points}) cannot exceed 100"}), 400

    new_problem = Problem(
        title=title,
        description=description,
        difficulty=difficulty,
        function_signature=function_signature,
        time_limit_ms=time_limit_ms,
        memory_limit_kb=memory_limit_kb,
        class_id=class_id
    )

    # Add test cases with structured inputs/outputs
    for tc_data in test_cases:
        # JSONB columns accept Python dict/list directly, no need for json.dumps()
        new_tc = TestCase(
            inputs=tc_data.get('inputs'),
            expected_output=tc_data.get('expected_output'),
            is_hidden=tc_data.get('is_hidden', False),
            points=tc_data.get('points', 10)
        )
        new_problem.test_cases.append(new_tc)

    db.session.add(new_problem)
    db.session.commit()

    return jsonify({
        "id": new_problem.id, 
        "title": new_problem.title,
        "difficulty": new_problem.difficulty,
        "function_signature": new_problem.function_signature
    }), 201


# GET /api/classes/<int:class_id>/problems
# Tương tự, route này cũng được đính vào class_bp
@class_bp.route('/<int:class_id>/problems', methods=['GET'])
@jwt_required()
def get_problems_in_class(class_id):
    """Get list of problems in a class."""
    problems = Problem.query.filter_by(class_id=class_id).all()
    problem_list = [{
        "id": p.id, 
        "title": p.title,
        "difficulty": p.difficulty,
        "function_signature": p.function_signature,
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
    """Get problem details with structured test cases."""
    problem = Problem.query.get_or_404(problem_id)
    
    # Include test cases with structured inputs/outputs
    # Note: JSONB fields are already deserialized by SQLAlchemy, no need for json.loads()
    test_cases_data = [{
        "id": tc.id,
        "inputs": tc.inputs if tc.inputs else [],
        "expected_output": tc.expected_output if tc.expected_output else {},
        "is_hidden": tc.is_hidden,
        "points": tc.points
    } for tc in problem.test_cases]
    
    return jsonify({
        "id": problem.id,
        "class_id": problem.class_id,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "function_signature": problem.function_signature,
        "time_limit_ms": problem.time_limit_ms,
        "memory_limit_kb": problem.memory_limit_kb,
        "test_cases": test_cases_data,
        "created_at": problem.created_at.isoformat() if problem.created_at else None
    })


# NEW ENDPOINTS for Frontend Integration

@problem_bp.route('/<int:problem_id>/submissions', methods=['GET'])
@jwt_required()
def get_problem_submissions(problem_id):
    """Lấy submissions cho một problem với pagination (teacher view)."""
    problem = Problem.query.get_or_404(problem_id)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Only teacher of the class can see all submissions
    if user.role.name != 'teacher' or str(problem.class_obj.teacher_id) != user_id:
        return jsonify({"msg": "Forbidden - Only teacher can view all submissions"}), 403
    
    from ..models import Submission
    
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)  # Default 20 per page
    
    # Only get actual submissions, not test runs
    paginated = Submission.query.filter_by(problem_id=problem_id, is_test=False).order_by(
        Submission.submitted_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    submissions_data = []
    for submission in paginated.items:
        # Use cached_score for performance (no recalculation)
        if submission.cached_score is not None:
            score = submission.cached_score
        else:
            total_points = sum(tc.points for tc in problem.test_cases)
            earned_points = 0
            for result in submission.results:
                if result.status in ['Passed', 'Accepted']:
                    test_case = next((tc for tc in problem.test_cases if tc.id == result.test_case_id), None)
                    if test_case:
                        earned_points += test_case.points
            score = round((earned_points / total_points * 100)) if total_points > 0 else 0
        
        passed_tests = len([r for r in submission.results if r.status in ['Passed', 'Accepted']])
        
        submissions_data.append({
            "id": submission.id,
            "user": {  # Changed from 'student' to 'user' to match frontend
                "id": submission.student.id,
                "full_name": submission.student.full_name,
                "email": submission.student.email
            },
            "status": submission.status,
            "score": score,
            "passedTests": passed_tests,  # Changed to camelCase
            "totalTests": len(problem.test_cases),  # Changed to camelCase
            "language": submission.language,
            "submittedAt": submission.submitted_at.isoformat()  # Changed to camelCase
        })
    
    return jsonify({
        "data": submissions_data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": paginated.total,
            "pages": paginated.pages
        }
    }), 200