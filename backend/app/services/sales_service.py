from datetime import date, timezone, datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
import uuid

from app.models.stock import StockItem, StockMovement
from app.models.sale import Sale, SaleItem, Customer
from app.models.delivery import Delivery
from app.schemas.sale import SaleCreate


async def generate_invoice_number(db: AsyncSession) -> str:
    year = datetime.now().year
    result = await db.execute(
        select(func.count()).select_from(Sale).where(
            extract("year", Sale.sale_date) == year,
            Sale.deleted_at == None,
        )
    )
    count = result.scalar() or 0
    return f"MSF-{year}-{count + 1:04d}"


async def create_sale(db: AsyncSession, body: SaleCreate, sold_by: uuid.UUID) -> Sale:
    subtotal = Decimal("0")
    cost_total = Decimal("0")
    sale_items = []

    for line in body.items:
        result = await db.execute(
            select(StockItem).where(StockItem.id == line.stock_item_id, StockItem.deleted_at == None)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise ValueError(f"Stock item {line.stock_item_id} not found")
        if item.quantity < line.quantity:
            raise ValueError(f"Insufficient stock for {item.name}: available {item.quantity}, requested {line.quantity}")

        line_subtotal = item.selling_price * line.quantity
        line_cost = item.cost_price * line.quantity
        subtotal += line_subtotal
        cost_total += line_cost

        sale_items.append(
            SaleItem(
                stock_item_id=item.id,
                item_name=item.name,
                quantity=line.quantity,
                unit_price=item.selling_price,
                unit_cost=item.cost_price,
                subtotal=line_subtotal,
            )
        )

        item.quantity -= line.quantity
        movement = StockMovement(
            item_id=item.id, type="sale", quantity=-line.quantity, created_by=sold_by
        )
        db.add(movement)

    total = subtotal - body.discount
    profit = total - cost_total

    invoice_number = await generate_invoice_number(db)

    sale = Sale(
        invoice_number=invoice_number,
        customer_id=body.customer_id,
        customer_name=body.customer_name,
        payment_method=body.payment_method,
        subtotal=subtotal,
        discount=body.discount,
        total=total,
        cost_total=cost_total,
        profit=profit,
        is_delivery=body.is_delivery,
        notes=body.notes,
        sold_by=sold_by,
        sale_date=date.today(),
        items=sale_items,
    )
    db.add(sale)
    await db.flush()

    if body.is_delivery and body.delivery_address:
        delivery = Delivery(
            sale_id=sale.id,
            customer_name=body.customer_name or "Walk-in",
            phone=body.delivery_phone,
            address=body.delivery_address,
            expected_date=body.expected_delivery_date,
        )
        db.add(delivery)

    await db.commit()
    await db.refresh(sale)
    return sale
