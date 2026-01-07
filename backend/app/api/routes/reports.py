"""Reports API routes for activity tracking and summaries."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.item import Item
from app.db.models.production import Production
from app.db.models.operations import Purchase, Distribution, Assembly, DistributionType
from app.db.models.stock_movement import StockMovement, ReferenceType
from app.schemas.reports import (
    ActivitySummary,
    UserActivity,
    DistributionSummary,
    ProductionSummary,
    PurchaseSummary,
    AssemblySummary,
    ComprehensiveReport
)
from app.api.deps import get_current_active_user

router = APIRouter()


@router.get("/activity", response_model=ComprehensiveReport)
def get_activity_report(
    period: str = Query("week", description="Time period: day, week, month"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive activity report for specified period."""
    
    # Calculate date range
    now = datetime.utcnow()
    if start_date and end_date:
        date_from = start_date
        date_to = end_date
    elif period == "day":
        date_from = now.replace(hour=0, minute=0, second=0, microsecond=0)
        date_to = now
    elif period == "week":
        date_from = now - timedelta(days=7)
        date_to = now
    elif period == "month":
        date_from = now - timedelta(days=30)
        date_to = now
    else:
        date_from = now - timedelta(days=7)
        date_to = now
    
    # Get all users for reference
    users = db.query(User).all()
    users_dict = {str(user.id): user.full_name for user in users}
    
    # Get all items for reference
    items = db.query(Item).all()
    items_dict = {str(item.id): item.name for item in items}
    
    # Productions
    productions_query = db.query(Production).filter(
        Production.production_date >= date_from,
        Production.production_date <= date_to
    ).all()
    
    productions = []
    for prod in productions_query:
        productions.append(ProductionSummary(
            id=str(prod.id),
            date=prod.production_date,
            item_name=items_dict.get(str(prod.produced_item_id), "Unknown"),
            quantity=float(prod.quantity_produced),
            user_name=users_dict.get(str(prod.produced_by_user_id), "Unknown"),
            notes=prod.notes
        ))
    
    # Purchases
    purchases_query = db.query(Purchase).filter(
        Purchase.purchase_date >= date_from,
        Purchase.purchase_date <= date_to
    ).all()
    
    purchases = []
    for purch in purchases_query:
        items_list = []
        for item_data in purch.items_purchased:
            item_id = item_data.get('item_id')
            items_list.append({
                'item_name': items_dict.get(str(item_id), "Unknown"),
                'quantity': item_data.get('quantity'),
                'unit_cost': item_data.get('unit_cost')
            })
        
        purchases.append(PurchaseSummary(
            id=str(purch.id),
            date=purch.purchase_date,
            supplier_name=purch.supplier_name,
            items=items_list,
            total_cost=float(purch.total_cost) if purch.total_cost else None,
            user_name=users_dict.get(str(purch.received_by_user_id), "Unknown"),
            notes=purch.notes
        ))
    
    # Distributions
    distributions_query = db.query(Distribution).filter(
        Distribution.distribution_date >= date_from,
        Distribution.distribution_date <= date_to
    ).all()
    
    distributions = []
    total_distributions = 0
    for dist in distributions_query:
        items_list = []
        for item_data in dist.items_distributed:
            item_id = item_data.get('item_id')
            qty = item_data.get('quantity', 0)
            items_list.append({
                'item_name': items_dict.get(str(item_id), "Unknown"),
                'quantity': qty
            })
            total_distributions += qty
        
        distributions.append(DistributionSummary(
            id=str(dist.id),
            date=dist.distribution_date,
            distribution_type=dist.distribution_type.value,
            distribution_type_legacy=getattr(dist, 'distribution_type_legacy', None),
            items=items_list,
            recipient_info=dist.recipient_info,
            user_name=users_dict.get(str(dist.distributed_by_user_id), "Unknown"),
            notes=dist.notes
        ))
    
    # Assemblies (kits)
    assemblies_query = db.query(Assembly).filter(
        Assembly.assembly_date >= date_from,
        Assembly.assembly_date <= date_to
    ).all()
    
    assemblies = []
    for asm in assemblies_query:
        components_list = []
        for comp_data in asm.component_items:
            item_id = comp_data.get('item_id')
            components_list.append({
                'item_name': items_dict.get(str(item_id), "Unknown"),
                'quantity_per_kit': comp_data.get('quantity_per_kit')
            })
        
        assemblies.append(AssemblySummary(
            id=str(asm.id),
            date=asm.assembly_date,
            kit_name=items_dict.get(str(asm.kit_type_item_id), "Unknown Kit"),
            quantity_assembled=float(asm.quantity_assembled),
            components=components_list,
            user_name=users_dict.get(str(asm.assembled_by_user_id), "Unknown"),
            notes=asm.notes
        ))
    
    # User Activity Summary
    user_activities = {}
    
    # Count by user
    for prod in productions_query:
        user_id = str(prod.produced_by_user_id)
        if user_id not in user_activities:
            user_activities[user_id] = {
                'user_name': users_dict.get(user_id, "Unknown"),
                'productions': 0,
                'purchases': 0,
                'distributions': 0,
                'assemblies': 0
            }
        user_activities[user_id]['productions'] += 1
    
    for purch in purchases_query:
        user_id = str(purch.received_by_user_id)
        if user_id not in user_activities:
            user_activities[user_id] = {
                'user_name': users_dict.get(user_id, "Unknown"),
                'productions': 0,
                'purchases': 0,
                'distributions': 0,
                'assemblies': 0
            }
        user_activities[user_id]['purchases'] += 1
    
    for dist in distributions_query:
        user_id = str(dist.distributed_by_user_id)
        if user_id not in user_activities:
            user_activities[user_id] = {
                'user_name': users_dict.get(user_id, "Unknown"),
                'productions': 0,
                'purchases': 0,
                'distributions': 0,
                'assemblies': 0
            }
        user_activities[user_id]['distributions'] += 1
    
    for asm in assemblies_query:
        user_id = str(asm.assembled_by_user_id)
        if user_id not in user_activities:
            user_activities[user_id] = {
                'user_name': users_dict.get(user_id, "Unknown"),
                'productions': 0,
                'purchases': 0,
                'distributions': 0,
                'assemblies': 0
            }
        user_activities[user_id]['assemblies'] += 1
    
    user_activity_list = [
        UserActivity(
            user_name=data['user_name'],
            productions_count=data['productions'],
            purchases_count=data['purchases'],
            distributions_count=data['distributions'],
            assemblies_count=data['assemblies'],
            total_entries=data['productions'] + data['purchases'] + data['distributions'] + data['assemblies']
        )
        for data in user_activities.values()
    ]
    
    # Activity Summary
    summary = ActivitySummary(
        period=period,
        date_from=date_from,
        date_to=date_to,
        total_productions=len(productions),
        total_purchases=len(purchases),
        total_distributions=len(distributions),
        total_assemblies=len(assemblies),
        total_items_distributed=int(total_distributions),
        unique_users=len(user_activities)
    )
    
    return ComprehensiveReport(
        summary=summary,
        user_activities=user_activity_list,
        productions=productions,
        purchases=purchases,
        distributions=distributions,
        assemblies=assemblies
    )


