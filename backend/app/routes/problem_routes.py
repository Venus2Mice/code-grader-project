from flask import Blueprint, request, jsonify, g
from .class_routes import class_bp 
from ..models import db, Problem, TestCase, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..decorators import role_required
from ..i18n_decorators import with_user_language
from ..token_utils import find_class_by_token_or_404, find_problem_by_token_or_404
from ..services.token_service import generate_problem_token
import re

# Blueprint này vẫn được tạo ra để chứa các route không lồng trong class
# Ví dụ: /api/problems/123
problem_bp = Blueprint('problems', __name__, url_prefix='/api/problems')


def generate_valid_function_name(title: str) -> str:
    """
    Generate a valid function name from problem title.
    
    Rules:
    1. If title <= 20 chars and valid identifier, use it
    2. Otherwise, default to "Problem"
    
    Valid identifier: starts with letter/underscore, contains only alphanumeric/underscore
    """
    if not title:
        return "Problem"
    
    # Remove whitespace and convert to camelCase
    words = title.strip().split()
    if not words:
        return "Problem"
    
    # Convert to camelCase: first word lowercase, rest capitalized
    camel_case = words[0].lower()
    for word in words[1:]:
        # Capitalize first letter, keep rest lowercase
        if word:
            camel_case += word[0].upper() + word[1:].lower()
    
    # Remove non-alphanumeric characters (except underscore)
    clean_name = re.sub(r'[^a-zA-Z0-9_]', '', camel_case)
    
    # Ensure it starts with letter or underscore
    if not clean_name or not re.match(r'^[a-zA-Z_]', clean_name):
        return "Problem"
    
    # Check length
    if len(clean_name) <= 20:
        return clean_name
    
    # If too long, default to "Problem"
    return "Problem"


def validate_function_name(name: str) -> bool:
    """
    Validate function name format.
    Must start with letter/underscore and contain only alphanumeric/underscore.
    """
    if not name:
        return False
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name))

# NEW ENDPOINT: POST /api/classes/<class_token>/problems/define
# Tạo problem với định nghĩa hàm rõ ràng
@class_bp.route('/<string:class_token>/problems/define', methods=['POST'])
@jwt_required()
@role_required('teacher')
def create_problem_with_definition(class_token):
    """
    Create new problem with explicit function definition (NEW).
    
    Request body:
    {
        "title": "Two Sum",
        "description": "Find two numbers that add up to target",
        "markdown_content": "...",
        "language": "python",
        "function_name": "twoSum",
        "return_type": "int[]",
        "parameters": [
            {"name": "nums", "type": "int[]"},
            {"name": "target", "type": "int"}
        ],
        "difficulty": "medium",
        "time_limit_ms": 1000,
        "memory_limit_kb": 256000,
        "test_cases": [
            {
                "inputs": [
                    {"type": "int[]", "value": [2, 7, 11, 15]},
                    {"type": "int", "value": 9}
                ],
                "expected_output": {"type": "int[]", "value": [0, 1]},
                "is_hidden": false,
                "points": 10
            }
        ]
    }
    """
    target_class = find_class_by_token_or_404(class_token)
    teacher_id = get_jwt_identity()

    if str(target_class.teacher_id) != teacher_id:
        return jsonify({"msg": "Forbidden"}), 403

    data = request.get_json()
    
    # Validate required fields
    title = data.get('title')
    description = data.get('description')
    function_name = data.get('function_name', '').strip()
    return_type = data.get('return_type')
    parameters = data.get('parameters', [])
    test_cases = data.get('test_cases', [])

    if not title:
        return jsonify({"msg": "Problem title is required"}), 400
    
    if not description:
        return jsonify({"msg": "Problem description is required"}), 400
    
    # Function name fallback logic
    if not function_name or not validate_function_name(function_name):
        # Generate from title or use default
        function_name = generate_valid_function_name(title)
        # Log the fallback for debugging
        from flask import current_app
        current_app.logger.info(f"Function name fallback applied: '{data.get('function_name')}' -> '{function_name}' for problem '{title}'")
    
    if not return_type:
        return jsonify({"msg": "Return type is required"}), 400
    
    if not isinstance(parameters, list):
        return jsonify({"msg": "Parameters must be an array"}), 400
    
    # Validate each parameter
    for param in parameters:
        if not isinstance(param, dict) or 'name' not in param or 'type' not in param:
            return jsonify({"msg": "Each parameter must have 'name' and 'type' fields"}), 400
    
    if not test_cases or len(test_cases) == 0:
        return jsonify({"msg": "At least one test case is required"}), 400
    
    # Validate test cases
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

    difficulty = data.get('difficulty', 'medium')
    if difficulty not in ['easy', 'medium', 'hard']:
        return jsonify({"msg": "Invalid difficulty"}), 400
    
    language = data.get('language', 'cpp')
    if language not in ['cpp', 'python', 'java']:
        return jsonify({"msg": "Invalid language"}), 400

    # Parse due_date if provided
    due_date = None
    if data.get('due_date'):
        try:
            from datetime import datetime
            due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({"msg": "Invalid due_date format. Use ISO 8601 format."}), 400

    # Create new problem
    new_problem = Problem(
        title=title,
        description=description,
        markdown_content=data.get('markdown_content'),
        difficulty=difficulty,
        language=language,
        function_name=function_name,
        return_type=return_type,
        parameters=parameters,  # Store as list, SQLAlchemy JSONB will handle it
        function_signature=None,  # Not required for new flow
        time_limit_ms=data.get('time_limit_ms', 1000),
        memory_limit_kb=data.get('memory_limit_kb', 256000),
        due_date=due_date,
        class_id=target_class.id
    )

    # Add test cases
    for tc_data in test_cases:
        new_tc = TestCase(
            inputs=tc_data.get('inputs'),
            expected_output=tc_data.get('expected_output'),
            is_hidden=tc_data.get('is_hidden', False),
            points=tc_data.get('points', 10)
        )
        new_problem.test_cases.append(new_tc)

    db.session.add(new_problem)
    db.session.commit()
    
    # CRITICAL: Generate and save the public token AFTER commit (so we have an ID)
    new_problem.public_token = generate_problem_token(new_problem.id)
    db.session.commit()

    return jsonify({
        "id": new_problem.id,
        "token": new_problem.public_token,
        "title": new_problem.title,
        "difficulty": new_problem.difficulty,
        "function_name": new_problem.function_name,
        "return_type": new_problem.return_type,
        "parameters": new_problem.parameters
    }), 201


