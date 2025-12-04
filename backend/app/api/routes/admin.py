from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.api.dependencies import get_current_active_admin
from app.models.user import User
from app.models.salary_slip import SalarySlip
from app.models.expense import Expense, ExpenseStatus
from app.models.notification import Notification, NotificationType
from app.schemas.salary_slip import SalarySlipCreate, SalarySlipUpdate, SalarySlipResponse
from app.schemas.expense import ExpenseResponse, ExpenseApproval
from app.schemas.dashboard import DashboardStats
from app.schemas.user import UserResponse
from app.services.pdf_service import generate_salary_slip_pdf
from app.services.notification_service import create_notification

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics."""
    # Total employees
    total_employees = db.query(User).filter(User.role == "employee").count()
    last_month_employees = db.query(User).filter(
        User.role == "employee",
        User.created_at < datetime.now().replace(day=1)
    ).count()
    employees_trend = ((total_employees - last_month_employees) / last_month_employees * 100) if last_month_employees > 0 else 0
    
    # Total salary disbursed this month
    current_month = datetime.now().month
    current_year = datetime.now().year
    total_salary = db.query(func.sum(SalarySlip.net_salary)).filter(
        SalarySlip.month == current_month,
        SalarySlip.year == current_year,
        SalarySlip.status == "paid"
    ).scalar() or 0.0
    
    last_month_salary = db.query(func.sum(SalarySlip.net_salary)).filter(
        SalarySlip.month == (current_month - 1) if current_month > 1 else 12,
        SalarySlip.year == (current_year if current_month > 1 else current_year - 1),
        SalarySlip.status == "paid"
    ).scalar() or 0.0
    salary_trend = ((total_salary - last_month_salary) / last_month_salary * 100) if last_month_salary > 0 else 0
    
    # Pending expenses
    pending_expenses = db.query(Expense).filter(Expense.status == ExpenseStatus.PENDING).count()
    last_month_pending = db.query(Expense).filter(
        Expense.status == ExpenseStatus.PENDING,
        Expense.created_at < datetime.now().replace(day=1)
    ).count()
    expenses_trend = ((pending_expenses - last_month_pending) / last_month_pending * 100) if last_month_pending > 0 else 0
    
    # Monthly payroll summary
    monthly_summary = {}
    for month in range(1, 13):
        month_salary = db.query(func.sum(SalarySlip.net_salary)).filter(
            SalarySlip.month == month,
            SalarySlip.year == current_year,
            SalarySlip.status == "paid"
        ).scalar() or 0.0
        monthly_summary[month] = float(month_salary)
    
    return DashboardStats(
        total_employees=total_employees,
        total_employees_trend=employees_trend,
        total_salary_disbursed=float(total_salary),
        total_salary_trend=salary_trend,
        pending_expenses=pending_expenses,
        pending_expenses_trend=expenses_trend,
        monthly_payroll_summary=monthly_summary
    )


@router.get("/employees", response_model=List[UserResponse])
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Get all employees with filtering and pagination."""
    query = db.query(User).filter(User.role == "employee")
    
    if search:
        query = query.filter(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    if department:
        query = query.filter(User.department == department)
    
    employees = query.offset(skip).limit(limit).all()
    return [UserResponse.model_validate(emp) for emp in employees]


@router.get("/employees/{employee_id}", response_model=UserResponse)
async def get_employee(
    employee_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Get employee details."""
    employee = db.query(User).filter(
        User.id == employee_id,
        User.role == "employee"
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return UserResponse.model_validate(employee)


@router.post("/salary-slip", response_model=SalarySlipResponse, status_code=status.HTTP_201_CREATED)
async def create_salary_slip(
    salary_slip: SalarySlipCreate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Create a new salary slip."""
    # Verify employee exists
    employee = db.query(User).filter(User.id == salary_slip.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Calculate net salary
    net_salary = (
        salary_slip.basic_salary +
        salary_slip.allowances -
        salary_slip.deductions -
        salary_slip.tax
    )
    
    new_salary_slip = SalarySlip(
        **salary_slip.model_dump(),
        net_salary=net_salary,
        status="pending"
    )
    
    db.add(new_salary_slip)
    db.commit()
    db.refresh(new_salary_slip)
    
    # Create notification
    create_notification(
        db=db,
        user_id=employee.id,
        type=NotificationType.SALARY_SLIP,
        title="New Salary Slip Generated",
        message=f"Your salary slip for {salary_slip.month}/{salary_slip.year} has been generated."
    )
    
    return SalarySlipResponse.model_validate(new_salary_slip)


@router.post("/salary-slips/bulk", response_model=List[SalarySlipResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_salary_slips(
    salary_slips: List[SalarySlipCreate],
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Bulk create salary slips."""
    created_slips = []
    
    for slip_data in salary_slips:
        employee = db.query(User).filter(User.id == slip_data.employee_id).first()
        if not employee:
            continue
        
        net_salary = (
            slip_data.basic_salary +
            slip_data.allowances -
            slip_data.deductions -
            slip_data.tax
        )
        
        new_slip = SalarySlip(
            **slip_data.model_dump(),
            net_salary=net_salary,
            status="pending"
        )
        
        db.add(new_slip)
        created_slips.append(new_slip)
        
        # Create notification
        create_notification(
            db=db,
            user_id=employee.id,
            type=NotificationType.SALARY_SLIP,
            title="New Salary Slip Generated",
            message=f"Your salary slip for {slip_data.month}/{slip_data.year} has been generated."
        )
    
    db.commit()
    
    for slip in created_slips:
        db.refresh(slip)
    
    return [SalarySlipResponse.model_validate(slip) for slip in created_slips]


@router.get("/salary-slips", response_model=List[SalarySlipResponse])
async def get_all_salary_slips(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    employee_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Get all salary slips with filtering."""
    query = db.query(SalarySlip)
    
    if employee_id:
        query = query.filter(SalarySlip.employee_id == employee_id)
    if month:
        query = query.filter(SalarySlip.month == month)
    if year:
        query = query.filter(SalarySlip.year == year)
    
    slips = query.order_by(SalarySlip.year.desc(), SalarySlip.month.desc()).offset(skip).limit(limit).all()
    return [SalarySlipResponse.model_validate(slip) for slip in slips]


@router.get("/salary-slips/{slip_id}/pdf")
async def admin_download_salary_slip_pdf(
    slip_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """Download any employee's salary slip as PDF (admin only)."""
    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary slip not found",
        )

    employee = db.query(User).filter(User.id == slip.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    pdf_bytes = generate_salary_slip_pdf(slip, employee)

    from fastapi.responses import Response

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=salary_slip_{slip.month}_{slip.year}_emp_{employee.id}.pdf"
        },
    )


@router.put("/salary-slip/{slip_id}", response_model=SalarySlipResponse)
async def update_salary_slip(
    slip_id: int,
    slip_update: SalarySlipUpdate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Update a salary slip."""
    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary slip not found"
        )
    
    update_data = slip_update.model_dump(exclude_unset=True)
    
    # Recalculate net salary if salary components changed
    if any(key in update_data for key in ["basic_salary", "allowances", "deductions", "tax"]):
        basic = update_data.get("basic_salary", slip.basic_salary)
        allowances = update_data.get("allowances", slip.allowances)
        deductions = update_data.get("deductions", slip.deductions)
        tax = update_data.get("tax", slip.tax)
        update_data["net_salary"] = basic + allowances - deductions - tax
    
    for key, value in update_data.items():
        setattr(slip, key, value)
    
    db.commit()
    db.refresh(slip)
    
    return SalarySlipResponse.model_validate(slip)


@router.delete("/salary-slip/{slip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_salary_slip(
    slip_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Delete a salary slip."""
    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary slip not found"
        )
    
    db.delete(slip)
    db.commit()
    return None


@router.get("/expenses", response_model=List[ExpenseResponse])
async def get_all_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[ExpenseStatus] = None,
    employee_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Get all expenses with filtering."""
    query = db.query(Expense)
    
    if status_filter:
        query = query.filter(Expense.status == status_filter)
    if employee_id:
        query = query.filter(Expense.employee_id == employee_id)
    
    expenses = query.order_by(Expense.created_at.desc()).offset(skip).limit(limit).all()
    return [ExpenseResponse.model_validate(exp) for exp in expenses]


@router.put("/expenses/{expense_id}/approve", response_model=ExpenseResponse)
async def approve_expense(
    expense_id: int,
    approval: ExpenseApproval,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Approve an expense."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    expense.status = ExpenseStatus.APPROVED
    expense.admin_comment = approval.comment
    expense.reviewed_by = current_user.id
    expense.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(expense)
    
    # Create notification
    create_notification(
        db=db,
        user_id=expense.employee_id,
        type=NotificationType.EXPENSE_APPROVED,
        title="Expense Approved",
        message=f"Your expense of ${expense.amount} has been approved."
    )
    
    return ExpenseResponse.model_validate(expense)


@router.put("/expenses/{expense_id}/reject", response_model=ExpenseResponse)
async def reject_expense(
    expense_id: int,
    approval: ExpenseApproval,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Reject an expense."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    expense.status = ExpenseStatus.REJECTED
    expense.admin_comment = approval.comment
    expense.reviewed_by = current_user.id
    expense.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(expense)
    
    # Create notification
    create_notification(
        db=db,
        user_id=expense.employee_id,
        type=NotificationType.EXPENSE_REJECTED,
        title="Expense Rejected",
        message=f"Your expense of ${expense.amount} has been rejected. {approval.comment or ''}"
    )
    
    return ExpenseResponse.model_validate(expense)

