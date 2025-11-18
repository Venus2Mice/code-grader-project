"""add_code_quality_columns

Revision ID: 9870caf18f66
Revises: remove_parameter_types_001
Create Date: 2025-11-17 13:31:35.045981

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '9870caf18f66'
down_revision = 'remove_parameter_types_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add code quality columns to submissions table
    op.add_column('submissions', sa.Column('quality_score', sa.Integer(), nullable=True))
    op.add_column('submissions', sa.Column('complexity_metrics', JSONB, nullable=True))
    op.add_column('submissions', sa.Column('style_issues', JSONB, nullable=True))
    op.add_column('submissions', sa.Column('security_warnings', JSONB, nullable=True))
    
    # Add configuration columns to problems table
    op.add_column('problems', sa.Column('enable_quality_grading', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('problems', sa.Column('quality_weight', sa.Integer(), nullable=False, server_default='40'))


def downgrade():
    # Remove columns from problems table
    op.drop_column('problems', 'quality_weight')
    op.drop_column('problems', 'enable_quality_grading')
    
    # Remove columns from submissions table
    op.drop_column('submissions', 'security_warnings')
    op.drop_column('submissions', 'style_issues')
    op.drop_column('submissions', 'complexity_metrics')
    op.drop_column('submissions', 'quality_score')
