from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.asset import LocationType
from app.schemas.asset import Asset as AssetSchema


class InventorySessionBase(BaseModel):
    description: Optional[str] = None


class InventorySessionCreate(InventorySessionBase):
    device_type_codes: Optional[List[str]] = None


class InventorySession(InventorySessionBase):
    id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    device_type_codes: List[str] = []

    class Config:
        from_attributes = True


class InventoryResultCreate(BaseModel):
    asset_id: int
    found: bool
    actual_location_type: Optional[LocationType] = None
    actual_location_id: Optional[int] = None


class InventoryResultBase(BaseModel):
    asset_id: int
    found: bool
    actual_location_type: Optional[LocationType] = None
    actual_location_id: Optional[int] = None


class InventoryResult(InventoryResultBase):
    id: int
    session_id: int
    confirmed_at: datetime

    class Config:
        from_attributes = True


class InventoryProgress(BaseModel):
    session_id: int
    checked: int
    total: int
    remaining: int


class InventoryCheckedItem(BaseModel):
    id: int
    found: bool
    confirmed_at: datetime
    asset: AssetSchema

    class Config:
        from_attributes = True

