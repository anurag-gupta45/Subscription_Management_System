import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BillingLog, User
from app.auth import require_admin
from app.billing import run_recurring_billing_job

router = APIRouter(prefix="/billing", tags=["Billing Engine"])

@router.post("/run-job")
def trigger_billing_job(
    as_of_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    result = run_recurring_billing_job(db, as_of_date=as_of_date)
    return result

@router.get("/logs")
def get_billing_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    logs = db.query(BillingLog).order_by(BillingLog.created_at.desc()).limit(limit).all()
    return logs
