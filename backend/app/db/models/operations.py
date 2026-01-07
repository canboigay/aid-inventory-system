"""Purchase, assembly, and distribution database models."""
from datetime import datetime
import enum
import uuid

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Numeric, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Purchase(Base):
    """Purchase model for incoming inventory from external sources."""
    
    __tablename__ = "purchases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    purchase_date = Column(DateTime, nullable=False, index=True)
    supplier_name = Column(String(255), nullable=True)
    
    # Items purchased (stored as JSON array of {item_id, quantity, unit_cost})
    items_purchased = Column(JSON, nullable=False)
    
    total_cost = Column(Numeric(10, 2), nullable=True)
    
    # User who recorded the purchase
    received_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Assembly(Base):
    """Assembly model for kit building events."""
    
    __tablename__ = "assemblies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    assembly_date = Column(DateTime, nullable=False, index=True)
    kit_type_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False, index=True)
    quantity_assembled = Column(Numeric(10, 2), nullable=False)
    
    # Component items (stored as JSON array of {item_id, quantity_per_kit})
    component_items = Column(JSON, nullable=False)
    
    # User who assembled the kits
    assembled_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DistributionType(str, enum.Enum):
    """Types of distributions."""
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    MONTHLY = "monthly"
    BI_MONTHLY = "bi_monthly"
    CRISIS_AID = "crisis_aid"
    OTHER = "other"


class Distribution(Base):
    """Distribution model for outgoing aid packages."""
    
    __tablename__ = "distributions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    distribution_date = Column(DateTime, nullable=False, index=True)
    distribution_type = Column(SQLEnum(DistributionType), nullable=False, index=True)
    
    # Items distributed (stored as JSON array of {item_id, quantity})
    items_distributed = Column(JSON, nullable=False)
    
    recipient_info = Column(Text, nullable=True)  # Location, organization name, etc.
    
    # User who handled the distribution
    distributed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    notes = Column(Text, nullable=True)
    # Stores original legacy distribution type (e.g. school_delivery) when mapped to a new simplified type
    distribution_type_legacy = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
