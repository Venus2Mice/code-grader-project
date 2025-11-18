from flask import Blueprint, request, jsonify
import logging
from ..models import db, Submission, SubmissionResult
from ..constants import (
    ERROR_STATUSES,
    STATUS_SYSTEM_ERROR,
    STATUS_ACCEPTED
)

logger = logging.getLogger(__name__)
internal_bp = Blueprint('internal', __name__, url_prefix='/internal')

# API này không cần JWT vì nó chỉ được gọi từ Worker trong mạng nội bộ.
# Trong môi trường production, bạn nên bảo vệ nó bằng một API key hoặc IP whitelisting.
@internal_bp.route('/submissions/<int:submission_id>/result', methods=['POST'])
def update_submission_result(submission_id):
    data = request.get_json()
    
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({"msg": "Submission not found"}), 404

    # Cập nhật trạng thái tổng thể
    overall_status = data.get('overall_status', STATUS_SYSTEM_ERROR)
    submission.status = overall_status
    
    # NEW: Store quality metrics if provided
    quality_metrics = data.get('quality_metrics')
    if quality_metrics:
        submission.quality_score = quality_metrics.get('quality_score')
        submission.complexity_metrics = quality_metrics.get('metrics')
        submission.style_issues = quality_metrics.get('issues')
        # Extract security warnings from issues
        security_warnings = [
            issue for issue in quality_metrics.get('issues', [])
            if issue.get('category') == 'security'
        ]
        submission.security_warnings = security_warnings
        logger.info(f"Submission {submission_id}: quality_score={submission.quality_score}")
    
    # Xóa các kết quả cũ (nếu có) để tránh trùng lặp
    SubmissionResult.query.filter_by(submission_id=submission_id).delete()

    # Thêm kết quả chi tiết
    results_data = data.get('results', [])
    new_results = []  # ✅ FIX: Store new results to calculate score
    
    # ✅ ENHANCED: Save all error types (Compile Error, Runtime Error, etc.)
    # Check if this is an error that applies to all test cases (no test_case_id)
    has_global_error = any(res.get('test_case_id') is None for res in results_data)
    
    # Use ERROR_STATUSES from constants instead of hardcoded list
    if has_global_error or overall_status in ERROR_STATUSES:
        # Lưu error vào SubmissionResult
        # Không có test_case_id cho compile error hoặc runtime error toàn cục
        for res_data in results_data:
            new_result = SubmissionResult(
                submission_id=submission_id,
                test_case_id=res_data.get('test_case_id'),  # Will be None for global errors
                status=res_data.get('status', overall_status),
                execution_time_ms=res_data.get('execution_time_ms', 0),
                memory_used_kb=res_data.get('memory_used_kb', 0),
                output_received=res_data.get('output_received', ''),
                error_message=res_data.get('error_message', '')
            )
            db.session.add(new_result)
            new_results.append(new_result)  # ✅ FIX: Track new result
        submission.cached_score = 0  # Cache score for errors
        logger.info(f"Submission {submission_id} failed with status {overall_status}. Error saved to results.")
    else:
        # Thêm kết quả chi tiết của từng test case
        for res_data in results_data:
            if res_data.get('test_case_id') is None:
                continue

            new_result = SubmissionResult(
                submission_id=submission_id,
                test_case_id=res_data.get('test_case_id'),
                status=res_data.get('status'),
                execution_time_ms=res_data.get('execution_time_ms'),
                memory_used_kb=res_data.get('memory_used_kb'),
                output_received=res_data.get('output_received'),
                error_message=res_data.get('error_message')
            )
            db.session.add(new_result)
            new_results.append(new_result)  # ✅ FIX: Track new result
        
        # ✅ AUTO-SCORING: Calculate score based on test case points
        # Load problem with test cases to calculate score
        problem = submission.problem
        total_points = sum(tc.points for tc in problem.test_cases)
        
        # Count earned points from passed test cases
        earned_points = 0
        for result in new_results:
            if result.status == STATUS_ACCEPTED:  # Use constant instead of hardcoded string
                test_case = next((tc for tc in problem.test_cases if tc.id == result.test_case_id), None)
                if test_case:
                    earned_points += test_case.points
        
        # Calculate percentage score (0-100)
        if total_points > 0:
            submission.cached_score = round((earned_points / total_points) * 100)
        else:
            submission.cached_score = 0
        
        logger.info(f"Submission {submission_id}: earned {earned_points}/{total_points} points = {submission.cached_score}%")
        
    db.session.commit()
    
    logger.info(f"Updated result for submission {submission_id}, cached_score={submission.cached_score}")
    return jsonify({"msg": "Result updated successfully"}), 200