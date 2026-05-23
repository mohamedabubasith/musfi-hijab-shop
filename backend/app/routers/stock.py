import csv
import io
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.stock import StockItem, StockMovement
from app.models.user import User
from app.schemas.stock import StockItemCreate, StockItemUpdate, StockItemOut, RestockRequest, StockMovementOut
from app.services.stock_service import get_stock_item, create_stock_item, restock_item
from app.utils.pagination import pagination_params, paginate, PaginatedResponse

UPLOADS_DIR = "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("", response_model=PaginatedResponse[StockItemOut])
async def list_stock(
    category: str | None = None,
    origin_country: str | None = None,
    search: str | None = None,
    pagination=Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = select(StockItem).where(StockItem.deleted_at == None, StockItem.is_active == True)
    if category:
        query = query.where(StockItem.category == category)
    if origin_country:
        query = query.where(StockItem.origin_country == origin_country)
    if search:
        query = query.where(StockItem.name.ilike(f"%{search}%"))

    total_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(total_q)).scalar()
    items = (await db.execute(query.offset(pagination["offset"]).limit(pagination["page_size"]))).scalars().all()
    return paginate([StockItemOut.model_validate(i) for i in items], total, pagination["page"], pagination["page_size"])


@router.post("", response_model=StockItemOut, status_code=201)
async def create_item(
    body: StockItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "stock_manager")),
):
    if body.sku:
        existing = (await db.execute(select(StockItem).where(StockItem.sku == body.sku))).scalar_one_or_none()
        if existing:
            raise HTTPException(409, detail={"code": "DUPLICATE_SKU", "message": "SKU already exists", "detail": None})
    item = await create_stock_item(db, body, current_user.id)
    return StockItemOut.model_validate(item)


@router.get("/by-sku/{sku}", response_model=StockItemOut)
async def get_by_sku(sku: str, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    item = (await db.execute(
        select(StockItem).where(StockItem.sku == sku, StockItem.deleted_at == None, StockItem.is_active == True)
    )).scalar_one_or_none()
    if not item:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "No item with that SKU", "detail": None})
    return StockItemOut.model_validate(item)


@router.get("/alerts/low", response_model=list[StockItemOut])
async def low_stock_alerts(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(StockItem).where(
            StockItem.deleted_at == None,
            StockItem.is_active == True,
            StockItem.quantity <= StockItem.low_stock_threshold,
        )
    )
    items = result.scalars().all()
    return [StockItemOut.model_validate(i) for i in items]


@router.get("/export/csv")
async def export_csv(db: AsyncSession = Depends(get_db), _=Depends(require_role("admin", "stock_manager"))):
    result = await db.execute(select(StockItem).where(StockItem.deleted_at == None))
    items = result.scalars().all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Category", "Origin", "SKU", "Cost Price", "Selling Price", "Quantity"])
    for item in items:
        writer.writerow([item.name, item.category, item.origin_country, item.sku, item.cost_price, item.selling_price, item.quantity])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=stock.csv"})


@router.get("/{item_id}", response_model=StockItemOut)
async def get_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    item = await get_stock_item(db, item_id)
    if not item:
        raise HTTPException(404, detail={"code": "STOCK_NOT_FOUND", "message": "Stock item not found", "detail": None})
    return StockItemOut.model_validate(item)


@router.patch("/{item_id}", response_model=StockItemOut)
async def update_item(
    item_id: uuid.UUID,
    body: StockItemUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "stock_manager")),
):
    item = await get_stock_item(db, item_id)
    if not item:
        raise HTTPException(404, detail={"code": "STOCK_NOT_FOUND", "message": "Stock item not found", "detail": None})
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(item, field, val)
    await db.commit()
    await db.refresh(item)
    return StockItemOut.model_validate(item)


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    item = await get_stock_item(db, item_id)
    if not item:
        raise HTTPException(404, detail={"code": "STOCK_NOT_FOUND", "message": "Stock item not found", "detail": None})
    item.deleted_at = datetime.utcnow()
    await db.commit()


@router.post("/{item_id}/restock", response_model=StockItemOut)
async def restock(
    item_id: uuid.UUID,
    body: RestockRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "stock_manager")),
):
    item = await get_stock_item(db, item_id)
    if not item:
        raise HTTPException(404, detail={"code": "STOCK_NOT_FOUND", "message": "Stock item not found", "detail": None})
    updated = await restock_item(db, item, body.quantity, body.note, current_user.id)
    return StockItemOut.model_validate(updated)


@router.post("/{item_id}/image", response_model=StockItemOut)
async def upload_image(
    item_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "stock_manager")),
):
    item = await get_stock_item(db, item_id)
    if not item:
        raise HTTPException(404, detail={"code": "STOCK_NOT_FOUND", "message": "Stock item not found", "detail": None})
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, detail={"code": "INVALID_FILE_TYPE", "message": "Only JPEG, PNG, WebP, GIF allowed", "detail": None})

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(400, detail={"code": "FILE_TOO_LARGE", "message": "Max file size is 5 MB", "detail": None})

    ext = os.path.splitext(file.filename or "image")[1] or ".jpg"
    filename = f"{item_id}{ext}"
    dest = os.path.join(UPLOADS_DIR, filename)
    with open(dest, "wb") as f:
        f.write(contents)

    # delete old file if different name
    if item.image_url:
        old_path = item.image_url.lstrip("/")
        if old_path != dest and os.path.exists(old_path):
            os.remove(old_path)

    item.image_url = f"/uploads/{filename}"
    await db.commit()
    await db.refresh(item)
    return StockItemOut.model_validate(item)


@router.get("/movements/{item_id}", response_model=list[StockMovementOut])
async def get_movements(item_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(StockMovement).where(StockMovement.item_id == item_id).order_by(StockMovement.created_at.desc())
    )
    return [StockMovementOut.model_validate(m) for m in result.scalars().all()]
