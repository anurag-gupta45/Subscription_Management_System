import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  FileText, 
  CalendarClock, 
  Receipt, 
  CreditCard, 
  Percent, 
  Users, 
  Cpu,
  UserCheck,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, userRole }) {
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';
  const isCustomer = userRole === 'customer';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon-wrapper">
          <Zap size={22} />
        </div>
        <div className="brand-text-col">
          <span className="brand-name">Brightloop</span>
          <span className="brand-tag">Subscription OS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {}
        {isCustomer && (
          <>
            <div className="nav-section-title">Customer Portal</div>
            <button
              className={`nav-item ${currentTab === 'customer-portal' ? 'active' : ''}`}
              onClick={() => setCurrentTab('customer-portal')}
            >
              <LayoutDashboard size={18} />
              <span>Portal Overview</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'subscriptions' ? 'active' : ''}`}
              onClick={() => setCurrentTab('subscriptions')}
            >
              <CalendarClock size={18} />
              <span>My Subscriptions</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setCurrentTab('invoices')}
            >
              <Receipt size={18} />
              <span>Invoices & Bills</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'payments' ? 'active' : ''}`}
              onClick={() => setCurrentTab('payments')}
            >
              <CreditCard size={18} />
              <span>Payment History</span>
            </button>
          </>
        )}

        {}
        {(isAdmin || isStaff) && (
          <>
            <div className="nav-section-title">Analytics & Operations</div>
            <button
              className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Executive Dashboard</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'subscriptions' ? 'active' : ''}`}
              onClick={() => setCurrentTab('subscriptions')}
            >
              <CalendarClock size={18} />
              <span>Subscriptions</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'quotations' ? 'active' : ''}`}
              onClick={() => setCurrentTab('quotations')}
            >
              <FileText size={18} />
              <span>Quotations</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setCurrentTab('invoices')}
            >
              <Receipt size={18} />
              <span>Invoices</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'payments' ? 'active' : ''}`}
              onClick={() => setCurrentTab('payments')}
            >
              <CreditCard size={18} />
              <span>Payments</span>
            </button>
          </>
        )}

        {}
        {isAdmin && (
          <>
            <div className="nav-section-title">Catalogue & Configuration</div>
            <button
              className={`nav-item ${currentTab === 'products' ? 'active' : ''}`}
              onClick={() => setCurrentTab('products')}
            >
              <Package size={18} />
              <span>Products & Variants</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'plans' ? 'active' : ''}`}
              onClick={() => setCurrentTab('plans')}
            >
              <Layers size={18} />
              <span>Subscription Plans</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'taxes-discounts' ? 'active' : ''}`}
              onClick={() => setCurrentTab('taxes-discounts')}
            >
              <Percent size={18} />
              <span>Taxes & Discounts</span>
            </button>

            <div className="nav-section-title">System & Administration</div>
            <button
              className={`nav-item ${currentTab === 'staff' ? 'active' : ''}`}
              onClick={() => setCurrentTab('staff')}
            >
              <UserCheck size={18} />
              <span>Staff Management</span>
            </button>
            <button
              className={`nav-item ${currentTab === 'billing-engine' ? 'active' : ''}`}
              onClick={() => setCurrentTab('billing-engine')}
            >
              <Cpu size={18} />
              <span>Billing Runner</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  );
}
