import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Invoice, InvoiceItem, Subscription, User
from app.schemas import InvoiceResponse
from app.auth import get_current_user, require_staff_or_admin
from app.billing import run_recurring_billing_job

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    status_filter: Optional[str] = None,
    customer_id: Optional[int] = None,
    subscription_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice)

                                                                     
    if current_user.role == "customer":
        query = query.filter(Invoice.customer_id == current_user.id)
    else:
        if customer_id:
            query = query.filter(Invoice.customer_id == customer_id)

    if subscription_id:
        query = query.filter(Invoice.subscription_id == subscription_id)

    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    invoices = query.order_by(Invoice.invoice_date.desc(), Invoice.id.desc()).all()

                                  
    for inv in invoices:
        inv.subscription_number = inv.subscription.subscription_number if inv.subscription else None

    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if current_user.role == "customer" and inv.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this invoice")

    inv.subscription_number = inv.subscription.subscription_number if inv.subscription else None
    return inv

@router.patch("/{invoice_id}/status")
def update_invoice_status(
    invoice_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    allowed = ["draft", "confirmed", "paid", "cancelled"]
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid invoice status. Must be one of {allowed}")

    if new_status == "paid" and inv.outstanding_balance > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot mark invoice as Paid while an outstanding balance of Rs. {inv.outstanding_balance:.2f} remains. Record a payment first."
        )

    inv.status = new_status
    db.commit()
    db.refresh(inv)
    return {"message": f"Invoice {inv.invoice_number} status updated to {new_status}"}

@router.post("/generate-due")
def trigger_due_billing(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    result = run_recurring_billing_job(db)
    return result
