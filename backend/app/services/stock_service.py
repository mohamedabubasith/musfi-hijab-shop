from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.models.stock import StockItem, StockMovement
from app.schemas.stock import StockItemCreate, StockItemUpdate


async def get_stock_item(db: AsyncSession, item_id: uuid.UUID) -> StockItem | None:
    result = await db.execute(
        select(StockItem).where(StockItem.id == item_id, StockItem.deleted_at == None)
    )
    return result.scalar_one_or_none()


async def create_stock_item(db: AsyncSession, body: StockItemCreate, created_by: uuid.UUID) -> StockItem:
    item = StockItem(**body.model_dump(), created_by=created_by)
    db.add(item)
    await db.flush()
    if body.quantity > 0:
        movement = StockMovement(item_id=item.id, type="restock", quantity=body.quantity, created_by=created_by)
        db.add(movement)
    await db.commit()
    await db.refresh(item)
    return item


async def restock_item(db: AsyncSession, item: StockItem, quantity: int, note: str | None, user_id: uuid.UUID) -> StockItem:
    item.quantity += quantity
    movement = StockMovement(item_id=item.id, type="restock", quantity=quantity, note=note, created_by=user_id)
    db.add(movement)
    await db.commit()
    await db.refresh(item)
    return item


async def deduct_stock(db: AsyncSession, item: StockItem, quantity: int, user_id: uuid.UUID, note: str = "sale") -> None:
    item.quantity -= quantity
    movement = StockMovement(item_id=item.id, type="sale", quantity=-quantity, note=note, created_by=user_id)
    db.add(movement)
