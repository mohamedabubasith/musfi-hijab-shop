from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, ChangePasswordRequest, UserOut, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    hash_password,
    verify_password,
    forgot_password,
    reset_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password", "detail": None},
        )
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = await create_refresh_token(db, str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        new_raw, user = await rotate_refresh_token(db, body.refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": str(e), "detail": None},
        )
    access_token = create_access_token(str(user.id), user.role)
    response.set_cookie(key="refresh_token", value=new_raw, httponly=True, samesite="lax", max_age=7 * 24 * 3600)
    return TokenResponse(access_token=access_token, refresh_token=new_raw, user=UserOut.model_validate(user))


@router.post("/logout")
async def logout(body: RefreshRequest, response: Response, db: AsyncSession = Depends(get_db)):
    await revoke_refresh_token(db, body.refresh_token)
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password_endpoint(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    await forgot_password(db, body.email)
    return {"message": "If this email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password_endpoint(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        await reset_password(db, body.token, body.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_RESET_TOKEN", "message": str(e), "detail": None},
        )
    return {"message": "Password reset successfully."}


@router.patch("/me/password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CREDENTIALS", "message": "Current password incorrect", "detail": None},
        )
    current_user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password updated"}
