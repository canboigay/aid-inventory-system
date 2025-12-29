"""Stock movement database model for audit trail."""
from datetime import datetime
import enum
import uuid

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class MovementType(str, enum.Enum):
    """Types of stock movements."""
    IN = "in"  # Stock coming in
    OUT = "out"  # Stock going out
    ADJUSTMENT = "adjustment"  # Manual adjustment


class ReferenceType(str, enum.Enum):
    """Reference types for movements."""
    PRODUCTION = "production"
    PURCHASE = "purchase"
    ASSEMBLY = "assembly"
    DISTRIBUTION = "distribution"
    ADJUSTMENT = "adjustment"


class StockMovement(Base):
    """Stock movement model for tracking all inventory changes."""
    
    __tablename__ = "stock_movements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False, index=True)
    
    movement_type = Column(SQLEnum(MovementType), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    
    # Reference to source transaction
    reference_type = Column(SQLEnum(ReferenceType), nullable=False)
    reference_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # User who made the movement
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
