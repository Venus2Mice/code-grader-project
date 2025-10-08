from flask import Blueprint, request, jsonify
from .models import db, Submission, SubmissionResult

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

    # Thêm kết quả chi tiết của từng test case
    if overall_status not in ["Complie Error", "System Error"]:
        for res_data in data.get('results', []):
            new_result = SubmissionResult(
                submission_id=submission_id,
                test_case_id=res_data.get('test_case_id'),
                status=res_data.get('status'),
                execution_time_ms=res_data.get('execution_time_ms'),
                memory_used_kb=res_data.get('memory_used_kb'),
                output_received=res_data.get('output_received')
            )
            db.session.add(new_result)
        
    db.session.commit()
    
    print(f"Updated result for submission {submission_id}")
    return jsonify({"msg": "Result updated successfully"}), 200