from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserResponse, StaffCreate
from app.auth import get_password_hash, require_admin, require_staff_or_admin

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()

@router.get("/customers", response_model=List[UserResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    return db.query(User).filter(User.role == "customer").order_by(User.full_name.asc()).all()

@router.post("/staff", response_model=UserResponse)
def create_staff_user(
    staff_in: StaffCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)                                               
):
    existing = db.query(User).filter(User.email == staff_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    new_staff = User(
        email=staff_in.email,
        hashed_password=get_password_hash(staff_in.password),
        full_name=staff_in.full_name,
        role="staff",
        is_active=True
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@router.patch("/{user_id}/toggle-status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account")

    target.is_active = not target.is_active
    db.commit()
    db.refresh(target)
    return target
