"""Remove deprecated parameter_types field from problems

Revision ID: remove_parameter_types_001
Revises: 434d0a31b503
Create Date: 2025-11-04 08:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_parameter_types_001'
down_revision = '434d0a31b503'
branch_labels = None
depends_on = None


def upgrade():
    # Remove parameter_types column from problems table
    # This field was DEPRECATED and not used anywhere in the codebase
    op.drop_column('problems', 'parameter_types')


def downgrade():
    # Restore parameter_types column if needed (for rollback)
    op.add_column('problems', sa.Column('parameter_types', sa.JSON(), nullable=True))
