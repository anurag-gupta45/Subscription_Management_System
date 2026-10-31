import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';
import { api } from '../api';

export default function PaymentsView({ userRole, preSelectedInvoice, clearPreSelectedInvoice }) {
  const [payments, setPayments] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);

  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const isCustomer = userRole === 'customer';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preSelectedInvoice) {
      setSelectedInvoiceId(preSelectedInvoice.id.toString());
      setAmount(preSelectedInvoice.outstanding_balance.toString());
      setShowRecordModal(true);
    }
  }, [preSelectedInvoice]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pays, invs] = await Promise.all([
        api.getPayments(),
        api.getInvoices('confirmed')
      ]);
      setPayments(pays);
      setUnpaidInvoices(invs.filter(i => i.outstanding_balance > 0.01));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedInv = unpaidInvoices.find(i => i.id === parseInt(selectedInvoiceId));
  const maxAllowed = selectedInv ? selectedInv.outstanding_balance : 0;
  const numAmount = parseFloat(amount || '0');
  const remainingAfterPayment = Math.max(0, maxAllowed - numAmount);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (numAmount <= 0) {
      setFormError("Payment amount must be greater than zero");
      return;
    }

    if (numAmount > maxAllowed) {
      setFormError(`Payment amount (Rs. ${numAmount}) cannot exceed outstanding invoice balance (Rs. ${maxAllowed})`);
      return;
    }

    try {
      await api.recordPayment({
        invoice_id: parseInt(selectedInvoiceId),
        amount: numAmount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        notes: notes
      });
      setShowRecordModal(false);
      resetForm();
      if (clearPreSelectedInvoice) clearPreSelectedInvoice();
      await loadData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const resetForm = () => {
    setSelectedInvoiceId('');
    setAmount('');
    setPaymentMethod('Bank Transfer');
    setNotes('');
    setFormError('');
  };

  const filtered = payments.filter(p =>
    p.payment_reference.toLowerCase().includes(search.toLowerCase()) ||
    (p.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    p.payment_method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Payment Ledger & Settlements</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Multi-method payment recording with real-time invoice balance tracking and partial settlement support.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            if (unpaidInvoices.length > 0) {
              setSelectedInvoiceId(unpaidInvoices[0].id.toString());
              setAmount(unpaidInvoices[0].outstanding_balance.toString());
            }
            setShowRecordModal(true);
          }}
        >
          <Plus size={16} />
          <span>Record Payment</span>
        </button>
      </div>

      {}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search by payment ref, invoice #, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Payment Ref</th>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Payment Method</th>
              <th>Payment Date</th>
              <th>Amount Settled</th>
              <th>Notes / Transaction</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No payments recorded.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td><span className="table-code">{p.payment_reference}</span></td>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>
                    {p.invoice_number || `Invoice #${p.invoice_id}`}
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {p.customer_name || `Customer #${p.customer_id}`}
                  </td>
                  <td>
                    <span className="badge draft">
                      <CreditCard size={12} />
                      {p.payment_method}
                    </span>
                  </td>
                  <td>{p.payment_date}</td>
                  <td style={{ fontWeight: 800, color: '#34d399' }}>
                    Rs. {p.amount.toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {p.notes || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {}
      {showRecordModal && (
        <div className="modal-overlay" onClick={() => { setShowRecordModal(false); if (clearPreSelectedInvoice) clearPreSelectedInvoice(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <CreditCard size={20} color="var(--primary)" />
                Record Incoming Payment
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => { setShowRecordModal(false); if (clearPreSelectedInvoice) clearPreSelectedInvoice(); }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">Select Unpaid Invoice</label>
                <select
                  required
                  className="select-field"
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = unpaidInvoices.find(i => i.id === parseInt(e.target.value));
                    if (inv) setAmount(inv.outstanding_balance.toString());
                  }}
                >
                  <option value="">-- Choose Invoice to Settle --</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.customer?.full_name} (Bal: Rs. {inv.outstanding_balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInv && (
                <div style={{ background: 'var(--bg-subtle)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Invoice Total:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>Rs. {selectedInv.total_amount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Current Balance Due:</span>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>Rs. {selectedInv.outstanding_balance.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Balance After Payment:</span>
                    <span style={{ color: remainingAfterPayment <= 0.01 ? '#34d399' : '#fbbf24', fontWeight: 800 }}>
                      Rs. {remainingAfterPayment.toLocaleString()} {remainingAfterPayment <= 0.01 ? '(Will mark as PAID)' : '(Partial)'}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Payment Amount (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={maxAllowed}
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="select-field"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Bank Reference #</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. UTR / Transaction Ref #98765432"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowRecordModal(false); if (clearPreSelectedInvoice) clearPreSelectedInvoice(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
