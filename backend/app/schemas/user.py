"""User and authentication schemas."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

from app.db.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class AdminUserUpdate(BaseModel):
    """Admin-only user updates."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class AdminResetPasswordRequest(BaseModel):
    """Admin resets a user's password."""
    new_password: str = Field(min_length=6)


class UserInDB(UserBase):
    """User schema as stored in database."""
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserResponse(UserInDB):
    """User schema for API responses."""
    pass


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Token refresh request schema."""
    refresh_token: str


class LoginRequest(BaseModel):
    """Login request schema."""
    username: str
    password: str
    remember_me: Optional[bool] = False


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""
    current_password: str
    new_password: str
