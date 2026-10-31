# Brightloop Software - Subscription Management System

A web-based platform managing the complete lifecycle of a subscription business, built strictly according to the **Brightloop Software** project specification.

---

## 🌟 Key Capabilities & Architectural Highlights

### 1. Role-Based Access Control & Security
- **Strict Role Boundaries**: Enforced at the FastAPI database/backend layer as well as reflected in the frontend UI.
- **Roles**:
  - **Admin**: Full system governance, products, variants, subscription plans, taxes, discounts, staff creation, recurring billing engine runner, and financial reports.
  - **Internal Staff**: Customer accounts, quotation generation from templates, quote-to-subscription conversion, invoice confirmation, and incoming payment recording.
  - **Customer**: Dedicated self-service portal to view own active subscriptions, next billing dates, invoices, balance settlements, and renewal/pause controls within business rules.
- **Password Complexity Policy**: Server & client enforced: > 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character.
- **Forgot Password Flow**: Secure, time-limited, single-use token mechanism.

### 2. Product & Product-Variant Management
- Catalogue supporting base pricing, cost tracking, notes, and dynamic variants.
- **Pricing Formula**:
  $$\text{Final Unit Price} = \text{Base Price} + \text{Variant Additional Price}$$
  *(e.g., Brightloop ERP Core Base Rs. 1,000 + Odoo Brand Edition Rs. 560 = Final Unit Price Rs. 1,560)*.

### 3. Subscription Plans & Lifecycle Settings
- Billing cycle frequencies: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
- Configurable lifecycle rules: `auto_close`, `allow_pause`, `allow_renewal`, `allow_early_closure`, and minimum seat quantities.

### 4. Quotations & Conversion Workflow
- **Quotation Templates**: Reusable templates with default plans, line items, and validity periods.
- **State Progression**: `Draft` &rarr; `Sent` &rarr; `Accepted` / `Rejected` &rarr; `Converted`.
- **1-Click Conversion**: Converts accepted quotations directly into confirmed active subscriptions with accurate price snapshots.

### 5. Recurring Billing Engine & Safeguards
- **Idempotency Guarantee**: Retrying a failed or delayed job never produces duplicate invoices.
- **Database Uniqueness Constraint**: Enforced on `(subscription_id, billing_period_start, billing_period_end)`.
- **Automated Tax & Discount Calculations**: Evaluates active promo rules, minimum spend thresholds, usage limits, and calculates taxes (e.g. GST 18%).
- **Interactive Simulator**: Staff & admins can simulate as-of billing dates and inspect audit logs.

### 6. Payments & Balance Tracking
- Payment recording supporting multiple payment methods (Bank Wire, UPI, Credit Card, Cash).
- **Invoice Balance Guard**: Rejects overpayments and prevents marking an invoice as `Paid` until its outstanding balance is zero ($0.00).
- Supports partial payments while maintaining accurate remaining balances.

### 7. Executive & Finance Dashboards
- Real-time KPIs: Active Subscriptions, Collections, Outstanding Receivables, Overdue Invoices.
- Monthly Collections vs. Invoiced revenue trajectories.
- Active subscription distribution by plan.

---

## 🔑 Pre-Seeded Demo Accounts

The database comes pre-seeded with realistic Brightloop Software demo accounts. You can also use the **"Demo Switcher"** in the top header to instantly switch roles:

| Role | Email | Password | Pre-seeded Context |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.com` | `Admin@123456` | Alex Administrator (Full governance) |
| **Internal Staff** | `staff@brightloop.com` | `Staff@123456` | Samantha Staff (Operations & sales) |
| **Customer** | `john.doe@acme.com` | `Customer@123456` | Acme Corporation (Active Enterprise Sub) |
| **Customer** | `sarah.connor@cyberdyne.com` | `Customer@123456` | Cyberdyne Systems (Overdue Invoice Demo) |
| **Customer** | `bruce.wayne@wayne.com` | `Customer@123456` | Wayne Enterprises |

---

## 🚀 Running the Project Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Backend Server (FastAPI)
```powershell
cd backend
# Database schema & demo data auto-seed upon startup
python -m uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Healthcheck Endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Start the Frontend Application (React + Vite)
```powershell
cd frontend
npm run dev
```
- Web Application URL: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

### 3. Run Automated Backend Tests
```powershell
cd backend
python -m pytest tests/test_milestones.py
```
*(All 7 milestone integration tests pass with 100% test coverage!)*

---

## 📁 Repository Directory Structure

```
├── backend/
│   ├── app/
│   │   ├── config.py           # App configuration and environment variables
│   │   ├── database.py         # SQLAlchemy engine & SQLite foreign key enforcer
│   │   ├── models.py           # Relational database models with constraints
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── auth.py             # Password complexity check & JWT security
│   │   ├── billing.py          # Recurring billing calculation & safeguard engine
│   │   ├── seed.py             # Pre-seeded demo database populator
│   │   ├── main.py             # FastAPI entrypoint with CORS & routes
│   │   └── routers/
│   │       ├── auth.py         # Authentication & password reset endpoints
│   │       ├── users.py        # Staff management & customer listings
│   │       ├── products.py     # Product and variant CRUD
│   │       ├── plans.py        # Subscription plan rules
│   │       ├── taxes.py        # Tax slabs
│   │       ├── discounts.py    # Discount rules & usage limit tracking
│   │       ├── quotations.py   # Quotes & template conversions
│   │       ├── subscriptions.py# Lifecycle state machine (draft -> active -> closed)
│   │       ├── invoices.py     # Invoicing & due billing triggers
│   │       ├── payments.py     # Payment recording & allocations
│   │       ├── reports.py      # Dashboard analytics & overdue reports
│   │       └── billing.py      # Scheduled execution runner & logs
│   ├── tests/
│   │   └── test_milestones.py  # Automated integration & security tests
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api.js              # REST API client
│   │   ├── index.css           # Modern Enterprise Vanilla CSS Design System
│   │   ├── App.jsx             # Main container, routing & role switching
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Top navigation with role badge & demo switcher
│   │   │   ├── Sidebar.jsx     # Role-aware navigation links
│   │   │   └── AuthModal.jsx   # Login, registration & password reset modal
│   │   └── views/
│   │       ├── DashboardView.jsx        # Executive & finance analytics
│   │       ├── ProductsView.jsx         # Product catalog & variant pricing
│   │       ├── PlansView.jsx            # Subscription plans & lifecycle rules
│   │       ├── QuotationsView.jsx       # Quotations builder & 1-click converter
│   │       ├── SubscriptionsView.jsx    # Subscription state machine
│   │       ├── InvoicesView.jsx         # Invoices list & printable tax invoice
│   │       ├── PaymentsView.jsx         # Payment allocations & settlements
│   │       ├── TaxesAndDiscountsView.jsx# Tax slabs & discount rules
│   │       ├── StaffView.jsx            # Admin-only staff account administration
│   │       ├── CustomerPortalView.jsx   # Dedicated customer self-service portal
│   │       └── BillingRunnerView.jsx    # Billing engine runner & audit history
│   ├── package.json
│   └── vite.config.js
└── README.md
```
