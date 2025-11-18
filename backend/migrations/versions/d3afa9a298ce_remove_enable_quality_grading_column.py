"""remove_enable_quality_grading_column

Revision ID: d3afa9a298ce
Revises: 9870caf18f66
Create Date: 2025-11-17 15:03:13.694325

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd3afa9a298ce'
down_revision = '9870caf18f66'
branch_labels = None
depends_on = None


def upgrade():
    # Drop enable_quality_grading column from problems table
    op.drop_column('problems', 'enable_quality_grading')


def downgrade():
    # Re-add enable_quality_grading column if rolling back
    op.add_column('problems', sa.Column('enable_quality_grading', sa.Boolean(), nullable=False, server_default=sa.text('true')))
