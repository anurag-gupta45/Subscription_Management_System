import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="customer")                                
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

                   
    quotations = relationship("Quotation", back_populates="customer", foreign_keys="Quotation.customer_id")
    subscriptions = relationship("Subscription", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
    payments = relationship("Payment", back_populates="customer", foreign_keys="Payment.customer_id")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    product_type = Column(String(100), nullable=False, default="Software License")                 
    sales_price = Column(Float, nullable=False, default=0.0)
    cost_price = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    variant_name = Column(String(255), nullable=False)                                                 
    additional_price = Column(Float, nullable=False, default=0.0)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="variants")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)                                              
    billing_cycle = Column(String(50), nullable=False, default="monthly")                                          
    minimum_quantity = Column(Integer, default=1)
    availability_start = Column(Date, nullable=True)
    availability_end = Column(Date, nullable=True)
    auto_close = Column(Boolean, default=False)
    allow_pause = Column(Boolean, default=True)
    allow_renewal = Column(Boolean, default=True)
    allow_early_closure = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="plan")


class Tax(Base):
    __tablename__ = "taxes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)                             
    rate = Column(Float, nullable=False)                     
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    discount_type = Column(String(50), nullable=False, default="percentage")                         
    discount_value = Column(Float, nullable=False)
    scope = Column(String(50), nullable=False, default="whole_subscription")                                            
    applicable_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    minimum_purchase = Column(Float, default=0.0)
    minimum_quantity = Column(Integer, default=0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    usage_limit = Column(Integer, nullable=True)
    times_used = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    applicable_product = relationship("Product")


class QuotationTemplate(Base):
    __tablename__ = "quotation_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    default_plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    validity_days = Column(Integer, default=30)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    default_plan = relationship("Plan")
    items = relationship("QuotationTemplateItem", back_populates="template", cascade="all, delete-orphan")


class QuotationTemplateItem(Base):
    __tablename__ = "quotation_template_items"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("quotation_templates.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)

    template = relationship("QuotationTemplate", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    status = Column(String(50), default="draft")                                                        
    valid_until = Column(Date, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_total = Column(Float, default=0.0)
    discount_total = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_terms = Column(String(100), default="Net 30")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("User", back_populates="quotations", foreign_keys=[customer_id])
    plan = relationship("Plan")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="quotation")


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)
    tax_rate = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)

    quotation = relationship("Quotation", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=True)
    
                                                                                                           
    status = Column(String(50), default="draft", nullable=False)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    next_billing_date = Column(Date, nullable=False)
    billing_cycle = Column(String(50), nullable=False, default="monthly")
    payment_terms = Column(String(100), default="Due upon receipt")
    auto_close = Column(Boolean, default=False)
    allow_pause = Column(Boolean, default=True)
    allow_renewal = Column(Boolean, default=True)
    allow_early_closure = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    quotation = relationship("Quotation", back_populates="subscriptions")
    items = relationship("SubscriptionItem", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription")


class SubscriptionItem(Base):
    __tablename__ = "subscription_items"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)                                           
    tax_id = Column(Integer, ForeignKey("taxes.id"), nullable=True)
    tax_rate = Column(Float, default=0.0)
    line_total = Column(Float, nullable=False)

    subscription = relationship("Subscription", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    tax = relationship("Tax")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    
    subtotal = Column(Float, default=0.0)
    tax_total = Column(Float, default=0.0)
    discount_total = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    outstanding_balance = Column(Float, default=0.0)
    
                                                     
    status = Column(String(50), default="draft", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

                                                                                                         
    __table_args__ = (
        UniqueConstraint('subscription_id', 'billing_period_start', 'billing_period_end', name='uq_subscription_billing_period'),
    )

    subscription = relationship("Subscription", back_populates="invoices")
    customer = relationship("User", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(255), nullable=False)
    variant_id = Column(Integer, nullable=True)
    variant_name = Column(String(255), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    line_total = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_reference = Column(String(50), unique=True, index=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)                                                 
    payment_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")
    customer = relationship("User", back_populates="payments", foreign_keys=[customer_id])
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])


class BillingLog(Base):
    __tablename__ = "billing_logs"

    id = Column(Integer, primary_key=True, index=True)
    run_date = Column(Date, nullable=False)
    subscriptions_evaluated = Column(Integer, default=0)
    invoices_created = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
