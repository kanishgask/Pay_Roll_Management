from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_employees: int
    total_employees_trend: float  # percentage change
    total_salary_disbursed: float
    total_salary_trend: float
    pending_expenses: int
    pending_expenses_trend: float
    monthly_payroll_summary: dict


class EmployeeStats(BaseModel):
    total_salary_slips: int
    total_expenses: int
    pending_expenses: int
    approved_expenses: int
    total_expense_amount: float
    total_approved_amount: float

