from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    department: str | None = None
    position: str | None = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.EMPLOYEE


class UserUpdate(BaseModel):
    full_name: str | None = None
    department: str | None = None
    position: str | None = None
    avatar_url: str | None = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class User(UserResponse):
    pass

