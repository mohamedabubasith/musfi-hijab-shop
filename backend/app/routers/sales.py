from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import uuid

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.sale import Sale, SaleItem
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleOut
from app.services.sales_service import create_sale
from app.models.stock import StockItem, StockMovement
from app.utils.pagination import pagination_params, paginate, PaginatedResponse

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("", response_model=PaginatedResponse[SaleOut])
async def list_sales(
    date_from: date | None = None,
    date_to: date | None = None,
    sold_by: uuid.UUID | None = None,
    pagination=Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Sale).where(Sale.deleted_at == None).options(selectinload(Sale.items))
    if current_user.role == "sales":
        query = query.where(Sale.sold_by == current_user.id)
    elif sold_by:
        query = query.where(Sale.sold_by == sold_by)
    if date_from:
        query = query.where(Sale.sale_date >= date_from)
    if date_to:
        query = query.where(Sale.sale_date <= date_to)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    sales = (await db.execute(query.order_by(Sale.created_at.desc()).offset(pagination["offset"]).limit(pagination["page_size"]))).scalars().all()
    return paginate([SaleOut.model_validate(s) for s in sales], total, pagination["page"], pagination["page_size"])


@router.post("", response_model=SaleOut, status_code=201)
async def record_sale(
    body: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "sales")),
):
    try:
        sale = await create_sale(db, body, current_user.id)
    except ValueError as e:
        error_msg = str(e)
        code = "INSUFFICIENT_STOCK" if "Insufficient" in error_msg else "STOCK_NOT_FOUND"
        raise HTTPException(400, detail={"code": code, "message": error_msg, "detail": None})

    result = await db.execute(select(Sale).where(Sale.id == sale.id).options(selectinload(Sale.items)))
    return SaleOut.model_validate(result.scalar_one())


@router.get("/{sale_id}", response_model=SaleOut)
async def get_sale(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.deleted_at == None).options(selectinload(Sale.items))
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(404, detail={"code": "SALE_NOT_FOUND", "message": "Sale not found", "detail": None})
    if current_user.role == "sales" and sale.sold_by != current_user.id:
        raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Access denied", "detail": None})
    return SaleOut.model_validate(sale)


@router.get("/{sale_id}/invoice")
async def get_invoice(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.deleted_at == None).options(selectinload(Sale.items))
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(404, detail={"code": "SALE_NOT_FOUND", "message": "Sale not found", "detail": None})
    return SaleOut.model_validate(sale)


@router.delete("/{sale_id}", status_code=204)
async def delete_sale(
    sale_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.deleted_at == None).options(selectinload(Sale.items))
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(404, detail={"code": "SALE_NOT_FOUND", "message": "Sale not found", "detail": None})

    for item in sale.items:
        stock_result = await db.execute(select(StockItem).where(StockItem.id == item.stock_item_id))
        stock = stock_result.scalar_one_or_none()
        if stock:
            stock.quantity += item.quantity
            db.add(StockMovement(item_id=stock.id, type="return", quantity=item.quantity, note=f"Sale {sale.invoice_number} reversed"))

    sale.deleted_at = datetime.now(timezone.utc)
    await db.commit()
