from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut
from app.utils.pagination import pagination_params, paginate, PaginatedResponse

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=PaginatedResponse[SupplierOut])
async def list_suppliers(
    pagination=Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    total = (await db.execute(select(func.count()).select_from(Supplier))).scalar()
    items = (await db.execute(select(Supplier).offset(pagination["offset"]).limit(pagination["page_size"]))).scalars().all()
    return paginate([SupplierOut.model_validate(s) for s in items], total, pagination["page"], pagination["page_size"])


@router.post("", response_model=SupplierOut, status_code=201)
async def create_supplier(
    body: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "stock_manager")),
):
    supplier = Supplier(**body.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


@router.get("/{supplier_id}", response_model=SupplierOut)
async def get_supplier(supplier_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(404, detail={"code": "SUPPLIER_NOT_FOUND", "message": "Supplier not found", "detail": None})
    return SupplierOut.model_validate(supplier)


@router.patch("/{supplier_id}", response_model=SupplierOut)
async def update_supplier(
    supplier_id: uuid.UUID,
    body: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "stock_manager")),
):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(404, detail={"code": "SUPPLIER_NOT_FOUND", "message": "Supplier not found", "detail": None})
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(supplier, field, val)
    await db.commit()
    await db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(
    supplier_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin", "stock_manager")),
):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(404, detail={"code": "SUPPLIER_NOT_FOUND", "message": "Supplier not found", "detail": None})
    await db.delete(supplier)
    await db.commit()
