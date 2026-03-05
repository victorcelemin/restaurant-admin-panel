from pydantic import BaseModel, Field
from datetime import datetime


class InvoiceCreate(BaseModel):
    order_id: int
    client_name: str = Field(..., min_length=2, max_length=100)
    total: float = Field(..., gt=0)


class InvoiceStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(emitida|pendiente|anulada)$")


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    client_name: str
    total: float
    status: str
    dian_ref: str
    created_at: datetime

    model_config = {"from_attributes": True}
