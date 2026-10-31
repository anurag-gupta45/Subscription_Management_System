import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Payment, Invoice, User
from app.schemas import PaymentCreate, PaymentResponse
from app.auth import get_current_user, require_staff_or_admin

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    invoice_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Payment)

    if current_user.role == "customer":
        query = query.filter(Payment.customer_id == current_user.id)
    else:
        if customer_id:
            query = query.filter(Payment.customer_id == customer_id)

    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)

    payments = query.order_by(Payment.payment_date.desc(), Payment.id.desc()).all()

    for p in payments:
        p.invoice_number = p.invoice.invoice_number if p.invoice else None
        p.customer_name = p.customer.full_name if p.customer else None

    return payments

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    invoice = db.query(Invoice).filter(Invoice.id == payment_in.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot record payments against a cancelled invoice")

    if payment_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

                                                                  
    if round(payment_in.amount, 2) > round(invoice.outstanding_balance, 2):
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (Rs. {payment_in.amount:.2f}) cannot exceed outstanding invoice balance (Rs. {invoice.outstanding_balance:.2f})"
        )

    today = payment_in.payment_date or datetime.date.today()
    seq = int(datetime.datetime.utcnow().timestamp()) % 100000
    ref = f"PAY-{today.year}-{seq:04d}"

    payment = Payment(
        payment_reference=ref,
        invoice_id=invoice.id,
        customer_id=invoice.customer_id,
        amount=round(payment_in.amount, 2),
        payment_method=payment_in.payment_method,
        payment_date=today,
        notes=payment_in.notes,
        recorded_by_id=current_user.id
    )
    db.add(payment)

                                           
    invoice.paid_amount = round(invoice.paid_amount + payment.amount, 2)
    invoice.outstanding_balance = round(max(0.0, invoice.total_amount - invoice.paid_amount), 2)

                                                                             
    if invoice.outstanding_balance <= 0.01:
        invoice.status = "paid"
    else:
        invoice.status = "confirmed"                                    

    db.commit()
    db.refresh(payment)

    payment.invoice_number = invoice.invoice_number
    payment.customer_name = invoice.customer.full_name if invoice.customer else None

    return payment
