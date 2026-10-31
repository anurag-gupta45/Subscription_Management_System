from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Tax, User
from app.schemas import TaxCreate, TaxResponse
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/taxes", tags=["Taxes"])

@router.get("/", response_model=List[TaxResponse])
def get_taxes(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Tax)
    if not include_inactive:
        query = query.filter(Tax.is_active == True)
    return query.order_by(Tax.rate.asc()).all()

@router.post("/", response_model=TaxResponse, status_code=status.HTTP_201_CREATED)
def create_tax(
    tax_in: TaxCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    tax = Tax(**tax_in.model_dump())
    db.add(tax)
    db.commit()
    db.refresh(tax)
    return tax

@router.delete("/{tax_id}")
def delete_tax(
    tax_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(status_code=404, detail="Tax rule not found")
    tax.is_active = False
    db.commit()
    return {"message": "Tax rule deactivated"}
