from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.invoice import InvoiceOut
from app.security import get_current_user

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.get("/", response_model=list[InvoiceOut])
def list_invoices(
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Invoice)
    if status_filter:
        q = q.filter(Invoice.status == status_filter)
    if search:
        q = q.filter(
            (Invoice.client_name.ilike(f"%{search}%")) |
            (Invoice.invoice_number.ilike(f"%{search}%"))
        )
    return [InvoiceOut.model_validate(i) for i in q.order_by(Invoice.created_at.desc()).all()]
