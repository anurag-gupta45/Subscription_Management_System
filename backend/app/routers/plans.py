from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Plan, User
from app.schemas import PlanCreate, PlanUpdate, PlanResponse
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/plans", tags=["Subscription Plans"])

@router.get("/", response_model=List[PlanResponse])
def get_plans(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    query = db.query(Plan)
    if not include_inactive:
        query = query.filter(Plan.is_active == True)
    return query.order_by(Plan.price.asc()).all()

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    return plan

@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    plan_in: PlanCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    plan = Plan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    plan_update: PlanUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")

    for field, value in plan_update.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{plan_id}")
def toggle_plan_active(
    plan_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")

    plan.is_active = not plan.is_active
    db.commit()
    return {"message": f"Plan is now {'active' if plan.is_active else 'archived'}"}
