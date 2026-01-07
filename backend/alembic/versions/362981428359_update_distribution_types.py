"""update distribution types

Revision ID: 362981428359
Revises: 5ba46a4f39df
Create Date: 2026-01-04 09:33:25.651040

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '362981428359'
down_revision = '5ba46a4f39df'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add legacy column to preserve old specific distribution types
    op.add_column('distributions', sa.Column('distribution_type_legacy', sa.String(length=50), nullable=True))

    # Create new enum type
    op.execute("CREATE TYPE distributiontype_new AS ENUM ('WEEKLY','BI_WEEKLY','MONTHLY','BI_MONTHLY','CRISIS_AID','OTHER')")

    # Preserve legacy values that won't exist in the new enum
    op.execute(
        """
        UPDATE distributions
        SET distribution_type_legacy = distribution_type::text
        WHERE distribution_type IN ('SCHOOL_DELIVERY','BOARDING_HOME','LARGE_AID_DROP')
        """
    )

    # Convert column to new enum with mapping
    op.execute(
        """
        ALTER TABLE distributions
        ALTER COLUMN distribution_type
        TYPE distributiontype_new
        USING (
          CASE
            WHEN distribution_type = 'WEEKLY_PACKAGE' THEN 'WEEKLY'::distributiontype_new
            WHEN distribution_type = 'CRISIS_AID' THEN 'CRISIS_AID'::distributiontype_new
            WHEN distribution_type = 'OTHER' THEN 'OTHER'::distributiontype_new
            WHEN distribution_type IN ('SCHOOL_DELIVERY','BOARDING_HOME','LARGE_AID_DROP') THEN 'OTHER'::distributiontype_new
            ELSE 'OTHER'::distributiontype_new
          END
        )
        """
    )

    # Replace old enum type
    op.execute('DROP TYPE distributiontype')
    op.execute('ALTER TYPE distributiontype_new RENAME TO distributiontype')


def downgrade() -> None:
    # Best-effort downgrade: keep current enum as-is and drop legacy column.
    # Full reversal would require recreating old enum values.
    op.drop_column('distributions', 'distribution_type_legacy')
