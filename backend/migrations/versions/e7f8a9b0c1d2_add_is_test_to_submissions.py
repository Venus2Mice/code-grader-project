"""add_is_test_to_submissions

Revision ID: e7f8a9b0c1d2
Revises: d6ce8b6308d1
Create Date: 2025-10-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7f8a9b0c1d2'
down_revision = 'd6ce8b6308d1'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_test column to submissions table
    op.add_column('submissions', sa.Column('is_test', sa.Boolean(), nullable=True))
    
    # Set default value False for existing submissions (using FALSE for PostgreSQL)
    op.execute("UPDATE submissions SET is_test = FALSE WHERE is_test IS NULL")
    
    # Make the column non-nullable after setting defaults
    op.alter_column('submissions', 'is_test',
                    existing_type=sa.Boolean(),
                    nullable=False,
                    server_default='false')


def downgrade():
    # Remove is_test column
    op.drop_column('submissions', 'is_test')
