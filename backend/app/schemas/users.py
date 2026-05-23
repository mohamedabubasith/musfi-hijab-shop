from pydantic import BaseModel, EmailStr, Field
import uuid
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8)
    role: str


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    role: str | None = None


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    email: str
    phone: str | None
    role: str
    is_active: bool
    created_at: datetime
