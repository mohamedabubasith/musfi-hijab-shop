from pydantic import BaseModel
from datetime import datetime
import uuid


class SupplierCreate(BaseModel):
    name: str
    country: str
    contact: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = None
    country: str | None = None
    contact: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class SupplierOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    country: str
    contact: str | None
    phone: str | None
    email: str | None
    notes: str | None
    is_active: bool
    created_at: datetime
