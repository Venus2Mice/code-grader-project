"""Add performance indexes to critical tables

Revision ID: optimize_indexes_001
Revises: a1b2c3d4e5f6
Create Date: 2025-10-18 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'optimize_indexes_001'
down_revision = 'f9a8b7c6d5e4'
branch_labels = None
depends_on = None


def upgrade():
    # Create indexes for performance optimization
    op.create_index('idx_submissions_problem_id', 'submissions', ['problem_id'])
    op.create_index('idx_submissions_student_id', 'submissions', ['student_id'])
    op.create_index('idx_submission_results_submission_id', 'submission_results', ['submission_id'])
    op.create_index('idx_problems_class_id', 'problems', ['class_id'])
    op.create_index('idx_test_cases_problem_id', 'test_cases', ['problem_id'])
    
    # Add cached_score column to submissions for performance
    op.add_column('submissions', sa.Column('cached_score', sa.Integer, nullable=True, default=0))


def downgrade():
    # Remove indexes
    op.drop_index('idx_submissions_problem_id', table_name='submissions')
    op.drop_index('idx_submissions_student_id', table_name='submissions')
    op.drop_index('idx_submission_results_submission_id', table_name='submission_results')
    op.drop_index('idx_problems_class_id', table_name='problems')
    op.drop_index('idx_test_cases_problem_id', table_name='test_cases')
    
    # Remove cached_score column
    op.drop_column('submissions', 'cached_score')
