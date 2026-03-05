from pydantic import BaseModel, Field
from datetime import datetime


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., min_length=2, max_length=50)
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    unit: str = Field(default="unidades", max_length=30)
    min_stock: int = Field(default=10, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=150)
    category: str | None = Field(None, min_length=2, max_length=50)
    price: float | None = Field(None, gt=0)
    stock: int | None = Field(None, ge=0)
    unit: str | None = Field(None, max_length=30)
    min_stock: int | None = Field(None, ge=0)
    active: bool | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    price: float
    stock: int
    unit: str
    min_stock: int
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
