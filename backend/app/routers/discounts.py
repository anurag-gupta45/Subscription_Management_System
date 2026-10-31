from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Discount, User
from app.schemas import DiscountCreate, DiscountResponse
from app.auth import require_admin, require_staff_or_admin, get_current_user

router = APIRouter(prefix="/discounts", tags=["Discounts"])

@router.get("/", response_model=List[DiscountResponse])
def get_discounts(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Discount)
    if not include_inactive:
        query = query.filter(Discount.is_active == True)
    return query.order_by(Discount.created_at.desc() if hasattr(Discount, "created_at") else Discount.id.desc()).all()

@router.post("/", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    discount_in: DiscountCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)                                   
):
    existing = db.query(Discount).filter(Discount.code == discount_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="A discount with this code already exists")

    discount = Discount(**discount_in.model_dump())
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount

@router.delete("/{discount_id}")
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    discount.is_active = False
    db.commit()
    return {"message": "Discount deactivated"}
