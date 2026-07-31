import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Package, Utensils, Plus, Search, Edit2, Trash2, MapPin, Sparkles } from 'lucide-react';

const StorageInventory = () => {
  const { vessels, addVessel, updateVessel, deleteVessel, companyProfile } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Cooking Vessel', totalQty: 10, availableQty: 10, inUseQty: 0, damagedQty: 0, location: 'Main Store A', valuePerUnit: 1000 });

  const formatCurrency = (amount) => `${companyProfile.currency} ${Number(amount || 0).toLocaleString('en-IN')}`;

  const totalCount = vessels.reduce((acc, v) => acc + (Number(v.totalQty) || 0), 0);
  const damagedCount = vessels.reduce((acc, v) => acc + (Number(v.damagedQty) || 0), 0);
  const totalValue = vessels.reduce((sum, v) => sum + ((Number(v.totalQty) || 0) * (Number(v.valuePerUnit) || 0)), 0);

  const filtered = vessels.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, totalQty: Number(form.totalQty), availableQty: Number(form.availableQty), inUseQty: Number(form.inUseQty), damagedQty: Number(form.damagedQty), valuePerUnit: Number(form.valuePerUnit) };
    if (editingItem) { updateVessel({ ...payload, id: editingItem.id }); } else { addVessel(payload); }
    setIsModalOpen(false); setEditingItem(null);
    setForm({ name: '', category: 'Cooking Vessel', totalQty: 10, availableQty: 10, inUseQty: 0, damagedQty: 0, location: 'Main Store A', valuePerUnit: 1000 });
  };

  const openEdit = (v) => { setEditingItem(v); setForm(v); setIsModalOpen(true); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Storage Inventory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track vessels, utensils, cooking equipment and storage assets.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setForm({ name: '', category: 'Cooking Vessel', totalQty: 10, availableQty: 10, inUseQty: 0, damagedQty: 0, location: 'Main Store A', valuePerUnit: 1000 }); setIsModalOpen(true); }}>
          <Plus size={18} /><span>Add Vessel / Gear</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpis" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Vessels & Utensils</h3>
            <div className="kpi-value">{totalCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>units</span></div>
            {damagedCount > 0 && (<div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.25rem', fontWeight: 600 }}>⚠️ {damagedCount} damaged/lost</div>)}
          </div>
          <div className="kpi-icon icon-blue"><Utensils size={22} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Item Categories</h3>
            <div className="kpi-value">{vessels.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>types</span></div>
          </div>
          <div className="kpi-icon icon-purple"><Package size={22} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Asset Value</h3>
            <div className="kpi-value">{formatCurrency(totalValue)}</div>
          </div>
          <div className="kpi-icon icon-green"><Sparkles size={22} /></div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input type="text" placeholder="Search vessels & equipment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}>
            <option value="All">All Categories</option>
            <option value="Cooking Vessel">Cooking Vessel</option>
            <option value="Serving Gear">Serving Gear</option>
            <option value="Utensils">Utensils</option>
            <option value="Heating & Fuel">Heating & Fuel</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vessel / Item Name</th>
                <th>Category</th>
                <th>Total Qty</th>
                <th>Available</th>
                <th>In Use</th>
                <th>Damaged</th>
                <th>Storage Location</th>
                <th>Unit Value</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {v.id}</div></td>
                  <td><span className="badge badge-info">{v.category}</span></td>
                  <td style={{ fontWeight: 700 }}>{v.totalQty}</td>
                  <td><span className="badge badge-success">{v.availableQty} ready</span></td>
                  <td>{v.inUseQty > 0 ? (<span className="badge badge-warning">{v.inUseQty} in events</span>) : (<span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>0</span>)}</td>
                  <td>{v.damagedQty > 0 ? (<span className="badge badge-danger">{v.damagedQty} damaged</span>) : (<span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>0</span>)}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}><MapPin size={14} className="accent-text" /><span>{v.location || 'Main Store'}</span></div></td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(v.valuePerUnit)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-small" onClick={() => openEdit(v)} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-secondary btn-small" onClick={() => deleteVessel(v.id)} style={{ color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (<tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No vessels or equipment found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '550px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editingItem ? 'Edit Vessel / Equipment' : 'Add New Vessel / Equipment'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Vessel / Item Name</label>
                <input type="text" required placeholder="e.g. Aluminium Degchi (100 Litre)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <option value="Cooking Vessel">Cooking Vessel</option><option value="Serving Gear">Serving Gear</option><option value="Utensils">Utensils</option><option value="Heating & Fuel">Heating & Fuel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Storage Location</label>
                  <input type="text" placeholder="e.g. Kitchen Store A" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Total Qty</label>
                  <input type="number" min="0" required value={form.totalQty} onChange={(e) => setForm({ ...form, totalQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Available</label>
                  <input type="number" min="0" required value={form.availableQty} onChange={(e) => setForm({ ...form, availableQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>In Use</label>
                  <input type="number" min="0" value={form.inUseQty} onChange={(e) => setForm({ ...form, inUseQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Damaged</label>
                  <input type="number" min="0" value={form.damagedQty} onChange={(e) => setForm({ ...form, damagedQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Asset Value / Unit ({companyProfile.currency})</label>
                <input type="number" min="0" required placeholder="e.g. 5000" value={form.valuePerUnit} onChange={(e) => setForm({ ...form, valuePerUnit: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Vessel' : 'Save Vessel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageInventory;
