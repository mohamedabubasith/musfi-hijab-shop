from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.users import UserCreate, UserUpdate, UserOut
from app.services.auth_service import hash_password
from app.utils.pagination import pagination_params, paginate, PaginatedResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=PaginatedResponse[UserOut])
async def list_users(
    pagination=Depends(pagination_params),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    total_result = await db.execute(select(func.count()).select_from(User))
    total = total_result.scalar()
    result = await db.execute(select(User).offset(pagination["offset"]).limit(pagination["page_size"]))
    users = result.scalars().all()
    return paginate([UserOut.model_validate(u) for u in users], total, pagination["page"], pagination["page_size"])


@router.post("", response_model=UserOut, status_code=201)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db), _=Depends(require_role("admin"))):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail={"code": "DUPLICATE_EMAIL", "message": "Email already exists", "detail": None},
        )
    user = User(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_role("admin"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail={"code": "USER_NOT_FOUND", "message": "User not found", "detail": None})
    return UserOut.model_validate(user)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID, body: UserUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_role("admin"))
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail={"code": "USER_NOT_FOUND", "message": "User not found", "detail": None})
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(user, field, val)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_role("admin"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail={"code": "USER_NOT_FOUND", "message": "User not found", "detail": None})
    await db.delete(user)
    await db.commit()


@router.patch("/{user_id}/toggle-active", response_model=UserOut)
async def toggle_active(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_role("admin"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail={"code": "USER_NOT_FOUND", "message": "User not found", "detail": None})
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)
