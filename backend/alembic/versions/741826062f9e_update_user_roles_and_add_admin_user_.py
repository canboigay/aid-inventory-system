"""update user roles and add admin user edit

Revision ID: 741826062f9e
Revises: 362981428359
Create Date: 2026-01-04 09:35:04.559764

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '741826062f9e'
down_revision = '362981428359'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE userrole_new AS ENUM ('ADMIN','WAREHOUSE_MANAGER','OUTREACH_COORDINATOR','IN_HOUSE_PRODUCTION_COORDINATOR','PRODUCT_PURCHASER')")

    # Convert users.role to new enum values
    op.execute(
        """
        ALTER TABLE users
        ALTER COLUMN role
        TYPE userrole_new
        USING (
          CASE
            WHEN role = 'ADMIN' THEN 'ADMIN'::userrole_new
            WHEN role = 'WAREHOUSE_STAFF' THEN 'WAREHOUSE_MANAGER'::userrole_new
            WHEN role = 'PRODUCTION_STAFF' THEN 'IN_HOUSE_PRODUCTION_COORDINATOR'::userrole_new
            WHEN role = 'DISTRIBUTION_COORDINATOR' THEN 'OUTREACH_COORDINATOR'::userrole_new
            ELSE 'WAREHOUSE_MANAGER'::userrole_new
          END
        )
        """
    )

    op.execute('DROP TYPE userrole')
    op.execute('ALTER TYPE userrole_new RENAME TO userrole')


def downgrade() -> None:
    # Best-effort downgrade: keep current enum as-is (no recreation of removed enum values).
    pass
