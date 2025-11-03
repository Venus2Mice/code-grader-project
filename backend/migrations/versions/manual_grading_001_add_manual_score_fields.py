"""Add manual grading fields to submissions

Revision ID: manual_grading_001
Revises: leetcode_style_001
Create Date: 2025-11-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'manual_grading_001'
down_revision = 'leetcode_style_001'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add manual grading fields to submissions table:
    - manual_score: Teacher-assigned score (overrides cached_score)
    - graded_by_teacher_id: FK to users table (teacher who graded)
    - graded_at: Timestamp when teacher graded
    - teacher_comment: Teacher's feedback comment
    """
    # Add new columns
    op.add_column('submissions', sa.Column('manual_score', sa.Integer(), nullable=True))
    op.add_column('submissions', sa.Column('graded_by_teacher_id', sa.Integer(), nullable=True))
    op.add_column('submissions', sa.Column('graded_at', sa.DateTime(), nullable=True))
    op.add_column('submissions', sa.Column('teacher_comment', sa.Text(), nullable=True))
    
    # Add foreign key constraint for graded_by_teacher_id
    op.create_foreign_key(
        'fk_submissions_graded_by_teacher_id',
        'submissions', 'users',
        ['graded_by_teacher_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Add comment to cached_score to mark it as deprecated
    op.alter_column('submissions', 'cached_score',
                    comment='DEPRECATED: Auto-calculated score (kept for backward compatibility). Use manual_score instead.')


def downgrade():
    """
    Remove manual grading fields from submissions table
    """
    # Drop foreign key constraint
    op.drop_constraint('fk_submissions_graded_by_teacher_id', 'submissions', type_='foreignkey')
    
    # Drop columns
    op.drop_column('submissions', 'teacher_comment')
    op.drop_column('submissions', 'graded_at')
    op.drop_column('submissions', 'graded_by_teacher_id')
    op.drop_column('submissions', 'manual_score')
    
    # Remove comment from cached_score
    op.alter_column('submissions', 'cached_score', comment=None)
