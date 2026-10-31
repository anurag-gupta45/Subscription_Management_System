import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  ArrowRight, 
  Check, 
  X, 
  Send, 
  Copy, 
  Tag, 
  Calendar,
  Layers,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export default function QuotationsView({ userRole, onNavigate }) {
  const [activeTab, setActiveTab] = useState('quotations'); 
  const [quotations, setQuotations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);

  
  const [templateName, setTemplateName] = useState('');
  const [templatePlanId, setTemplatePlanId] = useState('');
  const [templateValidity, setTemplateValidity] = useState(30);
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateItems, setTemplateItems] = useState([]);

  const isCustomer = userRole === 'customer';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [q, t, p, prods] = await Promise.all([
        api.getQuotations(),
        api.getTemplates(),
        api.getPlans(),
        api.getProducts()
      ]);
      setQuotations(q);
      setTemplates(t);
      setPlans(p);
      setProducts(prods);

      if (userRole !== 'customer') {
        const custs = await api.getCustomers();
        setCustomers(custs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (tmpl) => {
    setSelectedPlanId(tmpl.default_plan_id ? tmpl.default_plan_id.toString() : '');
    const items = tmpl.items.map(it => ({
      product_id: it.product_id,
      variant_id: it.variant_id || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: 18.0
    }));
    setQuoteItems(items);
    setActiveTab('quotations');
    setShowNewQuote(true);
  };

  const handleAddQuoteItem = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setQuoteItems([
      ...quoteItems,
      {
        product_id: firstProd.id,
        variant_id: null,
        quantity: 1,
        unit_price: firstProd.sales_price,
        tax_rate: 18.0
      }
    ]);
  };

  const handleQuoteItemProductChange = (index, prodId) => {
    const prod = products.find(p => p.id === parseInt(prodId));
    if (!prod) return;
    const copy = [...quoteItems];
    copy[index].product_id = prod.id;
    copy[index].variant_id = null;
    copy[index].unit_price = prod.sales_price;
    setQuoteItems(copy);
  };

  const handleQuoteItemVariantChange = (index, varId) => {
    const copy = [...quoteItems];
    const prod = products.find(p => p.id === copy[index].product_id);
    if (!prod) return;

    if (!varId) {
      copy[index].variant_id = null;
      copy[index].unit_price = prod.sales_price;
    } else {
      const v = prod.variants.find(vr => vr.id === parseInt(varId));
      copy[index].variant_id = parseInt(varId);
      copy[index].unit_price = prod.sales_price + (v ? v.additional_price : 0);
    }
    setQuoteItems(copy);
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    if (quoteItems.length === 0) {
      alert("Please add at least one product line item");
      return;
    }
    try {
      await api.createQuotation({
        customer_id: parseInt(selectedCustomerId),
        plan_id: parseInt(selectedPlanId),
        payment_terms: paymentTerms,
        notes: quoteNotes,
        items: quoteItems
      });
      setShowNewQuote(false);
      resetQuoteForm();
      await loadAllData();
    } catch (err) {
      alert("Quotation creation failed: " + err.message);
    }
  };

  const resetQuoteForm = () => {
    setSelectedCustomerId('');
    setSelectedPlanId('');
    setPaymentTerms('Net 30');
    setQuoteNotes('');
    setQuoteItems([]);
  };

  const handleUpdateStatus = async (quoteId, status) => {
    try {
      await api.updateQuotationStatus(quoteId, status);
      await loadAllData();
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  const handleConvertToSubscription = async (quoteId) => {
    if (confirm("Convert this quotation into a confirmed active subscription?")) {
      try {
        const res = await api.convertQuotation(quoteId);
        alert(res.message);
        await loadAllData();
        if (onNavigate) onNavigate('subscriptions');
      } catch (err) {
        alert("Conversion failed: " + err.message);
      }
    }
  };

  
  const subtotal = quoteItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
  const taxTotal = quoteItems.reduce((acc, it) => acc + (it.quantity * it.unit_price * (it.tax_rate / 100.0)), 0);
  const totalAmount = subtotal + taxTotal;

  return (
    <div>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Quotations & Templates Workflow</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Build custom software offers from templates and convert accepted quotes into subscriptions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!isCustomer && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetQuoteForm();
                if (plans.length > 0) setSelectedPlanId(plans[0].id.toString());
                if (customers.length > 0) setSelectedCustomerId(customers[0].id.toString());
                handleAddQuoteItem();
                setShowNewQuote(true);
              }}
            >
              <Plus size={16} />
              <span>Create Quotation</span>
            </button>
          )}
        </div>
      </div>

      {}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('quotations')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            color: activeTab === 'quotations' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            borderBottom: activeTab === 'quotations' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          Customer Quotations ({quotations.length})
        </button>

        {!isCustomer && (
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.75rem 1rem',
              color: activeTab === 'templates' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
              borderBottom: activeTab === 'templates' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            Quotation Templates ({templates.length})
          </button>
        )}
      </div>

      {}
      {activeTab === 'quotations' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Selected Plan</th>
                <th>Valid Until</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id}>
                    <td><span className="table-code">{q.quotation_number}</span></td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {q.customer?.full_name || `Customer #${q.customer_id}`}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {q.customer?.company_name || q.customer?.email}
                      </div>
                    </td>
                    <td>
                      <span className="badge draft">
                        <Layers size={12} />
                        {q.plan?.name || `Plan #${q.plan_id}`}
                      </span>
                    </td>
                    <td>{q.valid_until || '—'}</td>
                    <td style={{ fontWeight: 800, color: '#34d399' }}>
                      Rs. {q.total_amount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${q.status}`}>
                        <span className="badge-dot" />
                        {q.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {}
                        {isCustomer && q.status === 'sent' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStatus(q.id, 'accepted')}
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleUpdateStatus(q.id, 'rejected')}
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}

                        {}
                        {!isCustomer && (
                          <>
                            {q.status === 'draft' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleUpdateStatus(q.id, 'sent')}
                              >
                                <Send size={14} /> Send to Client
                              </button>
                            )}

                            {(q.status === 'sent' || q.status === 'accepted') && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleConvertToSubscription(q.id)}
                                title="Convert quotation into an active subscription"
                              >
                                <ArrowRight size={14} /> Convert to Subscription
                              </button>
                            )}

                            {q.status === 'converted' && (
                              <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle2 size={14} /> Subscribed
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {}
      {activeTab === 'templates' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {templates.map((t) => (
              <div key={t.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.125rem', color: '#fff', fontWeight: 700 }}>
                    {t.name}
                  </h3>
                  <span className="badge draft">
                    {t.validity_days} Days Validity
                  </span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  {t.description || "Reusable template line items"}
                </p>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>Included Lines:</div>
                  {t.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                      <span>{it.quantity}x {it.product_name || `Product #${it.product_id}`} {it.variant_name ? `(${it.variant_name})` : ''}</span>
                      <span style={{ color: '#fff' }}>Rs. {(it.quantity * it.unit_price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => handleApplyTemplate(t)}
                >
                  <Copy size={14} />
                  <span>Create Quote from Template</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {showNewQuote && (
        <div className="modal-overlay" onClick={() => setShowNewQuote(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <FileText size={20} color="var(--primary)" />
                Prepare Quotation Offer
              </h3>
              <button className="modal-close-btn" onClick={() => setShowNewQuote(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateQuotation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer Account</label>
                  <select
                    required
                    className="select-field"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.company_name || c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subscription Plan</label>
                  <select
                    required
                    className="select-field"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                  >
                    <option value="">-- Choose Plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Rs. {p.price.toLocaleString()} /{p.billing_cycle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {}
              <div style={{ margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Product Line Items & Variants
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddQuoteItem}
                  >
                    + Add Product Line
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {quoteItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.product_id);
                    const variants = prod?.variants || [];
                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.2fr 1fr 36px', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        {}
                        <select
                          className="select-field"
                          value={item.product_id}
                          onChange={(e) => handleQuoteItemProductChange(idx, e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        {}
                        <select
                          className="select-field"
                          value={item.variant_id || ''}
                          onChange={(e) => handleQuoteItemVariantChange(idx, e.target.value)}
                        >
                          <option value="">Base Edition (+Rs. 0)</option>
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.variant_name} (+Rs. {v.additional_price})
                            </option>
                          ))}
                        </select>

                        {}
                        <input
                          type="number"
                          min="1"
                          className="input-field"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...quoteItems];
                            copy[idx].quantity = parseInt(e.target.value) || 1;
                            setQuoteItems(copy);
                          }}
                        />

                        {}
                        <input
                          type="number"
                          step="0.01"
                          className="input-field"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => {
                            const copy = [...quoteItems];
                            copy[idx].unit_price = parseFloat(e.target.value) || 0;
                            setQuoteItems(copy);
                          }}
                        />

                        {}
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#38bdf8', textAlign: 'right' }}>
                          Rs. {(item.quantity * item.unit_price).toLocaleString()}
                        </div>

                        {}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.35rem' }}
                          onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginLeft: 'auto', width: '280px', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Tax (18%):</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>Rs. {taxTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#34d399', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                  <span>Total Amount:</span>
                  <span>Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewQuote(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
