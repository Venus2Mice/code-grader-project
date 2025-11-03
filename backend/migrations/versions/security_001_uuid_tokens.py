"""Add UUID and opaque token fields for security

Revision ID: security_001_uuid_tokens
Revises: manual_grading_001
Create Date: 2025-11-03

This migration adds UUID and opaque token fields to key resources:
- Users: uuid, public_token
- Classes: uuid, public_token
- Problems: uuid, public_token
- Submissions: uuid, public_token

These fields enable:
1. Opaque token-based API access (prevents IDOR attacks)
2. UUID-based resource identification (prevents ID enumeration)
3. Secure resource sharing without exposing internal IDs
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = 'security_001_uuid_tokens'
down_revision = 'manual_grading_001'
branch_labels = None
depends_on = None


def upgrade():
    """Add UUID and public_token fields to users, classes, problems, and submissions."""
    
    # Get connection for data operations
    connection = op.get_bind()
    
    # ===== USERS TABLE =====
    # Add column as nullable first
    op.add_column('users', sa.Column('uuid', sa.String(36), nullable=True))
    op.add_column('users', sa.Column('public_token', sa.String(255), nullable=True))
    
    # Populate existing rows with UUIDs - need to do it row by row to ensure unique UUIDs
    result = connection.execute(sa.text("SELECT id FROM users"))
    for row in result:
        connection.execute(
            sa.text("UPDATE users SET uuid = :uuid_val WHERE id = :id"),
            {"uuid_val": str(uuid.uuid4()), "id": row[0]}
        )
    
    # Now make uuid NOT NULL
    op.alter_column('users', 'uuid', nullable=False)
    
    # Create unique constraints
    op.create_unique_constraint('uq_users_uuid', 'users', ['uuid'])
    op.create_unique_constraint('uq_users_public_token', 'users', ['public_token'])
    
    # Create indexes for faster lookups
    op.create_index('idx_users_uuid', 'users', ['uuid'])
    op.create_index('idx_users_public_token', 'users', ['public_token'])
    
    # ===== CLASSES TABLE =====
    op.add_column('classes', sa.Column('uuid', sa.String(36), nullable=True))
    op.add_column('classes', sa.Column('public_token', sa.String(255), nullable=True))
    
    # Populate existing rows with UUIDs
    result = connection.execute(sa.text("SELECT id FROM classes"))
    for row in result:
        connection.execute(
            sa.text("UPDATE classes SET uuid = :uuid_val WHERE id = :id"),
            {"uuid_val": str(uuid.uuid4()), "id": row[0]}
        )
    
    # Now make uuid NOT NULL
    op.alter_column('classes', 'uuid', nullable=False)
    
    # Create unique constraints
    op.create_unique_constraint('uq_classes_uuid', 'classes', ['uuid'])
    op.create_unique_constraint('uq_classes_public_token', 'classes', ['public_token'])
    
    # Create indexes for faster lookups
    op.create_index('idx_classes_uuid', 'classes', ['uuid'])
    op.create_index('idx_classes_public_token', 'classes', ['public_token'])
    
    # ===== PROBLEMS TABLE =====
    op.add_column('problems', sa.Column('uuid', sa.String(36), nullable=True))
    op.add_column('problems', sa.Column('public_token', sa.String(255), nullable=True))
    
    # Populate existing rows with UUIDs
    result = connection.execute(sa.text("SELECT id FROM problems"))
    for row in result:
        connection.execute(
            sa.text("UPDATE problems SET uuid = :uuid_val WHERE id = :id"),
            {"uuid_val": str(uuid.uuid4()), "id": row[0]}
        )
    
    # Now make uuid NOT NULL
    op.alter_column('problems', 'uuid', nullable=False)
    
    # Create unique constraints
    op.create_unique_constraint('uq_problems_uuid', 'problems', ['uuid'])
    op.create_unique_constraint('uq_problems_public_token', 'problems', ['public_token'])
    
    # Create indexes for faster lookups
    op.create_index('idx_problems_uuid', 'problems', ['uuid'])
    op.create_index('idx_problems_public_token', 'problems', ['public_token'])
    
    # ===== SUBMISSIONS TABLE =====
    op.add_column('submissions', sa.Column('uuid', sa.String(36), nullable=True))
    op.add_column('submissions', sa.Column('public_token', sa.String(255), nullable=True))
    
    # Populate existing rows with UUIDs
    result = connection.execute(sa.text("SELECT id FROM submissions"))
    for row in result:
        connection.execute(
            sa.text("UPDATE submissions SET uuid = :uuid_val WHERE id = :id"),
            {"uuid_val": str(uuid.uuid4()), "id": row[0]}
        )
    
    # Now make uuid NOT NULL
    op.alter_column('submissions', 'uuid', nullable=False)
    
    # Create unique constraints
    op.create_unique_constraint('uq_submissions_uuid', 'submissions', ['uuid'])
    op.create_unique_constraint('uq_submissions_public_token', 'submissions', ['public_token'])
    
    # Create indexes for faster lookups
    op.create_index('idx_submissions_uuid', 'submissions', ['uuid'])
    op.create_index('idx_submissions_public_token', 'submissions', ['public_token'])


def downgrade():
    """Remove UUID and public_token fields."""
    
    # ===== SUBMISSIONS TABLE =====
    op.drop_index('idx_submissions_public_token', table_name='submissions')
    op.drop_index('idx_submissions_uuid', table_name='submissions')
    op.drop_constraint('uq_submissions_public_token', 'submissions', type_='unique')
    op.drop_constraint('uq_submissions_uuid', 'submissions', type_='unique')
    op.drop_column('submissions', 'public_token')
    op.drop_column('submissions', 'uuid')
    
    # ===== PROBLEMS TABLE =====
    op.drop_index('idx_problems_public_token', table_name='problems')
    op.drop_index('idx_problems_uuid', table_name='problems')
    op.drop_constraint('uq_problems_public_token', 'problems', type_='unique')
    op.drop_constraint('uq_problems_uuid', 'problems', type_='unique')
    op.drop_column('problems', 'public_token')
    op.drop_column('problems', 'uuid')
    
    # ===== CLASSES TABLE =====
    op.drop_index('idx_classes_public_token', table_name='classes')
    op.drop_index('idx_classes_uuid', table_name='classes')
    op.drop_constraint('uq_classes_public_token', 'classes', type_='unique')
    op.drop_constraint('uq_classes_uuid', 'classes', type_='unique')
    op.drop_column('classes', 'public_token')
    op.drop_column('classes', 'uuid')
    
    # ===== USERS TABLE =====
    op.drop_index('idx_users_public_token', table_name='users')
    op.drop_index('idx_users_uuid', table_name='users')
    op.drop_constraint('uq_users_public_token', 'users', type_='unique')
    op.drop_constraint('uq_users_uuid', 'users', type_='unique')
    op.drop_column('users', 'public_token')
    op.drop_column('users', 'uuid')
