"""add language field to problems table

Revision ID: add_language_field
Revises: a1b2c3d4e5f6
Create Date: 2025-10-30 14:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_language_field'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    """Add language column to problems table with default value and index"""
    # Add language column with server_default for existing rows
    # This field specifies the target programming language for the problem
    op.add_column(
        'problems',
        sa.Column('language', sa.String(length=50), nullable=False, server_default='cpp')
    )
    
    # Create index for better query performance when filtering by language
    op.create_index('ix_problems_language', 'problems', ['language'], unique=False)


def downgrade():
    """Remove language column and its index"""
    # Drop index first
    op.drop_index('ix_problems_language', table_name='problems')
    
    # Drop column
    op.drop_column('problems', 'language')