# GET /api/classes/<string:class_token>/problems
# Tương tự, route này cũng được đính vào class_bp
@class_bp.route('/<string:class_token>/problems', methods=['GET'])
@jwt_required()
def get_problems_in_class(class_token):
    """Get list of problems in a class."""
    target_class = find_class_by_token_or_404(class_token)
    problems = Problem.query.filter_by(class_id=target_class.id).all()
    problem_list = [{
        "id": p.id,
        "token": p.public_token,  # Add token for frontend routing
        "title": p.title,
        "difficulty": p.difficulty,
        "function_name": p.function_name,
        "return_type": p.return_type,
        "parameters": p.parameters,
        "function_signature": p.function_signature,
        "time_limit_ms": p.time_limit_ms,
        "memory_limit_kb": p.memory_limit_kb,
        "markdown_content": p.markdown_content,
        "created_at": p.created_at.isoformat() if p.created_at else None
    } for p in problems]
    return jsonify(problem_list)

# GET /api/problems/<string:problem_token>
# Route này thuộc về problem_bp
@problem_bp.route('/<string:problem_token>', methods=['GET'])
@jwt_required()
@with_user_language
def get_problem_details(problem_token):
    """Get problem details with structured test cases and localized content."""
    problem = find_problem_by_token_or_404(problem_token)
    
    # Get user's preferred language from context
    lang = getattr(g, 'language', 'en')
    
    # Include test cases with structured inputs/outputs
    test_cases_data = [{
        "id": tc.id,
        "inputs": tc.inputs if tc.inputs else [],
        "expected_output": tc.expected_output if tc.expected_output else {},
        "is_hidden": tc.is_hidden,
        "points": tc.points
    } for tc in problem.test_cases]
    
    return jsonify({
        "id": problem.id,
        "token": problem.public_token,  # Add token
        "class_id": problem.class_id,
        "class_token": problem.class_obj.public_token if problem.class_obj else None,  # Add class token
        "title": problem.get_title(lang),  # Use localized title
        "description": problem.get_description(lang),  # Use localized description
        "markdown_content": problem.get_markdown_content(lang),  # Use localized markdown
        "difficulty": problem.difficulty,
        "function_name": problem.function_name,
        "return_type": problem.return_type,
        "parameters": problem.parameters,
        "function_signature": problem.function_signature,
        "time_limit_ms": problem.time_limit_ms,
        "memory_limit_kb": problem.memory_limit_kb,
        "language": problem.language,
        "grading_mode": "function" if problem.function_name else "stdio",
        "test_cases": test_cases_data,
        "due_date": problem.due_date.isoformat() if problem.due_date else None,
        "created_at": problem.created_at.isoformat() if problem.created_at else None,
        "user_language": lang  # Include user's language preference in response
    })


