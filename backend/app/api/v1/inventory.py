from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.models.inventory_session import InventorySession
from app.models.inventory_session_device_type import InventorySessionDeviceType
from app.models.inventory_result import InventoryResult
from app.models.asset import Asset
from app.models.device_type import DeviceType
from app.schemas.inventory import (
    InventorySession as InventorySessionSchema,
    InventorySessionCreate,
    InventoryResult as InventoryResultSchema,
    InventoryResultCreate,
    InventoryProgress,
    InventoryCheckedItem,
)
from app.schemas.asset import Asset as AssetSchema
from app.api.deps import get_current_active_user

router = APIRouter()


@router.post("/sessions", response_model=InventorySessionSchema, status_code=status.HTTP_201_CREATED)
def create_inventory_session(
    session_in: InventorySessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Validate scope upfront
    codes: List[str] = []
    if session_in.device_type_codes:
        codes = [c.strip() for c in session_in.device_type_codes if c and c.strip()]
        existing_codes = {c for (c,) in db.query(DeviceType.code).filter(DeviceType.code.in_(codes)).all()}
        missing = [c for c in codes if c not in existing_codes]
        if missing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown device types: {', '.join(missing)}")

    session = InventorySession(
        description=session_in.description
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    if codes:
        for code in sorted(set(codes)):
            db.add(InventorySessionDeviceType(session_id=session.id, device_type_code=code))
        db.commit()
        db.refresh(session)
    return session


@router.get("/sessions", response_model=List[InventorySessionSchema])
def list_inventory_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    sessions = db.query(InventorySession).order_by(InventorySession.started_at.desc()).all()
    return sessions


@router.get("/sessions/{session_id}", response_model=InventorySessionSchema)
def get_inventory_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(InventorySession).filter(InventorySession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory session not found"
        )
    return session


@router.put("/sessions/{session_id}/complete", response_model=InventorySessionSchema)
def complete_inventory_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(InventorySession).filter(InventorySession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory session not found"
        )
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session already completed"
        )
    session.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/results", response_model=InventoryResultSchema, status_code=status.HTTP_201_CREATED)
def add_inventory_result(
    session_id: int,
    result_in: InventoryResultCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Validate session exists and not completed
    session = db.query(InventorySession).filter(InventorySession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory session not found"
        )
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add results to completed session"
        )
    
    # Validate asset exists
    asset = db.query(Asset).filter(Asset.id == result_in.asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    # Enforce session scope if set (empty scope = all)
    scope_codes = session.device_type_codes
    if scope_codes and asset.device_type_code not in scope_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset is not in this inventory session scope"
        )
    
    # Check if result already exists for this asset in this session
    existing = db.query(InventoryResult).filter(
        InventoryResult.session_id == session_id,
        InventoryResult.asset_id == result_in.asset_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Result already exists for this asset in this session"
        )
    
    result = InventoryResult(
        session_id=session_id,
        asset_id=result_in.asset_id,
        found=result_in.found,
        actual_location_type=result_in.actual_location_type,
        actual_location_id=result_in.actual_location_id
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.get("/sessions/{session_id}/results", response_model=List[InventoryResultSchema])
def get_inventory_results(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(InventorySession).filter(InventorySession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory session not found"
        )
    
    results = db.query(InventoryResult).filter(
        InventoryResult.session_id == session_id
    ).all()
    return results


@router.get("/sessions/{session_id}/progress", response_model=InventoryProgress)
def get_inventory_progress(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(InventorySession).filter(InventorySession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory session not found"
        )
    
    scope_codes = session.device_type_codes

    assets_q = db.query(Asset.id)
    if scope_codes:
        assets_q = assets_q.filter(Asset.device_type_code.in_(scope_codes))
    total = int(assets_q.count())

    checked_q = db.query(func.count(InventoryResult.id)).filter(InventoryResult.session_id == session_id)
    if scope_codes:
        checked_q = checked_q.join(Asset, Asset.id == InventoryResult.asset_id).filter(Asset.device_type_code.in_(scope_codes))
    checked = int(checked_q.scalar() or 0)
    remaining = max(total - checked, 0)

    return InventoryProgress(session_id=session_id, checked=checked, total=total, remaining=remaining)


@router.get("/sessions/{session_id}/checked", response_model=List[InventoryCheckedItem])
def get_checked_assets(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(InventorySession).filter(InventorySession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory session not found"
        )
    scope_codes = session.device_type_codes

    q = db.query(InventoryResult).filter(InventoryResult.session_id == session_id).join(Asset, Asset.id == InventoryResult.asset_id)
    if scope_codes:
        q = q.filter(Asset.device_type_code.in_(scope_codes))

    results = q.order_by(InventoryResult.confirmed_at.desc()).all()
    return [
        InventoryCheckedItem(
            id=r.id,
            found=r.found,
            confirmed_at=r.confirmed_at,
            asset=r.asset,
        )
        for r in results
    ]


@router.get("/sessions/{session_id}/remaining", response_model=List[AssetSchema])
def get_remaining_assets(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(InventorySession).filter(InventorySession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory session not found"
        )
    scope_codes = session.device_type_codes

    checked_ids_q = db.query(InventoryResult.asset_id).filter(InventoryResult.session_id == session_id)
    q = db.query(Asset).filter(~Asset.id.in_(checked_ids_q))
    if scope_codes:
        q = q.filter(Asset.device_type_code.in_(scope_codes))
    return q.order_by(Asset.inventory_number.asc()).all()


