from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.asset import Asset, LocationType
from app.models.employee import Employee
from app.models.warehouse import Warehouse
from app.models.movement import Movement
from app.schemas.movement import Movement as MovementSchema, MovementCreate
from app.api.deps import get_current_active_user

router = APIRouter()


@router.post("/", response_model=MovementSchema, status_code=status.HTTP_201_CREATED)
def create_movement(
    movement_in: MovementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Get asset
    asset = db.query(Asset).filter(Asset.id == movement_in.asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Validate destination location exists
    if movement_in.to_type == LocationType.employee:
        employee = db.query(Employee).filter(Employee.id == movement_in.to_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee with id {movement_in.to_id} not found"
            )
    elif movement_in.to_type == LocationType.warehouse:
        warehouse = db.query(Warehouse).filter(Warehouse.id == movement_in.to_id).first()
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warehouse with id {movement_in.to_id} not found"
            )
    
    # Check if moving to the same location
    if asset.location_type == movement_in.to_type and asset.location_id == movement_in.to_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot move asset to the same location"
        )
    
    # Create movement record
    movement = Movement(
        asset_id=asset.id,
        from_type=asset.location_type,
        from_id=asset.location_id,
        to_type=movement_in.to_type,
        to_id=movement_in.to_id
    )
    db.add(movement)
    
    # Update asset location
    asset.location_type = movement_in.to_type
    asset.location_id = movement_in.to_id
    
    db.commit()
    db.refresh(movement)
    return movement


@router.get("/{asset_id}", response_model=List[MovementSchema])
def get_asset_movements(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Check asset exists
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    movements = db.query(Movement).filter(Movement.asset_id == asset_id).order_by(Movement.moved_at.desc()).all()
    return movements


