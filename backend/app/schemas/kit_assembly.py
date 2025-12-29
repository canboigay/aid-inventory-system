"""Kit assembly schemas with validation."""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
import uuid


class KitComponentInput(BaseModel):
    """Component item for kit template."""
    item_id: uuid.UUID
    quantity: int = Field(gt=0, description="Quantity must be positive")
    
    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v


class KitComponentResponse(BaseModel):
    """Component with item name included."""
    item_id: str
    item_name: str
    quantity: int


class KitTemplateCreate(BaseModel):
    """Create a new kit template."""
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    kit_item_id: uuid.UUID
    components: List[KitComponentInput] = Field(min_items=1, description="At least one component required")
    
    @validator('components')
    def components_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Kit must have at least one component')
        return v
    
    @validator('components')
    def components_must_be_unique(cls, v):
        item_ids = [c.item_id for c in v]
        if len(item_ids) != len(set(item_ids)):
            raise ValueError('Duplicate components not allowed')
        return v


class KitTemplateUpdate(BaseModel):
    """Update kit template."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    components: Optional[List[KitComponentInput]] = None
    is_active: Optional[bool] = None


class KitTemplateResponse(BaseModel):
    """Kit template response."""
    id: uuid.UUID
    name: str
    description: Optional[str]
    kit_item_id: uuid.UUID
    kit_item_name: str  # Denormalized for display
    components: List[KitComponentResponse]
    is_active: bool
    created_by_user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AssembleKitRequest(BaseModel):
    """Request to assemble kits."""
    kit_template_id: uuid.UUID
    quantity: int = Field(gt=0, description="Number of kits to assemble")
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be at least 1')
        if v > 10000:
            raise ValueError('Cannot assemble more than 10,000 kits at once')
        return v


class ComponentAvailability(BaseModel):
    """Component stock availability check."""
    item_id: uuid.UUID
    item_name: str
    required_quantity: int
    available_quantity: float
    sufficient: bool


class AssemblyPreview(BaseModel):
    """Preview of what will happen during assembly."""
    template_name: str
    kits_to_assemble: int
    components: List[ComponentAvailability]
    can_assemble: bool
    insufficient_items: List[str]  # Names of items with insufficient stock


class AssemblyResponse(BaseModel):
    """Assembly operation response."""
    id: uuid.UUID
    assembly_date: datetime
    kit_type_item_id: uuid.UUID
    kit_name: str
    quantity_assembled: float
    components_used: List[dict]
    assembled_by_user_id: uuid.UUID
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
