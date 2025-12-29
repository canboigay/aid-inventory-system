"""Items API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.item import Item, ItemCategory
from app.schemas.inventory import ItemCreate, ItemUpdate, ItemResponse
from app.api.deps import get_current_active_user

router = APIRouter()


@router.get("", response_model=List[ItemResponse])
def list_items(
    category: Optional[ItemCategory] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all items with optional filters."""
    query = db.query(Item)
    
    if category:
        query = query.filter(Item.category == category)
    
    if low_stock_only:
        query = query.filter(
            Item.minimum_stock_level.isnot(None),
            Item.current_stock_level <= Item.minimum_stock_level
        )
    
    return query.order_by(Item.name).all()


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new item."""
    # Check if SKU already exists
    if item_data.sku:
        existing = db.query(Item).filter(Item.sku == item_data.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )
    
    item = Item(**item_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get item by ID."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return item


@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: uuid.UUID,
    item_data: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an item."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check SKU uniqueness if updating
    if item_data.sku and item_data.sku != item.sku:
        existing = db.query(Item).filter(Item.sku == item_data.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )
    
    # Update fields
    update_data = item_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an item."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    
    return None
