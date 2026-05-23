import json
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import AsyncGenerator

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract

from app.config import settings
from app.models.sale import Sale, SaleItem
from app.models.stock import StockItem
from app.models.delivery import Delivery


async def build_shop_context(db: AsyncSession) -> str:
    today = date.today()
    now = datetime.now()
    thirty_days_ago = today - timedelta(days=30)

    today_rev = (await db.execute(
        select(func.coalesce(func.sum(Sale.total), 0)).where(Sale.sale_date == today, Sale.deleted_at == None)
    )).scalar()
    monthly_rev = (await db.execute(
        select(func.coalesce(func.sum(Sale.total), 0)).where(
            extract("month", Sale.sale_date) == now.month,
            extract("year", Sale.sale_date) == now.year,
            Sale.deleted_at == None,
        )
    )).scalar()
    monthly_profit = (await db.execute(
        select(func.coalesce(func.sum(Sale.profit), 0)).where(
            extract("month", Sale.sale_date) == now.month,
            extract("year", Sale.sale_date) == now.year,
            Sale.deleted_at == None,
        )
    )).scalar()
    total_sales_count = (await db.execute(
        select(func.count()).select_from(Sale).where(
            extract("month", Sale.sale_date) == now.month,
            extract("year", Sale.sale_date) == now.year,
            Sale.deleted_at == None,
        )
    )).scalar()
    total_stock = (await db.execute(
        select(func.coalesce(func.sum(StockItem.quantity), 0)).where(StockItem.deleted_at == None)
    )).scalar()
    low_stock_items = (await db.execute(
        select(StockItem.name, StockItem.quantity).where(
            StockItem.deleted_at == None,
            StockItem.quantity <= StockItem.low_stock_threshold,
        ).limit(10)
    )).all()
    pending_del = (await db.execute(
        select(func.count()).select_from(Delivery).where(Delivery.status.in_(["pending", "packed", "in_transit"]))
    )).scalar()

    # Top selling items last 30 days by qty
    top_items_rows = (await db.execute(
        select(
            SaleItem.item_name,
            func.sum(SaleItem.quantity).label("total_qty"),
            func.sum(SaleItem.subtotal).label("total_rev"),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.sale_date >= thirty_days_ago, Sale.deleted_at == None)
        .group_by(SaleItem.item_name)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(10)
    )).all()

    # Out of stock items
    out_of_stock = (await db.execute(
        select(StockItem.name).where(StockItem.deleted_at == None, StockItem.quantity == 0).limit(10)
    )).scalars().all()

    # Payment method breakdown this month
    payment_rows = (await db.execute(
        select(Sale.payment_method, func.count().label("cnt"), func.sum(Sale.total).label("total"))
        .where(
            extract("month", Sale.sale_date) == now.month,
            extract("year", Sale.sale_date) == now.year,
            Sale.deleted_at == None,
        )
        .group_by(Sale.payment_method)
    )).all()

    low_stock_text = ", ".join([f"{r.name} ({r.quantity} left)" for r in low_stock_items]) or "None"
    out_of_stock_text = ", ".join(out_of_stock) or "None"

    if top_items_rows:
        top_items_text = "\n".join([
            f"  {i+1}. {r.item_name} — {r.total_qty} units sold, ₹{float(r.total_rev):.0f} revenue"
            for i, r in enumerate(top_items_rows)
        ])
    else:
        top_items_text = "  No sales data yet"

    if payment_rows:
        payment_text = ", ".join([f"{r.payment_method}: {r.cnt} sales (₹{float(r.total):.0f})" for r in payment_rows])
    else:
        payment_text = "No sales this month"

    return f"""You are a smart business advisor for Musfi Hijab Shop — a retail store selling hijabs, scarves, and related items imported from Malaysia, Dubai, and Bangalore.

Live shop data as of {today}:

**Revenue & Profit (This Month)**
- Today's revenue: ₹{today_rev}
- Monthly revenue: ₹{monthly_rev}
- Monthly profit: ₹{monthly_profit}
- Total sales transactions: {total_sales_count}
- Payment breakdown: {payment_text}

**Stock**
- Total stock units: {total_stock}
- Low stock items: {low_stock_text}
- Out of stock items: {out_of_stock_text}

**Deliveries**
- Pending/in-transit deliveries: {pending_del}

**Top Selling Items (Last 30 Days by Quantity)**
{top_items_text}

You have FULL access to this real-time shop data. Always use it for specific, accurate answers.

Rules:
- Be concise and direct. No filler phrases like "Great question" or "I'd be happy to help".
- For simple questions (1–2 line answer), skip headings entirely.
- For complex answers, use: ## Heading, - bullet points, **bold** only for specific numbers or 1–3 key words.
- Numbered lists for step-by-step instructions. Each item MUST be on its own line — never inline.
- NEVER wrap an entire sentence, bullet, or numbered item in **bold**. **Bold** is for short highlights only.
- NEVER put multiple list items on one line separated by spaces.
- Never suggest the owner "check their POS" or "export data" — you already have the data.
- Max 150 words unless the question genuinely requires more detail."""


async def stream_chat(db: AsyncSession, message: str, history: list[dict], language: str = "en") -> AsyncGenerator[str, None]:
    system_prompt = await build_shop_context(db)

    if language == "ta":
        system_prompt += "\n\nMUST: The user's app language is Tamil. Respond ENTIRELY in Tamil (தமிழ் மொழி). Write all text in Tamil script. Numbers and currency (₹) are fine in numerals."
    else:
        system_prompt += "\n\nRespond in English."

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream(
            "POST",
            f"{settings.LLM_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {settings.LLM_API_KEY}"},
            json={"model": settings.LLM_MODEL, "messages": messages, "stream": True},
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except (json.JSONDecodeError, KeyError, IndexError):
                        pass
