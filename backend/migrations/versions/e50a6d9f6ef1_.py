"""empty message

Revision ID: e50a6d9f6ef1
Revises: 0cee517cf2c7, security_001_uuid_tokens
Create Date: 2025-11-03 10:17:00.124117

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e50a6d9f6ef1'
down_revision = ('0cee517cf2c7', 'security_001_uuid_tokens')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
