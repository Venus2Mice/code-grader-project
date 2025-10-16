"""
Cleanup service để xóa test submissions cũ
Test submissions (is_test=True) chỉ dùng tạm thời để test code,
không cần lưu lâu dài. Service này sẽ tự động xóa các test submissions cũ hơn 1 giờ.
"""
from datetime import datetime, timedelta
from ..models import db, Submission

def cleanup_old_test_submissions(hours=1):
    """
    Xóa các test submissions (is_test=True) cũ hơn số giờ được chỉ định.
    
    Args:
        hours (int): Số giờ. Test submissions cũ hơn thời gian này sẽ bị xóa.
    
    Returns:
        int: Số lượng test submissions đã xóa
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Tìm và xóa test submissions cũ
    old_test_submissions = Submission.query.filter(
        Submission.is_test == True,
        Submission.submitted_at < cutoff_time
    ).all()
    
    count = len(old_test_submissions)
    
    for submission in old_test_submissions:
        db.session.delete(submission)
    
    db.session.commit()
    
    print(f"[CLEANUP] Deleted {count} old test submissions (older than {hours} hour(s))")
    return count


def cleanup_completed_test_submissions():
    """
    Xóa tất cả test submissions đã hoàn tất (không còn Pending/Running).
    Chỉ giữ lại test submissions đang chạy.
    
    Returns:
        int: Số lượng test submissions đã xóa
    """
    completed_test_submissions = Submission.query.filter(
        Submission.is_test == True,
        Submission.status.notin_(['Pending', 'Running'])
    ).all()
    
    count = len(completed_test_submissions)
    
    for submission in completed_test_submissions:
        db.session.delete(submission)
    
    db.session.commit()
    
    print(f"[CLEANUP] Deleted {count} completed test submissions")
    return count
