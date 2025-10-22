"""add language_limits and function_name to problems

Revision ID: a1b2c3d4e5f6
Revises: d6ce8b6308d1
Create Date: 2025-10-22 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'd6ce8b6308d1'
branch_labels = None
depends_on = None


def upgrade():
    # Add function_name column for function-based grading
    op.add_column('problems', sa.Column('function_name', sa.String(length=100), nullable=True))
    
    # Add language_limits column as JSONB for language-specific time/memory limits
    # Schema: {"cpp": {"timeMs": 1000, "memoryKb": 65536}, "python": {"timeMs": 5000, "memoryKb": 131072}}
    op.add_column('problems', sa.Column('language_limits', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Create index on language_limits for better query performance
    op.create_index('ix_problems_language_limits', 'problems', ['language_limits'], postgresql_using='gin')


def downgrade():
    # Drop index
    op.drop_index('ix_problems_language_limits', table_name='problems')
    
    # Drop columns
    op.drop_column('problems', 'language_limits')
    op.drop_column('problems', 'function_name')
