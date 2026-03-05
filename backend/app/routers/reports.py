from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta, timezone

from app.database import get_db
from app.models.order import Order
from app.models.daily_close import DailyClose
from app.models.user import User
from app.schemas.reports import DailyReportOut, DailyCloseOut, DailyCloseCreate, WeeklySalesItem
from app.security import get_current_user, require_role

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/daily", response_model=DailyReportOut)
def daily_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    today_orders = db.query(Order).filter(
        func.date(Order.created_at) == today
    ).all()

    total_orders = len([o for o in today_orders if o.status != "cancelado"])
    completed = len([o for o in today_orders if o.status == "completado"])
    cancelled = len([o for o in today_orders if o.status == "cancelado"])
    total_sales = sum(o.total for o in today_orders if o.status == "completado")
    avg_ticket = total_sales / completed if completed > 0 else 0

    return DailyReportOut(
        date=today.isoformat(),
        total_orders=total_orders,
        completed_orders=completed,
        cancelled_orders=cancelled,
        total_sales=total_sales,
        average_ticket=avg_ticket,
    )


@router.get("/weekly", response_model=list[WeeklySalesItem])
def weekly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())

    days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
    result = []

    for i in range(7):
        day_date = start_of_week + timedelta(days=i)
        day_orders = db.query(Order).filter(
            func.date(Order.created_at) == day_date,
            Order.status != "cancelado",
        ).all()
        completed_sales = sum(o.total for o in day_orders if o.status == "completado")
        result.append(WeeklySalesItem(day=days[i], orders=len(day_orders), sales=completed_sales))

    return result


@router.post("/close-day", response_model=DailyCloseOut, status_code=201)
def close_day(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("administrador", "cajero")),
):
    today = date.today()
    existing = db.query(DailyClose).filter(DailyClose.date == today).first()
    if existing:
        raise HTTPException(status_code=400, detail="El dia ya fue cerrado")

    today_orders = db.query(Order).filter(
        func.date(Order.created_at) == today,
        Order.status != "cancelado",
    ).all()

    total_sales = sum(o.total for o in today_orders if o.status == "completado")

    close = DailyClose(
        date=today,
        total_orders=len(today_orders),
        total_sales=total_sales,
        closed_by=current_user.id,
    )
    db.add(close)
    db.commit()
    db.refresh(close)
    return DailyCloseOut.model_validate(close)


@router.get("/closes", response_model=list[DailyCloseOut])
def list_closes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    closes = db.query(DailyClose).order_by(DailyClose.date.desc()).limit(30).all()
    return [DailyCloseOut.model_validate(c) for c in closes]
