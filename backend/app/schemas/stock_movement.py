from pydantic import BaseModel, Field
from datetime import datetime


class StockMovementCreate(BaseModel):
    product_id: int
    type: str = Field(..., pattern="^(entrada|merma|venta)$")
    quantity: int = Field(..., gt=0)
    notes: str = Field(default="", max_length=500)


class StockMovementOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    type: str
    quantity: int
    notes: str
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_model(cls, movement):
        return cls(
            id=movement.id,
            product_id=movement.product_id,
            product_name=movement.product.name,
            type=movement.type,
            quantity=movement.quantity,
            notes=movement.notes or "",
            created_by=movement.created_by,
            created_at=movement.created_at,
        )