# UPDATE ENDPOINT: PUT /api/problems/<problem_token>
@problem_bp.route('/<string:problem_token>', methods=['PUT'])
@jwt_required()
@role_required('teacher')
def update_problem(problem_token):
    """
    Update existing problem with full configuration.
    
    Only the teacher who owns the class can update the problem.
    """
    problem = find_problem_by_token_or_404(problem_token)
    teacher_id = get_jwt_identity()
    
    # Check ownership
    if str(problem.class_obj.teacher_id) != teacher_id:
        return jsonify({"msg": "Forbidden - You don't own this problem"}), 403
    
    data = request.get_json()
    
    # Update basic fields
    if 'title' in data and data['title']:
        problem.title = data['title']
    
    if 'description' in data and data['description']:
        problem.description = data['description']
    
    if 'markdown_content' in data:
        problem.markdown_content = data['markdown_content']
    
    if 'difficulty' in data:
        difficulty = data['difficulty']
        if difficulty not in ['easy', 'medium', 'hard']:
            return jsonify({"msg": "Invalid difficulty"}), 400
        problem.difficulty = difficulty
    
    if 'language' in data:
        language = data['language']
        if language not in ['cpp', 'python', 'java']:
            return jsonify({"msg": "Invalid language"}), 400
        problem.language = language
    
    # Update function configuration
    if 'function_name' in data:
        function_name = data['function_name'].strip()
        if function_name and not validate_function_name(function_name):
            # Apply fallback
            function_name = generate_valid_function_name(problem.title)
            from flask import current_app
            current_app.logger.info(f"Function name fallback on update: '{data['function_name']}' -> '{function_name}'")
        problem.function_name = function_name if function_name else problem.function_name
    
    if 'return_type' in data and data['return_type']:
        problem.return_type = data['return_type']
    
    if 'parameters' in data:
        parameters = data['parameters']
        if not isinstance(parameters, list):
            return jsonify({"msg": "Parameters must be an array"}), 400
        
        # Validate each parameter
        for param in parameters:
            if not isinstance(param, dict) or 'name' not in param or 'type' not in param:
                return jsonify({"msg": "Each parameter must have 'name' and 'type' fields"}), 400
        
        problem.parameters = parameters
    
    # Update limits
    if 'time_limit_ms' in data:
        problem.time_limit_ms = data['time_limit_ms']
    
    if 'memory_limit_kb' in data:
        problem.memory_limit_kb = data['memory_limit_kb']
    
    # Update due_date if provided
    if 'due_date' in data:
        if data['due_date'] is None:
            problem.due_date = None
        else:
            try:
                from datetime import datetime
                problem.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return jsonify({"msg": "Invalid due_date format. Use ISO 8601 format."}), 400
    
    # Update test cases if provided
    if 'test_cases' in data:
        test_cases_data = data['test_cases']
        
        if not test_cases_data or len(test_cases_data) == 0:
            return jsonify({"msg": "At least one test case is required"}), 400
        
        # Validate total points
        total_points = 0
        for tc_data in test_cases_data:
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
        
        # Remove old test cases
        TestCase.query.filter_by(problem_id=problem.id).delete()
        
        # Add new test cases
        for tc_data in test_cases_data:
            new_tc = TestCase(
                problem_id=problem.id,
                inputs=tc_data.get('inputs'),
                expected_output=tc_data.get('expected_output'),
                is_hidden=tc_data.get('is_hidden', False),
                points=tc_data.get('points', 10)
            )
            db.session.add(new_tc)
    
    db.session.commit()
    
    return jsonify({
        "msg": "Problem updated successfully",
        "token": problem.public_token,
        "title": problem.title,
        "difficulty": problem.difficulty,
        "function_name": problem.function_name,
        "return_type": problem.return_type,
        "parameters": problem.parameters
    }), 200


# NEW ENDPOINTS for Frontend Integration

@problem_bp.route('/<string:problem_token>/submissions', methods=['GET'])
@jwt_required()
def get_problem_submissions(problem_token):
    """Lấy submissions cho một problem với pagination (teacher view)."""
    problem = find_problem_by_token_or_404(problem_token)
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
    paginated = Submission.query.filter_by(problem_id=problem.id, is_test=False).order_by(
        Submission.submitted_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    submissions_data = []
    for submission in paginated.items:
        # Score priority: manual_score > cached_score
        if submission.manual_score is not None:
            score = submission.manual_score
        elif submission.cached_score is not None:
            score = submission.cached_score
        else:
            # Fallback: Calculate from test results
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
            "manual_score": submission.manual_score,
            "cached_score": submission.cached_score,
            "graded_by_teacher_id": submission.graded_by_teacher_id,
            "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
            "teacher_comment": submission.teacher_comment,
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


# DELETE ENDPOINT: DELETE /api/problems/<problem_token>
@problem_bp.route('/<string:problem_token>', methods=['DELETE'])
@jwt_required()
@role_required('teacher')
def delete_problem(problem_token):
    """
    Delete a problem and all related submissions.
    
    Only the teacher who owns the class can delete the problem.
    Returns warning if submissions exist but still allows deletion.
    """
    problem = find_problem_by_token_or_404(problem_token)
    teacher_id = get_jwt_identity()
    
    # Check ownership
    if str(problem.class_obj.teacher_id) != teacher_id:
        return jsonify({"msg": "Forbidden - You don't own this problem"}), 403
    
    # Check if submissions exist
    from ..models import Submission
    submission_count = Submission.query.filter_by(problem_id=problem.id).count()
    
    # Delete all related submissions first (cascade)
    if submission_count > 0:
        Submission.query.filter_by(problem_id=problem.id).delete()
    
    # Delete test cases (should cascade, but explicit for safety)
    TestCase.query.filter_by(problem_id=problem.id).delete()
    
    # Delete the problem
    problem_title = problem.title
    db.session.delete(problem)
    db.session.commit()
    
    return jsonify({
        "msg": "Problem deleted successfully",
        "title": problem_title,
        "submissions_deleted": submission_count,
        "had_submissions": submission_count > 0
    }), 200
