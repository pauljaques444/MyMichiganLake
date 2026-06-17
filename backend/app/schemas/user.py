import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    display_name: str
    bio: str | None = None
    avatar_url: str | None = None


class UserCreate(UserBase):
    clerk_id: str
    email: EmailStr


class UserUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


class UserOut(UserBase):
    id: uuid.UUID
    email: str
    onboarding_complete: bool
    created_at: datetime

    model_config = {"from_attributes": True}
