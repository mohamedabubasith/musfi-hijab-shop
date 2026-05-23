from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime, date
import uuid


class SaleItemCreate(BaseModel):
    stock_item_id: uuid.UUID
    quantity: int


class SaleCreate(BaseModel):
    customer_id: uuid.UUID | None = None
    customer_name: str | None = None
    payment_method: str
    discount: Decimal = Decimal("0")
    is_delivery: bool = False
    notes: str | None = None
    items: list[SaleItemCreate]
    delivery_address: str | None = None
    delivery_phone: str | None = None
    expected_delivery_date: date | None = None


class SaleItemOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    stock_item_id: uuid.UUID
    item_name: str
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal
    subtotal: Decimal


class SaleOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    invoice_number: str
    customer_id: uuid.UUID | None
    customer_name: str | None
    payment_method: str
    subtotal: Decimal
    discount: Decimal
    total: Decimal
    cost_total: Decimal
    profit: Decimal
    is_delivery: bool
    notes: str | None
    sold_by: uuid.UUID | None
    sale_date: date
    created_at: datetime
    items: list[SaleItemOut]


class CustomerCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None


class CustomerOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    phone: str | None
    email: str | None
    address: str | None
    created_at: datetime
