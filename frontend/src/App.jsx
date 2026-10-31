import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';

import DashboardView from './views/DashboardView';
import ProductsView from './views/ProductsView';
import PlansView from './views/PlansView';
import QuotationsView from './views/QuotationsView';
import SubscriptionsView from './views/SubscriptionsView';
import InvoicesView from './views/InvoicesView';
import PaymentsView from './views/PaymentsView';
import TaxesAndDiscountsView from './views/TaxesAndDiscountsView';
import StaffView from './views/StaffView';
import CustomerPortalView from './views/CustomerPortalView';
import BillingRunnerView from './views/BillingRunnerView';

import { 
  api, 
  getStoredUser, 
  setStoredToken, 
  setStoredUser 
} from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [preSelectedInvoice, setPreSelectedInvoice] = useState(null);
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
      if (cachedUser.role === 'customer') {
        setCurrentTab('customer-portal');
      } else {
        setCurrentTab('dashboard');
      }
      setAppInitialized(true);
    } else {
      
      try {
        const res = await api.login('admin@brightloop.com', 'Admin@123456');
        setStoredToken(res.access_token);
        setStoredUser(res.user);
        setCurrentUser(res.user);
        setCurrentTab('dashboard');
      } catch (err) {
        console.warn("Auto demo login notice:", err);
      } finally {
        setAppInitialized(true);
      }
    }
  };

  const handleSwitchDemoRole = async (role) => {
    try {
      let email = 'admin@brightloop.com';
      let pass = 'Admin@123456';

      if (role === 'staff') {
        email = 'staff@brightloop.com';
        pass = 'Staff@123456';
      } else if (role === 'customer') {
        email = 'john.doe@acme.com';
        pass = 'Customer@123456';
      }

      const res = await api.login(email, pass);
      setStoredToken(res.access_token);
      setStoredUser(res.user);
      setCurrentUser(res.user);

      if (role === 'customer') {
        setCurrentTab('customer-portal');
      } else {
        setCurrentTab('dashboard');
      }
    } catch (err) {
      alert("Role switch failed: " + err.message);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setStoredUser(null);
    setCurrentUser(null);
    setIsAuthOpen(true);
  };

  const handleNavigate = (tab) => {
    setCurrentTab(tab);
  };

  const handlePayInvoice = (invoice) => {
    setPreSelectedInvoice(invoice);
    setCurrentTab('payments');
  };

  return (
    <div className="app-container">
      {}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userRole={currentUser?.role || 'customer'} 
      />

      <div className="main-content">
        {}
        <Navbar 
          currentUser={currentUser} 
          onSwitchDemoRole={handleSwitchDemoRole}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />

        {}
        <main className="content-viewport">
          {currentTab === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} />
          )}

          {currentTab === 'products' && (
            <ProductsView />
          )}

          {currentTab === 'plans' && (
            <PlansView />
          )}

          {currentTab === 'quotations' && (
            <QuotationsView userRole={currentUser?.role} onNavigate={handleNavigate} />
          )}

          {currentTab === 'subscriptions' && (
            <SubscriptionsView userRole={currentUser?.role} onNavigate={handleNavigate} />
          )}

          {currentTab === 'invoices' && (
            <InvoicesView 
              userRole={currentUser?.role} 
              onNavigate={handleNavigate}
              onSelectInvoiceForPayment={(inv) => setPreSelectedInvoice(inv)}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsView 
              userRole={currentUser?.role}
              preSelectedInvoice={preSelectedInvoice}
              clearPreSelectedInvoice={() => setPreSelectedInvoice(null)}
            />
          )}

          {currentTab === 'taxes-discounts' && (
            <TaxesAndDiscountsView />
          )}

          {currentTab === 'staff' && (
            <StaffView />
          )}

          {currentTab === 'billing-engine' && (
            <BillingRunnerView />
          )}

          {currentTab === 'customer-portal' && (
            <CustomerPortalView 
              currentUser={currentUser} 
              onNavigate={handleNavigate}
              onPayInvoice={handlePayInvoice}
            />
          )}
        </main>
      </div>

      {}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'customer') {
            setCurrentTab('customer-portal');
          } else {
            setCurrentTab('dashboard');
          }
        }}
      />
    </div>
  );
}
