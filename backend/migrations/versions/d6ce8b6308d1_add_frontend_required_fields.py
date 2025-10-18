"""add_frontend_required_fields

Revision ID: d6ce8b6308d1
Revises: dfdbaaf2dc3e
Create Date: 2025-10-16 08:23:27.997488

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd6ce8b6308d1'
down_revision = 'dfdbaaf2dc3e'
branch_labels = None
depends_on = None


def upgrade():
    # Add description to classes table
    op.add_column('classes', sa.Column('description', sa.Text(), nullable=True))
    
    # Add new fields to problems table
    op.add_column('problems', sa.Column('difficulty', sa.String(length=20), nullable=True))
    op.add_column('problems', sa.Column('grading_mode', sa.String(length=20), nullable=True))
    op.add_column('problems', sa.Column('function_signature', sa.Text(), nullable=True))
    
    # Add points to test_cases table
    op.add_column('test_cases', sa.Column('points', sa.Integer(), nullable=True))
    
    # Set default values for existing records
    op.execute("UPDATE problems SET difficulty = 'medium' WHERE difficulty IS NULL")
    op.execute("UPDATE problems SET grading_mode = 'stdio' WHERE grading_mode IS NULL")
    op.execute("UPDATE test_cases SET points = 10 WHERE points IS NULL")


def downgrade():
    # Remove columns in reverse order
    op.drop_column('test_cases', 'points')
    op.drop_column('problems', 'function_signature')
    op.drop_column('problems', 'grading_mode')
    op.drop_column('problems', 'difficulty')
    op.drop_column('classes', 'description')
