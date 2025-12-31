"""Inventory and operations schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid

from app.db.models.item import ItemCategory
from app.db.models.operations import DistributionType


# Item Schemas
class ItemBase(BaseModel):
    """Base item schema."""
    name: str
    description: Optional[str] = None
    category: ItemCategory
    unit_of_measure: str
    minimum_stock_level: Optional[Decimal] = None
    sku: Optional[str] = None
    notes: Optional[str] = None


class ItemCreate(ItemBase):
    """Schema for creating an item."""
    current_stock_level: Optional[Decimal] = None


class ItemUpdate(BaseModel):
    """Schema for updating an item."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ItemCategory] = None
    unit_of_measure: Optional[str] = None
    minimum_stock_level: Optional[Decimal] = None
    sku: Optional[str] = None
    notes: Optional[str] = None


class ItemResponse(ItemBase):
    """Item response schema."""
    id: uuid.UUID
    current_stock_level: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Quick Entry Schemas for Dashboard
class QuickProductionEntry(BaseModel):
    """Quick entry for recording production (dashboard)."""
    produced_item_id: uuid.UUID
    quantity_produced: Decimal
    production_date: Optional[datetime] = None
    notes: Optional[str] = None


class QuickPurchaseItem(BaseModel):
    """Item in a purchase."""
    item_id: uuid.UUID
    quantity: Decimal
    unit_cost: Optional[Decimal] = None


class QuickPurchaseEntry(BaseModel):
    """Quick entry for recording purchases (dashboard)."""
    items: List[QuickPurchaseItem]
    supplier_name: Optional[str] = None
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None


class QuickDistributionItem(BaseModel):
    """Item in a distribution."""
    item_id: uuid.UUID
    quantity: Decimal


class QuickDistributionEntry(BaseModel):
    """Quick entry for recording distributions (dashboard)."""
    distribution_type: DistributionType
    items: List[QuickDistributionItem]
    recipient_info: Optional[str] = None
    distribution_date: Optional[datetime] = None
    notes: Optional[str] = None


# Adjustment Schema
class StockAdjustmentRequest(BaseModel):
    delta: Decimal = Field(description="Positive to add, negative to subtract")
    reason: Optional[str] = Field(default=None, max_length=200)


# Response Schemas
class ProductionResponse(BaseModel):
    """Production response schema."""
    id: uuid.UUID
    production_date: datetime
    produced_item_id: uuid.UUID
    quantity_produced: Decimal
    raw_materials_used: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PurchaseResponse(BaseModel):
    """Purchase response schema."""
    id: uuid.UUID
    purchase_date: datetime
    supplier_name: Optional[str] = None
    items_purchased: List[dict]
    total_cost: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class DistributionResponse(BaseModel):
    """Distribution response schema."""
    id: uuid.UUID
    distribution_date: datetime
    distribution_type: DistributionType
    items_distributed: List[dict]
    recipient_info: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_items: int
    low_stock_items: int
    productions_this_week: int
    distributions_this_week: int
    recent_activity: List[dict]
