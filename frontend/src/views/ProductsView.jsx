import React, { useState, useEffect } from 'react';
import { Package, Plus, Archive, ChevronDown, ChevronRight, Tag, Layers, Search, Check, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(null); 
  const [expandedProduct, setExpandedProduct] = useState({});

  
  const [prodName, setProdName] = useState('');
  const [prodType, setProdType] = useState('Software License');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [prodNotes, setProdNotes] = useState('');
  const [initialVariants, setInitialVariants] = useState([]);

  
  const [varName, setVarName] = useState('');
  const [varPrice, setVarPrice] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts(true);
      setProducts(res);
      
      const exp = {};
      res.forEach(p => { exp[p.id] = true; });
      setExpandedProduct(exp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: prodName,
        product_type: prodType,
        sales_price: parseFloat(salesPrice),
        cost_price: parseFloat(costPrice || '0'),
        notes: prodNotes,
        variants: initialVariants.map(v => ({
          variant_name: v.name,
          additional_price: parseFloat(v.price)
        }))
      });
      setShowAddProduct(false);
      resetProdForm();
      await loadProducts();
    } catch (err) {
      alert("Failed to create product: " + err.message);
    }
  };

  const resetProdForm = () => {
    setProdName('');
    setProdType('Software License');
    setSalesPrice('');
    setCostPrice('');
    setProdNotes('');
    setInitialVariants([]);
  };

  const handleAddVariantToProduct = async (e) => {
    e.preventDefault();
    try {
      await api.addVariant(showAddVariant, {
        variant_name: varName,
        additional_price: parseFloat(varPrice || '0')
      });
      setShowAddVariant(null);
      setVarName('');
      setVarPrice('');
      await loadProducts();
    } catch (err) {
      alert("Failed to add variant: " + err.message);
    }
  };

  const handleArchiveProduct = async (id) => {
    if (confirm("Are you sure you want to archive this product?")) {
      await api.archiveProduct(id);
      await loadProducts();
    }
  };

  const handleArchiveVariant = async (vId) => {
    if (confirm("Archive this product variant?")) {
      await api.archiveVariant(vId);
      await loadProducts();
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.product_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Products & Product Variants</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Catalogue items with dynamic variant pricing (Final Price = Base Price + Variant Add-on).
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowAddProduct(true)}
        >
          <Plus size={16} />
          <span>New Product</span>
        </button>
      </div>

      {}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search products by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filtered.map((prod) => {
          const isExpanded = expandedProduct[prod.id];
          return (
            <div key={prod.id} className="card" style={{ opacity: prod.is_archived ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <button 
                    onClick={() => setExpandedProduct(p => ({ ...p, [prod.id]: !p[prod.id] }))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '4px' }}
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.125rem', color: '#fff', fontWeight: 700 }}>
                        {prod.name}
                      </h3>
                      <span className="badge draft">
                        <Tag size={12} />
                        {prod.product_type}
                      </span>
                      {prod.is_archived && (
                        <span className="badge cancelled">Archived</span>
                      )}
                    </div>

                    {prod.notes && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        {prod.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Base Sales Price
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                      Rs. {prod.sales_price.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      Cost: Rs. {prod.cost_price.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAddVariant(prod.id)}
                    >
                      <Plus size={14} />
                      <span>Add Variant</span>
                    </button>
                    {!prod.is_archived && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleArchiveProduct(prod.id)}
                        title="Archive Product"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {}
              {isExpanded && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Available Variants & Formula Calculation
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Formula: Final Price = Base Price + Variant Price
                    </span>
                  </div>

                  {prod.variants.length === 0 ? (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                      No variants configured. Base price applies.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Variant Name</th>
                            <th>Additional Price</th>
                            <th>Final Unit Price</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prod.variants.map((v) => {
                            const finalPrice = prod.sales_price + v.additional_price;
                            return (
                              <tr key={v.id}>
                                <td style={{ fontWeight: 600, color: '#fff' }}>
                                  {v.variant_name}
                                </td>
                                <td>
                                  + Rs. {v.additional_price.toLocaleString()}
                                </td>
                                <td style={{ fontWeight: 800, color: '#38bdf8' }}>
                                  Rs. {finalPrice.toLocaleString()}
                                </td>
                                <td>
                                  <span className={`badge ${v.is_archived ? 'cancelled' : 'active'}`}>
                                    <span className="badge-dot" />
                                    {v.is_archived ? 'Archived' : 'Active'}
                                  </span>
                                </td>
                                <td>
                                  {!v.is_archived && (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => handleArchiveVariant(v.id)}
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                    >
                                      Archive
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {}
      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">
                <Package size={20} color="var(--primary)" />
                Create New Product
              </h3>
              <button className="modal-close-btn" onClick={() => setShowAddProduct(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Brightloop Analytics Engine"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product Type / Category</label>
                  <select 
                    className="select-field"
                    value={prodType}
                    onChange={(e) => setProdType(e.target.value)}
                  >
                    <option value="Software License">Software License</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Support Service">Support Service</option>
                    <option value="Add-on Module">Add-on Module</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Base Sales Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-field"
                    placeholder="1000.00"
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Cost Price (Internal Cost)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="200.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Notes</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Specifications or description"
                    value={prodNotes}
                    onChange={(e) => setProdNotes(e.target.value)}
                  />
                </div>
              </div>

              {}
              <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
                    Initial Variants (Optional)
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setInitialVariants(v => [...v, { name: '', price: '' }])}
                  >
                    + Add Row
                  </button>
                </div>

                {initialVariants.map((iv, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Variant name (e.g. Odoo Brand Edition)"
                      value={iv.name}
                      onChange={(e) => {
                        const copy = [...initialVariants];
                        copy[idx].name = e.target.value;
                        setInitialVariants(copy);
                      }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      style={{ width: '160px' }}
                      placeholder="Additional Rs."
                      value={iv.price}
                      onChange={(e) => {
                        const copy = [...initialVariants];
                        copy[idx].price = e.target.value;
                        setInitialVariants(copy);
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setInitialVariants(initialVariants.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddProduct(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showAddVariant && (
        <div className="modal-overlay" onClick={() => setShowAddVariant(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="card-title">Add Variant</h3>
              <button className="modal-close-btn" onClick={() => setShowAddVariant(null)}>✕</button>
            </div>

            <form onSubmit={handleAddVariantToProduct}>
              <div className="form-group">
                <label className="form-label">Variant Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Odoo Brand Edition"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Price (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input-field"
                  placeholder="560.00"
                  value={varPrice}
                  onChange={(e) => setVarPrice(e.target.value)}
                />
                <p className="form-hint">
                  This amount will be added to the product's base price when selected.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddVariant(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
