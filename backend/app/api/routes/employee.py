from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.salary_slip import SalarySlip
from app.models.expense import Expense, ExpenseStatus, ExpenseCategory
from app.models.notification import Notification
from app.schemas.user import UserUpdate, UserResponse
from app.schemas.salary_slip import SalarySlipResponse
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.schemas.dashboard import EmployeeStats
from app.schemas.notification import NotificationResponse
from app.services.pdf_service import generate_salary_slip_pdf
from app.core.security import get_password_hash, verify_password

router = APIRouter()


@router.get("/dashboard/stats", response_model=EmployeeStats)
async def get_employee_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get employee dashboard statistics."""
    total_slips = db.query(SalarySlip).filter(SalarySlip.employee_id == current_user.id).count()
    
    expenses = db.query(Expense).filter(Expense.employee_id == current_user.id).all()
    total_expenses = len(expenses)
    pending_expenses = len([e for e in expenses if e.status == ExpenseStatus.PENDING])
    approved_expenses = len([e for e in expenses if e.status == ExpenseStatus.APPROVED])
    total_amount = sum(e.amount for e in expenses)
    approved_amount = sum(e.amount for e in expenses if e.status == ExpenseStatus.APPROVED)
    
    return EmployeeStats(
        total_salary_slips=total_slips,
        total_expenses=total_expenses,
        pending_expenses=pending_expenses,
        approved_expenses=approved_expenses,
        total_expense_amount=total_amount,
        total_approved_amount=approved_amount
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    update_data = profile_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/profile/avatar")
async def upload_avatar(
    avatar_url: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update avatar URL (in production, handle file upload)."""
    current_user.avatar_url = avatar_url
    db.commit()
    return {"message": "Avatar updated successfully", "avatar_url": avatar_url}


@router.get("/salary-slips", response_model=List[SalarySlipResponse])
async def get_my_salary_slips(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's salary slips."""
    slips = db.query(SalarySlip).filter(
        SalarySlip.employee_id == current_user.id
    ).order_by(
        SalarySlip.year.desc(),
        SalarySlip.month.desc()
    ).offset(skip).limit(limit).all()
    
    return [SalarySlipResponse.model_validate(slip) for slip in slips]


@router.get("/salary-slips/{slip_id}/pdf")
async def download_salary_slip_pdf(
    slip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download salary slip as PDF."""
    slip = db.query(SalarySlip).filter(
        SalarySlip.id == slip_id,
        SalarySlip.employee_id == current_user.id
    ).first()
    
    if not slip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary slip not found"
        )
    
    pdf_bytes = generate_salary_slip_pdf(slip, current_user)
    
    from fastapi.responses import Response
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=salary_slip_{slip.month}_{slip.year}.pdf"
        }
    )


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a new expense."""
    new_expense = Expense(
        **expense.model_dump(),
        employee_id=current_user.id,
        status=ExpenseStatus.PENDING
    )
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return ExpenseResponse.model_validate(new_expense)


@router.get("/expenses", response_model=List[ExpenseResponse])
async def get_my_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[ExpenseStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's expenses."""
    query = db.query(Expense).filter(Expense.employee_id == current_user.id)
    
    if status_filter:
        query = query.filter(Expense.status == status_filter)
    
    expenses = query.order_by(Expense.created_at.desc()).offset(skip).limit(limit).all()
    return [ExpenseResponse.model_validate(exp) for exp in expenses]


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an expense (only if pending)."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.employee_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    if expense.status != ExpenseStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update pending expenses"
        )
    
    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)
    
    db.commit()
    db.refresh(expense)
    
    return ExpenseResponse.model_validate(expense)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an expense (only if pending)."""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.employee_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    if expense.status != ExpenseStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete pending expenses"
        )
    
    db.delete(expense)
    db.commit()
    return None


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user notifications."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return [NotificationResponse.model_validate(notif) for notif in notifications]


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return NotificationResponse.model_validate(notification)


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

