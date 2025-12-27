"""Inventory sessions: scope by device types

Revision ID: c3a1f6c2d2b1
Revises: b3f0d9a2c7e1
Create Date: 2025-12-27
"""

from alembic import op
import sqlalchemy as sa


revision = "c3a1f6c2d2b1"
down_revision = "b3f0d9a2c7e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "inventory_session_device_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("device_type_code", sa.String(length=2), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["inventory_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["device_type_code"], ["device_types.code"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "device_type_code", name="uq_inventory_session_device_type"),
    )
    op.create_index(op.f("ix_inventory_session_device_types_id"), "inventory_session_device_types", ["id"], unique=False)
    op.create_index(op.f("ix_inventory_session_device_types_session_id"), "inventory_session_device_types", ["session_id"], unique=False)
    op.create_index(op.f("ix_inventory_session_device_types_device_type_code"), "inventory_session_device_types", ["device_type_code"], unique=False)
    op.create_index("ix_inventory_session_device_type_session", "inventory_session_device_types", ["session_id", "device_type_code"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_inventory_session_device_type_session", table_name="inventory_session_device_types")
    op.drop_index(op.f("ix_inventory_session_device_types_device_type_code"), table_name="inventory_session_device_types")
    op.drop_index(op.f("ix_inventory_session_device_types_session_id"), table_name="inventory_session_device_types")
    op.drop_index(op.f("ix_inventory_session_device_types_id"), table_name="inventory_session_device_types")
    op.drop_table("inventory_session_device_types")


