from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from app.models.asset import LocationType


class AssetBase(BaseModel):
    company_code: str = Field(..., max_length=3, description="Company code (3 uppercase letters)")
    device_type_code: str = Field(..., max_length=2, description="Device type code (2 digits)")
    serial_number: str = Field(..., description="Serial number (unique)")
    vendor: str
    model: str
    location_type: LocationType
    location_id: int

    @validator('company_code')
    def validate_company_code(cls, v):
        if not v.isupper() or len(v) != 3 or not v.isalpha():
            raise ValueError('Company code must be 3 uppercase letters')
        return v

    @validator('device_type_code')
    def validate_device_type_code(cls, v):
        if not v.isdigit() or len(v) != 2:
            raise ValueError('Device type code must be 2 digits')
        return v


class AssetCreate(AssetBase):
    # inventory_number будет сгенерирован автоматически
    pass


class AssetUpdate(BaseModel):
    serial_number: Optional[str] = Field(None, description="Serial number (unique)")
    vendor: Optional[str] = None
    model: Optional[str] = None
    location_type: Optional[LocationType] = None
    location_id: Optional[int] = None


class Asset(AssetBase):
    id: int
    inventory_number: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


