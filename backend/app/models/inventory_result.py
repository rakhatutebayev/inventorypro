from sqlalchemy import Column, Integer, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.asset import LocationType


class InventoryResult(Base):
    __tablename__ = "inventory_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("inventory_sessions.id"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    found = Column(Boolean, nullable=False)
    actual_location_type = Column(SQLEnum(LocationType), nullable=True)
    actual_location_id = Column(Integer, nullable=True)
    confirmed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("InventorySession", back_populates="results")
    asset = relationship("Asset")

