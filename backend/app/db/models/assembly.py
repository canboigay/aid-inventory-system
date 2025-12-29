"""Kit assembly and bill of materials models."""
from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class KitTemplate(Base):
    """Kit template defining standard kit configurations."""
    
    __tablename__ = "kit_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # e.g., "Hygiene Kit", "School Kit"
    description = Column(String(500), nullable=True)
    kit_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)  # The assembled kit item
    
    # JSON structure: [{"item_id": "uuid", "quantity": 2}, ...]
    components = Column(JSON, nullable=False)  # List of items and quantities needed
    
    is_active = Column(Integer, default=1)  # Can be deactivated
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Assembly(Base):
    """Record of kit assembly operations."""
    
    __tablename__ = "assemblies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assembly_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    kit_template_id = Column(UUID(as_uuid=True), ForeignKey("kit_templates.id"), nullable=False)
    kit_type_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False, index=True)
    quantity_assembled = Column(Integer, nullable=False)  # How many kits were assembled
    
    # JSON structure: [{"item_id": "uuid", "quantity_used": 10}, ...]
    components_used = Column(JSON, nullable=False)  # What was used in this assembly
    
    assembled_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notes = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
