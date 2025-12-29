"""Add kit_templates table for sophisticated kit assembly

Revision ID: fdddbbb2159b
Revises: 82e4a8e030c3
Create Date: 2025-12-28 21:02:56.403644

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fdddbbb2159b'
down_revision = '82e4a8e030c3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'kit_templates',
        sa.Column('id', sa.UUID(), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('kit_item_id', sa.UUID(), sa.ForeignKey('items.id'), nullable=False),
        sa.Column('components', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_by_user_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_kit_templates_name', 'kit_templates', ['name'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_kit_templates_name', table_name='kit_templates')
    op.drop_table('kit_templates')
