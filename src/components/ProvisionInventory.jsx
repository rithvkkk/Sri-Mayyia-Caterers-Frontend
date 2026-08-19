import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Boxes, Plus, Search, AlertTriangle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';

const ProvisionInventory = () => {
  const { provisions, addProvision, updateProvision, deleteProvision, suppliers, companyProfile } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Grocery', unit: 'kg', stockQty: 100, reorderLevel: 25, costPerUnit: 80, supplierId: suppliers[0]?.id || '' });

  const formatCurrency = (amount) => `${companyProfile.currency} ${Number(amount || 0).toLocaleString('en-IN')}`;
  const getSupplierName = (supId) => { const s = suppliers.find(sup => sup.id === supId); return s ? s.name : 'Local Market / Wholesaler'; };

  const lowStockCount = provisions.filter(p => Number(p.stockQty) <= Number(p.reorderLevel)).length;
  const totalValue = provisions.reduce((sum, p) => sum + ((Number(p.stockQty) || 0) * (Number(p.costPerUnit) || 0)), 0);

  const filtered = provisions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, stockQty: Number(form.stockQty), reorderLevel: Number(form.reorderLevel), costPerUnit: Number(form.costPerUnit) };
    if (editingItem) { updateProvision({ ...payload, id: editingItem.id }); } else { addProvision(payload); }
    setIsModalOpen(false); setEditingItem(null);
    setForm({ name: '', category: 'Grocery', unit: 'kg', stockQty: 100, reorderLevel: 25, costPerUnit: 80, supplierId: suppliers[0]?.id || '' });
  };

  const openEdit = (p) => { setEditingItem(p); setForm(p); setIsModalOpen(true); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Provision Inventory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track grocery, spices, oils, dry fruits and all provision stock levels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setForm({ name: '', category: 'Grocery', unit: 'kg', stockQty: 100, reorderLevel: 25, costPerUnit: 80, supplierId: suppliers[0]?.id || '' }); setIsModalOpen(true); }}>
          <Plus size={18} /><span>Add Provision Item</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpis" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Provisions</h3>
            <div className="kpi-value">{provisions.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>items</span></div>
          </div>
          <div className="kpi-icon icon-amber"><Boxes size={22} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Low Stock Alerts</h3>
            <div className="kpi-value" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{lowStockCount}</div>
            <div style={{ fontSize: '0.75rem', color: lowStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)', marginTop: '0.25rem', fontWeight: 600 }}>
              {lowStockCount > 0 ? `${lowStockCount} items need reorder` : 'All stock healthy'}
            </div>
          </div>
          <div className="kpi-icon icon-blue"><AlertTriangle size={22} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Stock Value</h3>
            <div className="kpi-value">{formatCurrency(totalValue)}</div>
          </div>
          <div className="kpi-icon icon-green"><CheckCircle2 size={22} /></div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input type="text" placeholder="Search provisions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}>
            <option value="All">All Categories</option>
            <option value="Grocery">Grocery</option>
            <option value="Ghee & Oils">Ghee & Oils</option>
            <option value="Spices & Condiments">Spices & Condiments</option>
            <option value="Dry Fruits">Dry Fruits</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Provision Item</th>
                <th>Category</th>
                <th>Stock Quantity</th>
                <th>Reorder Level</th>
                <th>Stock Status</th>
                <th>Cost / Unit</th>
                <th>Primary Supplier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLowStock = Number(p.stockQty) <= Number(p.reorderLevel);
                return (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {p.id}</div></td>
                    <td><span className="badge badge-info">{p.category}</span></td>
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>{p.stockQty} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.unit}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.reorderLevel} {p.unit}</td>
                    <td>{isLowStock ? (<span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={12} /> Low Stock Alert</span>) : (<span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={12} /> Adequate</span>)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.costPerUnit)} / {p.unit}</td>
                    <td>{getSupplierName(p.supplierId)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button className="btn btn-secondary btn-small" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-secondary btn-small" onClick={() => deleteProvision(p.id)} style={{ color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (<tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No provision items found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '550px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editingItem ? 'Edit Provision Item' : 'Add Provision Item'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Provision Name</label>
                <input type="text" required placeholder="e.g. Basmati Rice / Cooking Oil" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <option value="Grocery">Grocery</option><option value="Ghee & Oils">Ghee & Oils</option><option value="Spices & Condiments">Spices & Condiments</option><option value="Dry Fruits">Dry Fruits</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Unit of Measure</label>
                  <input type="text" required placeholder="kg, ltr, bag, pkt" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Current Stock Qty</label>
                  <input type="number" min="0" required value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Reorder Threshold</label>
                  <input type="number" min="0" required value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Cost / Unit ({companyProfile.currency})</label>
                  <input type="number" min="0" required value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Primary Supplier</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.category})</option>))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Provision' : 'Save Provision'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvisionInventory;
