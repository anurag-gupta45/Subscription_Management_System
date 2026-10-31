from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, ProductVariant, User
from app.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductVariantCreate, ProductVariantResponse
)
from app.auth import require_admin, require_staff_or_admin, get_current_user

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[ProductResponse])
def get_products(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if not include_archived:
        query = query.filter(Product.is_archived == False)
    return query.order_by(Product.name.asc()).all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    new_product = Product(
        name=product_in.name,
        product_type=product_in.product_type,
        sales_price=product_in.sales_price,
        cost_price=product_in.cost_price,
        notes=product_in.notes,
        is_archived=False
    )
    db.add(new_product)
    db.flush()

    if product_in.variants:
        for v in product_in.variants:
            variant_obj = ProductVariant(
                product_id=new_product.id,
                variant_name=v.variant_name,
                additional_price=v.additional_price,
                is_archived=False
            )
            db.add(variant_obj)

    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def archive_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_archived = True
    db.commit()
    return {"message": "Product archived successfully"}

@router.post("/{product_id}/variants", response_model=ProductVariantResponse)
def add_product_variant(
    product_id: int,
    variant_in: ProductVariantCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variant = ProductVariant(
        product_id=product_id,
        variant_name=variant_in.variant_name,
        additional_price=variant_in.additional_price,
        is_archived=False
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant

@router.delete("/variants/{variant_id}")
def archive_variant(
    variant_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    variant.is_archived = True
    db.commit()
    return {"message": "Variant archived successfully"}
