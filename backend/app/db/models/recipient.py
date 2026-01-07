"""Recipient directory model."""
from datetime import datetime
import uuid

from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Recipient(Base):
    """Recipient directory entry (organization/location/person)."""

    __tablename__ = "recipients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(255), nullable=False, index=True, unique=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
