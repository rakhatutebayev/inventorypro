from sqlalchemy import Column, Integer, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class LocationType(str, enum.Enum):
    employee = "employee"
    warehouse = "warehouse"


class Movement(Base):
    __tablename__ = "movements"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    from_type = Column(SQLEnum(LocationType), nullable=False)
    from_id = Column(Integer, nullable=False)
    to_type = Column(SQLEnum(LocationType), nullable=False)
    to_id = Column(Integer, nullable=False)
    moved_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    asset = relationship("Asset", backref="movements")


