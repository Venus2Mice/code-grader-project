from flask import Blueprint, request, jsonify
from ..models import db, Submission, SubmissionResult

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
    overall_status = data.get('overall_status', 'System Error')
    submission.status = overall_status
    
    # Xóa các kết quả cũ (nếu có) để tránh trùng lặp
    SubmissionResult.query.filter_by(submission_id=submission_id).delete()

    # Thêm kết quả chi tiết
    results_data = data.get('results', [])
    
    if overall_status in ["Compile Error", "System Error"]:
        # Lưu compile error hoặc system error vào SubmissionResult
        # Không có test_case_id cho compile error
        for res_data in results_data:
            new_result = SubmissionResult(
                submission_id=submission_id,
                test_case_id=res_data.get('test_case_id'),  # Will be None for compile errors
                status=res_data.get('status', overall_status),
                execution_time_ms=res_data.get('execution_time_ms', 0),
                memory_used_kb=res_data.get('memory_used_kb', 0),
                output_received=res_data.get('output_received', ''),
                error_message=res_data.get('error_message', '')
            )
            db.session.add(new_result)
        submission.cached_score = 0  # Cache score for compile error
        print(f"Submission {submission_id} failed with status {overall_status}. Error saved to results.")
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
        
        # NEW: Calculate and cache score for performance
        problem = submission.problem
        total_points = sum(tc.points for tc in problem.test_cases)
        
        if total_points > 0:
            earned_points = 0
            for result in submission.results:
                if result.status in ['Passed', 'Accepted']:
                    test_case = next((tc for tc in problem.test_cases if tc.id == result.test_case_id), None)
                    if test_case:
                        earned_points += test_case.points
            
            cached_score = round((earned_points / total_points * 100))
            submission.cached_score = cached_score
        
    db.session.commit()
    
    print(f"Updated result for submission {submission_id}, cached_score={submission.cached_score}")
    return jsonify({"msg": "Result updated successfully"}), 200