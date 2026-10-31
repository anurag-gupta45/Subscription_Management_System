import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Subscription, Invoice, Payment, Plan, User
from app.schemas import DashboardMetrics
from app.auth import require_staff_or_admin

router = APIRouter(prefix="/reports", tags=["Financial Reporting & Dashboards"])

@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_summary(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    today = datetime.date.today()

                                
    active_subs = db.query(Subscription).filter(Subscription.status == "active").count()
    total_subs = db.query(Subscription).count()

                            
    pay_query = db.query(func.coalesce(func.sum(Payment.amount), 0.0))
    if start_date:
        pay_query = pay_query.filter(Payment.payment_date >= start_date)
    if end_date:
        pay_query = pay_query.filter(Payment.payment_date <= end_date)
    revenue_received = round(float(pay_query.scalar()), 2)

                    
    inv_query = db.query(Invoice).filter(Invoice.status != "cancelled")
    if start_date:
        inv_query = inv_query.filter(Invoice.invoice_date >= start_date)
    if end_date:
        inv_query = inv_query.filter(Invoice.invoice_date <= end_date)
    invoices = inv_query.all()

    total_invoices_count = len(invoices)
    outstanding_amount = round(sum(inv.outstanding_balance for inv in invoices if inv.status != "paid"), 2)

                                                   
    overdue_invoices = [
        inv for inv in invoices
        if inv.status in ["draft", "confirmed"] and inv.outstanding_balance > 0.01 and inv.due_date < today
    ]
    overdue_amount = round(sum(inv.outstanding_balance for inv in overdue_invoices), 2)
    overdue_count = len(overdue_invoices)

                    
    p_count_q = db.query(Payment)
    if start_date:
        p_count_q = p_count_q.filter(Payment.payment_date >= start_date)
    if end_date:
        p_count_q = p_count_q.filter(Payment.payment_date <= end_date)
    total_payments_count = p_count_q.count()

    return {
        "active_subscriptions": active_subs,
        "total_subscriptions": total_subs,
        "revenue_received": revenue_received,
        "outstanding_amount": outstanding_amount,
        "overdue_invoices_amount": overdue_amount,
        "overdue_invoices_count": overdue_count,
        "total_payments_count": total_payments_count,
        "total_invoices_count": total_invoices_count
    }

@router.get("/plan-distribution")
def get_plan_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    plans = db.query(Plan).all()
    results = []
    for plan in plans:
        active_count = db.query(Subscription).filter(
            Subscription.plan_id == plan.id,
            Subscription.status == "active"
        ).count()
        results.append({
            "plan_id": plan.id,
            "plan_name": plan.name,
            "billing_cycle": plan.billing_cycle,
            "price": plan.price,
            "active_subscriptions": active_count,
            "total_monthly_value": round(active_count * plan.price, 2)
        })
    return results

@router.get("/monthly-collections")
def get_monthly_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
                                                   
    payments = db.query(Payment).order_by(Payment.payment_date.asc()).all()
    invoices = db.query(Invoice).filter(Invoice.status != "cancelled").all()

    data_map: Dict[str, Dict[str, float]] = {}

    for p in payments:
        ym = p.payment_date.strftime("%Y-%m")
        if ym not in data_map:
            data_map[ym] = {"collected": 0.0, "invoiced": 0.0}
        data_map[ym]["collected"] = round(data_map[ym]["collected"] + p.amount, 2)

    for inv in invoices:
        ym = inv.invoice_date.strftime("%Y-%m")
        if ym not in data_map:
            data_map[ym] = {"collected": 0.0, "invoiced": 0.0}
        data_map[ym]["invoiced"] = round(data_map[ym]["invoiced"] + inv.total_amount, 2)

    sorted_keys = sorted(data_map.keys())
                                
    return [
        {
            "month": k,
            "collected": data_map[k]["collected"],
            "invoiced": data_map[k]["invoiced"]
        }
        for k in sorted_keys[-12:]
    ]

@router.get("/overdue-invoices")
def get_overdue_invoices_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    today = datetime.date.today()
    invoices = db.query(Invoice).filter(
        Invoice.status.in_(["confirmed", "draft"]),
        Invoice.outstanding_balance > 0.01,
        Invoice.due_date < today
    ).order_by(Invoice.due_date.asc()).all()

    output = []
    for inv in invoices:
        days_overdue = (today - inv.due_date).days
        output.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "customer_name": inv.customer.full_name if inv.customer else "Unknown",
            "customer_email": inv.customer.email if inv.customer else "",
            "due_date": inv.due_date.isoformat(),
            "total_amount": inv.total_amount,
            "outstanding_balance": inv.outstanding_balance,
            "days_overdue": days_overdue
        })
    return output
