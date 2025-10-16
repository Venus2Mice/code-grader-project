from flask import Blueprint, request, jsonify
from ..models import db, Submission, Problem, User, Class
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..decorators import role_required
from .. import rabbitmq_producer # Sẽ tạo file này ngay sau đây

submission_bp = Blueprint('submissions', __name__, url_prefix='/api/submissions')

@submission_bp.route('', methods=['POST'])
@jwt_required()
@role_required('student')
def create_submission():
    """Sinh viên nộp bài cho một problem."""
    data = request.get_json()
    problem_id = data.get('problem_id')
    source_code = data.get('source_code')
    language = data.get('language', 'cpp')
    
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

    # 1. Lưu bài nộp vào CSDL với trạng thái 'Pending'
    new_submission = Submission(
        problem_id=problem_id,
        student_id=student_id,
        source_code=source_code,
        language=language,
        status='Pending'
    )
    db.session.add(new_submission)
    db.session.commit()
    
    # 2. Gửi task chấm điểm tới RabbitMQ
    task_data = {'submission_id': new_submission.id}
    rabbitmq_producer.publish_task(task_data)
    
    return jsonify({
        "submission_id": new_submission.id,
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
    
    # Calculate score based on test case points
    total_points = sum(tc.points for tc in submission.problem.test_cases)
    earned_points = 0
    passed_tests = 0
    total_tests = len(submission.problem.test_cases)
    
    for result in submission.results:
        if result.status == 'Passed':
            passed_tests += 1
            # Find the test case to get its points
            test_case = next((tc for tc in submission.problem.test_cases if tc.id == result.test_case_id), None)
            if test_case:
                earned_points += test_case.points
    
    score = int((earned_points / total_points * 100)) if total_points > 0 else 0
    
    results = [{
        "test_case_id": res.test_case_id,
        "status": res.status,
        "execution_time_ms": res.execution_time_ms,
        "memory_used_kb": res.memory_used_kb,
        "output_received": res.output_received,
        "error_message": res.error_message
    } for res in submission.results]
    
    return jsonify({
        "id": submission.id,
        "problem_id": submission.problem_id,
        "student_id": submission.student_id,
        "status": submission.status,
        "score": score,  # NEW: Computed score
        "passed_tests": passed_tests,  # NEW
        "total_tests": total_tests,  # NEW
        "language": submission.language,
        "submitted_at": submission.submitted_at.isoformat(),
        "results": results
    })


# NEW ENDPOINTS for Frontend Integration

@submission_bp.route('/me', methods=['GET'])
@jwt_required()
@role_required('student')
def get_my_submissions():
    """Lấy submissions của student hiện tại, có thể filter theo problem_id."""
    student_id = get_jwt_identity()
    problem_id = request.args.get('problem_id', type=int)
    
    query = Submission.query.filter_by(student_id=student_id)
    
    if problem_id:
        query = query.filter_by(problem_id=problem_id)
    
    submissions = query.order_by(Submission.submitted_at.desc()).all()
    
    submissions_data = []
    for submission in submissions:
        # Calculate score
        total_points = sum(tc.points for tc in submission.problem.test_cases)
        earned_points = 0
        passed_tests = 0
        
        for result in submission.results:
            if result.status == 'Passed':
                passed_tests += 1
                test_case = next((tc for tc in submission.problem.test_cases if tc.id == result.test_case_id), None)
                if test_case:
                    earned_points += test_case.points
        
        score = int((earned_points / total_points * 100)) if total_points > 0 else 0
        
        submissions_data.append({
            "id": submission.id,
            "problem_id": submission.problem_id,
            "problem_title": submission.problem.title,
            "status": submission.status,
            "score": score,
            "passed_tests": passed_tests,
            "total_tests": len(submission.problem.test_cases),
            "language": submission.language,
            "code": submission.source_code,  # Include source code
            "submitted_at": submission.submitted_at.isoformat()
        })
    
    return jsonify(submissions_data), 200


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
        status='Pending',
        is_test=True  # Đánh dấu đây là test run
    )
    db.session.add(test_submission)
    db.session.commit()
    
    # Gửi task chấm điểm tới RabbitMQ (giống như submit bình thường)
    task_data = {'submission_id': test_submission.id}
    
    try:
        rabbitmq_producer.publish_task(task_data)
        
        # Trả về submission_id để client có thể poll kết quả
        return jsonify({
            "msg": "Code is being tested",
            "submission_id": test_submission.id,
            "status": "Pending"
        }), 202
    except Exception as e:
        # Nếu gửi task thất bại, xóa submission
        db.session.delete(test_submission)
        db.session.commit()
        return jsonify({"msg": f"Error running code: {str(e)}"}), 500