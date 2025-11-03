"""Utility functions for token-based resource lookup."""

from flask import abort
from .models import User, Class, Problem, Submission


def find_class_by_token_or_404(token: str):
    """Find a class by its public_token or raise 404."""
    class_obj = Class.query.filter_by(public_token=token).first()
    if not class_obj:
        abort(404, description="Class not found")
    return class_obj


def find_problem_by_token_or_404(token: str):
    """Find a problem by its public_token or raise 404."""
    problem = Problem.query.filter_by(public_token=token).first()
    if not problem:
        abort(404, description="Problem not found")
    return problem


def find_submission_by_token_or_404(token: str):
    """Find a submission by its public_token or raise 404."""
    submission = Submission.query.filter_by(public_token=token).first()
    if not submission:
        abort(404, description="Submission not found")
    return submission


def find_user_by_token_or_404(token: str):
    """Find a user by its public_token or raise 404."""
    user = User.query.filter_by(public_token=token).first()
    if not user:
        abort(404, description="User not found")
    return user
