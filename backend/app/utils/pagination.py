from typing import TypeVar, Generic, List
from pydantic import BaseModel
from fastapi import Query

from app.config import settings

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int


def pagination_params(
    page: int = Query(1, ge=1),
    page_size: int = Query(None),
):
    size = page_size or settings.DEFAULT_PAGE_SIZE
    size = min(size, settings.MAX_PAGE_SIZE)
    return {"page": page, "page_size": size, "offset": (page - 1) * size}


def paginate(items: list, total: int, page: int, page_size: int) -> dict:
    import math
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if page_size else 1,
    }
