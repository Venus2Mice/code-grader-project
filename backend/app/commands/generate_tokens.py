"""Generate public tokens for existing records."""

import click
import secrets
import base64
from flask.cli import with_appcontext
from ..models import User, Class, Problem, Submission, db


def generate_opaque_token():
    """Generate a URL-safe opaque token."""
    # Generate 32 random bytes and encode as base64
    random_bytes = secrets.token_bytes(32)
    token = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
    return token


@click.command(name='generate_tokens')
@with_appcontext
def generate_tokens_command():
    """Generate public_token for all existing records that don't have one."""
    
    print("🔐 Generating public tokens for existing records...")
    
    # Generate tokens for Users
    users_updated = 0
    for user in User.query.filter_by(public_token=None).all():
        user.public_token = generate_opaque_token()
        users_updated += 1
    
    # Generate tokens for Classes
    classes_updated = 0
    for class_obj in Class.query.filter_by(public_token=None).all():
        class_obj.public_token = generate_opaque_token()
        classes_updated += 1
    
    # Generate tokens for Problems
    problems_updated = 0
    for problem in Problem.query.filter_by(public_token=None).all():
        problem.public_token = generate_opaque_token()
        problems_updated += 1
    
    # Generate tokens for Submissions
    submissions_updated = 0
    for submission in Submission.query.filter_by(public_token=None).all():
        submission.public_token = generate_opaque_token()
        submissions_updated += 1
    
    # Commit all changes
    db.session.commit()
    
    print(f"✅ Generated tokens for:")
    print(f"   - {users_updated} users")
    print(f"   - {classes_updated} classes")
    print(f"   - {problems_updated} problems")
    print(f"   - {submissions_updated} submissions")
    print("\n✅ Token generation complete!")
