import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    QuotationTemplate, QuotationTemplateItem, Quotation, QuotationItem,
    Subscription, SubscriptionItem, Plan, Product, ProductVariant, User
)
from app.schemas import (
    QuotationTemplateCreate, QuotationTemplateResponse,
    QuotationCreate, QuotationResponse
)
from app.auth import require_staff_or_admin, get_current_user
from app.billing import advance_date_by_cycle

router = APIRouter(prefix="/quotations", tags=["Quotations & Templates"])

                                                               
@router.get("/templates", response_model=List[QuotationTemplateResponse])
def get_templates(db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    templates = db.query(QuotationTemplate).all()
                               
    for t in templates:
        for it in t.items:
            it.product_name = it.product.name if it.product else ""
            it.variant_name = it.variant.variant_name if it.variant else None
    return templates

@router.post("/templates", response_model=QuotationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    t_in: QuotationTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    template = QuotationTemplate(
        name=t_in.name,
        default_plan_id=t_in.default_plan_id,
        validity_days=t_in.validity_days,
        description=t_in.description
    )
    db.add(template)
    db.flush()

    for item in t_in.items:
        t_item = QuotationTemplateItem(
            template_id=template.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price
        )
        db.add(t_item)

    db.commit()
    db.refresh(template)
    for it in template.items:
        it.product_name = it.product.name if it.product else ""
        it.variant_name = it.variant.variant_name if it.variant else None
    return template

@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_staff_or_admin)):
    template = db.query(QuotationTemplate).filter(QuotationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template removed successfully"}

                                                      
@router.get("/", response_model=List[QuotationResponse])
def get_quotations(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Quotation)
                                             
    if current_user.role == "customer":
        query = query.filter(Quotation.customer_id == current_user.id)
    if status_filter:
        query = query.filter(Quotation.status == status_filter)
    return query.order_by(Quotation.created_at.desc()).all()

@router.get("/{quotation_id}", response_model=QuotationResponse)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if current_user.role == "customer" and quotation.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return quotation

@router.post("/", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(
    quo_in: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    plan = db.query(Plan).filter(Plan.id == quo_in.plan_id).first()
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan selected")

    today = datetime.date.today()
    valid_until = quo_in.valid_until or (today + datetime.timedelta(days=30))
    ts = int(datetime.datetime.utcnow().timestamp()) % 100000
    quotation_number = f"QUO-{today.year}-{ts:04d}"

    subtotal = 0.0
    tax_total = 0.0
    items_to_add = []

    for item in quo_in.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            continue
        unit_price = item.unit_price
        line_sub = round(item.quantity * unit_price, 2)
        line_tax = round(line_sub * (item.tax_rate / 100.0), 2)
        line_tot = round(line_sub + line_tax, 2)

        subtotal += line_sub
        tax_total += line_tax

        items_to_add.append({
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "tax_rate": item.tax_rate,
            "line_total": line_tot
        })

    total_amount = round(subtotal + tax_total, 2)

    quotation = Quotation(
        quotation_number=quotation_number,
        customer_id=quo_in.customer_id,
        plan_id=quo_in.plan_id,
        status="draft",
        valid_until=valid_until,
        subtotal=subtotal,
        tax_total=tax_total,
        discount_total=0.0,
        total_amount=total_amount,
        payment_terms=quo_in.payment_terms,
        notes=quo_in.notes
    )
    db.add(quotation)
    db.flush()

    for item_data in items_to_add:
        qi = QuotationItem(quotation_id=quotation.id, **item_data)
        db.add(qi)

    db.commit()
    db.refresh(quotation)
    return quotation

@router.patch("/{quotation_id}/status", response_model=QuotationResponse)
def update_quotation_status(
    quotation_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    allowed_statuses = ["draft", "sent", "accepted", "rejected", "converted"]
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed_statuses}")

                                                        
    if current_user.role == "customer":
        if quotation.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if status not in ["accepted", "rejected"]:
            raise HTTPException(status_code=400, detail="Customers can only accept or reject quotations")

    quotation.status = status
    db.commit()
    db.refresh(quotation)
    return quotation

@router.post("/{quotation_id}/convert")
def convert_quotation_to_subscription(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if quotation.status not in ["accepted", "sent", "draft"]:
        raise HTTPException(status_code=400, detail=f"Quotation cannot be converted in its current state ({quotation.status})")

    today = datetime.date.today()
    plan = quotation.plan
    seq = int(datetime.datetime.utcnow().timestamp()) % 100000
    sub_num = f"SUB-{today.year}-{seq:04d}"

                                                   
    expiry = advance_date_by_cycle(today, "yearly") if plan.billing_cycle == "yearly" else None

    subscription = Subscription(
        subscription_number=sub_num,
        customer_id=quotation.customer_id,
        plan_id=quotation.plan_id,
        quotation_id=quotation.id,
        status="confirmed",                                                                  
        start_date=today,
        expiry_date=expiry,
        next_billing_date=today,
        billing_cycle=plan.billing_cycle,
        payment_terms=quotation.payment_terms,
        auto_close=plan.auto_close,
        allow_pause=plan.allow_pause,
        allow_renewal=plan.allow_renewal,
        allow_early_closure=plan.allow_early_closure,
        notes=f"Converted from quotation {quotation.quotation_number}"
    )
    db.add(subscription)
    db.flush()

    for item in quotation.items:
        sub_item = SubscriptionItem(
            subscription_id=subscription.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_rate=item.tax_rate,
            line_total=item.line_total
        )
        db.add(sub_item)

    quotation.status = "converted"
    db.commit()
    db.refresh(subscription)

    return {
        "message": "Quotation successfully converted to confirmed subscription",
        "subscription_id": subscription.id,
        "subscription_number": subscription.subscription_number
    }
