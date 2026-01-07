"""Recipient directory schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class RecipientBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=2000)
    is_active: bool = True


class RecipientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=2000)


class RecipientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=2000)
    is_active: Optional[bool] = None


class RecipientResponse(RecipientBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
