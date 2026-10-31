from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
import datetime
import re

                                                               
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None
    role: str = "customer"

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) <= 8:
            raise ValueError("Password must be more than 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v

class StaffCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "staff"

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) <= 8:
            raise ValueError("Password must be more than 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) <= 8:
            raise ValueError("Password must be more than 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    company_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

                                                                     
class ProductVariantBase(BaseModel):
    variant_name: str
    additional_price: float = 0.0

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    is_archived: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

class ProductBase(BaseModel):
    name: str
    product_type: str = "Software License"
    sales_price: float
    cost_price: float = 0.0
    notes: Optional[str] = None

class ProductCreate(ProductBase):
    variants: Optional[List[ProductVariantCreate]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    product_type: Optional[str] = None
    sales_price: Optional[float] = None
    cost_price: Optional[float] = None
    notes: Optional[str] = None
    is_archived: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    is_archived: bool
    created_at: datetime.datetime
    variants: List[ProductVariantResponse] = []

    model_config = {"from_attributes": True}

                                                                     
class PlanBase(BaseModel):
    name: str
    price: float
    billing_cycle: str = "monthly"                                          
    minimum_quantity: int = 1
    availability_start: Optional[datetime.date] = None
    availability_end: Optional[datetime.date] = None
    auto_close: bool = False
    allow_pause: bool = True
    allow_renewal: bool = True
    allow_early_closure: bool = True
    description: Optional[str] = None
    is_active: bool = True

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    billing_cycle: Optional[str] = None
    minimum_quantity: Optional[int] = None
    availability_start: Optional[datetime.date] = None
    availability_end: Optional[datetime.date] = None
    auto_close: Optional[bool] = None
    allow_pause: Optional[bool] = None
    allow_renewal: Optional[bool] = None
    allow_early_closure: Optional[bool] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PlanResponse(PlanBase):
    id: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

                                                       
class TaxBase(BaseModel):
    name: str
    rate: float
    description: Optional[str] = None
    is_active: bool = True

class TaxCreate(TaxBase):
    pass

class TaxResponse(TaxBase):
    id: int

    model_config = {"from_attributes": True}

                                                            
class DiscountBase(BaseModel):
    code: str
    name: str
    discount_type: str = "percentage"                           
    discount_value: float
    scope: str = "whole_subscription"                                              
    applicable_product_id: Optional[int] = None
    minimum_purchase: float = 0.0
    minimum_quantity: int = 0
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    usage_limit: Optional[int] = None
    is_active: bool = True

class DiscountCreate(DiscountBase):
    pass

class DiscountResponse(DiscountBase):
    id: int
    times_used: int

    model_config = {"from_attributes": True}

                                                                            
class QuotationTemplateItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = 1
    unit_price: float

class QuotationTemplateCreate(BaseModel):
    name: str
    default_plan_id: Optional[int] = None
    validity_days: int = 30
    description: Optional[str] = None
    items: List[QuotationTemplateItemCreate] = []

class QuotationTemplateItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    variant_id: Optional[int] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}

class QuotationTemplateResponse(BaseModel):
    id: int
    name: str
    default_plan_id: Optional[int] = None
    validity_days: int
    description: Optional[str] = None
    created_at: datetime.datetime
    items: List[QuotationTemplateItemResponse] = []

    model_config = {"from_attributes": True}

class QuotationItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = 1
    unit_price: float
    tax_rate: float = 0.0

class QuotationCreate(BaseModel):
    customer_id: int
    plan_id: int
    valid_until: Optional[datetime.date] = None
    payment_terms: str = "Net 30"
    notes: Optional[str] = None
    discount_code: Optional[str] = None
    items: List[QuotationItemCreate] = []

class QuotationItemResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: float
    tax_rate: float
    line_total: float

    model_config = {"from_attributes": True}

class QuotationResponse(BaseModel):
    id: int
    quotation_number: str
    customer_id: int
    plan_id: int
    status: str
    valid_until: Optional[datetime.date] = None
    subtotal: float
    tax_total: float
    discount_total: float
    total_amount: float
    payment_terms: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    items: List[QuotationItemResponse] = []
    customer: Optional[UserResponse] = None
    plan: Optional[PlanResponse] = None

    model_config = {"from_attributes": True}

                                                         
class SubscriptionItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = 1
    unit_price: float
    tax_id: Optional[int] = None
    tax_rate: float = 0.0

class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    quotation_id: Optional[int] = None
    start_date: datetime.date
    expiry_date: Optional[datetime.date] = None
    billing_cycle: Optional[str] = None
    payment_terms: str = "Due upon receipt"
    auto_close: bool = False
    allow_pause: bool = True
    allow_renewal: bool = True
    allow_early_closure: bool = True
    notes: Optional[str] = None
    discount_code: Optional[str] = None
    items: List[SubscriptionItemCreate] = []

class SubscriptionStatusUpdate(BaseModel):
    status: str                                                                   
    notes: Optional[str] = None

class SubscriptionItemResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: float
    tax_rate: float
    line_total: float

    model_config = {"from_attributes": True}

class SubscriptionResponse(BaseModel):
    id: int
    subscription_number: str
    customer_id: int
    plan_id: int
    quotation_id: Optional[int] = None
    status: str
    start_date: datetime.date
    expiry_date: Optional[datetime.date] = None
    next_billing_date: datetime.date
    billing_cycle: str
    payment_terms: str
    auto_close: bool
    allow_pause: bool
    allow_renewal: bool
    allow_early_closure: bool
    notes: Optional[str] = None
    created_at: datetime.datetime
    items: List[SubscriptionItemResponse] = []
    customer: Optional[UserResponse] = None
    plan: Optional[PlanResponse] = None

    model_config = {"from_attributes": True}

                                                    
class InvoiceItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    variant_id: Optional[int] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float
    tax_rate: float
    tax_amount: float
    discount_amount: float
    line_total: float

    model_config = {"from_attributes": True}

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    subscription_id: int
    customer_id: int
    invoice_date: datetime.date
    due_date: datetime.date
    billing_period_start: datetime.date
    billing_period_end: datetime.date
    subtotal: float
    tax_total: float
    discount_total: float
    total_amount: float
    paid_amount: float
    outstanding_balance: float
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    items: List[InvoiceItemResponse] = []
    customer: Optional[UserResponse] = None
    subscription_number: Optional[str] = None

    model_config = {"from_attributes": True}

                                                    
class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str = "Bank Transfer"                                                 
    payment_date: Optional[datetime.date] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    payment_reference: str
    invoice_id: int
    customer_id: int
    amount: float
    payment_method: str
    payment_date: datetime.date
    notes: Optional[str] = None
    created_at: datetime.datetime
    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None

    model_config = {"from_attributes": True}

                                                                           
class DashboardMetrics(BaseModel):
    active_subscriptions: int
    total_subscriptions: int
    revenue_received: float
    outstanding_amount: float
    overdue_invoices_amount: float
    overdue_invoices_count: int
    total_payments_count: int
    total_invoices_count: int

class RevenueByMonthItem(BaseModel):
    month: str
    revenue: float
    invoiced: float

class SubscriptionsByPlanItem(BaseModel):
    plan_name: str
    count: int
    total_value: float
