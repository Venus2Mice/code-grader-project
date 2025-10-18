"""allow null test_case_id for compile errors

Revision ID: f9a8b7c6d5e4
Revises: e7f8a9b0c1d2
Create Date: 2025-10-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f9a8b7c6d5e4'
down_revision = 'e7f8a9b0c1d2'
branch_labels = None
depends_on = None


def upgrade():
    # Make test_case_id nullable in submission_results table
    with op.batch_alter_table('submission_results', schema=None) as batch_op:
        batch_op.alter_column('test_case_id',
                              existing_type=sa.Integer(),
                              nullable=True)


def downgrade():
    # Revert test_case_id to non-nullable
    with op.batch_alter_table('submission_results', schema=None) as batch_op:
        batch_op.alter_column('test_case_id',
                              existing_type=sa.Integer(),
                              nullable=False)
