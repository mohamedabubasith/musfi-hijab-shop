from pydantic import BaseModel
from datetime import datetime, date
import uuid


class DeliveryStatusUpdate(BaseModel):
    status: str
    notes: str | None = None


class DeliveryOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    sale_id: uuid.UUID
    customer_name: str
    phone: str | None
    address: str
    status: str
    assigned_to: uuid.UUID | None
    notes: str | None
    expected_date: date | None
    delivered_at: datetime | None
    created_at: datetime
    updated_at: datetime
