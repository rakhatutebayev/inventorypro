from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class InventorySessionDeviceType(Base):
    __tablename__ = "inventory_session_device_types"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("inventory_sessions.id"), nullable=False, index=True)
    device_type_code = Column(String(2), ForeignKey("device_types.code"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("session_id", "device_type_code", name="uq_inventory_session_device_type"),
        Index("ix_inventory_session_device_type_session", "session_id", "device_type_code"),
    )

    session = relationship("InventorySession", back_populates="device_type_scopes")

