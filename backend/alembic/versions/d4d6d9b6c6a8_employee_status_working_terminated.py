"""Employees: add status (working/terminated)

Revision ID: d4d6d9b6c6a8
Revises: c3a1f6c2d2b1
Create Date: 2025-12-27
"""

from alembic import op
import sqlalchemy as sa


revision = "d4d6d9b6c6a8"
down_revision = "c3a1f6c2d2b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    employee_status = sa.Enum("working", "terminated", name="employeestatus")
    employee_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "employees",
        sa.Column("status", employee_status, nullable=False, server_default="working"),
    )
    op.create_index(op.f("ix_employees_status"), "employees", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_employees_status"), table_name="employees")
    op.drop_column("employees", "status")

    employee_status = sa.Enum("working", "terminated", name="employeestatus")
    employee_status.drop(op.get_bind(), checkfirst=True)


