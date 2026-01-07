"""add donated item category

Revision ID: 5ba46a4f39df
Revises: bf23fc395112
Create Date: 2026-01-04 09:32:06.107264

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5ba46a4f39df'
down_revision = 'bf23fc395112'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new enum value to Postgres enum type used by items.category
    op.execute(
        """
        DO $$
        BEGIN
            ALTER TYPE itemcategory ADD VALUE IF NOT EXISTS 'DONATED';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )


def downgrade() -> None:
    # Postgres does not support removing enum values easily.
    # We leave the DONATED value in place on downgrade.
    pass
