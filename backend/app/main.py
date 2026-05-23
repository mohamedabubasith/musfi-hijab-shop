import logging
import traceback
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import engine, Base
import app.models  # noqa: F401 — registers all models with Base
from app.routers import auth, users, stock, sales, suppliers, deliveries, dashboard, ai_advisor, shop_config
from app.seed import router as seed_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)


async def _ensure_admin():
    import asyncio
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.user import User
    from app.services.auth_service import hash_password

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(User).where(User.email == settings.FIRST_ADMIN_EMAIL))).scalar_one_or_none()
        if not existing:
            # Run bcrypt in thread pool — it's CPU-bound and would block the event loop
            pw_hash = await asyncio.get_event_loop().run_in_executor(
                None, hash_password, settings.FIRST_ADMIN_PASSWORD
            )
            admin = User(
                name="Admin",
                email=settings.FIRST_ADMIN_EMAIL,
                password_hash=pw_hash,
                role="admin",
            )
            db.add(admin)
            try:
                await db.commit()
                logger.info("First admin user created: %s", settings.FIRST_ADMIN_EMAIL)
            except Exception:
                await db.rollback()  # Another worker inserted first — harmless


async def _seed_default_configs():
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.shop_config import ShopConfig

    defaults = [
        {"type": "category", "value": "hijab",   "label": "Hijab"},
        {"type": "category", "value": "scarf",   "label": "Scarf"},
        {"type": "category", "value": "niqab",   "label": "Niqab"},
        {"type": "category", "value": "abaya",   "label": "Abaya"},
        {"type": "category", "value": "dupatta", "label": "Dupatta"},
        {"type": "category", "value": "other",   "label": "Other"},
        {"type": "origin",   "value": "Malaysia",  "label": "Malaysia"},
        {"type": "origin",   "value": "Dubai",     "label": "Dubai"},
        {"type": "origin",   "value": "Bangalore", "label": "Bangalore"},
        {"type": "origin",   "value": "Local",     "label": "Local Dealer"},
        {"type": "origin",   "value": "Other",     "label": "Other"},
    ]
    async with AsyncSessionLocal() as db:
        for d in defaults:
            exists = (await db.execute(
                select(ShopConfig).where(ShopConfig.type == d["type"], ShopConfig.value == d["value"])
            )).scalar_one_or_none()
            if not exists:
                db.add(ShopConfig(**d))
        await db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables ready")
    except Exception as e:
        # Race condition: another worker already created tables — safe to ignore
        logger.warning("create_all skipped (likely race with another worker): %s", e)
    await _ensure_admin()
    await _seed_default_configs()
    yield


limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="Musfi Hijab Shop API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

_cors_origins = [settings.FRONTEND_URL]
if settings.EXTRA_CORS_ORIGINS:
    _cors_origins += [o.strip() for o in settings.EXTRA_CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(stock.router, prefix=PREFIX)
app.include_router(sales.router, prefix=PREFIX)
app.include_router(suppliers.router, prefix=PREFIX)
app.include_router(deliveries.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(ai_advisor.router, prefix=PREFIX)
app.include_router(shop_config.router, prefix=PREFIX)
app.include_router(seed_router, prefix=PREFIX)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.exception_handler(Exception)
async def _unhandled_exception(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc), "type": type(exc).__name__})


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
