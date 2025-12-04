from pydantic import BaseModel
from datetime import date, datetime
from app.schemas.user import UserResponse


class SalarySlipBase(BaseModel):
    month: int
    year: int
    basic_salary: float
    allowances: float = 0.0
    deductions: float = 0.0
    tax: float = 0.0
    payment_date: date | None = None
    notes: str | None = None


class SalarySlipCreate(SalarySlipBase):
    employee_id: int


class SalarySlipUpdate(BaseModel):
    month: int | None = None
    year: int | None = None
    basic_salary: float | None = None
    allowances: float | None = None
    deductions: float | None = None
    tax: float | None = None
    payment_date: date | None = None
    status: str | None = None
    notes: str | None = None


class SalarySlipResponse(SalarySlipBase):
    id: int
    employee_id: int
    net_salary: float
    status: str
    created_at: datetime
    updated_at: datetime
    employee: UserResponse | None = None

    class Config:
        from_attributes = True


class SalarySlip(SalarySlipResponse):
    pass

