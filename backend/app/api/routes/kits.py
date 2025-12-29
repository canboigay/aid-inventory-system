"""Kit assembly API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.item import Item
from app.db.models.assembly import KitTemplate, Assembly
from app.db.models.stock_movement import StockMovement, MovementType, ReferenceType
from app.schemas.kits import (
    KitTemplateCreate,
    KitTemplateResponse,
    AssembleKitRequest,
    AssemblyResponse
)
from app.api.deps import get_current_active_user

router = APIRouter()


@router.get("/templates", response_model=List[KitTemplateResponse])
def list_kit_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all kit templates."""
    templates = db.query(KitTemplate).filter(KitTemplate.is_active == 1).all()
    return templates


@router.post("/templates", response_model=KitTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_kit_template(
    template_data: KitTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new kit template."""
    # Verify kit item exists
    kit_item = db.query(Item).filter(Item.id == template_data.kit_item_id).first()
    if not kit_item:
        raise HTTPException(status_code=404, detail="Kit item not found")
    
    # Verify all component items exist
    component_ids = [c.item_id for c in template_data.components]
    components = db.query(Item).filter(Item.id.in_(component_ids)).all()
    if len(components) != len(component_ids):
        raise HTTPException(status_code=404, detail="One or more component items not found")
    
    # Create template
    components_json = [
        {
            "item_id": str(c.item_id),
            "quantity": c.quantity
        }
        for c in template_data.components
    ]
    
    template = KitTemplate(
        name=template_data.name,
        description=template_data.description,
        kit_item_id=template_data.kit_item_id,
        components=components_json
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.get("/templates/{template_id}", response_model=KitTemplateResponse)
def get_kit_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get kit template by ID."""
    template = db.query(KitTemplate).filter(KitTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Kit template not found")
    return template


@router.post("/assemble", response_model=AssemblyResponse, status_code=status.HTTP_201_CREATED)
def assemble_kits(
    assembly_data: AssembleKitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Assemble kits from components."""
    # Get template
    template = db.query(KitTemplate).filter(
        KitTemplate.id == assembly_data.kit_template_id,
        KitTemplate.is_active == 1
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Kit template not found")
    
    # Get kit item
    kit_item = db.query(Item).filter(Item.id == template.kit_item_id).first()
    if not kit_item:
        raise HTTPException(status_code=404, detail="Kit item not found")
    
    # Calculate total components needed
    components_needed = []
    for component in template.components:
        item_id = component["item_id"]
        quantity_per_kit = component["quantity"]
        total_needed = quantity_per_kit * assembly_data.quantity
        
        components_needed.append({
            "item_id": item_id,
            "quantity_per_kit": quantity_per_kit,
            "total_needed": total_needed
        })
    
    # Check stock availability
    component_items = {}
    for comp in components_needed:
        item = db.query(Item).filter(Item.id == comp["item_id"]).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Component item {comp['item_id']} not found")
        
        if item.current_stock_level < comp["total_needed"]:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.name}. Need: {comp['total_needed']}, Available: {item.current_stock_level}"
            )
        
        component_items[comp["item_id"]] = item
    
    # Create assembly record
    components_used_json = [
        {
            "item_id": comp["item_id"],
            "quantity_used": comp["total_needed"]
        }
        for comp in components_needed
    ]
    
    assembly = Assembly(
        kit_template_id=template.id,
        kit_type_item_id=template.kit_item_id,
        quantity_assembled=assembly_data.quantity,
        components_used=components_used_json,
        assembled_by_user_id=current_user.id,
        notes=assembly_data.notes
    )
    db.add(assembly)
    db.flush()
    
    # Deduct components from inventory
    for comp in components_needed:
        item = component_items[comp["item_id"]]
        item.current_stock_level -= comp["total_needed"]
        
        # Create stock movement for component deduction
        movement = StockMovement(
            item_id=comp["item_id"],
            movement_type=MovementType.OUT,
            quantity=comp["total_needed"],
            reference_type=ReferenceType.ASSEMBLY,
            reference_id=assembly.id,
            user_id=current_user.id,
            notes=f"Used in assembling {assembly_data.quantity} x {template.name}"
        )
        db.add(movement)
    
    # Add assembled kits to inventory
    kit_item.current_stock_level += assembly_data.quantity
    
    # Create stock movement for assembled kits
    movement = StockMovement(
        item_id=kit_item.id,
        movement_type=MovementType.IN,
        quantity=assembly_data.quantity,
        reference_type=ReferenceType.ASSEMBLY,
        reference_id=assembly.id,
        user_id=current_user.id,
        notes=f"Assembled {assembly_data.quantity} kits"
    )
    db.add(movement)
    
    db.commit()
    db.refresh(assembly)
    
    return assembly


@router.get("/assemblies", response_model=List[AssemblyResponse])
def list_assemblies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List recent assembly operations."""
    assemblies = db.query(Assembly).order_by(Assembly.assembly_date.desc()).limit(50).all()
    return assemblies
