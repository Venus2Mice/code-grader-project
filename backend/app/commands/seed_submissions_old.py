"""Seed test submissions with sample solutions."""

import click
from flask.cli import with_appcontext
from ..models import Problem, User, Role, Submission, db
from .. import rabbitmq_producer


@click.command(name='seed_test_submissions')
@with_appcontext
def seed_test_submissions_command():
    """Create test submissions for all problems with sample solutions."""
    print("\n��� Creating test submissions for all problems...")
    print("="*60)
    
    # Get all problems and students
    problems = Problem.query.all()
    student_role = Role.query.filter_by(name='student').first()
    if not student_role:
        print("❌ Student role not found. Run 'flask seed_db' first.")
        return
    
    students = User.query.filter_by(role_id=student_role.id).all()
    
    if not problems:
        print("❌ No problems found. Run 'flask seed_test_data' first.")
        return
    
    if not students:
        print("❌ No students found. Run 'flask seed_test_data' first.")
        return
    
    print(f"��� Found {len(problems)} problems and {len(students)} students")
    print("-"*60)
    
    # Import solution templates
    from .problem_templates import get_sample_solutions
    
    submission_count = 0
    
    for problem in problems:
        print(f"\n��� Problem: {problem.title} ({problem.language})")
        
        # Get sample solutions for this problem
        solutions = get_sample_solutions(problem.title, problem.language)
        if not solutions:
            print(f"  ⚠️  No sample solutions available")
            continue
        
        # Create submissions for each student (rotate through solution types)
        solution_types = list(solutions.keys())
        for i, student in enumerate(students):
            solution_type = solution_types[i % len(solution_types)]
            source_code = solutions[solution_type]
            
            # Create submission
            submission = Submission(
                problem_id=problem.id,
                student_id=student.id,
                source_code=source_code,
                language=problem.language,
                status='Pending',
                is_test=False
            )
            db.session.add(submission)
            db.session.commit()
            
            # Publish to RabbitMQ for grading
            try:
                task_data = {"submission_id": submission.id}
                rabbitmq_producer.publish_task(task_data)
                submission_count += 1
                print(f"  ✅ {student.full_name}: Submission #{submission.id} ({solution_type})")
            except Exception as e:
                print(f"  ❌ Failed to publish submission #{submission.id}: {str(e)}")
    
    print("\n" + "="*60)
    print(f"✅ Created {submission_count} test submissions!")
    print("="*60)
    
    if submission_count > 0:
        print("\n��� NEXT STEPS:")
        print("1. Ensure Docker services are running: docker compose up -d")
        print("2. Watch submissions being graded by worker")
        print("3. Check results via API or frontend")
        
        print("\n��� SUBMISSION DISTRIBUTION:")
        print(f"  Total: {submission_count} submissions")
        if len(problems) > 0:
            print(f"  Per Problem: ~{submission_count // len(problems)} submissions")
        if len(students) > 0:
            print(f"  Per Student: ~{submission_count // len(students)} submissions")
