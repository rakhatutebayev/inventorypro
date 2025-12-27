from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.asset import Asset, LocationType
from app.models.company import Company
from app.models.device_type import DeviceType
from app.models.employee import Employee
from app.models.warehouse import Warehouse
from app.schemas.asset import Asset as AssetSchema, AssetCreate, AssetUpdate
from app.api.deps import get_current_active_user
from app.core.inventory_number import generate_inventory_number

router = APIRouter()


@router.get("/", response_model=List[AssetSchema])
def read_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_type_code: Optional[str] = None,
    location_type: Optional[LocationType] = None,
    location_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(Asset)
    
    if device_type_code:
        query = query.filter(Asset.device_type_code == device_type_code)
    
    if location_type:
        query = query.filter(Asset.location_type == location_type)
        if location_id:
            query = query.filter(Asset.location_id == location_id)
    
    if search:
        search_filter = or_(
            Asset.inventory_number.ilike(f"%{search}%"),
            Asset.serial_number.ilike(f"%{search}%"),
            Asset.vendor.ilike(f"%{search}%"),
            Asset.model.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    assets = query.offset(skip).limit(limit).all()
    return assets


@router.get("/scan/{inventory_number}", response_model=AssetSchema)
def scan_asset(
    inventory_number: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    asset = db.query(Asset).filter(Asset.inventory_number == inventory_number).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    return asset


@router.get("/{asset_id}", response_model=AssetSchema)
def read_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    return asset


@router.post("/", response_model=AssetSchema, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Validate company exists
    company = db.query(Company).filter(Company.code == asset_in.company_code).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Company with code {asset_in.company_code} not found"
        )
    
    # Validate device type exists
    device_type = db.query(DeviceType).filter(DeviceType.code == asset_in.device_type_code).first()
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device type with code {asset_in.device_type_code} not found"
        )
    
    # Check serial number uniqueness
    if db.query(Asset).filter(Asset.serial_number == asset_in.serial_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number already exists"
        )
    
    # Validate location exists
    if asset_in.location_type == LocationType.employee:
        employee = db.query(Employee).filter(Employee.id == asset_in.location_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee with id {asset_in.location_id} not found"
            )
    elif asset_in.location_type == LocationType.warehouse:
        warehouse = db.query(Warehouse).filter(Warehouse.id == asset_in.location_id).first()
        if not warehouse:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Warehouse with id {asset_in.location_id} not found"
            )
    
    # Generate inventory number
    inventory_number = generate_inventory_number(
        db=db,
        company_code=asset_in.company_code,
        device_type_code=asset_in.device_type_code
    )
    
    # Create asset
    db_asset = Asset(
        company_code=asset_in.company_code,
        device_type_code=asset_in.device_type_code,
        inventory_number=inventory_number,
        serial_number=asset_in.serial_number,
        vendor=asset_in.vendor,
        model=asset_in.model,
        location_type=asset_in.location_type,
        location_id=asset_in.location_id
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.put("/{asset_id}", response_model=AssetSchema)
def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Validate location if provided
    if asset_in.location_type and asset_in.location_id:
        if asset_in.location_type == LocationType.employee:
            employee = db.query(Employee).filter(Employee.id == asset_in.location_id).first()
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Employee with id {asset_in.location_id} not found"
                )
        elif asset_in.location_type == LocationType.warehouse:
            warehouse = db.query(Warehouse).filter(Warehouse.id == asset_in.location_id).first()
            if not warehouse:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Warehouse with id {asset_in.location_id} not found"
                )
    
    # Update fields
    update_data = asset_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    db.delete(asset)
    db.commit()
    return None


