"""
Cleanup service to remove old test submissions
Test submissions (is_test=True) are temporary and don't need long-term storage.
This service automatically deletes test submissions older than 1 hour.
"""
from datetime import datetime, timedelta
import logging
from ..models import db, Submission

logger = logging.getLogger(__name__)

def cleanup_old_test_submissions(hours=1):
    """
    Delete test submissions (is_test=True) older than specified hours.
    
    Args:
        hours (int): Number of hours. Test submissions older than this will be deleted.
    
    Returns:
        int: Number of test submissions deleted
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Find and delete old test submissions
    old_test_submissions = Submission.query.filter(
        Submission.is_test == True,
        Submission.submitted_at < cutoff_time
    ).all()
    
    count = len(old_test_submissions)
    
    for submission in old_test_submissions:
        db.session.delete(submission)
    
    db.session.commit()
    
    logger.info(f"[CLEANUP] Deleted {count} old test submissions (older than {hours} hour(s))")
    return count


def cleanup_completed_test_submissions():
    """
    Delete all completed test submissions (not Pending/Running).
    Keep only running test submissions.
    
    Returns:
        int: Number of test submissions deleted
    """
    completed_test_submissions = Submission.query.filter(
        Submission.is_test == True,
        Submission.status.notin_(['Pending', 'Running'])
    ).all()
    
    count = len(completed_test_submissions)
    
    for submission in completed_test_submissions:
        db.session.delete(submission)
    
    db.session.commit()
    
    logger.info(f"[CLEANUP] Deleted {count} completed test submissions")
    return count
