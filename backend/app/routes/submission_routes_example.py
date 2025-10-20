"""
Example: Updated Submission Routes with Error Handling
Demonstrates how to use custom exceptions and logging
"""

from flask import Blueprint, request, jsonify, current_app
from ..models import db, Submission, Problem, User, Class
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..decorators import role_required
from .. import rabbitmq_producer
from ..exceptions import (
    ValidationError,
    ResourceNotFoundError,
    UnauthorizedError,
    ExternalServiceError,
    SubmissionError
)
from ..logging_config import log_user_activity, log_database_operation

submission_bp = Blueprint('submissions', __name__, url_prefix='/api/submissions')

@submission_bp.route('', methods=['POST'])
@jwt_required()
@role_required('student')
def create_submission():
    """
    Sinh viên nộp bài cho một problem.
    Sử dụng custom exceptions thay vì return jsonify trực tiếp
    """
    try:
        data = request.get_json()
        problem_id = data.get('problem_id')
        source_code = data.get('source_code')
        language = data.get('language', 'cpp')
        
        # Validate input
        if not problem_id:
            raise ValidationError('problem_id is required')
        if not source_code or not source_code.strip():
            raise ValidationError('source_code cannot be empty')
        if language not in ['cpp', 'python', 'java']:
            raise ValidationError(f'Unsupported language: {language}')
            
        student_id = get_jwt_identity()
        
        # Kiểm tra problem tồn tại
        problem = Problem.query.get(problem_id)
        if not problem:
            raise ResourceNotFoundError(f'Problem with ID {problem_id} not found')
        
        # Kiểm tra quyền: Sinh viên có thuộc lớp học chứa bài tập này không?
        student = User.query.get(student_id)
        if not student:
            raise ResourceNotFoundError('Student not found')
            
        target_class = problem.class_obj
        if target_class not in student.classes_joined:
            raise UnauthorizedError('You are not a member of the class for this problem')

        # Lưu bài nộp vào CSDL với trạng thái 'Pending'
        new_submission = Submission(
            problem_id=problem_id,
            student_id=student_id,
            source_code=source_code,
            language=language,
            status='Pending'
        )
        db.session.add(new_submission)
        db.session.commit()
        db.session.refresh(new_submission)
        
        log_database_operation('CREATE', 'Submission', new_submission.id, True)
        log_user_activity(
            student_id, 
            'SUBMISSION_CREATED', 
            {'submission_id': new_submission.id, 'problem_id': problem_id}
        )
        
        # Gửi task chấm điểm tới RabbitMQ
        try:
            task_data = {'submission_id': new_submission.id}
            rabbitmq_producer.publish_task(task_data)
        except Exception as e:
            current_app.logger.error(f'Failed to publish task to RabbitMQ: {str(e)}')
            # Mark submission as failed if can't queue
            new_submission.status = 'Error'
            new_submission.error_message = 'Failed to queue grading task'
            db.session.commit()
            raise ExternalServiceError('Grading service is temporarily unavailable')
        
        return jsonify({
            'status': 'success',
            'message': 'Submission accepted for grading',
            'data': {
                'id': new_submission.id,
                'submission_id': new_submission.id,
                'status': new_submission.status
            }
        }), 202  # 202 Accepted
        
    except (ValidationError, ResourceNotFoundError, UnauthorizedError, ExternalServiceError):
        # Re-raise our custom exceptions to be handled by error handlers
        raise
    except Exception as e:
        # Log unexpected errors
        current_app.logger.error(f'Unexpected error in create_submission: {str(e)}', exc_info=True)
        raise SubmissionError(f'Failed to create submission: {str(e)}')


@submission_bp.route('/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_submission_result(submission_id):
    """
    Lấy kết quả của một lần nộp bài.
    Improved error handling and validation
    """
    try:
        user_id = get_jwt_identity()
        
        # Get submission or raise 404
        submission = Submission.query.get(submission_id)
        if not submission:
            raise ResourceNotFoundError(f'Submission with ID {submission_id} not found')
        
        # Kiểm tra quyền xem
        is_owner = str(submission.student_id) == user_id
        is_teacher = str(submission.problem.class_obj.teacher_id) == user_id
        
        if not (is_owner or is_teacher):
            raise UnauthorizedError('You do not have permission to view this submission')
        
        # Calculate score
        if submission.cached_score is not None:
            score = submission.cached_score
        else:
            total_points = sum(tc.points for tc in submission.problem.test_cases)
            earned_points = sum(
                result.test_case.points 
                for result in submission.results 
                if result.status in ['Passed', 'Accepted'] and result.test_case
            )
            score = round((earned_points / total_points * 100)) if total_points > 0 else 0
        
        passed_tests = len([r for r in submission.results if r.status in ['Passed', 'Accepted']])
        total_tests = len(submission.problem.test_cases)
        
        # Build results
        results = []
        for res in submission.results:
            result_data = {
                'test_case_id': res.test_case_id,
                'status': res.status,
                'execution_time_ms': res.execution_time_ms,
                'memory_used_kb': res.memory_used_kb,
                'output_received': res.output_received,
                'error_message': res.error_message,
                'expected_output': res.test_case.expected_output if res.test_case else None,
                'is_hidden': res.test_case.is_hidden if res.test_case else None
            }
            results.append(result_data)
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': submission.id,
                'problem_id': submission.problem_id,
                'student_id': submission.student_id,
                'status': submission.status,
                'score': score,
                'passedTests': passed_tests,
                'totalTests': total_tests,
                'language': submission.language,
                'submittedAt': submission.submitted_at.isoformat(),
                'results': results
            }
        }), 200
        
    except (ResourceNotFoundError, UnauthorizedError):
        raise
    except Exception as e:
        current_app.logger.error(f'Error getting submission result: {str(e)}', exc_info=True)
        raise SubmissionError(f'Failed to retrieve submission: {str(e)}')


# Additional helper for better error messages
def validate_submission_data(data):
    """Validate submission data and raise detailed errors"""
    errors = {}
    
    if not data.get('problem_id'):
        errors['problem_id'] = 'This field is required'
    
    if not data.get('source_code'):
        errors['source_code'] = 'This field is required'
    elif not data['source_code'].strip():
        errors['source_code'] = 'Source code cannot be empty'
    
    if data.get('language') and data['language'] not in ['cpp', 'python', 'java']:
        errors['language'] = 'Must be one of: cpp, python, java'
    
    if errors:
        raise ValidationError('Validation failed', payload={'errors': errors})
