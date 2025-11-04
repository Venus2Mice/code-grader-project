"""Add user language preference and problem translations

Revision ID: i18n_001_language_support
Revises: security_001_uuid_tokens
Create Date: 2025-11-04

This migration adds internationalization (i18n) support:
- Users: language preference field (en/vi)
- Problems: Vietnamese translation fields for title, description, and markdown_content

These fields enable:
1. User language preference tracking and persistence
2. Multilingual problem content (English + Vietnamese)
3. Localized user experience based on preference
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'i18n_001_language_support'
down_revision = 'security_001_uuid_tokens'
branch_labels = None
depends_on = None


def upgrade():
    """Add language preference to users and translation fields to problems"""
    
    # 1. Add language preference to users table
    # Default to 'en' for existing users, allows 'en' or 'vi'
    op.add_column(
        'users',
        sa.Column('language', sa.String(length=5), nullable=False, server_default='en')
    )
    
    # Create index for better query performance when filtering by language
    op.create_index('ix_users_language', 'users', ['language'], unique=False)
    
    # 2. Add Vietnamese translation fields to problems table
    # These fields are nullable since not all problems may have translations yet
    op.add_column(
        'problems',
        sa.Column('title_vi', sa.String(length=255), nullable=True)
    )
    
    op.add_column(
        'problems',
        sa.Column('description_vi', sa.Text, nullable=True)
    )
    
    op.add_column(
        'problems',
        sa.Column('markdown_content_vi', sa.Text, nullable=True)
    )
    
    # Add check constraint to ensure language is either 'en' or 'vi'
    op.create_check_constraint(
        'valid_user_language_check',
        'users',
        "language IN ('en', 'vi')"
    )


def downgrade():
    """Remove language preference and translation fields"""
    
    # Drop check constraint first
    op.drop_constraint('valid_user_language_check', 'users', type_='check')
    
    # Drop problem translation fields
    op.drop_column('problems', 'markdown_content_vi')
    op.drop_column('problems', 'description_vi')
    op.drop_column('problems', 'title_vi')
    
    # Drop user language preference
    op.drop_index('ix_users_language', table_name='users')
    op.drop_column('users', 'language')
