import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Subscription, SubscriptionItem, Plan, Product, ProductVariant, User
from app.schemas import (
    SubscriptionCreate, SubscriptionResponse, SubscriptionStatusUpdate
)
from app.auth import get_current_user, require_staff_or_admin
from app.billing import advance_date_by_cycle

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

                                 
ALLOWED_TRANSITIONS = {
    "draft": ["quotation", "confirmed"],
    "quotation": ["confirmed", "closed"],
    "confirmed": ["active", "closed"],
    "active": ["paused", "closed"],
    "paused": ["active", "closed"],
    "closed": ["confirmed"]              
}

@router.get("/", response_model=List[SubscriptionResponse])
def get_subscriptions(
    status_filter: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Subscription)

                                                     
    if current_user.role == "customer":
        query = query.filter(Subscription.customer_id == current_user.id)
    elif customer_id:
        query = query.filter(Subscription.customer_id == customer_id)

    if status_filter:
        query = query.filter(Subscription.status == status_filter)

    return query.order_by(Subscription.created_at.desc()).all()

@router.get("/{sub_id}", response_model=SubscriptionResponse)
def get_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.role == "customer" and sub.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return sub

@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    sub_in: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    plan = db.query(Plan).filter(Plan.id == sub_in.plan_id).first()
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    today = datetime.date.today()
    seq = int(datetime.datetime.utcnow().timestamp()) % 100000
    sub_num = f"SUB-{today.year}-{seq:04d}"

    subscription = Subscription(
        subscription_number=sub_num,
        customer_id=sub_in.customer_id,
        plan_id=sub_in.plan_id,
        quotation_id=sub_in.quotation_id,
        status="confirmed",                        
        start_date=sub_in.start_date,
        expiry_date=sub_in.expiry_date,
        next_billing_date=sub_in.start_date,
        billing_cycle=sub_in.billing_cycle or plan.billing_cycle,
        payment_terms=sub_in.payment_terms,
        auto_close=sub_in.auto_close if sub_in.auto_close is not None else plan.auto_close,
        allow_pause=sub_in.allow_pause if sub_in.allow_pause is not None else plan.allow_pause,
        allow_renewal=sub_in.allow_renewal if sub_in.allow_renewal is not None else plan.allow_renewal,
        allow_early_closure=sub_in.allow_early_closure if sub_in.allow_early_closure is not None else plan.allow_early_closure,
        notes=sub_in.notes
    )
    db.add(subscription)
    db.flush()

    for it in sub_in.items:
        line_tot = round(it.quantity * it.unit_price * (1 + it.tax_rate / 100.0), 2)
        sub_item = SubscriptionItem(
            subscription_id=subscription.id,
            product_id=it.product_id,
            variant_id=it.variant_id,
            quantity=it.quantity,
            unit_price=it.unit_price,
            tax_id=it.tax_id,
            tax_rate=it.tax_rate,
            line_total=line_tot
        )
        db.add(sub_item)

    db.commit()
    db.refresh(subscription)
    return subscription

@router.patch("/{sub_id}/status", response_model=SubscriptionResponse)
def update_subscription_status(
    sub_id: int,
    status_update: SubscriptionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    new_status = status_update.status.lower()
    current_status = sub.status.lower()

                                   
    if current_user.role == "customer":
        if sub.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
                                                               
        if new_status == "paused" and not sub.allow_pause:
            raise HTTPException(status_code=400, detail="Pausing is not permitted for this subscription plan")
        if new_status == "closed" and not sub.allow_early_closure:
            raise HTTPException(status_code=400, detail="Early closure is not permitted for this subscription plan")
        if new_status not in ["paused", "active", "closed"]:
            raise HTTPException(status_code=400, detail="Unauthorized status modification for customer")

                                    
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Illegal status transition from '{current_status}' to '{new_status}'. Allowed: {allowed}"
        )

                            
    if new_status == "paused" and not sub.allow_pause:
        raise HTTPException(status_code=400, detail="This plan does not permit pausing")

                                    
    if new_status == "closed" and sub.expiry_date and datetime.date.today() < sub.expiry_date and not sub.allow_early_closure:
        raise HTTPException(status_code=400, detail="This plan does not permit early closure before expiry")

    sub.status = new_status
    if status_update.notes:
        sub.notes = f"{sub.notes or ''}\nStatus changed to {new_status}: {status_update.notes}"

    db.commit()
    db.refresh(sub)
    return sub

@router.post("/{sub_id}/renew", response_model=SubscriptionResponse)
def renew_subscription(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.role == "customer" and sub.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not sub.allow_renewal:
        raise HTTPException(status_code=400, detail="Renewal is not permitted for this subscription")

    today = datetime.date.today()
    base_expiry = sub.expiry_date if sub.expiry_date and sub.expiry_date > today else today
    sub.expiry_date = advance_date_by_cycle(base_expiry, sub.billing_cycle)
    sub.status = "active"

    db.commit()
    db.refresh(sub)
    return sub
