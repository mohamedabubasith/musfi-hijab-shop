from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
import uuid


class StockItemCreate(BaseModel):
    name: str
    name_ta: str | None = None
    category: str
    supplier_id: uuid.UUID | None = None
    origin_country: str
    sku: str | None = None
    cost_price: Decimal
    selling_price: Decimal
    quantity: int = 0
    low_stock_threshold: int = 5
    image_url: str | None = None
    description: str | None = None


class StockItemUpdate(BaseModel):
    name: str | None = None
    name_ta: str | None = None
    category: str | None = None
    supplier_id: uuid.UUID | None = None
    origin_country: str | None = None
    sku: str | None = None
    cost_price: Decimal | None = None
    selling_price: Decimal | None = None
    low_stock_threshold: int | None = None
    image_url: str | None = None
    description: str | None = None
    is_active: bool | None = None


class StockItemOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    name_ta: str | None
    category: str
    supplier_id: uuid.UUID | None
    origin_country: str
    sku: str | None
    cost_price: Decimal
    selling_price: Decimal
    quantity: int
    low_stock_threshold: int
    image_url: str | None
    description: str | None
    is_active: bool
    created_at: datetime


class RestockRequest(BaseModel):
    quantity: int
    note: str | None = None


class StockMovementOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    item_id: uuid.UUID
    type: str
    quantity: int
    note: str | None
    created_by: uuid.UUID | None
    created_at: datetime
