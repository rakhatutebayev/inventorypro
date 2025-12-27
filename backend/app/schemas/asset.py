from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.asset import LocationType


class AssetUpdate(BaseModel):
    serial_number: Optional[str] = Field(None, description="Serial number (unique)")
    vendor_id: Optional[int] = None
    vendor: Optional[str] = None
    model: Optional[str] = None
    location_type: Optional[LocationType] = None
    location_id: Optional[int] = None


class AssetCreate(BaseModel):
    company_code: str = Field(..., min_length=3, max_length=3, description="Company code (3 uppercase letters)")
    device_type_code: str = Field(..., min_length=2, max_length=2, description="Device type code (2 digits)")
    serial_number: str = Field(..., description="Serial number (unique)")
    vendor_id: int = Field(..., description="Vendor reference id")
    model: str
    location_type: LocationType
    location_id: int

    @field_validator("company_code")
    @classmethod
    def validate_company_code(cls, v: str):
        if not v.isupper() or len(v) != 3 or not v.isalpha():
            raise ValueError("Company code must be 3 uppercase letters")
        return v

    @field_validator("device_type_code")
    @classmethod
    def validate_device_type_code(cls, v: str):
        if not v.isdigit() or len(v) != 2:
            raise ValueError("Device type code must be 2 digits")
        return v


class Asset(BaseModel):
    id: int
    inventory_number: str
    vendor_id: int
    vendor: str
    company_code: str
    device_type_code: str
    serial_number: str
    model: str
    location_type: LocationType
    location_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


