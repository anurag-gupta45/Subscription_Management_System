import datetime
from calendar import monthrange
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import (
    Subscription, SubscriptionItem, Invoice, InvoiceItem,
    Discount, Tax, BillingLog, Product
)

def advance_date_by_cycle(start_date: datetime.date, cycle: str) -> datetime.date:
    cycle = cycle.lower()
    if cycle == "daily":
        return start_date + datetime.timedelta(days=1)
    elif cycle == "weekly":
        return start_date + datetime.timedelta(weeks=1)
    elif cycle == "monthly":
                                                   
        year = start_date.year
        month = start_date.month + 1
        if month > 12:
            month = 1
            year += 1
        max_day = monthrange(year, month)[1]
        day = min(start_date.day, max_day)
        return datetime.date(year, month, day)
    elif cycle == "yearly":
        year = start_date.year + 1
        month = start_date.month
        max_day = monthrange(year, month)[1]
        day = min(start_date.day, max_day)
        return datetime.date(year, month, day)
    else:
                         
        return start_date + datetime.timedelta(days=30)

def compute_period_end(start_date: datetime.date, cycle: str) -> datetime.date:
    next_date = advance_date_by_cycle(start_date, cycle)
    return next_date - datetime.timedelta(days=1)

def find_applicable_discount(
    db: Session,
    subtotal: float,
    total_qty: int,
    product_id: Optional[int] = None,
    discount_code: Optional[str] = None
) -> Optional[Discount]:
    today = datetime.date.today()
    query = db.query(Discount).filter(Discount.is_active == True)

    if discount_code:
        query = query.filter(Discount.code == discount_code)

    discounts = query.all()

    for d in discounts:
                             
        if d.start_date and today < d.start_date:
            continue
        if d.end_date and today > d.end_date:
            continue
                           
        if d.usage_limit is not None and d.times_used >= d.usage_limit:
            continue
                        
        if subtotal < d.minimum_purchase:
            continue
        if total_qty < d.minimum_quantity:
            continue
                             
        if d.scope == "specific_product" and product_id is not None:
            if d.applicable_product_id != product_id:
                continue
        return d
    return None

