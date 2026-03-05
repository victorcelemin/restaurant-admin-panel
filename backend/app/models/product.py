from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    unit = Column(String(30), nullable=False, default="unidades")
    min_stock = Column(Integer, nullable=False, default=10)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
