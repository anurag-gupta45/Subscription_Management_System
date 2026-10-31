import React, { useState, useEffect } from 'react';
import { Percent, Plus, Tag, Calendar, Layers, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function TaxesAndDiscountsView() {
  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [showAddTax, setShowAddTax] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [taxDesc, setTaxDesc] = useState('');

  
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [discCode, setDiscCode] = useState('');
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState('percentage');
  const [discValue, setDiscValue] = useState('');
  const [discScope, setDiscScope] = useState('whole_subscription');
  const [applicableProdId, setApplicableProdId] = useState('');
  const [minPurchase, setMinPurchase] = useState('0');
  const [minQty, setMinQty] = useState('0');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [t, d, prods] = await Promise.all([
        api.getTaxes(),
        api.getDiscounts(),
        api.getProducts()
      ]);
      setTaxes(t);
      setDiscounts(d);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTax = async (e) => {
    e.preventDefault();
    try {
      await api.createTax({
        name: taxName,
        rate: parseFloat(taxRate),
        description: taxDesc,
        is_active: true
      });
      setShowAddTax(false);
      setTaxName('');
      setTaxRate('');
      setTaxDesc('');
      await loadData();
    } catch (err) {
      alert("Failed to create tax rule: " + err.message);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      await api.createDiscount({
        code: discCode.toUpperCase(),
        name: discName,
        discount_type: discType,
        discount_value: parseFloat(discValue),
        scope: discScope,
        applicable_product_id: discScope === 'specific_product' && applicableProdId ? parseInt(applicableProdId) : null,
        minimum_purchase: parseFloat(minPurchase || '0'),
        minimum_quantity: parseInt(minQty || '0'),
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        is_active: true
      });
      setShowAddDiscount(false);
      resetDiscountForm();
      await loadData();
    } catch (err) {
      alert("Failed to create discount: " + err.message);
    }
  };

  const resetDiscountForm = () => {
    setDiscCode('');
    setDiscName('');
    setDiscType('percentage');
    setDiscValue('');
    setDiscScope('whole_subscription');
    setApplicableProdId('');
    setMinPurchase('0');
    setMinQty('0');
    setUsageLimit('');
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Taxes & Discount Rules</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Configure jurisdictional tax slabs and rule-based promotional discounts with usage limits and eligibility criteria.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem' }}>
        {}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>
              Tax Configuration Rates
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddTax(true)}>
              <Plus size={14} /> Add Tax Slab
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tax Name</th>
                  <th>Rate (%)</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{t.name}</td>
                    <td style={{ fontWeight: 800, color: '#38bdf8' }}>{t.rate}%</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t.description || '—'}</td>
                    <td>
                      <span className={`badge ${t.is_active ? 'active' : 'cancelled'}`}>
                        <span className="badge-dot" />
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>
              Discount Eligibility Rules
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddDiscount(true)}>
              <Plus size={14} /> New Discount Rule
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code / Name</th>
                  <th>Value</th>
                  <th>Scope</th>
                  <th>Usage Limit</th>
                  <th>Min Purchase</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="table-code">{d.code}</span>
                      <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                        {d.name}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#34d399' }}>
                      {d.discount_type === 'percentage' ? `${d.discount_value}%` : `Rs. ${d.discount_value}`}
                    </td>
                    <td style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                      {d.scope.replace('_', ' ')}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: d.usage_limit && d.times_used >= d.usage_limit ? '#f87171' : '#cbd5e1' }}>
                        {d.times_used} / {d.usage_limit !== null ? d.usage_limit : '∞'} used
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      Rs. {d.minimum_purchase.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {}
      {showAddTax && (
        <div className="modal-overlay" onClick={() => setShowAddTax(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="card-title">Add Tax Rate</h3>
              <button className="modal-close-btn" onClick={() => setShowAddTax(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTax}>
              <div className="form-group">
                <label className="form-label">Tax Name (e.g. GST 18%, VAT 5%)</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="GST 18%"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Percentage Rate</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input-field"
                  placeholder="18.0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Applies to software services"
                  value={taxDesc}
                  onChange={(e) => setTaxDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTax(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Tax</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showAddDiscount && (
        <div className="modal-overlay" onClick={() => setShowAddDiscount(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="card-title">Create Discount Rule</h3>
              <button className="modal-close-btn" onClick={() => setShowAddDiscount(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDiscount}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Coupon / Rule Code</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. PROMO2026"
                    value={discCode}
                    onChange={(e) => setDiscCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Label</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="New Customer Special"
                    value={discName}
                    onChange={(e) => setDiscName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="select-field"
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deduction Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-field"
                    placeholder={discType === 'percentage' ? '10%' : '500.00'}
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Application Scope</label>
                  <select
                    className="select-field"
                    value={discScope}
                    onChange={(e) => setDiscScope(e.target.value)}
                  >
                    <option value="whole_subscription">Whole Subscription</option>
                    <option value="specific_product">Specific Product</option>
                  </select>
                </div>

                {discScope === 'specific_product' && (
                  <div className="form-group">
                    <label className="form-label">Applicable Product</label>
                    <select
                      className="select-field"
                      value={applicableProdId}
                      onChange={(e) => setApplicableProdId(e.target.value)}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Min Purchase Required (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Usage Limit (Max Uses)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Leave empty for unlimited"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDiscount(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Discount Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