def generate_invoice_for_subscription(
    db: Session,
    subscription: Subscription,
    as_of_date: Optional[datetime.date] = None
) -> Optional[Invoice]:
    """
    Safely generates a single invoice for a due subscription.
    Ensures idempotency via database uniqueness constraint and checks.
    """
    today = as_of_date or datetime.date.today()

                                     
    if subscription.status != "active":
        return None

                                      
    if subscription.expiry_date and today > subscription.expiry_date:
        if subscription.auto_close:
            subscription.status = "closed"
            db.commit()
            return None

    period_start = subscription.next_billing_date
    period_end = compute_period_end(period_start, subscription.billing_cycle)
    due_date = period_start + datetime.timedelta(days=15)                          

                                                                          
    existing_invoice = db.query(Invoice).filter(
        Invoice.subscription_id == subscription.id,
        Invoice.billing_period_start == period_start,
        Invoice.billing_period_end == period_end
    ).first()

    if existing_invoice:
                                                            
        if subscription.next_billing_date <= today:
            subscription.next_billing_date = advance_date_by_cycle(period_start, subscription.billing_cycle)
            db.commit()
        return existing_invoice

                          
    subtotal = 0.0
    tax_total = 0.0
    discount_total = 0.0
    total_qty = sum(item.quantity for item in subscription.items)

    invoice_lines_data = []

                                           
    sub_discount = find_applicable_discount(
        db,
        subtotal=sum(item.quantity * item.unit_price for item in subscription.items),
        total_qty=total_qty,
        product_id=None
    )

    for sub_item in subscription.items:
        line_sub = round(sub_item.quantity * sub_item.unit_price, 2)
        subtotal += line_sub

                                                 
        line_discount = 0.0
        prod_discount = find_applicable_discount(
            db,
            subtotal=line_sub,
            total_qty=sub_item.quantity,
            product_id=sub_item.product_id
        )
        if prod_discount:
            if prod_discount.discount_type == "percentage":
                line_discount = round(line_sub * (prod_discount.discount_value / 100.0), 2)
            else:
                line_discount = round(min(line_sub, prod_discount.discount_value), 2)
            prod_discount.times_used += 1

        tax_rate = sub_item.tax_rate or 0.0
        taxable_amount = max(0.0, line_sub - line_discount)
        tax_amount = round(taxable_amount * (tax_rate / 100.0), 2)
        line_total = round(taxable_amount + tax_amount, 2)

        discount_total += line_discount
        tax_total += tax_amount

        prod_name = sub_item.product.name if sub_item.product else f"Product #{sub_item.product_id}"
        var_name = sub_item.variant.variant_name if sub_item.variant else None

        invoice_lines_data.append({
            "product_id": sub_item.product_id,
            "product_name": prod_name,
            "variant_id": sub_item.variant_id,
            "variant_name": var_name,
            "quantity": sub_item.quantity,
            "unit_price": sub_item.unit_price,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "discount_amount": line_discount,
            "line_total": line_total
        })

                                                                                                
    if sub_discount and discount_total == 0.0:
        if sub_discount.discount_type == "percentage":
            whole_disc = round(subtotal * (sub_discount.discount_value / 100.0), 2)
        else:
            whole_disc = round(min(subtotal, sub_discount.discount_value), 2)
        discount_total = whole_disc
        sub_discount.times_used += 1

    final_total = round(max(0.0, subtotal - discount_total + tax_total), 2)

                                               
    timestamp_seq = int(datetime.datetime.utcnow().timestamp()) % 1000000
    invoice_number = f"INV-{today.year}-{subscription.id:03d}-{timestamp_seq:04d}"

    invoice = Invoice(
        invoice_number=invoice_number,
        subscription_id=subscription.id,
        customer_id=subscription.customer_id,
        invoice_date=today,
        due_date=due_date,
        billing_period_start=period_start,
        billing_period_end=period_end,
        subtotal=subtotal,
        tax_total=tax_total,
        discount_total=discount_total,
        total_amount=final_total,
        paid_amount=0.0,
        outstanding_balance=final_total,
        status="confirmed",
        notes=f"Recurring billing for {subscription.subscription_number} ({subscription.billing_cycle})"
    )

    try:
        db.add(invoice)
        db.flush()

        for line in invoice_lines_data:
            item_obj = InvoiceItem(
                invoice_id=invoice.id,
                **line
            )
            db.add(item_obj)

                                                
        subscription.next_billing_date = advance_date_by_cycle(period_start, subscription.billing_cycle)
        db.commit()
        db.refresh(invoice)
        return invoice

    except IntegrityError:
        db.rollback()
                                                                        
        return db.query(Invoice).filter(
            Invoice.subscription_id == subscription.id,
            Invoice.billing_period_start == period_start,
            Invoice.billing_period_end == period_end
        ).first()
    except Exception as e:
        db.rollback()
        raise e

def run_recurring_billing_job(db: Session, as_of_date: Optional[datetime.date] = None) -> Dict[str, Any]:
    """
    Evaluates all active subscriptions due for billing up to as_of_date.
    Safely generates invoices, preventing skipped or duplicate billing.
    """
    today = as_of_date or datetime.date.today()
    due_subscriptions = db.query(Subscription).filter(
        Subscription.status == "active",
        Subscription.next_billing_date <= today
    ).all()

    invoices_created = 0
    errors = []

    for sub in due_subscriptions:
        try:
            inv = generate_invoice_for_subscription(db, sub, as_of_date=today)
            if inv:
                invoices_created += 1
        except Exception as e:
            errors.append(f"Subscription {sub.subscription_number} error: {str(e)}")

                     
    log_entry = BillingLog(
        run_date=today,
        subscriptions_evaluated=len(due_subscriptions),
        invoices_created=invoices_created,
        errors_count=len(errors),
        details="\n".join(errors) if errors else "Billing completed successfully with no errors."
    )
    db.add(log_entry)
    db.commit()

    return {
        "run_date": today.isoformat(),
        "evaluated_count": len(due_subscriptions),
        "invoices_created": invoices_created,
        "errors_count": len(errors),
        "errors": errors
    }
