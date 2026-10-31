import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_password_policy_enforcement():
                                       
    weak_passwords = [
        "short",                        
        "alllowercase123!",                
        "ALLUPPERCASE123!",                
        "NoSpecialChar123",                   
    ]
    for p in weak_passwords:
        res = client.post("/api/v1/auth/register", json={
            "email": f"test_{abs(hash(p))}@example.com",
            "password": p,
            "full_name": "Test User",
            "role": "customer"
        })
        assert res.status_code == 422, f"Password '{p}' should have failed validation"

import time

def test_user_registration_and_email_uniqueness():
    email = f"unique_tester_{int(time.time()*1000)}@brightloop.com"
    payload = {
        "email": email,
        "password": "StrongPassword@123!",
        "full_name": "Unique Tester",
        "company_name": "Tester Co",
        "role": "customer"
    }
                        
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code in [200, 201]
    data = res1.json()
    assert data["email"] == email
    assert data["role"] == "customer"

                                               
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]

def test_login_and_role_tokens():
                 
    res_admin = client.post("/api/v1/auth/login", json={
        "email": "admin@brightloop.com",
        "password": "Admin@123456"
    })
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert data_admin["user"]["role"] == "admin"
    assert "access_token" in data_admin

                    
    res_cust = client.post("/api/v1/auth/login", json={
        "email": "john.doe@acme.com",
        "password": "Customer@123456"
    })
    assert res_cust.status_code == 200
    data_cust = res_cust.json()
    assert data_cust["user"]["role"] == "customer"

def test_role_authorization_customer_cannot_access_admin_endpoints():
                        
    res_cust = client.post("/api/v1/auth/login", json={
        "email": "john.doe@acme.com",
        "password": "Customer@123456"
    })
    cust_token = res_cust.json()["access_token"]
    headers = {"Authorization": f"Bearer {cust_token}"}

                                            
    res_create_prod = client.post("/api/v1/products/", json={
        "name": "Hacked Product",
        "sales_price": 500.0,
        "cost_price": 100.0
    }, headers=headers)
    assert res_create_prod.status_code == 403

                                                  
    res_create_staff = client.post("/api/v1/users/staff", json={
        "email": "fake_staff@brightloop.com",
        "full_name": "Fake Staff",
        "password": "Password@123!"
    }, headers=headers)
    assert res_create_staff.status_code == 403

def test_admin_product_variant_pricing_formula():
    res_admin = client.post("/api/v1/auth/login", json={
        "email": "admin@brightloop.com",
        "password": "Admin@123456"
    })
    admin_token = res_admin.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

                                                                      
    prod_res = client.post("/api/v1/products/", json={
        "name": "Audit License ERP",
        "product_type": "Software License",
        "sales_price": 1000.0,
        "cost_price": 200.0,
        "variants": [
            {"variant_name": "Odoo Edition", "additional_price": 560.0}
        ]
    }, headers=headers)
    assert prod_res.status_code == 201
    prod = prod_res.json()
    assert len(prod["variants"]) == 1
    variant = prod["variants"][0]
    final_price = prod["sales_price"] + variant["additional_price"]
    assert final_price == 1560.0

def test_payment_and_outstanding_balance_recalculation():
    res_staff = client.post("/api/v1/auth/login", json={
        "email": "staff@brightloop.com",
        "password": "Staff@123456"
    })
    staff_token = res_staff.json()["access_token"]
    headers = {"Authorization": f"Bearer {staff_token}"}

                                     
    invoices_res = client.get("/api/v1/invoices/?status_filter=confirmed", headers=headers)
    assert invoices_res.status_code == 200
    invoices = invoices_res.json()
    assert len(invoices) > 0

    target_inv = invoices[0]
    inv_id = target_inv["id"]
    current_balance = target_inv["outstanding_balance"]

                                  
    bad_pay = client.post("/api/v1/payments/", json={
        "invoice_id": inv_id,
        "amount": current_balance + 5000.0,
        "payment_method": "Bank Transfer"
    }, headers=headers)
    assert bad_pay.status_code == 400
    assert "cannot exceed" in bad_pay.json()["detail"]

                          
    partial_amount = min(50.0, current_balance)
    pay_res = client.post("/api/v1/payments/", json={
        "invoice_id": inv_id,
        "amount": partial_amount,
        "payment_method": "Cash",
        "notes": "Partial milestone test payment"
    }, headers=headers)
    assert pay_res.status_code == 201

                                   
    updated_inv_res = client.get(f"/api/v1/invoices/{inv_id}", headers=headers)
    assert updated_inv_res.status_code == 200
    updated_inv = updated_inv_res.json()
    expected_balance = round(current_balance - partial_amount, 2)
    assert abs(updated_inv["outstanding_balance"] - expected_balance) < 0.01

                                                                
    if updated_inv["outstanding_balance"] > 0.01:
        assert updated_inv["status"] != "paid"

def test_recurring_billing_safeguards_and_idempotency():
    res_admin = client.post("/api/v1/auth/login", json={
        "email": "admin@brightloop.com",
        "password": "Admin@123456"
    })
    admin_token = res_admin.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

                                                                        
    res1 = client.post("/api/v1/billing/run-job", headers=headers)
    assert res1.status_code == 200

    res2 = client.post("/api/v1/billing/run-job", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
                                                                  
    assert data2["errors_count"] == 0
