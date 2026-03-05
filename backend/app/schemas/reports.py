from pydantic import BaseModel
from datetime import date, datetime


class DailyReportOut(BaseModel):
    date: str
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    total_sales: float
    average_ticket: float


class DailyCloseCreate(BaseModel):
    pass  # Auto-calculated from today's data


class DailyCloseOut(BaseModel):
    id: int
    date: date
    total_orders: int
    total_sales: float
    closed_by: int
    closed_at: datetime

    model_config = {"from_attributes": True}


class WeeklySalesItem(BaseModel):
    day: str
    orders: int
    sales: float


class MonthlySalesItem(BaseModel):
    month: str
    sales: float
    expenses: float
    profit: float


class FinancialReportOut(BaseModel):
    current_month_sales: float
    current_month_expenses: float
    current_month_profit: float
    sales_change_pct: float
    monthly_data: list[MonthlySalesItem]


class SettingsUpdate(BaseModel):
    key: str
    value: str
