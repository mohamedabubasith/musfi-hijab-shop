from pydantic import BaseModel
import uuid
from datetime import datetime


class ShopConfigCreate(BaseModel):
    type: str   # "category" | "origin"
    value: str
    label: str


class ShopConfigUpdate(BaseModel):
    label: str | None = None
    is_active: bool | None = None


class ShopConfigOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    type: str
    value: str
    label: str
    is_active: bool
    created_at: datetime
