"""Add vendors reference table and link assets to vendors

Revision ID: b3f0d9a2c7e1
Revises: 26ad93f2da0a
Create Date: 2025-12-27
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b3f0d9a2c7e1"
down_revision = "26ad93f2da0a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vendors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_vendors_id"), "vendors", ["id"], unique=False)
    op.create_index(op.f("ix_vendors_name"), "vendors", ["name"], unique=False)

    op.add_column("assets", sa.Column("vendor_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_assets_vendor_id"), "assets", ["vendor_id"], unique=False)
    op.create_foreign_key("fk_assets_vendor_id_vendors", "assets", "vendors", ["vendor_id"], ["id"])

    # Backfill vendors from existing assets.vendor (trim spaces) and link assets.vendor_id
    op.execute(
        """
        INSERT INTO vendors (name, created_at, updated_at)
        SELECT DISTINCT btrim(vendor) AS name, NOW(), NOW()
        FROM assets
        WHERE vendor IS NOT NULL AND btrim(vendor) <> ''
        ON CONFLICT (name) DO NOTHING;
        """
    )
    op.execute(
        """
        UPDATE assets a
        SET vendor_id = v.id,
            vendor = v.name
        FROM vendors v
        WHERE btrim(a.vendor) = v.name;
        """
    )

    # Ensure no NULL vendor_id remains
    op.execute(
        """
        INSERT INTO vendors (name, created_at, updated_at)
        VALUES ('Unknown', NOW(), NOW())
        ON CONFLICT (name) DO NOTHING;
        """
    )
    op.execute(
        """
        UPDATE assets
        SET vendor_id = (SELECT id FROM vendors WHERE name = 'Unknown'),
            vendor = 'Unknown'
        WHERE vendor_id IS NULL;
        """
    )

    op.alter_column("assets", "vendor_id", nullable=False)


def downgrade() -> None:
    op.drop_constraint("fk_assets_vendor_id_vendors", "assets", type_="foreignkey")
    op.drop_index(op.f("ix_assets_vendor_id"), table_name="assets")
    op.drop_column("assets", "vendor_id")

    op.drop_index(op.f("ix_vendors_name"), table_name="vendors")
    op.drop_index(op.f("ix_vendors_id"), table_name="vendors")
    op.drop_table("vendors")


