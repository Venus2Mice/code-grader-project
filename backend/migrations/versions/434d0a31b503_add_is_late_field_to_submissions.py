"""Add is_late field to submissions

Revision ID: 434d0a31b503
Revises: 4c51eca8080d
Create Date: 2025-11-04 07:52:13.239121

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '434d0a31b503'
down_revision = '4c51eca8080d'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_late column to submissions table
    op.add_column('submissions', sa.Column('is_late', sa.Boolean(), nullable=True))
    
    # Set default value for existing rows
    op.execute('UPDATE submissions SET is_late = FALSE WHERE is_late IS NULL')
    
    # Make it non-nullable
    op.alter_column('submissions', 'is_late', nullable=False, server_default=sa.false())


def downgrade():
    # Remove is_late column
    op.drop_column('submissions', 'is_late')
