from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base


class DailyClose(Base):
    __tablename__ = "daily_closes"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    total_orders = Column(Integer, nullable=False, default=0)
    total_sales = Column(Float, nullable=False, default=0)
    closed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    closed_at = Column(DateTime(timezone=True), server_default=func.now())

    closer = relationship("User")
