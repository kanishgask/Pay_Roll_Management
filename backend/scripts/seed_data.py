"""
Seed script to populate database with demo data.
Run this after initial database setup.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.salary_slip import SalarySlip
from app.models.expense import Expense, ExpenseStatus, ExpenseCategory
from app.models.notification import Notification, NotificationType
from datetime import datetime, date, timedelta
import random

# Create tables
Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()


def seed_users():
    """Seed users."""
    print("Seeding users...")
    
    # Admin user
    admin = User(
        email="admin@anshumat.org",
        hashed_password=get_password_hash("Admin@2025!"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        department="Administration",
        position="System Administrator",
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Created admin: {admin.email}")
    
    # Employee user (required)
    employee1 = User(
        email="hire-me@anshumat.org",
        hashed_password=get_password_hash("HireMe@2025!"),
        full_name="John Doe",
        role=UserRole.EMPLOYEE,
        department="Engineering",
        position="Senior Developer",
        is_active=True
    )
    db.add(employee1)
    db.commit()
    db.refresh(employee1)
    print(f"Created employee: {employee1.email}")
    
    # Additional employees
    employees_data = [
        ("jane.smith@anshumat.org", "Jane Smith", "Marketing", "Marketing Manager"),
        ("bob.johnson@anshumat.org", "Bob Johnson", "Sales", "Sales Executive"),
        ("alice.williams@anshumat.org", "Alice Williams", "Engineering", "Frontend Developer"),
        ("charlie.brown@anshumat.org", "Charlie Brown", "HR", "HR Manager"),
    ]
    
    employees = [employee1]
    for email, name, dept, pos in employees_data:
        emp = User(
            email=email,
            hashed_password=get_password_hash("Password@123"),
            full_name=name,
            role=UserRole.EMPLOYEE,
            department=dept,
            position=pos,
            is_active=True
        )
        db.add(emp)
        employees.append(emp)
    
    db.commit()
    
    for emp in employees:
        db.refresh(emp)
        print(f"Created employee: {emp.email}")
    
    return [admin] + employees


def seed_salary_slips(users):
    """Seed salary slips."""
    print("Seeding salary slips...")
    
    employees = [u for u in users if u.role == UserRole.EMPLOYEE]
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Generate salary slips for last 12 months
    for employee in employees:
        base_salary = random.randint(5000, 15000)
        
        for month_offset in range(12):
            month = current_month - month_offset
            year = current_year
            
            if month <= 0:
                month += 12
                year -= 1
            
            allowances = random.randint(500, 2000)
            deductions = random.randint(200, 800)
            tax = random.randint(500, 1500)
            net_salary = base_salary + allowances - deductions - tax
            
            statuses = ["paid", "pending", "paid"]
            status = random.choice(statuses)
            
            payment_date = date(year, month, random.randint(25, 28)) if status == "paid" else None
            
            slip = SalarySlip(
                employee_id=employee.id,
                month=month,
                year=year,
                basic_salary=float(base_salary),
                allowances=float(allowances),
                deductions=float(deductions),
                tax=float(tax),
                net_salary=float(net_salary),
                status=status,
                payment_date=payment_date,
                notes=f"Salary for {month:02d}/{year}"
            )
            db.add(slip)
    
    db.commit()
    print("Created salary slips for all employees")


def seed_expenses(users):
    """Seed expenses."""
    print("Seeding expenses...")
    
    employees = [u for u in users if u.role == UserRole.EMPLOYEE]
    admin = [u for u in users if u.role == UserRole.ADMIN][0]
    
    categories = list(ExpenseCategory)
    statuses = [ExpenseStatus.PENDING, ExpenseStatus.APPROVED, ExpenseStatus.REJECTED]
    
    for employee in employees:
        # Create 5-8 expenses per employee
        num_expenses = random.randint(5, 8)
        
        for _ in range(num_expenses):
            days_ago = random.randint(1, 90)
            expense_date = date.today() - timedelta(days=days_ago)
            
            category = random.choice(categories)
            amount = round(random.uniform(50, 1000), 2)
            
            status = random.choice(statuses)
            reviewed_by = admin.id if status != ExpenseStatus.PENDING else None
            reviewed_at = datetime.utcnow() - timedelta(days=random.randint(1, days_ago)) if reviewed_by else None
            admin_comment = "Approved" if status == ExpenseStatus.APPROVED else ("Rejected - Invalid receipt" if status == ExpenseStatus.REJECTED else None)
            
            descriptions = {
                ExpenseCategory.TRAVEL: "Business travel expenses",
                ExpenseCategory.FOOD: "Team lunch meeting",
                ExpenseCategory.EQUIPMENT: "Office equipment purchase",
                ExpenseCategory.TRAINING: "Professional development course",
                ExpenseCategory.OTHER: "Miscellaneous expense"
            }
            
            expense = Expense(
                employee_id=employee.id,
                category=category,
                amount=amount,
                description=descriptions[category],
                expense_date=expense_date,
                receipt_url=f"/uploads/receipt_{random.randint(1000, 9999)}.jpg",
                status=status,
                admin_comment=admin_comment,
                reviewed_by=reviewed_by,
                reviewed_at=reviewed_at
            )
            db.add(expense)
    
    db.commit()
    print("Created expenses for all employees")


def seed_notifications(users):
    """Seed notifications."""
    print("Seeding notifications...")
    
    employees = [u for u in users if u.role == UserRole.EMPLOYEE]
    
    for employee in employees:
        # Get some salary slips and expenses for this employee
        slips = db.query(SalarySlip).filter(SalarySlip.employee_id == employee.id).limit(3).all()
        expenses = db.query(Expense).filter(Expense.employee_id == employee.id).limit(5).all()
        
        # Create notifications for salary slips
        for slip in slips:
            notification = Notification(
                user_id=employee.id,
                type=NotificationType.SALARY_SLIP,
                title="New Salary Slip Generated",
                message=f"Your salary slip for {slip.month:02d}/{slip.year} has been generated.",
                is_read=random.choice([True, False]),
                link=f"/employee/salary-slips/{slip.id}"
            )
            db.add(notification)
        
        # Create notifications for expenses
        for expense in expenses:
            if expense.status == ExpenseStatus.APPROVED:
                notification = Notification(
                    user_id=employee.id,
                    type=NotificationType.EXPENSE_APPROVED,
                    title="Expense Approved",
                    message=f"Your expense of ${expense.amount:.2f} has been approved.",
                    is_read=random.choice([True, False]),
                    link=f"/employee/expenses/{expense.id}"
                )
                db.add(notification)
            elif expense.status == ExpenseStatus.REJECTED:
                notification = Notification(
                    user_id=employee.id,
                    type=NotificationType.EXPENSE_REJECTED,
                    title="Expense Rejected",
                    message=f"Your expense of ${expense.amount:.2f} has been rejected.",
                    is_read=random.choice([True, False]),
                    link=f"/employee/expenses/{expense.id}"
                )
                db.add(notification)
    
    db.commit()
    print("Created notifications for employees")


def main():
    """Main seeding function."""
    print("Starting database seeding...")
    print("=" * 50)
    
    try:
        users = seed_users()
        seed_salary_slips(users)
        seed_expenses(users)
        seed_notifications(users)
        
        print("=" * 50)
        print("Database seeding completed successfully!")
        print("\nDemo accounts:")
        print("  Admin: admin@anshumat.org / Admin@2025!")
        print("  Employee: hire-me@anshumat.org / HireMe@2025!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

