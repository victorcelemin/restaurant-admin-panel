from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    client_name = Column(String(100), nullable=False)
    payment_method = Column(String(20), nullable=False)  # efectivo, tarjeta, transferencia, nequi
    notes = Column(Text, default="")
    total = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="pendiente", index=True)  # pendiente, en_preparacion, completado, cancelado
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(150), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    notes = Column(Text, default="")

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
