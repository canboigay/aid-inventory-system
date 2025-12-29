"""Quick entry API routes for dashboard operations."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.item import Item
from app.db.models.production import Production
from app.db.models.operations import Purchase, Distribution
from app.db.models.stock_movement import StockMovement, MovementType, ReferenceType
from app.schemas.inventory import (
    QuickProductionEntry,
    QuickPurchaseEntry,
    QuickDistributionEntry,
    ProductionResponse,
    PurchaseResponse,
    DistributionResponse,
    DashboardStats
)
from app.api.deps import get_current_active_user

router = APIRouter()


@router.post("/production", response_model=ProductionResponse, status_code=status.HTTP_201_CREATED)
def create_quick_production(
    entry: QuickProductionEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Quick entry for production (used on dashboard)."""
    # Verify item exists
    item = db.query(Item).filter(Item.id == entry.produced_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Create production record
    production = Production(
        production_date=entry.production_date or datetime.utcnow(),
        produced_item_id=entry.produced_item_id,
        quantity_produced=entry.quantity_produced,
        produced_by_user_id=current_user.id,
        notes=entry.notes
    )
    db.add(production)
    db.flush()
    
    # Update stock level
    item.current_stock_level += entry.quantity_produced
    
    # Create stock movement
    movement = StockMovement(
        item_id=entry.produced_item_id,
        movement_type=MovementType.IN,
        quantity=entry.quantity_produced,
        reference_type=ReferenceType.PRODUCTION,
        reference_id=production.id,
        user_id=current_user.id,
        notes=entry.notes
    )
    db.add(movement)
    
    db.commit()
    db.refresh(production)
    
    return production


@router.post("/purchase", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_quick_purchase(
    entry: QuickPurchaseEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Quick entry for purchases (used on dashboard)."""
    # Verify all items exist
    item_ids = [item.item_id for item in entry.items]
    items = db.query(Item).filter(Item.id.in_(item_ids)).all()
    
    if len(items) != len(item_ids):
        raise HTTPException(status_code=404, detail="One or more items not found")
    
    items_dict = {str(item.id): item for item in items}
    
    # Calculate total cost
    total_cost = sum(
        (item.quantity * (item.unit_cost or 0)) for item in entry.items
    )
    
    # Prepare items_purchased JSON
    items_purchased_json = [
        {
            "item_id": str(item.item_id),
            "quantity": float(item.quantity),
            "unit_cost": float(item.unit_cost) if item.unit_cost else None
        }
        for item in entry.items
    ]
    
    # Create purchase record
    purchase = Purchase(
        purchase_date=entry.purchase_date or datetime.utcnow(),
        supplier_name=entry.supplier_name,
        items_purchased=items_purchased_json,
        total_cost=total_cost if total_cost > 0 else None,
        received_by_user_id=current_user.id,
        notes=entry.notes
    )
    db.add(purchase)
    db.flush()
    
    # Update stock levels and create movements
    for purchase_item in entry.items:
        item = items_dict[str(purchase_item.item_id)]
        item.current_stock_level += purchase_item.quantity
        
        movement = StockMovement(
            item_id=purchase_item.item_id,
            movement_type=MovementType.IN,
            quantity=purchase_item.quantity,
            reference_type=ReferenceType.PURCHASE,
            reference_id=purchase.id,
            user_id=current_user.id
        )
        db.add(movement)
    
    db.commit()
    db.refresh(purchase)
    
    return purchase


@router.post("/distribution", response_model=DistributionResponse, status_code=status.HTTP_201_CREATED)
def create_quick_distribution(
    entry: QuickDistributionEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Quick entry for distributions (used on dashboard)."""
    # Verify all items exist and have sufficient stock
    item_ids = [item.item_id for item in entry.items]
    items = db.query(Item).filter(Item.id.in_(item_ids)).all()
    
    if len(items) != len(item_ids):
        raise HTTPException(status_code=404, detail="One or more items not found")
    
    items_dict = {str(item.id): item for item in items}
    
    # Check stock levels
    for dist_item in entry.items:
        item = items_dict[str(dist_item.item_id)]
        if item.current_stock_level < dist_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.name}. Available: {item.current_stock_level}, Requested: {dist_item.quantity}"
            )
    
    # Prepare items_distributed JSON
    items_distributed_json = [
        {
            "item_id": str(item.item_id),
            "quantity": float(item.quantity)
        }
        for item in entry.items
    ]
    
    # Create distribution record
    distribution = Distribution(
        distribution_date=entry.distribution_date or datetime.utcnow(),
        distribution_type=entry.distribution_type,
        items_distributed=items_distributed_json,
        recipient_info=entry.recipient_info,
        distributed_by_user_id=current_user.id,
        notes=entry.notes
    )
    db.add(distribution)
    db.flush()
    
    # Update stock levels and create movements
    for dist_item in entry.items:
        item = items_dict[str(dist_item.item_id)]
        item.current_stock_level -= dist_item.quantity
        
        movement = StockMovement(
            item_id=dist_item.item_id,
            movement_type=MovementType.OUT,
            quantity=dist_item.quantity,
            reference_type=ReferenceType.DISTRIBUTION,
            reference_id=distribution.id,
            user_id=current_user.id
        )
        db.add(movement)
    
    db.commit()
    db.refresh(distribution)
    
    return distribution


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics and recent activity."""
    from datetime import timedelta
    from sqlalchemy import func
    
    # Calculate date range for "this week"
    today = datetime.utcnow()
    week_start = today - timedelta(days=7)
    
    # Count totals
    total_items = db.query(func.count(Item.id)).scalar()
    
    # Count low stock items
    low_stock_items = db.query(func.count(Item.id)).filter(
        Item.minimum_stock_level.isnot(None),
        Item.current_stock_level <= Item.minimum_stock_level
    ).scalar()
    
    # Count productions this week
    productions_this_week = db.query(func.count(Production.id)).filter(
        Production.production_date >= week_start
    ).scalar()
    
    # Count distributions this week
    distributions_this_week = db.query(func.count(Distribution.id)).filter(
        Distribution.distribution_date >= week_start
    ).scalar()
    
    # Get recent activity (last 10 movements)
    recent_movements = db.query(StockMovement).order_by(
        StockMovement.created_at.desc()
    ).limit(10).all()
    
    recent_activity = []
    for movement in recent_movements:
        item = db.query(Item).filter(Item.id == movement.item_id).first()
        recent_activity.append({
            "type": movement.reference_type.value,
            "item_name": item.name if item else "Unknown",
            "quantity": float(movement.quantity),
            "movement_type": movement.movement_type.value,
            "timestamp": movement.created_at.isoformat()
        })
    
    return DashboardStats(
        total_items=total_items or 0,
        low_stock_items=low_stock_items or 0,
        productions_this_week=productions_this_week or 0,
        distributions_this_week=distributions_this_week or 0,
        recent_activity=recent_activity
    )
