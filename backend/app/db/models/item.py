"""Item and category database models."""
from datetime import datetime
import enum
import uuid

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class ItemCategory(str, enum.Enum):
    """Item categories."""
    RAW_MATERIAL = "raw_material"
    IN_HOUSE_PRODUCT = "in_house_product"
    PURCHASED_ITEM = "purchased_item"
    ASSEMBLED_KIT = "assembled_kit"


class Category(Base):
    """Category model for hierarchical organization."""
    
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Item(Base):
    """Item model for inventory tracking."""
    
    __tablename__ = "items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(ItemCategory), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    
    # Stock tracking
    unit_of_measure = Column(String(50), nullable=False)  # e.g., "kg", "liters", "units", "bags"
    current_stock_level = Column(Numeric(10, 2), nullable=False, default=0)
    minimum_stock_level = Column(Numeric(10, 2), nullable=True)  # For low-stock alerts
    
    # Additional metadata
    sku = Column(String(100), unique=True, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
