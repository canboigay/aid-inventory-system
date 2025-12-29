"""Kit template model for defining standard kit configurations."""
from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class KitTemplate(Base):
    """Kit template defining standard kit configurations.
    
    This stores the "recipe" for each kit type - what items and quantities
    are needed to assemble one kit.
    """
    
    __tablename__ = "kit_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template info
    name = Column(String(255), nullable=False, unique=True)  # e.g., "Hygiene Kit", "School Kit"
    description = Column(Text, nullable=True)
    
    # The assembled kit item this template produces
    kit_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    
    # Bill of Materials: [{"item_id": "uuid", "quantity": 2, "item_name": "Soap"}, ...]
    # item_name is denormalized for easy display
    components = Column(JSON, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
