"""Kit assembly schemas."""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid


class KitComponent(BaseModel):
    """Component item in a kit."""
    item_id: uuid.UUID
    quantity: int


class KitTemplateCreate(BaseModel):
    """Schema for creating a kit template."""
    name: str
    description: Optional[str] = None
    kit_item_id: uuid.UUID
    components: List[KitComponent]


class KitTemplateResponse(BaseModel):
    """Kit template response."""
    id: uuid.UUID
    name: str
    description: Optional[str]
    kit_item_id: uuid.UUID
    components: List[dict]
    is_active: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AssembleKitRequest(BaseModel):
    """Request to assemble kits."""
    kit_template_id: uuid.UUID
    quantity: int
    notes: Optional[str] = None


class AssemblyResponse(BaseModel):
    """Assembly operation response."""
    id: uuid.UUID
    assembly_date: datetime
    kit_template_id: uuid.UUID
    kit_type_item_id: uuid.UUID
    quantity_assembled: int
    components_used: List[dict]
    assembled_by_user_id: uuid.UUID
    notes: Optional[str]
    
    class Config:
        from_attributes = True
