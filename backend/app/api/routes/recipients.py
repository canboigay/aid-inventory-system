"""Recipient directory API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.recipient import Recipient
from app.schemas.recipient import RecipientCreate, RecipientUpdate, RecipientResponse
from app.api.deps import get_current_active_user

router = APIRouter()


@router.get("", response_model=List[RecipientResponse])
def list_recipients(
    q: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(Recipient)
    if active_only:
        query = query.filter(Recipient.is_active.is_(True))
    if q:
        query = query.filter(func.lower(Recipient.name).contains(q.lower()))
    return query.order_by(Recipient.name.asc()).all()


@router.post("", response_model=RecipientResponse, status_code=status.HTTP_201_CREATED)
def create_recipient(
    body: RecipientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    existing = db.query(Recipient).filter(func.lower(Recipient.name) == body.name.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Recipient already exists")

    r = Recipient(name=body.name.strip(), notes=body.notes)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{recipient_id}", response_model=RecipientResponse)
def update_recipient(
    recipient_id: uuid.UUID,
    body: RecipientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    r = db.query(Recipient).filter(Recipient.id == recipient_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if body.name is not None:
        new_name = body.name.strip()
        existing = db.query(Recipient).filter(func.lower(Recipient.name) == new_name.lower(), Recipient.id != recipient_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Recipient name already exists")
        r.name = new_name

    if body.notes is not None:
        r.notes = body.notes

    if body.is_active is not None:
        r.is_active = body.is_active

    db.commit()
    db.refresh(r)
    return r
