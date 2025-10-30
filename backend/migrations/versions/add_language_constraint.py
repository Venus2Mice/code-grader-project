"""add check constraint for language field

Revision ID: add_lang_constraint
Revises: add_language_field
Create Date: 2025-10-30 14:25:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_lang_constraint'
down_revision = 'add_language_field'
branch_labels = None
depends_on = None


def upgrade():
    """Add check constraint to validate language field values"""
    op.create_check_constraint(
        'valid_language_check',
        'problems',
        "language IN ('cpp', 'python', 'java')"
    )


def downgrade():
    """Remove check constraint"""
    op.drop_constraint('valid_language_check', 'problems', type_='check')
