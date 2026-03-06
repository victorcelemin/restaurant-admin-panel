from pydantic import BaseModel, Field
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    notes: str = Field(default="", max_length=500)


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    notes: str

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    client_name: str = Field(..., min_length=2, max_length=100)
    payment_method: str = Field(..., pattern="^(efectivo|tarjeta|transferencia|nequi)$")
    notes: str = Field(default="", max_length=1000)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class PublicOrderCreate(BaseModel):
    """Schema for unauthenticated ecommerce orders."""
    client_name: str = Field(..., min_length=2, max_length=100)
    table_number: str = Field(default="", max_length=20)
    notes: str = Field(default="", max_length=1000)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pendiente|en_preparacion|completado|cancelado)$")


class OrderOut(BaseModel):
    id: int
    order_number: str
    client_name: str
    payment_method: str
    notes: str
    total: float
    status: str
    created_by: int
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}
