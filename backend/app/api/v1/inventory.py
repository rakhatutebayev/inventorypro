from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.models.inventory_session import InventorySession
from app.models.inventory_result import InventoryResult
from app.models.asset import Asset
from app.schemas.inventory import (
    InventorySession as InventorySessionSchema,
    InventorySessionCreate,
    InventoryResult as InventoryResultSchema,
    InventoryResultCreate
)
from app.api.deps import get_current_active_user

router = APIRouter()


@router.post("/sessions", response_model=InventorySessionSchema, status_code=status.HTTP_201_CREATED)
def create_inventory_session(
    session_in: InventorySessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = InventorySession(
        description=session_in.description
    )
    db.add(session)
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


@router.get("/sessions/{session_id}/progress")
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
    
    # Count checked assets
    checked_count = db.query(func.count(InventoryResult.id)).filter(
        InventoryResult.session_id == session_id
    ).scalar()
    
    # TODO: Get total assets count based on session filters/scope
    # For now, return checked count only
    return {
        "session_id": session_id,
        "checked": checked_count,
        "total": None,  # Will be implemented based on session scope
        "remaining": None
    }


