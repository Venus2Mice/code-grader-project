"""Add LeetCode-style structured inputs

Revision ID: leetcode_style_001
Revises: previous_migration
Create Date: 2025-10-23

This migration transforms the grading system to use structured JSON inputs
similar to LeetCode, replacing both STDIO and function-based modes.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'leetcode_style_001'
down_revision = None  # Update this to point to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # ===== Problems Table =====
    # Remove old grading_mode column
    op.drop_column('problems', 'grading_mode')
    
    # Add parameter_types array
    op.add_column('problems', 
        sa.Column('parameter_types', postgresql.ARRAY(sa.Text), nullable=True)
    )
    
    # ===== Test Cases Table =====
    # Add new JSONB columns first
    op.add_column('test_cases',
        sa.Column('inputs_new', postgresql.JSONB, nullable=True)
    )
    op.add_column('test_cases',
        sa.Column('expected_output_new', postgresql.JSONB, nullable=True)
    )
    
    # Migrate existing data from old format to new format
    # This converts old text-based inputs to structured JSON
    op.execute("""
        UPDATE test_cases
        SET 
            inputs_new = jsonb_build_array(
                jsonb_build_object(
                    'type', 'string',
                    'value', input_data
                )
            ),
            expected_output_new = jsonb_build_object(
                'type', 'string',
                'value', expected_output
            )
        WHERE input_data IS NOT NULL AND expected_output IS NOT NULL;
    """)
    
    # Drop old columns
    op.drop_column('test_cases', 'input_data')
    op.drop_column('test_cases', 'expected_output')
    
    # Rename new columns
    op.alter_column('test_cases', 'inputs_new', new_column_name='inputs')
    op.alter_column('test_cases', 'expected_output_new', new_column_name='expected_output')
    
    # Make them NOT NULL after migration
    op.alter_column('test_cases', 'inputs',
                    existing_type=postgresql.JSONB,
                    nullable=False)
    op.alter_column('test_cases', 'expected_output',
                    existing_type=postgresql.JSONB,
                    nullable=False)


def downgrade():
    # ===== Test Cases Table =====
    # Add back old columns
    op.add_column('test_cases',
        sa.Column('input_data', sa.Text, nullable=True)
    )
    op.add_column('test_cases',
        sa.Column('expected_output', sa.Text, nullable=True)
    )
    
    # Migrate data back (lossy conversion)
    op.execute("""
        UPDATE test_cases
        SET 
            input_data = (inputs->0->>'value'),
            expected_output = (expected_output->>'value');
    """)
    
    # Drop new columns
    op.drop_column('test_cases', 'inputs')
    op.drop_column('test_cases', 'expected_output')
    
    # ===== Problems Table =====
    op.drop_column('problems', 'parameter_types')
    op.add_column('problems',
        sa.Column('grading_mode', sa.String(20), server_default='stdio', nullable=True)
    )
