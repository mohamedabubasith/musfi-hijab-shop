from pydantic import BaseModel
from decimal import Decimal


class MetricSummary(BaseModel):
    today_revenue: Decimal
    today_profit: Decimal
    today_sales_count: int
    monthly_revenue: Decimal
    monthly_profit: Decimal
    total_stock_count: int
    pending_deliveries: int
    low_stock_count: int


class ChartDataPoint(BaseModel):
    label: str
    revenue: Decimal
    profit: Decimal


class TopItem(BaseModel):
    id: str
    name: str
    category: str
    total_sold: int
    total_revenue: Decimal


class CountryBreakdown(BaseModel):
    country: str
    stock_count: int
    total_items: int


class MonthlyRevenue(BaseModel):
    month: int
    month_label: str
    revenue: Decimal
    profit: Decimal
    sales_count: int
