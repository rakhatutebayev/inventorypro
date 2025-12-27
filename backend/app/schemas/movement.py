from pydantic import BaseModel, validator
from datetime import datetime
from app.models.movement import LocationType


class MovementBase(BaseModel):
    asset_id: int
    to_type: LocationType
    to_id: int


class MovementCreate(MovementBase):
    pass


class Movement(MovementBase):
    id: int
    from_type: LocationType
    from_id: int
    moved_at: datetime

    class Config:
        from_attributes = True


