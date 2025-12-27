from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.asset import LocationType


class InventorySessionBase(BaseModel):
    description: Optional[str] = None


class InventorySessionCreate(InventorySessionBase):
    pass


class InventorySession(InventorySessionBase):
    id: int
    started_at: datetime
    completed_at: Optional[datetime] = None

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

