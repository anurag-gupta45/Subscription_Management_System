import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Printer, 
  Search, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Play,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../api';

export default function InvoicesView({ userRole, onNavigate, onSelectInvoiceForPayment }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  const isCustomer = userRole === 'customer';

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices(statusFilter || undefined);
      setInvoices(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = (inv) => {
    setSelectedInvoice(inv);
    setShowBillModal(true);
  };

  const handleGenerateDueInvoices = async () => {
    try {
      const res = await api.generateDueInvoices();
      alert(`Recurring Billing Complete: Generated ${res.invoices_created} new invoices.`);
      await loadInvoices();
    } catch (err) {
      alert("Billing run failed: " + err.message);
    }
  };

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customer?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.subscription_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>
            {isCustomer ? 'My Invoices & Bills' : 'Invoice & Recurring Billing Management'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Accurate billing records with automatic period uniqueness safeguards, tax calculations, and balance tracking.
          </p>
        </div>

        {!isCustomer && (
          <button 
            className="btn btn-primary"
            onClick={handleGenerateDueInvoices}
          >
            <Play size={15} fill="currentColor" />
            <span>Generate Due Invoices</span>
          </button>
        )}
      </div>

      {}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search invoices by invoice #, customer, or subscription ref..."
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
          <option value="confirmed">Confirmed (Unpaid)</option>
          <option value="paid">Fully Paid</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Billing Period</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span className="table-code">{inv.invoice_number}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      Ref: {inv.subscription_number || `Sub #${inv.subscription_id}`}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {inv.customer?.full_name || `Customer #${inv.customer_id}`}
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    <div>{inv.billing_period_start} &rarr;</div>
                    <div style={{ color: 'var(--text-dim)' }}>{inv.billing_period_end}</div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {inv.due_date}
                  </td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>
                    Rs. {inv.total_amount.toLocaleString()}
                  </td>
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
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePrintBill(inv)}
                        title="View printable bill"
                      >
                        <Printer size={13} /> Bill
                      </button>

                      {inv.outstanding_balance > 0.01 && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            if (onSelectInvoiceForPayment) onSelectInvoiceForPayment(inv);
                            if (onNavigate) onNavigate('payments');
                          }}
                        >
                          <CreditCard size={13} /> Pay
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
      {showBillModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} /> Print Document
                </button>
              </div>
              <button className="modal-close-btn" onClick={() => setShowBillModal(false)}>✕</button>
            </div>

            {}
            <div className="invoice-sheet" id="printable-invoice">
              <div className="invoice-header-row">
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Brightloop Software</h2>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Enterprise Cloud Software & Subscription Services<br />
                    GSTIN: 27AABCB1234F1Z8 &bull; support@brightloop.com
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5' }}>TAX INVOICE</h3>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{selectedInvoice.invoice_number}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Date: {selectedInvoice.invoice_date}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 600 }}>Due Date: {selectedInvoice.due_date}</div>
                </div>
              </div>

              {}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <strong style={{ color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem' }}>Billed To:</strong>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{selectedInvoice.customer?.full_name}</div>
                  <div>{selectedInvoice.customer?.company_name}</div>
                  <div>{selectedInvoice.customer?.email}</div>
                </div>
                <div>
                  <strong style={{ color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem' }}>Coverage Period & Ref:</strong>
                  <div>Subscription Ref: <strong>{selectedInvoice.subscription_number || selectedInvoice.subscription_id}</strong></div>
                  <div>Period: {selectedInvoice.billing_period_start} to {selectedInvoice.billing_period_end}</div>
                  <div>Status: <strong style={{ textTransform: 'capitalize', color: selectedInvoice.status === 'paid' ? '#059669' : '#dc2626' }}>{selectedInvoice.status}</strong></div>
                </div>
              </div>

              {}
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Tax Rate</th>
                    <th>Tax Amount</th>
                    <th style={{ textAlign: 'right' }}>Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{it.product_name}</strong>
                        {it.variant_name && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Variant: {it.variant_name}</div>}
                      </td>
                      <td>{it.quantity}</td>
                      <td>Rs. {it.unit_price.toLocaleString()}</td>
                      <td>{it.tax_rate}%</td>
                      <td>Rs. {it.tax_amount.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {it.line_total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {}
              <div className="invoice-totals-col">
                <div className="invoice-total-row">
                  <span>Subtotal:</span>
                  <span>Rs. {selectedInvoice.subtotal.toLocaleString()}</span>
                </div>
                {selectedInvoice.discount_total > 0 && (
                  <div className="invoice-total-row" style={{ color: '#059669' }}>
                    <span>Discounts:</span>
                    <span>- Rs. {selectedInvoice.discount_total.toLocaleString()}</span>
                  </div>
                )}
                <div className="invoice-total-row">
                  <span>Tax Total:</span>
                  <span>Rs. {selectedInvoice.tax_total.toLocaleString()}</span>
                </div>
                <div className="invoice-total-row grand-total">
                  <span>Invoice Total:</span>
                  <span>Rs. {selectedInvoice.total_amount.toLocaleString()}</span>
                </div>
                <div className="invoice-total-row" style={{ color: '#059669', fontWeight: 600 }}>
                  <span>Amount Paid:</span>
                  <span>Rs. {selectedInvoice.paid_amount.toLocaleString()}</span>
                </div>
                <div className="invoice-total-row" style={{ color: selectedInvoice.outstanding_balance > 0.01 ? '#dc2626' : '#059669', fontWeight: 800, fontSize: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                  <span>Balance Due:</span>
                  <span>Rs. {selectedInvoice.outstanding_balance.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                Thank you for choosing Brightloop Software! This is a computer-generated tax invoice.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
