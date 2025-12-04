from pydantic import BaseModel
from datetime import date, datetime
from app.models.expense import ExpenseStatus, ExpenseCategory
from app.schemas.user import UserResponse


class ExpenseBase(BaseModel):
    category: ExpenseCategory
    amount: float
    description: str
    expense_date: date


class ExpenseCreate(ExpenseBase):
    receipt_url: str | None = None


class ExpenseUpdate(BaseModel):
    category: ExpenseCategory | None = None
    amount: float | None = None
    description: str | None = None
    expense_date: date | None = None
    receipt_url: str | None = None


class ExpenseResponse(ExpenseBase):
    id: int
    employee_id: int
    receipt_url: str | None = None
    status: ExpenseStatus
    admin_comment: str | None = None
    reviewed_by: int | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    employee: UserResponse | None = None

    class Config:
        from_attributes = True


class Expense(ExpenseResponse):
    pass


class ExpenseApproval(BaseModel):
    comment: str | None = None

