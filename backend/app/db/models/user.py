"""User database model."""
from datetime import datetime
import enum
import uuid

from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class UserRole(str, enum.Enum):
    """User roles for access control."""
    ADMIN = "admin"
    WAREHOUSE_MANAGER = "warehouse_manager"
    OUTREACH_COORDINATOR = "outreach_coordinator"
    IN_HOUSE_PRODUCTION_COORDINATOR = "in_house_production_coordinator"
    PRODUCT_PURCHASER = "product_purchaser"


class User(Base):
    """User model for authentication and authorization."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.WAREHOUSE_MANAGER)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class RefreshToken(Base):
    """Refresh token for JWT authentication."""
    
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
