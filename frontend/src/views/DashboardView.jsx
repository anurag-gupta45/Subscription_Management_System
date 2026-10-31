import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Calendar,
  Layers,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { api } from '../api';

export default function DashboardView({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [plans, setPlans] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);
  const [jobResult, setJobResult] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [m, p, trends, overdue] = await Promise.all([
        api.getDashboardSummary(),
        api.getPlanDistribution(),
        api.getMonthlyCollections(),
        api.getOverdueInvoices()
      ]);
      setMetrics(m);
      setPlans(p);
      setMonthlyData(trends);
      setOverdueInvoices(overdue);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBillingJob = async () => {
    try {
      setRunningJob(true);
      setJobResult(null);
      const res = await api.runBillingJob();
      setJobResult(res);
      await loadDashboard();
    } catch (err) {
      alert("Billing run error: " + err.message);
    } finally {
      setRunningJob(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
          Loading Brightloop Financial Analytics...
        </div>
        <p>Calculating recurring revenues, overdue metrics and active subscriptions...</p>
      </div>
    );
  }

  const maxCollection = Math.max(...monthlyData.map(d => Math.max(d.collected, d.invoiced, 1000)), 5000);

  return (
    <div>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Executive & Finance Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time subscription operations, MRR trajectory, collections, and overdue receivables.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary"
            onClick={handleRunBillingJob}
            disabled={runningJob}
          >
            <Play size={16} fill="currentColor" />
            <span>{runningJob ? 'Processing Billing...' : 'Run Billing Engine'}</span>
          </button>
        </div>
      </div>

      {jobResult && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontWeight: 700, color: '#a5b4fc' }}>Billing Execution Report:</span>{' '}
            <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
              Evaluated {jobResult.evaluated_count} subscriptions &bull; Generated {jobResult.invoices_created} new invoices &bull; 0 skipped &bull; Idempotency guaranteed.
            </span>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setJobResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {}
      <div className="metrics-grid">
        <div className="metric-card success">
          <div className="metric-top">
            <span className="metric-label">Active Subscriptions</span>
            <div className="metric-icon-wrap" style={{ background: 'var(--success-bg)', color: '#34d399' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="metric-value">{metrics?.active_subscriptions || 0}</div>
          <div className="metric-footer">
            <span>{metrics?.total_subscriptions || 0} total records in lifecycle</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Revenue Collected</span>
            <div className="metric-icon-wrap">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="metric-value">Rs. {(metrics?.revenue_received || 0).toLocaleString()}</div>
          <div className="metric-footer">
            <span>{metrics?.total_payments_count || 0} recorded payments</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Outstanding Receivables</span>
            <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
              <Receipt size={20} />
            </div>
          </div>
          <div className="metric-value">Rs. {(metrics?.outstanding_amount || 0).toLocaleString()}</div>
          <div className="metric-footer">
            <span>Awaiting customer settlement</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-top">
            <span className="metric-label">Overdue Invoices</span>
            <div className="metric-icon-wrap" style={{ background: 'var(--warning-bg)', color: '#fbbf24' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#fbbf24' }}>
            Rs. {(metrics?.overdue_invoices_amount || 0).toLocaleString()}
          </div>
          <div className="metric-footer">
            <span style={{ color: '#f87171', fontWeight: 600 }}>
              {metrics?.overdue_invoices_count || 0} invoices past payment due date
            </span>
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Monthly Invoicing & Collections</h3>
              <p className="card-subtitle">Comparing billing generated vs actual incoming cash</p>
            </div>
          </div>

          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '1.25rem', paddingTop: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            {monthlyData.length === 0 ? (
              <div style={{ margin: 'auto', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                No past billing history to display yet
              </div>
            ) : (
              monthlyData.map((d, idx) => {
                const invHeight = Math.round((d.invoiced / maxCollection) * 160);
                const colHeight = Math.round((d.collected / maxCollection) * 160);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '170px' }}>
                      {}
                      <div 
                        title={`Invoiced: Rs. ${d.invoiced.toLocaleString()}`}
                        style={{
                          width: '18px',
                          height: `${Math.max(invHeight, 6)}px`,
                          background: 'rgba(99, 102, 241, 0.4)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.4s ease'
                        }}
                      />
                      {}
                      <div 
                        title={`Collected: Rs. ${d.collected.toLocaleString()}`}
                        style={{
                          width: '18px',
                          height: `${Math.max(colHeight, 6)}px`,
                          background: 'linear-gradient(180deg, #10b981, #059669)',
                          borderRadius: '4px 4px 0 0',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
                          transition: 'height 0.4s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>
                      {d.month}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'rgba(99, 102, 241, 0.4)', borderRadius: '2px' }} />
              <span>Invoiced Total</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
              <span>Cash Collected</span>
            </div>
          </div>
        </div>

        {}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Subscriptions by Plan</h3>
              <p className="card-subtitle">Active customer distribution across tier plans</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {plans.map((p) => {
              const totalActive = metrics?.active_subscriptions || 1;
              const pct = Math.round((p.active_subscriptions / totalActive) * 100);
              return (
                <div key={p.plan_id} style={{ background: 'var(--bg-subtle)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                      {p.plan_name}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#a5b4fc', fontWeight: 600 }}>
                      {p.active_subscriptions} active &bull; Rs. {p.price.toLocaleString()} /{p.billing_cycle}
                    </span>
                  </div>
                  {}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {}
      {overdueInvoices.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ color: '#fbbf24' }}>
                <AlertTriangle size={20} />
                Overdue Invoices Requiring Follow-Up
              </h3>
              <p className="card-subtitle">Unpaid balances on invoices past their specified due date</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('invoices')}>
              Manage All Invoices
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Invoice Amount</th>
                  <th>Balance Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><span className="table-code">{inv.invoice_number}</span></td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{inv.customer_name}</td>
                    <td>{inv.due_date}</td>
                    <td>
                      <span className="badge cancelled">
                        <span className="badge-dot" />
                        {inv.days_overdue} days past due
                      </span>
                    </td>
                    <td>Rs. {inv.total_amount.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#f87171' }}>
                      Rs. {inv.outstanding_balance.toLocaleString()}
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onNavigate('payments')}
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
