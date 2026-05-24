from datetime import date, datetime
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract

from app.database import get_db
from app.dependencies import get_current_user
from app.utils.settings import get_global_threshold
from app.models.sale import Sale, SaleItem
from app.models.stock import StockItem
from app.models.delivery import Delivery
from app.schemas.dashboard import MetricSummary, ChartDataPoint, TopItem, CountryBreakdown, MonthlyRevenue

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=MetricSummary)
async def summary(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    today = date.today()
    now = datetime.now()

    today_rev = (await db.execute(
        select(func.coalesce(func.sum(Sale.total), 0)).where(Sale.sale_date == today, Sale.deleted_at == None)
    )).scalar()
    today_profit = (await db.execute(
        select(func.coalesce(func.sum(Sale.profit), 0)).where(Sale.sale_date == today, Sale.deleted_at == None)
    )).scalar()
    today_count = (await db.execute(
        select(func.count()).select_from(Sale).where(Sale.sale_date == today, Sale.deleted_at == None)
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
    total_stock = (await db.execute(
        select(func.coalesce(func.sum(StockItem.quantity), 0)).where(StockItem.deleted_at == None, StockItem.is_active == True)
    )).scalar()
    pending_deliveries = (await db.execute(
        select(func.count()).select_from(Delivery).where(Delivery.status.in_(["pending", "packed", "in_transit"]))
    )).scalar()
    threshold = await get_global_threshold(db)
    low_stock = (await db.execute(
        select(func.count()).select_from(StockItem).where(
            StockItem.deleted_at == None,
            StockItem.is_active == True,
            StockItem.quantity <= threshold,
        )
    )).scalar()

    return MetricSummary(
        today_revenue=Decimal(str(today_rev)),
        today_profit=Decimal(str(today_profit)),
        today_sales_count=today_count,
        monthly_revenue=Decimal(str(monthly_rev)),
        monthly_profit=Decimal(str(monthly_profit)),
        total_stock_count=int(total_stock),
        pending_deliveries=pending_deliveries,
        low_stock_count=low_stock,
    )


@router.get("/charts", response_model=list[ChartDataPoint])
async def charts(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    rows = (await db.execute(
        select(
            Sale.sale_date,
            func.sum(Sale.total).label("revenue"),
            func.sum(Sale.profit).label("profit"),
        )
        .where(Sale.deleted_at == None)
        .group_by(Sale.sale_date)
        .order_by(Sale.sale_date.desc())
        .limit(30)
    )).all()
    return [ChartDataPoint(label=str(r.sale_date), revenue=float(r.revenue or 0), profit=float(r.profit or 0)) for r in rows]


@router.get("/top-items", response_model=list[TopItem])
async def top_items(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    rows = (await db.execute(
        select(
            SaleItem.stock_item_id,
            SaleItem.item_name,
            func.sum(SaleItem.quantity).label("total_sold"),
            func.sum(SaleItem.subtotal).label("total_revenue"),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.deleted_at == None)
        .group_by(SaleItem.stock_item_id, SaleItem.item_name)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(10)
    )).all()
    return [
        TopItem(id=str(r.stock_item_id), name=r.item_name, category="", total_sold=r.total_sold, total_revenue=Decimal(str(r.total_revenue)))
        for r in rows
    ]


@router.get("/monthly-revenue", response_model=list[MonthlyRevenue])
async def monthly_revenue(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    now = datetime.now()
    MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    rows = (await db.execute(
        select(
            extract("month", Sale.sale_date).label("month"),
            func.sum(Sale.total).label("revenue"),
            func.sum(Sale.profit).label("profit"),
            func.count().label("sales_count"),
        )
        .where(
            extract("year", Sale.sale_date) == now.year,
            Sale.deleted_at == None,
        )
        .group_by(extract("month", Sale.sale_date))
        .order_by(extract("month", Sale.sale_date))
    )).all()
    result = []
    for r in rows:
        m = int(r.month)
        result.append(MonthlyRevenue(
            month=m,
            month_label=MONTH_LABELS[m - 1],
            revenue=Decimal(str(r.revenue or 0)),
            profit=Decimal(str(r.profit or 0)),
            sales_count=r.sales_count,
        ))
    return result


@router.get("/country-breakdown", response_model=list[CountryBreakdown])
async def country_breakdown(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    rows = (await db.execute(
        select(
            StockItem.origin_country,
            func.sum(StockItem.quantity).label("stock_count"),
            func.count().label("total_items"),
        )
        .where(StockItem.deleted_at == None, StockItem.is_active == True)
        .group_by(StockItem.origin_country)
    )).all()
    return [CountryBreakdown(country=r.origin_country, stock_count=int(r.stock_count or 0), total_items=r.total_items) for r in rows]
