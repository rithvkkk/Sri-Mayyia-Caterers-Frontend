import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { calculatePdfReport, generateSupplierPO } from '../utils/pdfGenerator';
import { ShoppingBag, Truck, Check, Share2, ShieldAlert, FileText, Download, Eye, X, Plus, Trash2, Save } from 'lucide-react';

const RawMaterials = () => {
  const {
    currentRole,
    events,
    companyProfile,
    rawMaterials,
    suppliers,
    updateEvent,
    refreshEventTotals
  } = useContext(AppContext);

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [activeCatFilter, setActiveCatFilter] = useState('All');
  const [poPreview, setPoPreview] = useState(null);
  
  // State for manual material entry form
  const [newMaterial, setNewMaterial] = useState({
    rawMaterialId: '',
    requiredQty: '',
    supplierId: ''
  });
  const [saving, setSaving] = useState(false);

  const currentEvent = events.find(e => e.id === selectedEventId);
  const isOps = currentRole === 'Admin' || currentRole === 'Manager';
  const hasAccess = currentRole !== 'Agency';

  if (!hasAccess) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Raw material distribution reports are restricted for external Agency profiles. Please log in as an Admin, Manager, Accountant, or Chef.
        </p>
      </div>
    );
  }

  // Manual materials list
  const materialList = currentEvent?.manualMaterials || [];

  // Group by category
  const categories = ['All', 'Grocery', 'Dairy', 'Veg/Fruit', 'Fuel'];
  const filteredMaterials = activeCatFilter === 'All' 
    ? materialList 
    : materialList.filter(m => m.category === activeCatFilter);

  // Group costs by category
  const categoryCosts = materialList.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.totalCost;
    return acc;
  }, {});

  const totalRawCost = materialList.reduce((sum, item) => sum + item.totalCost, 0);

  // Extract unique suppliers — use _id (MongoDB) or fallback to name as key
  const suppliersUsed = Array.from(new Set(materialList.map(m => m.supplier?.name))).map(name => {
    if (!name) return null;
    const sup = materialList.find(m => m.supplier?.name === name)?.supplier;
    if (!sup) return null;
    return { ...sup, id: sup._id || sup.id || sup.name }; // normalise key
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
      name: rm.name,
      category: rm.category,
      requiredQty: parseFloat(newMaterial.requiredQty),
      unit: rm.unit,
      costPerUnit: rm.costPerUnit,
      totalCost,
      supplier: {
        _id: sup.id,
        name: sup.name,
        contact: sup.phone || sup.contact || '',
        category: sup.category
      }
    };

    const updatedEvent = {
      ...currentEvent,
      manualMaterials: [...materialList, manualMat]
    };
    updateEvent(updatedEvent).then(() => {
      if (refreshEventTotals) refreshEventTotals(updatedEvent.id);
    });
    setNewMaterial({ rawMaterialId: '', requiredQty: '', supplierId: '' });
  };

  const handleRemoveMaterial = (indexToRemove) => {
    const updatedMaterials = materialList.filter((_, idx) => idx !== indexToRemove);
    const updatedEvent = { ...currentEvent, manualMaterials: updatedMaterials };
    updateEvent(updatedEvent).then(() => {
      if (refreshEventTotals) refreshEventTotals(updatedEvent.id);
    });
  };

  const handleSendPO = (sup) => {
    if (!isOps) return;
    const supItems = materialList.filter(m => m.supplier.name === sup.name);
    if (!supItems.length) {
      alert('No materials assigned to this supplier for the selected event.');
      return;
    }
    // Ensure supplier has a phone/contact field for the PDF
    const supplierForPDF = {
      name: sup.name,
      contact: sup.contact || sup.phone || 'N/A',
      category: sup.category || '',
      _id: sup.id
    };
    const result = generateSupplierPO(supplierForPDF, supItems, currentEvent, companyProfile);
    setPoPreview({ ...result, supplierName: sup.name });
  };

  const handleDownloadPO = () => {
    if (!poPreview) return;
    const a = document.createElement('a');
    a.href = poPreview.blobUrl;
    a.download = poPreview.filename;
    a.click();
  };

  const handleSharePO = async () => {
    if (!poPreview) return;
    const file = new File([poPreview.blob], poPreview.filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Purchase Order — ${poPreview.supplierName}`,
          text: `PO for ${currentEvent?.id}`
        });
        return;
      } catch (e) { console.warn('Share cancelled', e); }
    }
    // fallback — download
    handleDownloadPO();
    alert('Native share not available on this browser. PDF has been downloaded instead.');
  };

  const closePreview = () => {
    if (poPreview?.blobUrl) URL.revokeObjectURL(poPreview.blobUrl);
    setPoPreview(null);
  };

  // WhatsApp client-side PDF trigger
  const handleShareReport = async (lang) => {
    if (!currentEvent) return;
    const success = await calculatePdfReport(currentEvent, materialList, companyProfile, lang, 'materials');
    if (success) {
      console.log('PDF share completed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Raw Material Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manually allocate exact ingredient requirements for vendors.</p>
        </div>

        {currentEvent && (
          <div className="form-group" style={{ marginBottom: 0 }}>
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
          
          {/* Left Column: Aggregated Items & Category Filters */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem' }}>Allocated Requirements Log</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Event ID: {currentEvent.id} | Total Items: {materialList.length}</p>
              </div>

              {/* PDF Share buttons in English, Hindi, Gujarati */}
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
              {categories.map(cat => (
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
                  {filteredMaterials.map((mat, idx) => (
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
                  {filteredMaterials.length === 0 && (
                    <tr>
                      <td colSpan={isOps ? "7" : "6"} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No raw materials manually allocated yet.
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
                        <button 
                          className="btn btn-primary btn-small" 
                          style={{ padding: '0.3rem' }} 
                          onClick={handleAddMaterial}
                        >
                          <Plus size={14} />
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Suppliers PO & Summary Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Costs Breakdown */}
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

            {/* Supplier PO Dispatch panel */}
            <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.03)' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={18} style={{ color: 'var(--color-success)' }} />
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
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.3rem 0.6rem', fontSize: '0.72rem'
                        }}
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
          <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p>Please configure an active booking to compute raw ingredient metrics.</p>
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Purchase Order Preview</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>{poPreview.supplierName} · {poPreview.filename}</p>
              </div>
              <button onClick={closePreview} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* PDF iframe */}
            <iframe
              src={poPreview.blobUrl}
              title="PO Preview"
              style={{ flex: 1, border: 'none', minHeight: '520px', background: '#fff' }}
            />

            {/* Action footer */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-color)', flexShrink: 0, justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
              <button
                className="btn btn-secondary"
                onClick={handleDownloadPO}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={16} /> Download PDF
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSharePO}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RawMaterials;

