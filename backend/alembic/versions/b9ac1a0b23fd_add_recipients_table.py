"""add recipients table

Revision ID: b9ac1a0b23fd
Revises: fdddbbb2159b
Create Date: 2026-01-04 09:19:33.752594

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b9ac1a0b23fd'
down_revision = 'fdddbbb2159b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'recipients',
        sa.Column('id', sa.UUID(), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('name', name='uq_recipients_name'),
    )
    op.create_index('ix_recipients_name', 'recipients', ['name'])
    op.create_index('ix_recipients_is_active', 'recipients', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_recipients_is_active', table_name='recipients')
    op.drop_index('ix_recipients_name', table_name='recipients')
    op.drop_table('recipients')
