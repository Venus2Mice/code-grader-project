"""Seed test submissions with sample solutions."""

import click
from flask.cli import with_appcontext
from ..models import Problem, User, Role, Submission, SubmissionResult, db
from datetime import datetime, timedelta


@click.command(name='seed_test_submissions')
@with_appcontext
def seed_test_submissions_command():
    """Create diverse test submissions to demonstrate grading system."""
    print("\n>>> Creating test submissions for all problems...")
    print("="*60)
    
    # Get all problems and students
    problems = Problem.query.all()
    student_role = Role.query.filter_by(name='student').first()
    if not student_role:
        print("[ERROR] Student role not found. Run 'flask seed_db' first.")
        return
    
    students = User.query.filter_by(role_id=student_role.id).all()
    
    if not problems:
        print("[ERROR] No problems found. Run 'flask seed_test_data' first.")
        return
    
    if not students:
        print("[ERROR] No students found. Run 'flask seed_test_data' first.")
        return
    
    print(f"[INFO] Found {len(problems)} problems and {len(students)} students")
    print("-"*60)
    
    # Import solution templates and helper
    from .problem_templates import get_sample_solutions
    from ..services.token_service import generate_submission_token
    
    submission_count = 0
    base_time = datetime.utcnow() - timedelta(days=7)  # Start from 7 days ago
    
    for idx, problem in enumerate(problems):
        print(f"\n[PROBLEM] {problem.title} ({problem.language})")
        
        solutions = get_sample_solutions(problem.title, problem.language)
        if not solutions or 'correct' not in solutions:
            print(f"  [WARN] No sample solutions available, skipping...")
            continue
        
        correct_solution = solutions['correct']
        wrong_solution = solutions.get('wrong', correct_solution)
        
        # Alice - Perfect student
        if len(students) >= 1:
            alice = students[0]
            submission = _create_submission(
                problem, alice, correct_solution, 'Accepted',
                base_time + timedelta(hours=idx*2), False
            )
            _create_submission_results(submission, 'Accepted')
            submission_count += 1
            print(f"  [OK] {alice.full_name}: AC (100 points)")
        
        # Bob - Mixed results
        if len(students) >= 2:
            bob = students[1]
            if 'wrong' in solutions:
                sub1 = _create_submission(
                    problem, bob, wrong_solution, 'Wrong Answer',
                    base_time + timedelta(hours=idx*2, minutes=30), False
                )
                _create_submission_results(sub1, 'Wrong Answer', 40)
                submission_count += 1
                print(f"  [WA] {bob.full_name}: WA (40 points) - Try 1")
            
            sub2 = _create_submission(
                problem, bob, correct_solution, 'Accepted',
                base_time + timedelta(hours=idx*2, minutes=45), False
            )
            _create_submission_results(sub2, 'Accepted')
            submission_count += 1
            print(f"  [OK] {bob.full_name}: AC (100 points) - Try 2")
        
        # Charlie - Partial completion
        if len(students) >= 3:
            charlie = students[2]
            if idx % 2 == 0:
                submission = _create_submission(
                    problem, charlie, correct_solution, 'Accepted',
                    base_time + timedelta(hours=idx*2, minutes=60), False
                )
                _create_submission_results(submission, 'Accepted')
                submission_count += 1
                print(f"  [OK] {charlie.full_name}: AC (100 points)")
            else:
                if 'wrong' in solutions:
                    submission = _create_submission(
                        problem, charlie, wrong_solution, 'Wrong Answer',
                        base_time + timedelta(hours=idx*2, minutes=70), False
                    )
                    _create_submission_results(submission, 'Wrong Answer', 30)
                    submission_count += 1
                    print(f"  [WA] {charlie.full_name}: WA (30 points)")
    
    print("\n" + "="*60)
    print(f"[SUCCESS] Created {submission_count} test submissions!")
    print("="*60)
    
    if submission_count > 0:
        print("\n[SUMMARY] SUBMISSION STATS:")
        print(f"  Total: {submission_count} submissions")


def _create_submission(problem, student, source_code, status, submitted_at, is_test):
    """Helper to create a submission with token."""
    from ..services.token_service import generate_submission_token
    
    total_points = sum(tc.points for tc in problem.test_cases)
    if status == 'Accepted':
        cached_score = total_points
    elif status == 'Wrong Answer':
        cached_score = int(total_points * 0.4)
    else:
        cached_score = 0
    
    submission = Submission(
        problem_id=problem.id,
        student_id=student.id,
        source_code=source_code,
        language=problem.language,
        status=status,
        submitted_at=submitted_at,
        is_test=is_test,
        cached_score=cached_score
    )
    db.session.add(submission)
    db.session.commit()
    
    submission.public_token = generate_submission_token(submission.id)
    db.session.commit()
    
    return submission


def _create_submission_results(submission, overall_status, partial_score=None):
    """Helper to create submission results for test cases."""
    problem = submission.problem
    test_cases = problem.test_cases
    
    if overall_status == 'Accepted':
        for tc in test_cases:
            result = SubmissionResult(
                submission_id=submission.id,
                test_case_id=tc.id,
                status='Accepted',
                execution_time_ms=50 + (tc.id % 100),
                memory_used_kb=2048 + (tc.id % 1000),
                output_received="(Output matches expected)",
                error_message=None
            )
            db.session.add(result)
    
    elif overall_status == 'Wrong Answer':
        passed_count = int(len(test_cases) * 0.5) if partial_score is None else int(len(test_cases) * (partial_score / 100))
        for i, tc in enumerate(test_cases):
            if i < passed_count:
                result = SubmissionResult(
                    submission_id=submission.id,
                    test_case_id=tc.id,
                    status='Accepted',
                    execution_time_ms=45 + (tc.id % 100),
                    memory_used_kb=2000 + (tc.id % 1000),
                    output_received="(Output matches expected)",
                    error_message=None
                )
            else:
                result = SubmissionResult(
                    submission_id=submission.id,
                    test_case_id=tc.id,
                    status='Wrong Answer',
                    execution_time_ms=50 + (tc.id % 100),
                    memory_used_kb=2100 + (tc.id % 1000),
                    output_received="(Wrong output)",
                    error_message="Output does not match expected result"
                )
            db.session.add(result)
    
    db.session.commit()
