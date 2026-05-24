from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.shop_config import ShopConfig


async def get_global_threshold(db: AsyncSession) -> int:
    result = await db.execute(
        select(ShopConfig).where(ShopConfig.type == "threshold", ShopConfig.is_active == True)
    )
    config = result.scalar_one_or_none()
    return int(config.value) if config else 5
