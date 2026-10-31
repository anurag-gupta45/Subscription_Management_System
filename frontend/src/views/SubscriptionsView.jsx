import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Play, 
  Pause, 
  RefreshCw, 
  XCircle, 
  Eye, 
  Search, 
  Tag, 
  Layers, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function SubscriptionsView({ userRole, onNavigate }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);

  const isCustomer = userRole === 'customer';

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubscriptions(statusFilter || undefined);
      setSubscriptions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (subId, newStatus) => {
    try {
      await api.updateSubscriptionStatus(subId, newStatus);
      await loadSubscriptions();
      if (selectedSub && selectedSub.id === subId) {
        const updated = await api.getSubscription(subId);
        setSelectedSub(updated);
      }
    } catch (err) {
      alert("Status transition error: " + err.message);
    }
  };

  const handleRenew = async (subId) => {
    try {
      await api.renewSubscription(subId);
      alert("Subscription renewed successfully!");
      await loadSubscriptions();
    } catch (err) {
      alert("Renewal error: " + err.message);
    }
  };

  const filtered = subscriptions.filter(s =>
    s.subscription_number.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.plan?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>
            {isCustomer ? 'My Subscriptions' : 'Subscriptions Management'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Lifecycle progression: Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &rarr; Closed.
          </p>
        </div>
      </div>

      {}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search by subscription #, customer, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="confirmed">Confirmed</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subscription #</th>
              <th>Customer</th>
              <th>Plan & Cycle</th>
              <th>Start / Expiry</th>
              <th>Next Billing Date</th>
              <th>Lifecycle Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No subscriptions found matching the filter.
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <span className="table-code">{sub.subscription_number}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {sub.customer?.full_name || `Customer #${sub.customer_id}`}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {sub.customer?.company_name || sub.customer?.email}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#a5b4fc' }}>
                      {sub.plan?.name || `Plan #${sub.plan_id}`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {sub.billing_cycle} &bull; Rs. {sub.plan?.price.toLocaleString()}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    <div>Start: {sub.start_date}</div>
                    <div style={{ color: 'var(--text-dim)' }}>
                      Exp: {sub.expiry_date || 'No Expiry'}
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#38bdf8' }}>
                      <Clock size={14} />
                      {sub.next_billing_date}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${sub.status}`}>
                      <span className="badge-dot" />
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedSub(sub)}
                        title="View details"
                      >
                        <Eye size={14} /> View
                      </button>

                      {}
                      {sub.status === 'confirmed' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange(sub.id, 'active')}
                          title="Activate subscription"
                        >
                          <Play size={13} fill="currentColor" /> Activate
                        </button>
                      )}

                      {sub.status === 'active' && sub.allow_pause && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusChange(sub.id, 'paused')}
                          title="Pause subscription"
                        >
                          <Pause size={13} /> Pause
                        </button>
                      )}

                      {sub.status === 'paused' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange(sub.id, 'active')}
                          title="Resume active billing"
                        >
                          <Play size={13} fill="currentColor" /> Resume
                        </button>
                      )}

                      {(sub.status === 'active' || sub.status === 'paused') && sub.allow_early_closure && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange(sub.id, 'closed')}
                          title="Close subscription"
                        >
                          <XCircle size={13} /> Close
                        </button>
                      )}

                      {sub.status === 'closed' && sub.allow_renewal && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleRenew(sub.id)}
                          title="Renew subscription"
                        >
                          <RefreshCw size={13} /> Renew
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h3 className="card-title">
                  <CalendarClock size={20} color="var(--primary)" />
                  Subscription {selectedSub.subscription_number}
                </h3>
                <span className={`badge ${selectedSub.status}`} style={{ marginTop: '0.4rem' }}>
                  <span className="badge-dot" />
                  {selectedSub.status}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedSub(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Customer:</div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{selectedSub.customer?.full_name}</div>
                <div style={{ color: 'var(--text-muted)' }}>{selectedSub.customer?.email}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Plan Tier:</div>
                <div style={{ fontWeight: 600, color: '#a5b4fc' }}>{selectedSub.plan?.name}</div>
                <div style={{ color: 'var(--text-muted)' }}>Rs. {selectedSub.plan?.price} /{selectedSub.billing_cycle}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Billing Window:</div>
                <div style={{ color: '#fff' }}>Start: {selectedSub.start_date}</div>
                <div style={{ color: '#fff' }}>Next Due: {selectedSub.next_billing_date}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Payment Terms:</div>
                <div style={{ color: '#fff' }}>{selectedSub.payment_terms}</div>
              </div>
            </div>

            {}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Subscription Line Items (Price Snapshots)
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price Snapshot</th>
                      <th>Tax</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSub.items?.map((it) => (
                      <tr key={it.id}>
                        <td style={{ color: '#fff', fontWeight: 600 }}>
                          Product #{it.product_id}
                        </td>
                        <td>{it.quantity}</td>
                        <td>Rs. {it.unit_price.toLocaleString()}</td>
                        <td>{it.tax_rate}%</td>
                        <td style={{ fontWeight: 700, color: '#38bdf8' }}>
                          Rs. {it.line_total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedSub(null)}
              >
                Close
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedSub(null);
                  if (onNavigate) onNavigate('invoices');
                }}
              >
                View Generated Invoices &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
