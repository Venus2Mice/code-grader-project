from flask import Blueprint, request, jsonify
from .models import db, Submission, Problem, User, Class
from flask_jwt_extended import jwt_required, get_jwt_identity
from .decorators import role_required
from . import rabbitmq_producer # Sẽ tạo file này ngay sau đây

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
        
    results = [{
        "test_case_id": res.test_case_id,
        "status": res.status,
        "execution_time_ms": res.execution_time_ms,
        "memory_used_kb": res.memory_used_kb
    } for res in submission.results]
    
    return jsonify({
        "id": submission.id,
        "problem_id": submission.problem_id,
        "status": submission.status,
        "submitted_at": submission.submitted_at.isoformat(),
        "results": results
    })