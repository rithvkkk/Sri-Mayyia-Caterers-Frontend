import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Package,
  Boxes,
  Carrot,
  Utensils,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  MapPin,
  TrendingDown,
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';

const Inventory = () => {
  const {
    vessels,
    addVessel,
    updateVessel,
    deleteVessel,
    provisions,
    addProvision,
    updateProvision,
    deleteProvision,
    vegetables,
    addVegetable,
    updateVegetable,
    deleteVegetable,
    suppliers,
    companyProfile
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('vessels'); // 'vessels' | 'provisions' | 'vegetables'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal States
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isVegetableModalOpen, setIsVegetableModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);

  // Form States - Vessel
  const [vesselForm, setVesselForm] = useState({
    name: '',
    category: 'Cooking Vessel',
    totalQty: 10,
    availableQty: 10,
    inUseQty: 0,
    damagedQty: 0,
    location: 'Main Store A',
    valuePerUnit: 1000
  });

  // Form States - Provision
  const [provisionForm, setProvisionForm] = useState({
    name: '',
    category: 'Grocery',
    unit: 'kg',
    stockQty: 100,
    reorderLevel: 25,
    costPerUnit: 80,
    supplierId: suppliers[0]?.id || ''
  });

  // Form States - Vegetable
  const [vegetableForm, setVegetableForm] = useState({
    name: '',
    category: 'Vegetable',
    unit: 'kg',
    stockQty: 50,
    marketPrice: 40,
    freshnessStatus: 'Fresh',
    supplierId: suppliers[0]?.id || ''
  });

  const formatCurrency = (amount) => {
    return `${companyProfile.currency} ${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  // Helper supplier name lookup
  const getSupplierName = (supId) => {
    const s = suppliers.find(sup => sup.id === supId);
    return s ? s.name : 'Local Market / Wholesaler';
  };

  // Summary Metrics
  const totalVesselsCount = vessels.reduce((acc, v) => acc + (Number(v.totalQty) || 0), 0);
  const damagedVesselsCount = vessels.reduce((acc, v) => acc + (Number(v.damagedQty) || 0), 0);
  const lowStockProvisionsCount = provisions.filter(p => Number(p.stockQty) <= Number(p.reorderLevel)).length;
  const urgentVegCount = vegetables.filter(v => v.freshnessStatus === '1-2 Days Left' || v.freshnessStatus === 'Urgent Use').length;

  // Total Inventory Value
  const vesselTotalValue = vessels.reduce((sum, v) => sum + ((Number(v.totalQty) || 0) * (Number(v.valuePerUnit) || 0)), 0);
  const provisionTotalValue = provisions.reduce((sum, p) => sum + ((Number(p.stockQty) || 0) * (Number(p.costPerUnit) || 0)), 0);
  const vegetableTotalValue = vegetables.reduce((sum, v) => sum + ((Number(v.stockQty) || 0) * (Number(v.marketPrice) || 0)), 0);
  const totalInventoryAssetValue = vesselTotalValue + provisionTotalValue + vegetableTotalValue;

  // Filtered Datasets
  const filteredVessels = vessels.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredProvisions = provisions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredVegetables = vegetables.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Handle Vessel Submit
  const handleVesselSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...vesselForm,
      totalQty: Number(vesselForm.totalQty),
      availableQty: Number(vesselForm.availableQty),
      inUseQty: Number(vesselForm.inUseQty),
      damagedQty: Number(vesselForm.damagedQty),
      valuePerUnit: Number(vesselForm.valuePerUnit)
    };

    if (editingItem) {
      updateVessel({ ...payload, id: editingItem.id });
    } else {
      addVessel(payload);
    }

    setIsVesselModalOpen(false);
    setEditingItem(null);
    setVesselForm({
      name: '',
      category: 'Cooking Vessel',
      totalQty: 10,
      availableQty: 10,
      inUseQty: 0,
      damagedQty: 0,
      location: 'Main Store A',
      valuePerUnit: 1000
    });
  };

  // Handle Provision Submit
  const handleProvisionSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...provisionForm,
      stockQty: Number(provisionForm.stockQty),
      reorderLevel: Number(provisionForm.reorderLevel),
      costPerUnit: Number(provisionForm.costPerUnit)
    };

    if (editingItem) {
      updateProvision({ ...payload, id: editingItem.id });
    } else {
      addProvision(payload);
    }

    setIsProvisionModalOpen(false);
    setEditingItem(null);
    setProvisionForm({
      name: '',
      category: 'Grocery',
      unit: 'kg',
      stockQty: 100,
      reorderLevel: 25,
      costPerUnit: 80,
      supplierId: suppliers[0]?.id || ''
    });
  };

  // Handle Vegetable Submit
  const handleVegetableSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...vegetableForm,
      stockQty: Number(vegetableForm.stockQty),
      marketPrice: Number(vegetableForm.marketPrice)
    };

    if (editingItem) {
      updateVegetable({ ...payload, id: editingItem.id });
    } else {
      addVegetable(payload);
    }

    setIsVegetableModalOpen(false);
    setEditingItem(null);
    setVegetableForm({
      name: '',
      category: 'Vegetable',
      unit: 'kg',
      stockQty: 50,
      marketPrice: 40,
      freshnessStatus: 'Fresh',
      supplierId: suppliers[0]?.id || ''
    });
  };

  const openEditVessel = (v) => {
    setEditingItem(v);
    setVesselForm(v);
    setIsVesselModalOpen(true);
  };

  const openEditProvision = (p) => {
    setEditingItem(p);
    setProvisionForm(p);
    setIsProvisionModalOpen(true);
  };

  const openEditVegetable = (v) => {
    setEditingItem(v);
    setVegetableForm(v);
    setIsVegetableModalOpen(true);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            Inventory Management Console
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time track for Vessels & Utensils, Provisions, and Fresh Vegetable Stock.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeTab === 'vessels' && (
            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsVesselModalOpen(true); }}>
              <Plus size={18} />
              <span>Add Vessel / Gear</span>
            </button>
          )}
          {activeTab === 'provisions' && (
            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsProvisionModalOpen(true); }}>
              <Plus size={18} />
              <span>Add Provision Item</span>
            </button>
          )}
          {activeTab === 'vegetables' && (
            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsVegetableModalOpen(true); }}>
              <Plus size={18} />
              <span>Add Fresh Vegetable</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpis" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Vessels & Utensils</h3>
            <div className="kpi-value">{totalVesselsCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>units</span></div>
            {damagedVesselsCount > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.25rem', fontWeight: 600 }}>
                {damagedVesselsCount} damaged/lost
              </div>
            )}
          </div>
          <div className="kpi-icon icon-blue">
            <Utensils size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Provisions Stock</h3>
            <div className="kpi-value">{provisions.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>categories</span></div>
            {lowStockProvisionsCount > 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.25rem', fontWeight: 600 }}>
                {lowStockProvisionsCount} items low stock
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem', fontWeight: 600 }}>
                All stock healthy
              </div>
            )}
          </div>
          <div className="kpi-icon icon-amber">
            <Boxes size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Fresh Produce & Veggies</h3>
            <div className="kpi-value">{vegetables.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>items</span></div>
            {urgentVegCount > 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', fontWeight: 600 }}>
                {urgentVegCount} expiring / urgent use
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem', fontWeight: 600 }}>
                Fresh daily stock
              </div>
            )}
          </div>
          <div className="kpi-icon icon-purple">
            <Carrot size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Asset Valuation</h3>
            <div className="kpi-value">{formatCurrency(totalInventoryAssetValue)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Combined inventory worth
            </div>
          </div>
          <div className="kpi-icon icon-green">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => { setActiveTab('vessels'); setCategoryFilter('All'); }}
          className={`btn ${activeTab === 'vessels' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Utensils size={18} />
          <span>Vessels & Equipment ({vessels.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('provisions'); setCategoryFilter('All'); }}
          className={`btn ${activeTab === 'provisions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Boxes size={18} />
          <span>Provisions & Groceries ({provisions.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('vegetables'); setCategoryFilter('All'); }}
          className={`btn ${activeTab === 'vegetables' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Carrot size={18} />
          <span>Vegetables & Produce ({vegetables.length})</span>
        </button>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="All">All Categories</option>
            {activeTab === 'vessels' && (
              <>
                <option value="Cooking Vessel">Cooking Vessel</option>
                <option value="Serving Gear">Serving Gear</option>
                <option value="Utensils">Utensils</option>
                <option value="Heating & Fuel">Heating & Fuel</option>
              </>
            )}
            {activeTab === 'provisions' && (
              <>
                <option value="Grocery">Grocery</option>
                <option value="Ghee & Oils">Ghee & Oils</option>
                <option value="Spices & Condiments">Spices & Condiments</option>
                <option value="Dry Fruits">Dry Fruits</option>
              </>
            )}
            {activeTab === 'vegetables' && (
              <>
                <option value="Vegetable">Vegetable</option>
                <option value="Fruit">Fruit</option>
                <option value="Dairy & Fresh">Dairy & Fresh</option>
                <option value="Herbs & Greens">Herbs & Greens</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* TAB CONTENT 1: VESSELS */}
      {activeTab === 'vessels' && (
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
                {filteredVessels.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {v.id}</div>
                    </td>
                    <td><span className="badge badge-info">{v.category}</span></td>
                    <td style={{ fontWeight: 700 }}>{v.totalQty}</td>
                    <td>
                      <span className="badge badge-success">{v.availableQty} ready</span>
                    </td>
                    <td>
                      {v.inUseQty > 0 ? (
                        <span className="badge badge-warning">{v.inUseQty} in events</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>0</span>
                      )}
                    </td>
                    <td>
                      {v.damagedQty > 0 ? (
                        <span className="badge badge-danger">{v.damagedQty} damaged</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>0</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <MapPin size={14} className="accent-text" />
                        <span>{v.location || 'Main Store'}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(v.valuePerUnit)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button className="btn btn-secondary btn-small" onClick={() => openEditVessel(v)} title="Edit Vessel">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-secondary btn-small" onClick={() => deleteVessel(v.id)} style={{ color: 'var(--color-danger)' }} title="Delete Vessel">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVessels.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No vessels or equipment found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PROVISIONS */}
      {activeTab === 'provisions' && (
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
                {filteredProvisions.map(p => {
                  const isLowStock = Number(p.stockQty) <= Number(p.reorderLevel);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {p.id}</div>
                      </td>
                      <td><span className="badge badge-info">{p.category}</span></td>
                      <td style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {p.stockQty} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.unit}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.reorderLevel} {p.unit}</td>
                      <td>
                        {isLowStock ? (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertTriangle size={12} /> Low Stock Alert
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={12} /> Adequate
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(p.costPerUnit)} / {p.unit}</td>
                      <td>{getSupplierName(p.supplierId)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-small" onClick={() => openEditProvision(p)} title="Edit Provision">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-secondary btn-small" onClick={() => deleteProvision(p.id)} style={{ color: 'var(--color-danger)' }} title="Delete Provision">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProvisions.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No provision items found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: VEGETABLES & FRESH PRODUCE */}
      {activeTab === 'vegetables' && (
        <div className="glass-card">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vegetable / Produce</th>
                  <th>Category</th>
                  <th>Daily Stock Qty</th>
                  <th>Market Rate (₹)</th>
                  <th>Freshness Status</th>
                  <th>Total Stock Value</th>
                  <th>Supplier</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVegetables.map(v => {
                  const stockValue = (Number(v.stockQty) || 0) * (Number(v.marketPrice) || 0);
                  let statusBadge = <span className="badge badge-success">Fresh</span>;
                  if (v.freshnessStatus === '1-2 Days Left') {
                    statusBadge = <span className="badge badge-warning">1-2 Days Left</span>;
                  } else if (v.freshnessStatus === 'Urgent Use') {
                    statusBadge = <span className="badge badge-danger">Urgent Use</span>;
                  }

                  return (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {v.id}</div>
                      </td>
                      <td><span className="badge badge-info">{v.category}</span></td>
                      <td style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {v.stockQty} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.unit}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(v.marketPrice)} / {v.unit}</td>
                      <td>{statusBadge}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(stockValue)}</td>
                      <td>{getSupplierName(v.supplierId)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-small" onClick={() => openEditVegetable(v)} title="Edit Item">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-secondary btn-small" onClick={() => deleteVegetable(v.id)} style={{ color: 'var(--color-danger)' }} title="Delete Item">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredVegetables.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No vegetable items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: VESSEL FORM */}
      {isVesselModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '550px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingItem ? 'Edit Vessel / Utensil Equipment' : 'Add New Vessel / Utensil Equipment'}
            </h2>

            <form onSubmit={handleVesselSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Vessel / Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aluminium Degchi (100 Litre)"
                  value={vesselForm.name}
                  onChange={(e) => setVesselForm({ ...vesselForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select
                    value={vesselForm.category}
                    onChange={(e) => setVesselForm({ ...vesselForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Cooking Vessel">Cooking Vessel</option>
                    <option value="Serving Gear">Serving Gear</option>
                    <option value="Utensils">Utensils</option>
                    <option value="Heating & Fuel">Heating & Fuel</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Kitchen Store A / Rack 3"
                    value={vesselForm.location}
                    onChange={(e) => setVesselForm({ ...vesselForm, location: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Total Qty</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={vesselForm.totalQty}
                    onChange={(e) => setVesselForm({ ...vesselForm, totalQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Available</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={vesselForm.availableQty}
                    onChange={(e) => setVesselForm({ ...vesselForm, availableQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>In Use</label>
                  <input
                    type="number"
                    min="0"
                    value={vesselForm.inUseQty}
                    onChange={(e) => setVesselForm({ ...vesselForm, inUseQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Damaged</label>
                  <input
                    type="number"
                    min="0"
                    value={vesselForm.damagedQty}
                    onChange={(e) => setVesselForm({ ...vesselForm, damagedQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Asset Value / Unit ({companyProfile.currency})</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 5000"
                  value={vesselForm.valuePerUnit}
                  onChange={(e) => setVesselForm({ ...vesselForm, valuePerUnit: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsVesselModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Vessel' : 'Save Vessel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PROVISION FORM */}
      {isProvisionModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '550px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingItem ? 'Edit Provision Item' : 'Add Provision Item'}
            </h2>

            <form onSubmit={handleProvisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Provision Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice / Cooking Oil"
                  value={provisionForm.name}
                  onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select
                    value={provisionForm.category}
                    onChange={(e) => setProvisionForm({ ...provisionForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Ghee & Oils">Ghee & Oils</option>
                    <option value="Spices & Condiments">Spices & Condiments</option>
                    <option value="Dry Fruits">Dry Fruits</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, ltr, bag, pkt"
                    value={provisionForm.unit}
                    onChange={(e) => setProvisionForm({ ...provisionForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Current Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={provisionForm.stockQty}
                    onChange={(e) => setProvisionForm({ ...provisionForm, stockQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={provisionForm.reorderLevel}
                    onChange={(e) => setProvisionForm({ ...provisionForm, reorderLevel: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Cost / Unit ({companyProfile.currency})</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={provisionForm.costPerUnit}
                    onChange={(e) => setProvisionForm({ ...provisionForm, costPerUnit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Primary Supplier</label>
                <select
                  value={provisionForm.supplierId}
                  onChange={(e) => setProvisionForm({ ...provisionForm, supplierId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProvisionModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Provision' : 'Save Provision'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VEGETABLE FORM */}
      {isVegetableModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '550px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingItem ? 'Edit Vegetable / Produce' : 'Add Vegetable / Produce'}
            </h2>

            <form onSubmit={handleVegetableSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Vegetable / Produce Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Onions, Tomatoes, Fresh Mint"
                  value={vegetableForm.name}
                  onChange={(e) => setVegetableForm({ ...vegetableForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select
                    value={vegetableForm.category}
                    onChange={(e) => setVegetableForm({ ...vegetableForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Vegetable">Vegetable</option>
                    <option value="Fruit">Fruit</option>
                    <option value="Dairy & Fresh">Dairy & Fresh</option>
                    <option value="Herbs & Greens">Herbs & Greens</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, ltr, bunch"
                    value={vegetableForm.unit}
                    onChange={(e) => setVegetableForm({ ...vegetableForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={vegetableForm.stockQty}
                    onChange={(e) => setVegetableForm({ ...vegetableForm, stockQty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Market Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={vegetableForm.marketPrice}
                    onChange={(e) => setVegetableForm({ ...vegetableForm, marketPrice: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>Freshness Status</label>
                  <select
                    value={vegetableForm.freshnessStatus}
                    onChange={(e) => setVegetableForm({ ...vegetableForm, freshnessStatus: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Fresh">Fresh</option>
                    <option value="1-2 Days Left">1-2 Days Left</option>
                    <option value="Urgent Use">Urgent Use</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Supplier</label>
                <select
                  value={vegetableForm.supplierId}
                  onChange={(e) => setVegetableForm({ ...vegetableForm, supplierId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsVegetableModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Produce' : 'Save Produce'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
