import React, { useState, useEffect } from 'react';
import { Layers, Plus, Check, X, Calendar, RefreshCw, Pause, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function PlansView() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlan, setShowAddPlan] = useState(false);

  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [minQty, setMinQty] = useState(1);
  const [autoClose, setAutoClose] = useState(false);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.getPlans(true);
      setPlans(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.createPlan({
        name,
        price: parseFloat(price),
        billing_cycle: billingCycle,
        minimum_quantity: parseInt(minQty),
        auto_close: autoClose,
        allow_pause: allowPause,
        allow_renewal: allowRenewal,
        allow_early_closure: allowEarlyClosure,
        description,
        is_active: true
      });
      setShowAddPlan(false);
      resetForm();
      await loadPlans();
    } catch (err) {
      alert("Failed to create plan: " + err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setBillingCycle('monthly');
    setMinQty(1);
    setAutoClose(false);
    setAllowPause(true);
    setAllowRenewal(true);
    setAllowEarlyClosure(true);
    setDescription('');
  };

  const handleToggleActive = async (id) => {
    await api.togglePlanActive(id);
    await loadPlans();
  };

  return (
    <div>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Subscription Plans & Lifecycle Rules</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configure billing cycles, price frequencies, pausing allowances, renewal permissions, and closure rules.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowAddPlan(true)}
        >
          <Plus size={16} />
          <span>New Subscription Plan</span>
        </button>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {plans.map((p) => (
          <div key={p.id} className="card" style={{ opacity: p.is_active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                  {p.name}
                </h3>
                <span className="badge confirmed" style={{ marginTop: '0.35rem' }}>
                  <Calendar size={12} />
                  {p.billing_cycle} billing cycle
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                  Rs. {p.price.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                  per {p.billing_cycle}
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem', minHeight: '38px' }}>
              {p.description || "No description provided."}
            </p>

            {}
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.875rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                Plan Lifecycle Rules
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Minimum Quantity / Seats:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{p.minimum_quantity} unit(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Pausing Permitted:</span>
                <span style={{ color: p.allow_pause ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {p.allow_pause ? 'Allowed' : 'Disabled'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Renewal Permitted:</span>
                <span style={{ color: p.allow_renewal ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {p.allow_renewal ? 'Allowed' : 'Disabled'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Early Closure:</span>
                <span style={{ color: p.allow_early_closure ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {p.allow_early_closure ? 'Permitted' : 'Locked till expiry'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                <span>Auto-Close at End:</span>
                <span style={{ color: p.auto_close ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
                  {p.auto_close ? 'Yes (Auto-terminates)' : 'No (Continuous)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`badge ${p.is_active ? 'active' : 'cancelled'}`}>
                <span className="badge-dot" />
                {p.is_active ? 'Active Plan' : 'Archived'}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleToggleActive(p.id)}
              >
                {p.is_active ? 'Archive Plan' : 'Restore Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {}
      {showAddPlan && (
        <div className="modal-overlay" onClick={() => setShowAddPlan(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">
                <Layers size={20} color="var(--primary)" />
                Create Subscription Plan
              </h3>
              <button className="modal-close-btn" onClick={() => setShowAddPlan(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePlan}>
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Professional Enterprise Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price per Billing Period (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-field"
                    placeholder="2000.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Cycle Frequency</label>
                  <select
                    className="select-field"
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Minimum Quantity / Seats</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                />
              </div>

              {}
              <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Lifecycle Policies
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowPause}
                      onChange={(e) => setAllowPause(e.target.checked)}
                    />
                    <span>Allow customer / staff to pause subscription</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowRenewal}
                      onChange={(e) => setAllowRenewal(e.target.checked)}
                    />
                    <span>Allow subscription renewal</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowEarlyClosure}
                      onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                    />
                    <span>Allow early closure before expiry date</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoClose}
                      onChange={(e) => setAutoClose(e.target.checked)}
                    />
                    <span>Auto-close subscription when expiry date is reached</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Plan Description</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Target audience and included inclusions"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddPlan(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
