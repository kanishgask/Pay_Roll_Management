from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class ExpenseStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExpenseCategory(str, enum.Enum):
    TRAVEL = "travel"
    FOOD = "food"
    EQUIPMENT = "equipment"
    TRAINING = "training"
    OTHER = "other"


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(Enum(ExpenseCategory), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    receipt_url = Column(String, nullable=True)
    expense_date = Column(Date, nullable=False)
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.PENDING)
    admin_comment = Column(String, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="expenses")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

