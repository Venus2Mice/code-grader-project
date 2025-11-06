from flask import Blueprint, request, jsonify
from ..models import db, Submission, Problem, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..decorators import role_required
from .. import rabbitmq_producer
from ..rabbitmq_pool import publish_task_with_pool
from ..services.token_service import generate_submission_token
from ..constants import (
    STATUS_PENDING,
    STATUS_ACCEPTED,
    SUCCESS_STATUSES,
    DEFAULT_LANGUAGE
)
from datetime import datetime

submission_bp = Blueprint('submissions', __name__, url_prefix='/api/submissions')

@submission_bp.route('', methods=['POST'])
@jwt_required()
@role_required('student')
def create_submission():
    """Sinh viên nộp bài cho một problem."""
    data = request.get_json()
    problem_id = data.get('problem_id')
    source_code = data.get('source_code')
    language = data.get('language', DEFAULT_LANGUAGE)
    
    if not problem_id or not source_code:
        return jsonify({"msg": "problem_id and source_code are required"}), 400
        
    student_id = get_jwt_identity()
    
    # --- Kiểm tra quyền: Sinh viên có thuộc lớp học chứa bài tập này không? ---
    problem = Problem.query.get(problem_id)
    if not problem:
        return jsonify({"msg": "Problem not found"}), 404
    
    student = User.query.get(student_id)
    target_class = problem.class_obj
    
    if target_class not in student.classes_joined:
        return jsonify({"msg": "You are not a member of the class for this problem"}), 403
    # --- Hết phần kiểm tra quyền ---
    
    # --- Kiểm tra language: submission language phải khớp với problem language ---
    if language != problem.language:
        return jsonify({
            "msg": f"Language mismatch: Problem requires {problem.language}, but submission uses {language}",
            "required_language": problem.language,
            "submitted_language": language
        }), 400
    # --- Hết phần kiểm tra language ---
    
    # Check due date
    is_late = False
    if problem.due_date:
        current_time = datetime.utcnow()
        if current_time > problem.due_date:
            is_late = True
            # Option 1: Block submission (uncomment to use)
            # return jsonify({"msg": "Submission deadline has passed", "due_date": problem.due_date.isoformat()}), 403
            
            # Option 2: Allow but mark as late (current implementation)
            # Continue to create submission but mark it

    # 1. Lưu bài nộp vào CSDL với trạng thái 'Pending'
    new_submission = Submission(
        problem_id=problem_id,
        student_id=student_id,
        source_code=source_code,
        language=language,
        status=STATUS_PENDING,
        is_test=False,  # Actual submission, not a test run
        is_late=is_late  # Mark if submitted after due date
    )
    db.session.add(new_submission)
    db.session.commit()
    db.session.refresh(new_submission)  # Ensure all fields are loaded
    
    # CRITICAL: Generate and save the public token AFTER commit (so we have an ID)
    new_submission.public_token = generate_submission_token(new_submission.id)
    db.session.commit()
    
    # 2. Gửi task chấm điểm tới RabbitMQ với connection pool
    task_data = {
        'submission_id': new_submission.id,
        'retry_count': 0,
        'is_test': False
    }
    
    # Try using connection pool first, fallback to old method if needed
    success = publish_task_with_pool(task_data)
    if not success:
        # Fallback to original method if pool fails
        rabbitmq_producer.publish_task(task_data)
    
    return jsonify({
        "id": new_submission.id,
        "submission_id": new_submission.id,
        "token": new_submission.public_token,  # Add token for frontend routing
        "status": new_submission.status
    }), 202 # 202 Accepted: Yêu cầu đã được chấp nhận để xử lý


