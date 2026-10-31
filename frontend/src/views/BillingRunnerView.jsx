import React, { useState, useEffect } from 'react';
import { Cpu, Play, Calendar, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function BillingRunnerView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulatedDate, setSimulatedDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [runResult, setRunResult] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getBillingLogs();
      setLogs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBilling = async () => {
    try {
      setProcessing(true);
      setRunResult(null);
      const res = await api.runBillingJob(simulatedDate || undefined);
      setRunResult(res);
      await loadLogs();
    } catch (err) {
      alert("Billing engine failure: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Automated Billing Engine & Scheduler</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Evaluate active subscriptions on billing dates, apply discounts, calculate taxes, and enforce duplicate prevention.
        </p>
      </div>

      {}
      <div className="card" style={{ marginBottom: '2rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 className="card-title">
              <Cpu size={20} color="var(--primary)" />
              Billing Job Trigger & Date Simulator
            </h3>
            <p className="card-subtitle">
              Simulate any due billing period or trigger the production evaluation job.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                Simulate As-Of Date (Optional):
              </span>
              <input
                type="date"
                className="input-field"
                style={{ width: '180px', padding: '0.45rem 0.75rem' }}
                value={simulatedDate}
                onChange={(e) => setSimulatedDate(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleRunBilling}
              disabled={processing}
              style={{ marginTop: '1.15rem' }}
            >
              <Play size={16} fill="currentColor" />
              <span>{processing ? 'Evaluating Subscriptions...' : 'Execute Billing Cycle'}</span>
            </button>
          </div>
        </div>

        {runResult && (
          <div style={{ marginTop: '1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, marginBottom: '0.25rem' }}>
              <CheckCircle size={18} />
              Billing Cycle Completed Successfully
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
              Evaluated {runResult.evaluated_count} due subscriptions &bull; Created {runResult.invoices_created} new invoices &bull; {runResult.errors_count} errors logged.
            </p>
          </div>
        )}
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            <ShieldCheck size={16} /> Uniqueness Safeguard
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Unique composite constraint on <code>(subscription_id, billing_period_start, billing_period_end)</code> guarantees no duplicate invoice on job retries.
          </p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            <CheckCircle size={16} /> Idempotent Processing
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Safely advances subscription next billing dates only when the billing period transaction has been securely committed.
          </p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            <Calendar size={16} /> Multi-Cycle Engine
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Supports Daily (+1 day), Weekly (+7 days), Monthly (+1 month with leap handling), and Yearly cycles seamlessly.
          </p>
        </div>
      </div>

      {}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Billing Execution Audit History
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={loadLogs}>
            <RefreshCw size={13} /> Refresh Logs
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Execution ID</th>
                <th>Run Date</th>
                <th>Subscriptions Evaluated</th>
                <th>Invoices Generated</th>
                <th>Errors Count</th>
                <th>Audit Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No previous billing execution runs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td><span className="table-code">RUN-#{l.id}</span></td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{l.run_date}</td>
                    <td>{l.subscriptions_evaluated}</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>{l.invoices_created}</td>
                    <td>
                      <span style={{ color: l.errors_count > 0 ? '#f87171' : 'var(--text-dim)', fontWeight: 600 }}>
                        {l.errors_count}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {l.details}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(l.created_at).toLocaleString()}
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
