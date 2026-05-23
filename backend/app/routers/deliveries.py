from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.delivery import Delivery
from app.schemas.delivery import DeliveryStatusUpdate, DeliveryOut
from app.utils.pagination import pagination_params, paginate, PaginatedResponse

VALID_STATUSES = ("pending", "packed", "in_transit", "delivered", "returned")

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


@router.get("", response_model=PaginatedResponse[DeliveryOut])
async def list_deliveries(
    status: str | None = None,
    pagination=Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = select(Delivery)
    if status:
        query = query.where(Delivery.status == status)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    items = (await db.execute(query.order_by(Delivery.created_at.desc()).offset(pagination["offset"]).limit(pagination["page_size"]))).scalars().all()
    return paginate([DeliveryOut.model_validate(d) for d in items], total, pagination["page"], pagination["page_size"])


@router.get("/{delivery_id}", response_model=DeliveryOut)
async def get_delivery(delivery_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(404, detail={"code": "DELIVERY_NOT_FOUND", "message": "Delivery not found", "detail": None})
    return DeliveryOut.model_validate(delivery)


@router.patch("/{delivery_id}/status", response_model=DeliveryOut)
async def update_delivery_status(
    delivery_id: uuid.UUID,
    body: DeliveryStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "sales")),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(400, detail={"code": "INVALID_STATUS", "message": f"Status must be one of {VALID_STATUSES}", "detail": None})
    result = await db.execute(select(Delivery).where(Delivery.id == delivery_id))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(404, detail={"code": "DELIVERY_NOT_FOUND", "message": "Delivery not found", "detail": None})
    delivery.status = body.status
    if body.notes:
        delivery.notes = body.notes
    if body.status == "delivered":
        delivery.delivered_at = datetime.now(timezone.utc)
    delivery.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(delivery)
    return DeliveryOut.model_validate(delivery)
