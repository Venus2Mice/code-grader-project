"""add_markdown_content_to_problems

Revision ID: markdown_content_001
Revises: d6ce8b6308d1
Create Date: 2025-01-31 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'markdown_content_001'
down_revision = 'd6ce8b6308d1'
branch_labels = None
depends_on = None


def upgrade():
    # Add markdown_content column to problems table (optional field)
    op.add_column('problems', sa.Column('markdown_content', sa.Text(), nullable=True))


def downgrade():
    # Remove markdown_content column
    op.drop_column('problems', 'markdown_content')
