import datetime
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Product, ProductVariant, Plan, Tax, Discount,
    QuotationTemplate, QuotationTemplateItem, Quotation, QuotationItem,
    Subscription, SubscriptionItem, Invoice, InvoiceItem, Payment
)
from app.auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
                                 
        if db.query(User).filter(User.email == "admin@brightloop.com").first():
            print("Database already seeded.")
            return

        print("Seeding Brightloop database with comprehensive demo data...")

                  
        admin = User(
            email="admin@brightloop.com",
            hashed_password=get_password_hash("Admin@123456"),
            full_name="Alex Administrator",
            company_name="Brightloop Software Ltd.",
            role="admin",
            is_active=True
        )
        staff = User(
            email="staff@brightloop.com",
            hashed_password=get_password_hash("Staff@123456"),
            full_name="Samantha Staff",
            company_name="Brightloop Software Ltd.",
            role="staff",
            is_active=True
        )
        customer1 = User(
            email="john.doe@acme.com",
            hashed_password=get_password_hash("Customer@123456"),
            full_name="John Doe",
            company_name="Acme Corporation",
            role="customer",
            is_active=True
        )
        customer2 = User(
            email="sarah.connor@cyberdyne.com",
            hashed_password=get_password_hash("Customer@123456"),
            full_name="Sarah Connor",
            company_name="Cyberdyne Systems",
            role="customer",
            is_active=True
        )
        customer3 = User(
            email="bruce.wayne@wayne.com",
            hashed_password=get_password_hash("Customer@123456"),
            full_name="Bruce Wayne",
            company_name="Wayne Enterprises",
            role="customer",
            is_active=True
        )

        db.add_all([admin, staff, customer1, customer2, customer3])
        db.flush()

                  
        tax18 = Tax(name="GST 18%", rate=18.0, description="Standard Goods & Services Tax")
        tax12 = Tax(name="GST 12%", rate=12.0, description="Concessional Services Tax")
        tax5 = Tax(name="GST 5%", rate=5.0, description="Low bracket software tier")
        tax0 = Tax(name="Exempt / 0%", rate=0.0, description="Zero-rated export tax")
        db.add_all([tax18, tax12, tax5, tax0])
        db.flush()

                                                                                        
        p_erp = Product(
            name="Brightloop ERP Core",
            product_type="Software License",
            sales_price=1000.0,
            cost_price=200.0,
            notes="Base ERP license covering invoicing, inventory and general ledger"
        )
        p_crm = Product(
            name="Brightloop CRM Pro",
            product_type="Software License",
            sales_price=500.0,
            cost_price=80.0,
            notes="Customer relationship & sales pipeline automation"
        )
        p_cloud = Product(
            name="Dedicated High-Speed Cloud Host",
            product_type="Cloud Infrastructure",
            sales_price=1200.0,
            cost_price=350.0,
            notes="Private managed cloud server with automated backups"
        )
        p_support = Product(
            name="Priority 24/7 SLA Support Pack",
            product_type="Support Service",
            sales_price=400.0,
            cost_price=60.0,
            notes="Guaranteed 1-hour response time with designated account manager"
        )
        db.add_all([p_erp, p_crm, p_cloud, p_support])
        db.flush()

                                                                                  
        v_odoo = ProductVariant(product_id=p_erp.id, variant_name="Odoo Brand Edition", additional_price=560.0)
        v_multi = ProductVariant(product_id=p_erp.id, variant_name="Enterprise Multi-Company", additional_price=850.0)
        v_omni = ProductVariant(product_id=p_crm.id, variant_name="Omnichannel WhatsApp & SMS", additional_price=250.0)
        db.add_all([v_odoo, v_multi, v_omni])
        db.flush()

                                             
        plan_pro = Plan(
            name="Professional Plan",
            price=2000.0,
            billing_cycle="monthly",
            minimum_quantity=1,
            auto_close=False,
            allow_pause=True,
            allow_renewal=True,
            allow_early_closure=True,
            description="Our most popular plan for scaling organizations. Monthly billing with full features."
        )
        plan_starter = Plan(
            name="Starter Plan",
            price=800.0,
            billing_cycle="monthly",
            minimum_quantity=1,
            auto_close=False,
            allow_pause=True,
            allow_renewal=True,
            allow_early_closure=True,
            description="Essential toolset for startups and agile teams."
        )
        plan_ent = Plan(
            name="Enterprise Annual",
            price=22000.0,
            billing_cycle="yearly",
            minimum_quantity=5,
            auto_close=False,
            allow_pause=True,
            allow_renewal=True,
            allow_early_closure=False,
            description="Comprehensive enterprise tier with dedicated hosting and SLA support."
        )
        plan_daily = Plan(
            name="Daily Sandbox Tier",
            price=150.0,
            billing_cycle="daily",
            minimum_quantity=1,
            auto_close=True,
            allow_pause=False,
            allow_renewal=True,
            allow_early_closure=True,
            description="High-frequency testing tier for temporary compute and staging."
        )
        db.add_all([plan_pro, plan_starter, plan_ent, plan_daily])
        db.flush()

                                    
        disc_welcome = Discount(
            code="WELCOME10",
            name="New Customer 10% Off",
            discount_type="percentage",
            discount_value=10.0,
            scope="whole_subscription",
            minimum_purchase=1000.0,
            minimum_quantity=1,
            usage_limit=100,
            times_used=2,
            is_active=True
        )
        disc_flat = Discount(
            code="SAVE500",
            name="Flat Rs. 500 Discount",
            discount_type="fixed",
            discount_value=500.0,
            scope="whole_subscription",
            minimum_purchase=2500.0,
            minimum_quantity=1,
            usage_limit=50,
            times_used=1,
            is_active=True
        )
        db.add_all([disc_welcome, disc_flat])
        db.flush()

                                              
        tmpl_standard = QuotationTemplate(
            name="Standard SaaS Onboarding Pack",
            default_plan_id=plan_pro.id,
            validity_days=30,
            description="Standard bundle including ERP core with Odoo variant, CRM, and cloud hosting"
        )
        db.add(tmpl_standard)
        db.flush()

        tmpl_item1 = QuotationTemplateItem(
            template_id=tmpl_standard.id,
            product_id=p_erp.id,
            variant_id=v_odoo.id,
            quantity=10,
            unit_price=1560.0                           
        )
        tmpl_item2 = QuotationTemplateItem(
            template_id=tmpl_standard.id,
            product_id=p_cloud.id,
            quantity=1,
            unit_price=1200.0
        )
        db.add_all([tmpl_item1, tmpl_item2])
        db.flush()

                                                                            
        today = datetime.date.today()
        quo1 = Quotation(
            quotation_number="QUO-2026-0001",
            customer_id=customer1.id,
            plan_id=plan_pro.id,
            status="converted",
            valid_until=today + datetime.timedelta(days=30),
            subtotal=16800.0,
            tax_total=3024.0,
            discount_total=0.0,
            total_amount=19824.0,
            payment_terms="Net 30",
            notes="ABC Company / Acme Corp 10 seats quote"
        )
        db.add(quo1)
        db.flush()

        quo_it1 = QuotationItem(
            quotation_id=quo1.id,
            product_id=p_erp.id,
            variant_id=v_odoo.id,
            quantity=10,
            unit_price=1560.0,
            tax_rate=18.0,
            line_total=18408.0
        )
        quo_it2 = QuotationItem(
            quotation_id=quo1.id,
            product_id=p_cloud.id,
            quantity=1,
            unit_price=1200.0,
            tax_rate=18.0,
            line_total=1416.0
        )
        db.add_all([quo_it1, quo_it2])
        db.flush()

                                              
        sub1 = Subscription(
            subscription_number="SUB-2026-0001",
            customer_id=customer1.id,
            plan_id=plan_pro.id,
            quotation_id=quo1.id,
            status="active",
            start_date=today - datetime.timedelta(days=45),
            expiry_date=today + datetime.timedelta(days=320),
            next_billing_date=today + datetime.timedelta(days=15),
            billing_cycle="monthly",
            payment_terms="Due upon receipt",
            auto_close=False,
            allow_pause=True,
            allow_renewal=True,
            allow_early_closure=True,
            notes="Active enterprise subscription with 10 seats"
        )
        db.add(sub1)
        db.flush()

        sub1_it1 = SubscriptionItem(
            subscription_id=sub1.id,
            product_id=p_erp.id,
            variant_id=v_odoo.id,
            quantity=10,
            unit_price=1560.0,
            tax_id=tax18.id,
            tax_rate=18.0,
            line_total=18408.0
        )
        sub1_it2 = SubscriptionItem(
            subscription_id=sub1.id,
            product_id=p_cloud.id,
            quantity=1,
            unit_price=1200.0,
            tax_id=tax18.id,
            tax_rate=18.0,
            line_total=1416.0
        )
        db.add_all([sub1_it1, sub1_it2])
        db.flush()

                                     
                                           
        inv1 = Invoice(
            invoice_number="INV-2026-001-001",
            subscription_id=sub1.id,
            customer_id=customer1.id,
            invoice_date=today - datetime.timedelta(days=45),
            due_date=today - datetime.timedelta(days=30),
            billing_period_start=today - datetime.timedelta(days=45),
            billing_period_end=today - datetime.timedelta(days=16),
            subtotal=16800.0,
            tax_total=3024.0,
            discount_total=0.0,
            total_amount=19824.0,
            paid_amount=19824.0,
            outstanding_balance=0.0,
            status="paid",
            notes="Monthly billing cycle 1"
        )
        db.add(inv1)
        db.flush()

        inv1_it1 = InvoiceItem(
            invoice_id=inv1.id,
            product_id=p_erp.id,
            product_name="Brightloop ERP Core",
            variant_id=v_odoo.id,
            variant_name="Odoo Brand Edition",
            quantity=10,
            unit_price=1560.0,
            tax_rate=18.0,
            tax_amount=2808.0,
            discount_amount=0.0,
            line_total=18408.0
        )
        inv1_it2 = InvoiceItem(
            invoice_id=inv1.id,
            product_id=p_cloud.id,
            product_name="Dedicated High-Speed Cloud Host",
            quantity=1,
            unit_price=1200.0,
            tax_rate=18.0,
            tax_amount=216.0,
            discount_amount=0.0,
            line_total=1416.0
        )
        db.add_all([inv1_it1, inv1_it2])
        db.flush()

                               
        pay1 = Payment(
            payment_reference="PAY-2026-0001",
            invoice_id=inv1.id,
            customer_id=customer1.id,
            amount=19824.0,
            payment_method="Bank Transfer",
            payment_date=today - datetime.timedelta(days=35),
            notes="Full settlement via HDFC wire transfer",
            recorded_by_id=staff.id
        )
        db.add(pay1)

                                                                                                 
        inv2 = Invoice(
            invoice_number="INV-2026-001-002",
            subscription_id=sub1.id,
            customer_id=customer1.id,
            invoice_date=today - datetime.timedelta(days=15),
            due_date=today + datetime.timedelta(days=5),
            billing_period_start=today - datetime.timedelta(days=15),
            billing_period_end=today + datetime.timedelta(days=14),
            subtotal=16800.0,
            tax_total=3024.0,
            discount_total=0.0,
            total_amount=19824.0,
            paid_amount=10000.0,
            outstanding_balance=9824.0,
            status="confirmed",                                                  
            notes="Monthly billing cycle 2 (partial payment applied)"
        )
        db.add(inv2)
        db.flush()

        pay2 = Payment(
            payment_reference="PAY-2026-0002",
            invoice_id=inv2.id,
            customer_id=customer1.id,
            amount=10000.0,
            payment_method="UPI",
            payment_date=today - datetime.timedelta(days=10),
            notes="Partial advance received via UPI",
            recorded_by_id=staff.id
        )
        db.add(pay2)

                                                                                      
        sub2 = Subscription(
            subscription_number="SUB-2026-0002",
            customer_id=customer2.id,
            plan_id=plan_starter.id,
            status="active",
            start_date=today - datetime.timedelta(days=60),
            next_billing_date=today,
            billing_cycle="monthly",
            payment_terms="Net 15",
            auto_close=False,
            allow_pause=True,
            allow_renewal=True,
            allow_early_closure=True,
            notes="Cyberdyne operations tier"
        )
        db.add(sub2)
        db.flush()

        sub2_it1 = SubscriptionItem(
            subscription_id=sub2.id,
            product_id=p_crm.id,
            quantity=2,
            unit_price=500.0,
            tax_id=tax18.id,
            tax_rate=18.0,
            line_total=1180.0
        )
        db.add(sub2_it1)
        db.flush()

                                        
        inv_overdue = Invoice(
            invoice_number="INV-2026-002-001",
            subscription_id=sub2.id,
            customer_id=customer2.id,
            invoice_date=today - datetime.timedelta(days=35),
            due_date=today - datetime.timedelta(days=10),                     
            billing_period_start=today - datetime.timedelta(days=35),
            billing_period_end=today - datetime.timedelta(days=6),
            subtotal=1000.0,
            tax_total=180.0,
            discount_total=0.0,
            total_amount=1180.0,
            paid_amount=0.0,
            outstanding_balance=1180.0,
            status="confirmed",
            notes="Unpaid cycle 1 - requires finance follow-up"
        )
        db.add(inv_overdue)

        db.commit()
        print("Brightloop Software database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during database seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
