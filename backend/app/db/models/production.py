"""Production database model."""
from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Production(Base):
    """Production model for in-house manufacturing events."""
    
    __tablename__ = "productions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    production_date = Column(DateTime, nullable=False, index=True)
    produced_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False, index=True)
    quantity_produced = Column(Numeric(10, 2), nullable=False)
    
    # Raw materials used (stored as JSON array of {item_id, quantity})
    raw_materials_used = Column(JSON, nullable=True)
    
    # User who recorded the production
    produced_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
