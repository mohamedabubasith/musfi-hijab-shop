from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.models.supplier import Supplier
from app.models.stock import StockItem
from app.services.auth_service import hash_password
from app.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/seed")
async def seed(db: AsyncSession = Depends(get_db), _=Depends(require_role("admin"))):
    existing = (await db.execute(select(User).where(User.email == settings.FIRST_ADMIN_EMAIL))).scalar_one_or_none()
    if not existing:
        admin = User(
            name="Admin",
            email=settings.FIRST_ADMIN_EMAIL,
            password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin)

    suppliers_data = [
        {"name": "Amira Textiles", "country": "Malaysia"},
        {"name": "Al Noor Fabrics", "country": "Dubai"},
        {"name": "Bangalore Silk House", "country": "Bangalore"},
    ]
    supplier_objs = []
    for s in suppliers_data:
        existing_s = (await db.execute(select(Supplier).where(Supplier.name == s["name"]))).scalar_one_or_none()
        if not existing_s:
            obj = Supplier(**s)
            db.add(obj)
            supplier_objs.append(obj)
    await db.flush()

    all_suppliers = (await db.execute(select(Supplier))).scalars().all()
    s_map = {s.name: s for s in all_suppliers}

    stock_data = [
        {"name": "Premium Chiffon Hijab", "name_ta": "பிரீமியம் சிஃபான் ஹிஜாப்", "category": "hijab", "origin_country": "Malaysia", "cost_price": 200, "selling_price": 450, "quantity": 50, "sku": "MSF-HJ-001"},
        {"name": "Silk Scarf", "name_ta": "பட்டு சால்வை", "category": "scarf", "origin_country": "Dubai", "cost_price": 350, "selling_price": 750, "quantity": 30, "sku": "MSF-SC-001"},
        {"name": "Cotton Dupatta", "name_ta": "காட்டன் துப்பட்டா", "category": "dupatta", "origin_country": "Bangalore", "cost_price": 150, "selling_price": 320, "quantity": 80, "sku": "MSF-DP-001"},
        {"name": "Niqab Set", "name_ta": "நிகாப் செட்", "category": "niqab", "origin_country": "Dubai", "cost_price": 500, "selling_price": 1100, "quantity": 15, "sku": "MSF-NQ-001"},
        {"name": "Abaya Classic", "name_ta": "அபாயா கிளாசிக்", "category": "abaya", "origin_country": "Dubai", "cost_price": 1200, "selling_price": 2500, "quantity": 20, "sku": "MSF-AB-001"},
        {"name": "Georgette Hijab", "name_ta": "ஜார்ஜெட் ஹிஜாப்", "category": "hijab", "origin_country": "Malaysia", "cost_price": 180, "selling_price": 400, "quantity": 60, "sku": "MSF-HJ-002"},
        {"name": "Embroidered Scarf", "name_ta": "எம்பிராயிடரி சால்வை", "category": "scarf", "origin_country": "Bangalore", "cost_price": 250, "selling_price": 550, "quantity": 25, "sku": "MSF-SC-002"},
        {"name": "Jersey Hijab", "name_ta": "ஜெர்சி ஹிஜாப்", "category": "hijab", "origin_country": "Malaysia", "cost_price": 120, "selling_price": 280, "quantity": 3, "sku": "MSF-HJ-003"},
        {"name": "Pashmina Shawl", "name_ta": "பஷ்மினா சால்வை", "category": "scarf", "origin_country": "Bangalore", "cost_price": 600, "selling_price": 1300, "quantity": 10, "sku": "MSF-SC-003"},
        {"name": "Lawn Dupatta", "name_ta": "லான் துப்பட்டா", "category": "dupatta", "origin_country": "Bangalore", "cost_price": 100, "selling_price": 220, "quantity": 4, "sku": "MSF-DP-002"},
    ]

    for s_data in stock_data:
        existing_stock = (await db.execute(select(StockItem).where(StockItem.sku == s_data["sku"]))).scalar_one_or_none()
        if not existing_stock:
            country = s_data["origin_country"]
            supplier = None
            if country == "Malaysia":
                supplier = s_map.get("Amira Textiles")
            elif country == "Dubai":
                supplier = s_map.get("Al Noor Fabrics")
            elif country == "Bangalore":
                supplier = s_map.get("Bangalore Silk House")
            item = StockItem(
                name=s_data["name"],
                name_ta=s_data["name_ta"],
                category=s_data["category"],
                origin_country=country,
                supplier_id=supplier.id if supplier else None,
                cost_price=s_data["cost_price"],
                selling_price=s_data["selling_price"],
                quantity=s_data["quantity"],
                sku=s_data["sku"],
                low_stock_threshold=5,
            )
            db.add(item)

    await db.commit()
    return {"message": "Seed data created successfully"}
