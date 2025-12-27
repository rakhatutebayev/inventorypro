from sqlalchemy import Column, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class InventorySession(Base):
    __tablename__ = "inventory_sessions"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)

    # Relationships
    results = relationship("InventoryResult", back_populates="session", cascade="all, delete-orphan")
    device_type_scopes = relationship(
        "InventorySessionDeviceType",
        back_populates="session",
        cascade="all, delete-orphan",
    )

    @property
    def device_type_codes(self):
        """Scope for inventory session. Empty list means 'all device types'."""
        return [s.device_type_code for s in (self.device_type_scopes or [])]