@router.get("/distributions", response_model=List[DistributionSummary])
def get_distributions_report(
    period: str = Query("week", description="Time period: day, week, month"),
    distribution_type: Optional[DistributionType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed distributions report."""
    
    now = datetime.utcnow()
    if period == "day":
        date_from = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        date_from = now - timedelta(days=7)
    elif period == "month":
        date_from = now - timedelta(days=30)
    else:
        date_from = now - timedelta(days=7)
    
    query = db.query(Distribution).filter(
        Distribution.distribution_date >= date_from
    )
    
    if distribution_type:
        query = query.filter(Distribution.distribution_type == distribution_type)
    
    distributions = query.order_by(Distribution.distribution_date.desc()).all()
    
    # Get reference data
    users = db.query(User).all()
    users_dict = {str(user.id): user.full_name for user in users}
    
    items = db.query(Item).all()
    items_dict = {str(item.id): item.name for item in items}
    
    result = []
    for dist in distributions:
        items_list = []
        for item_data in dist.items_distributed:
            item_id = item_data.get('item_id')
            items_list.append({
                'item_name': items_dict.get(str(item_id), "Unknown"),
                'quantity': item_data.get('quantity')
            })
        
        result.append(DistributionSummary(
            id=str(dist.id),
            date=dist.distribution_date,
            distribution_type=dist.distribution_type.value,
            distribution_type_legacy=getattr(dist, 'distribution_type_legacy', None),
            items=items_list,
            recipient_info=dist.recipient_info,
            user_name=users_dict.get(str(dist.distributed_by_user_id), "Unknown"),
            notes=dist.notes
        ))
    
    return result
