"""add unit cost thb to items

Revision ID: bf23fc395112
Revises: b9ac1a0b23fd
Create Date: 2026-01-04 09:21:40.822596

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bf23fc395112'
down_revision = 'b9ac1a0b23fd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('items', sa.Column('unit_cost_thb', sa.Integer(), nullable=True))
    op.create_index('ix_items_unit_cost_thb', 'items', ['unit_cost_thb'])


def downgrade() -> None:
    op.drop_index('ix_items_unit_cost_thb', table_name='items')
    op.drop_column('items', 'unit_cost_thb')
