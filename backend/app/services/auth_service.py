import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
import httpx
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.user import User, RefreshToken, PasswordResetToken

N8N_EMAIL_WEBHOOK = "https://n8n.basivo.in/webhook/send-email"
RESET_TOKEN_EXPIRE_MINUTES = 60


async def _send_email(to: str, name: str, subject: str, content: str) -> None:
    payload = {"to": to, "name": name, "subject": subject, "content": content}
    async with httpx.AsyncClient(timeout=15) as client:
        await client.post(N8N_EMAIL_WEBHOOK, json=payload)


async def forgot_password(db: AsyncSession, email: str) -> None:
    result = await db.execute(select(User).where(User.email == email, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        return  # Don't reveal whether email exists

    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

    db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    await db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    name = user.name or "Valued Customer"
    content = (
        f"Hi {name},\n\n"
        f"We received a request to reset your password for Musfi Hijab Shop.\n\n"
        f"Click the link below to set a new password. This link expires in 1 hour.\n\n"
        f"{reset_link}\n\n"
        f"If you did not request this, ignore this email — your password will not change.\n\n"
        f"— Musfi Hijab Shop"
    )
    await _send_email(user.email, name, "Reset Your Password - Musfi Hijab Shop", content)


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> None:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise ValueError("Invalid or already used reset link.")
    if reset_token.expires_at < datetime.now(timezone.utc):
        raise ValueError("Reset link has expired. Please request a new one.")

    user_result = await db.execute(select(User).where(User.id == reset_token.user_id, User.is_active == True))
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found.")

    import asyncio
    user.password_hash = await asyncio.get_event_loop().run_in_executor(None, hash_password, new_password)
    reset_token.used = True
    await db.commit()


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def create_refresh_token(db: AsyncSession, user_id: str) -> str:
    raw = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=_hash_token(raw),
        expires_at=expires_at,
    )
    db.add(db_token)
    await db.commit()
    return raw


async def rotate_refresh_token(db: AsyncSession, raw_token: str) -> tuple[str, "User"]:
    token_hash = _hash_token(raw_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
        )
    )
    db_token = result.scalar_one_or_none()
    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise ValueError("Invalid or expired refresh token")

    db_token.revoked = True
    user_result = await db.execute(select(User).where(User.id == db_token.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise ValueError("User not found or inactive")

    new_raw = await create_refresh_token(db, str(user.id))
    return new_raw, user


async def revoke_refresh_token(db: AsyncSession, raw_token: str) -> None:
    token_hash = _hash_token(raw_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    db_token = result.scalar_one_or_none()
    if db_token:
        db_token.revoked = True
        await db.commit()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> "User | None":
    result = await db.execute(select(User).where(User.email == email, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user
