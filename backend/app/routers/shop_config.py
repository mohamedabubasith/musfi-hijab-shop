from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.shop_config import ShopConfig
from app.schemas.shop_config import ShopConfigCreate, ShopConfigUpdate, ShopConfigOut

router = APIRouter(prefix="/shop-config", tags=["shop-config"])


@router.get("/{config_type}", response_model=list[ShopConfigOut])
async def list_config(config_type: str, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(ShopConfig).where(ShopConfig.type == config_type, ShopConfig.is_active == True)
    )
    return [ShopConfigOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=ShopConfigOut, status_code=201)
async def create_config(
    body: ShopConfigCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    existing = (await db.execute(
        select(ShopConfig).where(ShopConfig.type == body.type, ShopConfig.value == body.value)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(409, detail={"code": "DUPLICATE", "message": "Already exists", "detail": None})
    config = ShopConfig(**body.model_dump())
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return ShopConfigOut.model_validate(config)


@router.patch("/{config_id}", response_model=ShopConfigOut)
async def update_config(
    config_id: uuid.UUID,
    body: ShopConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    result = await db.execute(select(ShopConfig).where(ShopConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Config not found", "detail": None})
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(config, field, val)
    await db.commit()
    await db.refresh(config)
    return ShopConfigOut.model_validate(config)


@router.delete("/{config_id}", status_code=204)
async def delete_config(
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    result = await db.execute(select(ShopConfig).where(ShopConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "Config not found", "detail": None})
    await db.delete(config)
    await db.commit()
