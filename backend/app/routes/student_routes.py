from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Class, Problem, Submission
from ..decorators import role_required

student_bp = Blueprint('students', __name__, url_prefix='/api/students')


@student_bp.route('/me/classes/<int:class_id>/problems-status', methods=['GET'])
@jwt_required()
@role_required('student')
def get_problems_status_in_class(class_id):
    """Lấy trạng thái của tất cả problems trong class cho student hiện tại."""
    student_id = get_jwt_identity()
    student = User.query.get(student_id)
    target_class = Class.query.get_or_404(class_id)
    
    # Check if student is in the class
    if target_class not in student.classes_joined:
        return jsonify({"msg": "Forbidden - You are not in this class"}), 403
    
    problems = Problem.query.filter_by(class_id=class_id).all()
    problems_status = []
    
    for problem in problems:
        # Get student's submissions for this problem
        submissions = Submission.query.filter_by(
            problem_id=problem.id,
            student_id=student_id
        ).order_by(Submission.submitted_at.desc()).all()
        
        # Determine status and best score
        status = "not_started"
        best_score = 0
        attempts = len(submissions)
        
        if attempts > 0:
            # Calculate best score from all attempts
            for submission in submissions:
                total_points = sum(tc.points for tc in problem.test_cases)
                earned_points = 0
                passed_tests = 0
                
                for result in submission.results:
                    if result.status == 'Passed':
                        passed_tests += 1
                        test_case = next((tc for tc in problem.test_cases if tc.id == result.test_case_id), None)
                        if test_case:
                            earned_points += test_case.points
                
                score = round((earned_points / total_points * 100)) if total_points > 0 else 0
                best_score = max(best_score, score)
                
                # Update status based on best submission
                if score == 100:
                    status = "accepted"
                elif score > 0:
                    status = "failed"
        
        # Return format matching frontend expectations
        problems_status.append({
            "problem": {
                "id": problem.id,
                "title": problem.title,
                "description": problem.description,
                "difficulty": problem.difficulty,
                "grading_mode": problem.grading_mode,
                "time_limit": problem.time_limit_ms,
                "memory_limit": problem.memory_limit_kb // 1024  # Convert KB to MB
            },
            "submission": {
                "status": status,
                "score": best_score
            } if attempts > 0 else None,
            "attempts_count": attempts
        })
    
    return jsonify(problems_status), 200


@student_bp.route('/me/progress', methods=['GET'])
@jwt_required()
@role_required('student')
def get_my_progress():
    """Lấy tổng quan tiến độ của student."""
    student_id = get_jwt_identity()
    student = User.query.get(student_id)
    
    total_classes = len(student.classes_joined)
    total_problems = 0
    completed_problems = 0
    total_submissions = 0
    
    for class_obj in student.classes_joined:
        problems = Problem.query.filter_by(class_id=class_obj.id).all()
        total_problems += len(problems)
        
        for problem in problems:
            submissions = Submission.query.filter_by(
                problem_id=problem.id,
                student_id=student_id
            ).all()
            total_submissions += len(submissions)
            
            # Check if any submission got 100%
            for submission in submissions:
                total_points = sum(tc.points for tc in problem.test_cases)
                earned_points = sum(
                    tc.points for tc in problem.test_cases
                    if any(r.status == 'Passed' and r.test_case_id == tc.id for r in submission.results)
                )
                score = round((earned_points / total_points * 100)) if total_points > 0 else 0
                if score == 100:
                    completed_problems += 1
                    break  # Count each problem only once
    
    return jsonify({
        "total_classes": total_classes,
        "total_problems": total_problems,
        "completed_problems": completed_problems,
        "in_progress": total_problems - completed_problems if total_submissions > 0 else 0,
        "not_started": total_problems - completed_problems if total_submissions == 0 else 0,
        "total_submissions": total_submissions
    }), 200
