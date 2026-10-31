import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Receipt, 
  CreditCard, 
  CheckCircle, 
  Play, 
  Pause, 
  RefreshCw, 
  Printer, 
  ShieldCheck,
  Building,
  User
} from 'lucide-react';
import { api } from '../api';

export default function CustomerPortalView({ currentUser, onNavigate, onPayInvoice }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const [subs, invs] = await Promise.all([
        api.getSubscriptions(),
        api.getInvoices()
      ]);
      setSubscriptions(subs);
      setInvoices(invs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async (sub, newStatus) => {
    try {
      await api.updateSubscriptionStatus(sub.id, newStatus);
      await loadPortalData();
    } catch (err) {
      alert("Action not permitted: " + err.message);
    }
  };

  const handleRenew = async (subId) => {
    try {
      await api.renewSubscription(subId);
      alert("Subscription renewed successfully!");
      await loadPortalData();
    } catch (err) {
      alert("Renewal error: " + err.message);
    }
  };

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const unpaidInvoices = invoices.filter(i => i.outstanding_balance > 0.01 && i.status !== 'cancelled');
  const totalDue = unpaidInvoices.reduce((acc, i) => acc + i.outstanding_balance, 0);

  return (
    <div>
      {}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))', borderColor: 'rgba(99, 102, 241, 0.3)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge active">Customer Portal</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Security Verified</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
              Welcome, {currentUser?.full_name}!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {currentUser?.company_name ? `${currentUser.company_name} — ` : ''}
              Manage your Brightloop subscriptions, check billing dates, and settle invoices.
            </p>
          </div>

          <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Current Outstanding Balance
            </span>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: totalDue > 0 ? '#f87171' : '#34d399' }}>
              Rs. {totalDue.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: totalDue > 0 ? '#fbbf24' : 'var(--text-dim)' }}>
              {unpaidInvoices.length} unpaid bill(s)
            </span>
          </div>
        </div>
      </div>

      {}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Your Active Subscriptions
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {subscriptions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
              No subscriptions found for your account. Contact sales to receive a quotation!
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="table-code">{sub.subscription_number}</span>
                    <h4 style={{ fontSize: '1.125rem', color: '#fff', fontWeight: 700, marginTop: '0.35rem' }}>
                      {sub.plan?.name || `Plan #${sub.plan_id}`}
                    </h4>
                  </div>
                  <span className={`badge ${sub.status}`}>
                    <span className="badge-dot" />
                    {sub.status}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.875rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Billing Frequency:</span>
                    <span style={{ color: '#fff', textTransform: 'capitalize' }}>{sub.billing_cycle}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Next Due Date:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{sub.next_billing_date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Expiry Date:</span>
                    <span style={{ color: '#cbd5e1' }}>{sub.expiry_date || 'Continuous'}</span>
                  </div>
                </div>

                {}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {sub.status === 'active' && sub.allow_pause && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handlePauseResume(sub, 'paused')}
                    >
                      <Pause size={13} /> Pause Subscription
                    </button>
                  )}

                  {sub.status === 'paused' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handlePauseResume(sub, 'active')}
                    >
                      <Play size={13} fill="currentColor" /> Resume
                    </button>
                  )}

                  {sub.allow_renewal && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRenew(sub.id)}
                    >
                      <RefreshCw size={13} /> Renew Plan
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Invoices & Settlement History
          </h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Billing Period</th>
                <th>Due Date</th>
                <th>Total (Rs.)</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
                <th>Self-Service Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No invoices issued yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><span className="table-code">{inv.invoice_number}</span></td>
                    <td style={{ fontSize: '0.8125rem' }}>{inv.billing_period_start} to {inv.billing_period_end}</td>
                    <td>{inv.due_date}</td>
                    <td style={{ fontWeight: 700 }}>Rs. {inv.total_amount.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: inv.outstanding_balance > 0.01 ? '#f87171' : '#34d399' }}>
                      Rs. {inv.outstanding_balance.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${inv.status}`}>
                        <span className="badge-dot" />
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {inv.outstanding_balance > 0.01 ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              if (onPayInvoice) onPayInvoice(inv);
                            }}
                          >
                            <CreditCard size={13} /> Pay Now
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={14} /> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
