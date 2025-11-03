"""add explicit function definition fields (return_type, parameters)

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-11-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Add return_type column to store return type explicitly
    op.add_column('problems', sa.Column('return_type', sa.String(length=100), nullable=True, server_default='int'))
    
    # Add parameters column as JSONB to store parameter definitions
    # Schema: [{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}]
    op.add_column('problems', sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default='[]'))
    
    # Make function_signature nullable (backward compatibility)
    op.alter_column('problems', 'function_signature', 
               existing_type=sa.Text(),
               nullable=True)
    
    # Make function_name not nullable for new flow, but migration needs to handle existing data
    # For now, keep nullable and set defaults later
    op.alter_column('problems', 'function_name',
               existing_type=sa.String(length=100),
               nullable=True)
    
    # Create index on return_type for better query performance
    op.create_index('ix_problems_return_type', 'problems', ['return_type'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_problems_return_type', table_name='problems')
    
    # Revert column changes
    op.alter_column('problems', 'function_name',
               existing_type=sa.String(length=100),
               nullable=True)
    
    op.alter_column('problems', 'function_signature',
               existing_type=sa.Text(),
               nullable=False)
    
    # Drop new columns
    op.drop_column('problems', 'parameters')
    op.drop_column('problems', 'return_type')
