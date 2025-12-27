from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class LocationType(str, enum.Enum):
    employee = "employee"
    warehouse = "warehouse"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    company_code = Column(String(3), ForeignKey("companies.code"), nullable=False, index=True)
    device_type_code = Column(String(2), ForeignKey("device_types.code"), nullable=False, index=True)
    inventory_number = Column(String(20), unique=True, nullable=False, index=True)
    serial_number = Column(String, unique=True, nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    vendor = Column(String, nullable=False)
    model = Column(String, nullable=False)
    location_type = Column(SQLEnum(LocationType), nullable=False, index=True)
    location_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Индекс для комбинации location_type и location_id для быстрого поиска
    __table_args__ = (
        Index('ix_assets_location', 'location_type', 'location_id'),
    )

    # Relationships
    company = relationship("Company", foreign_keys=[company_code], primaryjoin="Asset.company_code == Company.code")
    device_type = relationship("DeviceType", foreign_keys=[device_type_code], primaryjoin="Asset.device_type_code == DeviceType.code")
    vendor_ref = relationship("Vendor", foreign_keys=[vendor_id])

