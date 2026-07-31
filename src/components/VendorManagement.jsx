import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { calculatePdfReport, generateSupplierPO } from '../utils/pdfGenerator';
import { Store, ShoppingBag, FileText, Download, Eye, X, Plus, Trash2, Save, Share2, Edit2, Check, ShieldAlert, Search } from 'lucide-react';

const VendorManagement = () => {
  const {
    currentRole,
    events,
    companyProfile,
    rawMaterials,
    suppliers,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    updateEvent,
    refreshEventTotals
  } = useContext(AppContext);

  const [activeView, setActiveView] = useState('materials'); // 'materials' | 'suppliers' | 'allocation'
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [activeCatFilter, setActiveCatFilter] = useState('All');
  const [poPreview, setPoPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inline price editing
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  // Material form modal
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    name: '', category: 'Grocery', unit: 'kg', costPerUnit: 0
  });

  // Supplier form modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '', category: 'Grocery', phone: '', address: ''
  });

  // State for manual material entry form (allocation)
  const [newMaterial, setNewMaterial] = useState({
    rawMaterialId: '', requiredQty: '', supplierId: ''
  });

  const currentEvent = events.find(e => e.id === selectedEventId);
  const isOps = currentRole === 'Admin' || currentRole === 'Manager';
  const hasAccess = currentRole !== 'Agency';

  if (!hasAccess) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Vendor management is restricted for external Agency profiles. Please log in as an Admin, Manager, or Accountant.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return `${companyProfile.currency} ${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  // === MATERIALS FUNCTIONS ===
  const filteredMaterials = rawMaterials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCatFilter === 'All' || m.category === activeCatFilter;
    return matchesSearch && matchesCat;
  });

  const materialCategories = ['All', 'Grocery', 'Dairy', 'Veg/Fruit', 'Fuel', 'Spices & Condiments', 'Ghee & Oils', 'Dry Fruits'];

  const handlePriceEdit = (materialId, currentPrice) => {
    setEditingPriceId(materialId);
    setEditingPriceValue(currentPrice.toString());
  };

  const handlePriceSave = (material) => {
    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Please enter a valid price');
      return;
    }
    updateRawMaterial({ ...material, costPerUnit: newPrice });
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  const handlePriceCancel = () => {
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  const openMaterialForm = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setMaterialForm({
        name: material.name, category: material.category, unit: material.unit, costPerUnit: material.costPerUnit
      });
    } else {
      setEditingMaterial(null);
      setMaterialForm({ name: '', category: 'Grocery', unit: 'kg', costPerUnit: 0 });
    }
    setIsMaterialModalOpen(true);
  };

  const handleMaterialSubmit = (e) => {
    e.preventDefault();
    const payload = { ...materialForm, costPerUnit: Number(materialForm.costPerUnit) };
    if (editingMaterial) {
      updateRawMaterial({ ...payload, id: editingMaterial.id });
    } else {
      addRawMaterial(payload);
    }
    setIsMaterialModalOpen(false);
    setEditingMaterial(null);
  };

  // === SUPPLIER FUNCTIONS ===
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openSupplierForm = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name, category: supplier.category || '', phone: supplier.phone || supplier.contact || '', address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({ name: '', category: 'Grocery', phone: '', address: '' });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier({ ...supplierForm, id: editingSupplier.id });
    } else {
      addSupplier(supplierForm);
    }
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  // === ALLOCATION (Event Materials) FUNCTIONS ===
  const materialList = currentEvent?.manualMaterials || [];
  const allocationCategories = ['All', 'Grocery', 'Dairy', 'Veg/Fruit', 'Fuel'];
  const filteredAllocationMaterials = activeCatFilter === 'All'
    ? materialList
    : materialList.filter(m => m.category === activeCatFilter);

  const categoryCosts = materialList.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.totalCost;
    return acc;
  }, {});
  const totalRawCost = materialList.reduce((sum, item) => sum + item.totalCost, 0);

  const suppliersUsed = Array.from(new Set(materialList.map(m => m.supplier?.name))).map(name => {
    if (!name) return null;
    const sup = materialList.find(m => m.supplier?.name === name)?.supplier;
    if (!sup) return null;
    return { ...sup, id: sup._id || sup.id || sup.name };
  }).filter(Boolean);

  const handleAddMaterial = () => {
    if (!newMaterial.rawMaterialId || !newMaterial.requiredQty || !newMaterial.supplierId) {
      alert('Please fill out all fields.');
      return;
    }
    const rm = rawMaterials.find(r => r.id === newMaterial.rawMaterialId);
    const sup = suppliers.find(s => s.id === newMaterial.supplierId);
    if (!rm || !sup) return;
    const totalCost = parseFloat(newMaterial.requiredQty) * rm.costPerUnit;
    const manualMat = {
      name: rm.name, category: rm.category,
      requiredQty: parseFloat(newMaterial.requiredQty), unit: rm.unit,
      costPerUnit: rm.costPerUnit, totalCost,
      supplier: { _id: sup.id, name: sup.name, contact: sup.phone || sup.contact || '', category: sup.category }
    };
    const updatedEvent = { ...currentEvent, manualMaterials: [...materialList, manualMat] };
    updateEvent(updatedEvent).then(() => { if (refreshEventTotals) refreshEventTotals(updatedEvent.id); });
    setNewMaterial({ rawMaterialId: '', requiredQty: '', supplierId: '' });
  };

  const handleRemoveMaterial = (indexToRemove) => {
    const updatedMaterials = materialList.filter((_, idx) => idx !== indexToRemove);
    const updatedEvent = { ...currentEvent, manualMaterials: updatedMaterials };
    updateEvent(updatedEvent).then(() => { if (refreshEventTotals) refreshEventTotals(updatedEvent.id); });
  };

  const handleSendPO = (sup) => {
    if (!isOps) return;
    const supItems = materialList.filter(m => m.supplier.name === sup.name);
    if (!supItems.length) { alert('No materials assigned to this supplier for the selected event.'); return; }
    const supplierForPDF = { name: sup.name, contact: sup.contact || sup.phone || 'N/A', category: sup.category || '', _id: sup.id };
    const result = generateSupplierPO(supplierForPDF, supItems, currentEvent, companyProfile);
    setPoPreview({ ...result, supplierName: sup.name });
  };

  const handleDownloadPO = () => { if (!poPreview) return; const a = document.createElement('a'); a.href = poPreview.blobUrl; a.download = poPreview.filename; a.click(); };
  const handleSharePO = async () => {
    if (!poPreview) return;
    const file = new File([poPreview.blob], poPreview.filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Purchase Order — ${poPreview.supplierName}`, text: `PO for ${currentEvent?.id}` }); return; } catch (e) { console.warn('Share cancelled', e); }
    }
    handleDownloadPO();
    alert('Native share not available on this browser. PDF has been downloaded instead.');
  };
  const closePreview = () => { if (poPreview?.blobUrl) URL.revokeObjectURL(poPreview.blobUrl); setPoPreview(null); };

  const handleShareReport = async (lang) => {
    if (!currentEvent) return;
    const success = await calculatePdfReport(currentEvent, materialList, companyProfile, lang, 'materials');
    if (success) console.log('PDF share completed');
  };

  // KPIs
  const totalMaterialItems = rawMaterials.length;
  const totalSupplierCount = suppliers.length;
  const totalMaterialValue = rawMaterials.reduce((sum, m) => sum + (Number(m.costPerUnit) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Vendor Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage outsourced materials, supplier directory, and event allocations.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeView === 'materials' && isOps && (
            <button className="btn btn-primary" onClick={() => openMaterialForm()}>
              <Plus size={18} /><span>Add Material</span>
            </button>
          )}
          {activeView === 'suppliers' && isOps && (
            <button className="btn btn-primary" onClick={() => openSupplierForm()}>
              <Plus size={18} /><span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpis" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Raw Materials</h3>
            <div className="kpi-value">{totalMaterialItems} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>items</span></div>
          </div>
          <div className="kpi-icon icon-blue"><ShoppingBag size={22} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Active Suppliers</h3>
            <div className="kpi-value">{totalSupplierCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>vendors</span></div>
          </div>
          <div className="kpi-icon icon-purple"><Store size={22} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Active Events</h3>
            <div className="kpi-value">{events.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>bookings</span></div>
          </div>
          <div className="kpi-icon icon-amber"><FileText size={22} /></div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => { setActiveView('materials'); setSearchTerm(''); setActiveCatFilter('All'); }}
          className={`btn ${activeView === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <ShoppingBag size={18} /><span>Materials Directory ({rawMaterials.length})</span>
        </button>
        <button
          onClick={() => { setActiveView('suppliers'); setSearchTerm(''); }}
          className={`btn ${activeView === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Store size={18} /><span>Supplier Directory ({suppliers.length})</span>
        </button>
        <button
          onClick={() => { setActiveView('allocation'); setActiveCatFilter('All'); }}
          className={`btn ${activeView === 'allocation' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <FileText size={18} /><span>Event Allocation</span>
        </button>
      </div>

      {/* Search bar for materials & suppliers view */}
      {(activeView === 'materials' || activeView === 'suppliers') && (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder={`Search ${activeView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: '0.9rem' }}
            />
          </div>
          {activeView === 'materials' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
              <select
                value={activeCatFilter}
                onChange={(e) => setActiveCatFilter(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              >
                {materialCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ===== VIEW 1: MATERIALS DIRECTORY ===== */}
      {activeView === 'materials' && (
        <div className="glass-card">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Cost / Unit</th>
                  {isOps && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {m.id}</div>
                    </td>
                    <td><span className="badge badge-info">{m.category}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.unit}</td>
                    <td>
                      {editingPriceId === m.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handlePriceSave(m); if (e.key === 'Escape') handlePriceCancel(); }}
                            autoFocus
                            style={{ width: '80px', padding: '0.25rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                          />
                          <button onClick={() => handlePriceSave(m)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-success)', display: 'flex' }}>
                            <Check size={16} />
                          </button>
                          <button onClick={handlePriceCancel} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{ fontWeight: 600, cursor: isOps ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          onClick={() => isOps && handlePriceEdit(m.id, m.costPerUnit)}
                          title={isOps ? 'Click to edit price' : ''}
                        >
                          {formatCurrency(m.costPerUnit)} / {m.unit}
                          {isOps && <Edit2 size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      )}
                    </td>
                    {isOps && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-small" onClick={() => openMaterialForm(m)} title="Edit Material">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-secondary btn-small" onClick={() => deleteRawMaterial(m.id)} style={{ color: 'var(--color-danger)' }} title="Delete Material">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan={isOps ? "5" : "4"} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No materials found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== VIEW 2: SUPPLIER DIRECTORY ===== */}
      {activeView === 'suppliers' && (
        <div className="glass-card">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Category</th>
                  <th>Phone / Contact</th>
                  <th>Address</th>
                  {isOps && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {s.id}</div>
                    </td>
                    <td><span className="badge badge-info">{s.category}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.phone || s.contact || 'N/A'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.address || '—'}</td>
                    {isOps && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-small" onClick={() => openSupplierForm(s)} title="Edit Supplier">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-secondary btn-small" onClick={() => deleteSupplier(s.id)} style={{ color: 'var(--color-danger)' }} title="Delete Supplier">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={isOps ? "5" : "4"} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== VIEW 3: EVENT ALLOCATION ===== */}
      {activeView === 'allocation' && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            {currentEvent && (
              <div className="form-group" style={{ marginBottom: 0, maxWidth: '400px' }}>
                <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.id} - {e.customer.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {currentEvent ? (
            <div className="responsive-grid two-cols-left-heavier">
              {/* Left Column: Allocated Requirements */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem' }}>Allocated Requirements Log</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Event ID: {currentEvent.id} | Total Items: {materialList.length}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Share2 size={12} /> Share:
                    </span>
                    <button className="btn btn-secondary btn-small" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => handleShareReport('EN')}>EN</button>
                    <button className="btn btn-secondary btn-small" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => handleShareReport('HI')}>HI</button>
                    <button className="btn btn-secondary btn-small" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => handleShareReport('GUJ')}>GUJ</button>
                  </div>
                </div>

                {/* Category tabs */}
                <div className="tabs-header" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {allocationCategories.map(cat => (
                    <button
                      key={cat}
                      className={`tab-btn ${activeCatFilter === cat ? 'active' : ''}`}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => setActiveCatFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ingredient Name</th>
                        <th>Storage Category</th>
                        <th>Required Qty</th>
                        <th>Unit Cost</th>
                        <th>Est. Total Cost</th>
                        <th>Assigned Supplier</th>
                        {isOps && <th style={{ width: '40px' }}></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllocationMaterials.map((mat, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{mat.name}</td>
                          <td>
                            <span className={`badge ${
                              mat.category === 'Grocery' ? 'badge-info' :
                              mat.category === 'Dairy' ? 'badge-success' :
                              mat.category === 'Veg/Fruit' ? 'badge-warning' : 'badge-purple'
                            }`} style={{ fontSize: '0.7rem' }}>{mat.category}</span>
                          </td>
                          <td style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{mat.requiredQty} {mat.unit}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{companyProfile.currency} {mat.costPerUnit}</td>
                          <td style={{ fontWeight: 600 }}>{companyProfile.currency} {mat.totalCost.toLocaleString('en-IN')}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{mat.supplier?.name}</td>
                          {isOps && (
                            <td>
                              <button
                                className="btn btn-secondary btn-small"
                                style={{ padding: '0.2rem', color: 'var(--color-danger)', background: 'transparent', border: 'none' }}
                                onClick={() => handleRemoveMaterial(materialList.indexOf(mat))}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {filteredAllocationMaterials.length === 0 && (
                        <tr>
                          <td colSpan={isOps ? "7" : "6"} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No materials allocated yet for this event.
                          </td>
                        </tr>
                      )}
                      {isOps && (
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <td colSpan="2">
                            <select
                              className="form-input"
                              style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                              value={newMaterial.rawMaterialId}
                              onChange={e => setNewMaterial({...newMaterial, rawMaterialId: e.target.value})}
                            >
                              <option value="">-- Select Material --</option>
                              {rawMaterials.map(rm => (
                                <option key={rm.id} value={rm.id}>{rm.name} ({rm.category})</option>
                              ))}
                            </select>
                          </td>
                          <td colSpan="2">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="Qty"
                                style={{ padding: '0.3rem', fontSize: '0.8rem', width: '60px' }}
                                value={newMaterial.requiredQty}
                                onChange={e => setNewMaterial({...newMaterial, requiredQty: e.target.value})}
                              />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {newMaterial.rawMaterialId ? rawMaterials.find(r => r.id === newMaterial.rawMaterialId)?.unit : ''}
                              </span>
                            </div>
                          </td>
                          <td colSpan="2">
                            <select
                              className="form-input"
                              style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                              value={newMaterial.supplierId}
                              onChange={e => setNewMaterial({...newMaterial, supplierId: e.target.value})}
                            >
                              <option value="">-- Assign Supplier --</option>
                              {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button className="btn btn-primary btn-small" style={{ padding: '0.3rem' }} onClick={handleAddMaterial}>
                              <Plus size={14} />
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Cost Summary & Supplier PO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingBag size={18} className="accent-text" />
                    <span>Materials Budget Summary</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                    {Object.keys(categoryCosts).map(cat => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{cat} Total:</span>
                        <span style={{ fontWeight: 600 }}>{companyProfile.currency} {categoryCosts[cat].toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Total Materials Budget:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                        {companyProfile.currency} {totalRawCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.03)' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Store size={18} style={{ color: 'var(--color-success)' }} />
                    <span>Supplier PO Allocations</span>
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Dispatch calculated requirements directly as procurement orders.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    {suppliersUsed.map(sup => {
                      const supItems = materialList.filter(m => m.supplier.name === sup.name);
                      const supTotal = supItems.reduce((s, m) => s + m.totalCost, 0);
                      return (
                        <div key={sup.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sup.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sup.contact} | {sup.category}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '0.15rem' }}>{supItems.length} items · {companyProfile.currency} {supTotal.toLocaleString('en-IN')}</div>
                          </div>
                          <button
                            className="btn btn-small"
                            onClick={() => handleSendPO(sup)}
                            style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                          >
                            <FileText size={12} /> Send PO
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <Store size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>Please configure an active booking to compute material allocations.</p>
            </div>
          )}
        </>
      )}

      {/* Material Form Modal */}
      {isMaterialModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '550px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
            </h2>
            <form onSubmit={handleMaterialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Material Name</label>
                <input type="text" required placeholder="e.g. Basmati Rice" value={materialForm.name} onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select value={materialForm.category} onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <option value="Grocery">Grocery</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Veg/Fruit">Veg/Fruit</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Spices & Condiments">Spices & Condiments</option>
                    <option value="Ghee & Oils">Ghee & Oils</option>
                    <option value="Dry Fruits">Dry Fruits</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Unit of Measure</label>
                  <input type="text" required placeholder="kg, ltr, bag" value={materialForm.unit} onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Cost / Unit ({companyProfile.currency})</label>
                <input type="number" min="0" step="0.01" required value={materialForm.costPerUnit} onChange={(e) => setMaterialForm({ ...materialForm, costPerUnit: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMaterialModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingMaterial ? 'Update Material' : 'Save Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {isSupplierModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '550px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <form onSubmit={handleSupplierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Supplier Name</label>
                <input type="text" required placeholder="e.g. Krishnakumar & Sons" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                  <select value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    <option value="Grocery">Grocery</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Veg/Fruit">Veg/Fruit</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Spices & Condiments">Spices & Condiments</option>
                    <option value="Ghee & Oils">Ghee & Oils</option>
                    <option value="Dry Fruits">Dry Fruits</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Phone / Contact</label>
                  <input type="text" placeholder="9876543210" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Address</label>
                <input type="text" placeholder="Market Road, City" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSupplierModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Preview Modal */}
      {poPreview && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="modal-content"
            style={{ maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Purchase Order Preview</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>{poPreview.supplierName} · {poPreview.filename}</p>
              </div>
              <button onClick={closePreview} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>
            <iframe src={poPreview.blobUrl} title="PO Preview" style={{ flex: 1, border: 'none', minHeight: '520px', background: '#fff' }} />
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-color)', flexShrink: 0, justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
              <button className="btn btn-secondary" onClick={handleDownloadPO} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Download size={16} /> Download PDF
              </button>
              <button className="btn btn-primary" onClick={handleSharePO} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