@submission_bp.route('/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_submission_result(submission_id):
    """Lấy kết quả của một lần nộp bài."""
    user_id = get_jwt_identity()
    submission = Submission.query.get_or_404(submission_id)
    
    # Kiểm tra user có quyền xem bài nộp này không (là chủ nhân hoặc là giáo viên của lớp)
    if str(submission.student_id) != user_id and str(submission.problem.class_obj.teacher_id) != user_id:
        return jsonify({"msg": "Forbidden"}), 403
    
    # Score priority: manual_score > cached_score
    # If teacher has graded manually, use manual_score. Otherwise, use cached_score (test results)
    if submission.manual_score is not None:
        score = submission.manual_score
    elif submission.cached_score is not None:
        score = submission.cached_score
    else:
        # Fallback: Calculate from test results (should not happen normally)
        total_points = sum(tc.points for tc in submission.problem.test_cases)
        earned_points = 0
        for result in submission.results:
            if result.status == STATUS_ACCEPTED:  # Use constant instead of hardcoded string
                test_case = next((tc for tc in submission.problem.test_cases if tc.id == result.test_case_id), None)
                if test_case:
                    earned_points += test_case.points
        score = round((earned_points / total_points * 100)) if total_points > 0 else 0
    
    passed_tests = len([r for r in submission.results if r.status == STATUS_ACCEPTED])
    total_tests = len(submission.problem.test_cases)
    
    # Build results with test case info
    results = []
    for res in submission.results:
        result_data = {
            "test_case_id": res.test_case_id,
            "status": res.status,
            "execution_time_ms": res.execution_time_ms,
            "memory_used_kb": res.memory_used_kb,
            "output_received": res.output_received,
            "error_message": res.error_message,
            "expected_output": None,
            "is_hidden": None
        }
        
        # Add test case info if available (not for compile errors)
        if res.test_case_id and res.test_case:
            result_data["expected_output"] = res.test_case.expected_output
            result_data["is_hidden"] = res.test_case.is_hidden
        
        results.append(result_data)
    
    return jsonify({
        "id": submission.id,
        "problem_id": submission.problem_id,
        "student_id": submission.student_id,
        "status": submission.status,
        "score": score,
        "manual_score": submission.manual_score,  # Include manual_score
        "cached_score": submission.cached_score,  # Include cached_score for reference
        "graded_by_teacher_id": submission.graded_by_teacher_id,
        "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
        "teacher_comment": submission.teacher_comment,
        "passedTests": passed_tests,  # Changed to camelCase
        "totalTests": total_tests,    # Changed to camelCase
        "language": submission.language,
        "submittedAt": submission.submitted_at.isoformat(),  # Changed to camelCase
        "results": results
    })


# NEW ENDPOINTS for Frontend Integration

@submission_bp.route('/me', methods=['GET'])
@jwt_required()
@role_required('student')
def get_my_submissions():
    """Lấy submissions của student hiện tại với pagination, có thể filter theo problem_id hoặc problem_token."""
    student_id = get_jwt_identity()
    problem_id = request.args.get('problem_id', type=int)
    problem_token = request.args.get('problem_token', type=str)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)  # Default 20 per page
    
    # If problem_token is provided, resolve it to problem_id
    if problem_token and not problem_id:
        from ..services.token_service import verify_problem_token
        problem_id = verify_problem_token(problem_token)
        if not problem_id:
            return jsonify({"msg": "Invalid problem token"}), 400
    
    # Chỉ lấy actual submissions, không lấy test runs
    query = Submission.query.filter_by(student_id=student_id, is_test=False)
    
    if problem_id:
        query = query.filter_by(problem_id=problem_id)
    
    # Pagination
    paginated = query.order_by(Submission.submitted_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    submissions_data = []
    for submission in paginated.items:
        # Score priority: manual_score > cached_score
        if submission.manual_score is not None:
            score = submission.manual_score
        elif submission.cached_score is not None:
            score = submission.cached_score
        else:
            # Fallback: Calculate from test results
            total_points = sum(tc.points for tc in submission.problem.test_cases)
            earned_points = 0
            for result in submission.results:
                if result.status in SUCCESS_STATUSES:
                    test_case = next((tc for tc in submission.problem.test_cases if tc.id == result.test_case_id), None)
                    if test_case:
                        earned_points += test_case.points
            score = round((earned_points / total_points * 100)) if total_points > 0 else 0
    
        passed_tests = len([r for r in submission.results if r.status in SUCCESS_STATUSES])
        
        submissions_data.append({
            "id": submission.id,
            "problem_id": submission.problem_id,
            "problem_title": submission.problem.title,
            "status": submission.status,
            "score": score,
            "manual_score": submission.manual_score,
            "cached_score": submission.cached_score,
            "passedTests": passed_tests,
            "totalTests": len(submission.problem.test_cases),
            "language": submission.language,
            "submittedAt": submission.submitted_at.isoformat()
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


@submission_bp.route('/<int:submission_id>/code', methods=['GET'])
@jwt_required()
def get_submission_code(submission_id):
    """Lấy source code của một submission."""
    user_id = get_jwt_identity()
    submission = Submission.query.get_or_404(submission_id)
    
    # Check access: owner or teacher of the class
    is_owner = str(submission.student_id) == user_id
    is_teacher = str(submission.problem.class_obj.teacher_id) == user_id
    
    if not (is_owner or is_teacher):
        return jsonify({"msg": "Forbidden"}), 403
    
    return jsonify({
        "code": submission.source_code,
        "language": submission.language
    }), 200


@submission_bp.route('/run', methods=['POST'])
@jwt_required()
@role_required('student')
def run_code():
    """Chạy thử code và lưu vào database với flag is_test=True - để test trước khi submit."""
    data = request.get_json()
    problem_id = data.get('problem_id')
    source_code = data.get('source_code')
    language = data.get('language', 'cpp')
    
    if not problem_id or not source_code:
        return jsonify({"msg": "problem_id and source_code are required"}), 400
        
    student_id = get_jwt_identity()
    
    # Kiểm tra quyền: Sinh viên có thuộc lớp học chứa bài tập này không?
    problem = Problem.query.get(problem_id)
    if not problem:
        return jsonify({"msg": "Problem not found"}), 404
    
    student = User.query.get(student_id)
    target_class = problem.class_obj
    
    if target_class not in student.classes_joined:
        return jsonify({"msg": "You are not a member of the class for this problem"}), 403

    # Tạo test submission và lưu vào DB với is_test=True
    test_submission = Submission(
        problem_id=problem_id,
        student_id=student_id,
        source_code=source_code,
        language=language,
        status=STATUS_PENDING,
        is_test=True  # Đánh dấu đây là test run
    )
    db.session.add(test_submission)
    db.session.commit()
    
    # Gửi task chấm điểm tới RabbitMQ với is_test flag
    task_data = {
        'submission_id': test_submission.id,
        'retry_count': 0,
        'is_test': True  # Mark as test run
    }
    
    try:
        # Try using connection pool first, fallback to old method if needed
        success = publish_task_with_pool(task_data)
        if not success:
            rabbitmq_producer.publish_task(task_data)
        
        # Trả về submission_id để client có thể poll kết quả
        return jsonify({
            "msg": "Code is being tested",
            "submission_id": test_submission.id,
            "status": STATUS_PENDING
        }), 202
    except Exception as e:
        # Nếu gửi task thất bại, xóa submission
        db.session.delete(test_submission)
        db.session.commit()
        return jsonify({"msg": f"Error running code: {str(e)}"}), 500


@submission_bp.route('/<int:submission_id>/manual-grade', methods=['POST'])
@jwt_required()
@role_required('teacher')
def manual_grade_submission(submission_id):
    """
    Teacher manually assigns a grade to a submission.
    This replaces auto-calculated score with manual teacher score.
    """
    data = request.get_json()
    manual_score = data.get('manual_score')
    teacher_comment = data.get('teacher_comment', '')
    
    # Validate manual_score
    if manual_score is None:
        return jsonify({"msg": "manual_score is required"}), 400
    
    try:
        manual_score = int(manual_score)
        if manual_score < 0 or manual_score > 100:
            return jsonify({"msg": "manual_score must be between 0 and 100"}), 400
    except (ValueError, TypeError):
        return jsonify({"msg": "manual_score must be an integer"}), 400
    
    # Get submission
    submission = Submission.query.get_or_404(submission_id)
    
    # Verify teacher owns the class
    teacher_id = get_jwt_identity()
    if str(submission.problem.class_obj.teacher_id) != teacher_id:
        return jsonify({"msg": "You do not have permission to grade this submission"}), 403
    
    # Update manual grading fields
    submission.manual_score = manual_score
    submission.teacher_comment = teacher_comment
    submission.graded_by_teacher_id = int(teacher_id)
    submission.graded_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        "msg": "Submission graded successfully",
        "submission_id": submission_id,
        "manual_score": manual_score,
        "graded_by": teacher_id,
        "graded_at": submission.graded_at.isoformat(),
        "teacher_comment": teacher_comment
    }), 200
