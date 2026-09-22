import React, { useState, useContext, useRef, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Package, Utensils, Plus, Search, Edit2, Trash2, MapPin, Sparkles, FileText, Download, Printer, X, Truck, ShieldCheck, Check, Camera, Image, Upload, AlertCircle, Cloud } from 'lucide-react';
import { generateGatePassPdf, downloadPdfBlob, printPdfBlob } from '../utils/pdfGenerator';

/**
 * Compresses an image file client-side via HTML5 canvas.
 * - If a photo is above 5MB, automatically compresses and scales it down to <= 5MB.
 * - Targets high-definition (<= 2048px) with adaptive quality reduction.
 * - Falls back safely to raw data URL if canvas is unsupported or decode fails.
 */
const compressImage = (file, maxWidth = 2048, maxHeight = 2048, quality = 0.88, maxOutputBytes = 4.8 * 1024 * 1024) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      if (!rawDataUrl || typeof rawDataUrl !== 'string') {
        return reject(new Error('Failed to read file as data URL'));
      }

      if (typeof window === 'undefined' || !window.Image) {
        return resolve(rawDataUrl);
      }

      const img = new window.Image();
      const timeout = setTimeout(() => {
        resolve(rawDataUrl);
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          // If dimensions are missing or 0, fallback to rawDataUrl
          if (!width || !height) {
            return resolve(rawDataUrl);
          }

          let newWidth = width;
          let newHeight = height;

          if (newWidth > maxWidth || newHeight > maxHeight) {
            if (newWidth / newHeight > maxWidth / maxHeight) {
              newHeight = Math.round((newHeight * maxWidth) / newWidth);
              newWidth = maxWidth;
            } else {
              newWidth = Math.round((newWidth * maxHeight) / newHeight);
              newHeight = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, newWidth);
          canvas.height = Math.max(1, newHeight);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(rawDataUrl);
          }

          // Fill with clean background for transparency
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let currentQuality = quality;
          let compressed = canvas.toDataURL('image/jpeg', currentQuality);

          // Calculate approximate byte size from base64 string
          const getByteSize = (dataUri) => {
            const base64Str = dataUri.split(',')[1] || dataUri;
            return Math.round((base64Str.length * 3) / 4);
          };

          // Automatically compress in a loop if photo exceeds 5MB
          let attempts = 0;
          while (getByteSize(compressed) > maxOutputBytes && attempts < 5) {
            attempts++;
            currentQuality = Math.max(0.45, currentQuality - 0.12);
            if (attempts >= 2) {
              newWidth = Math.round(newWidth * 0.82);
              newHeight = Math.round(newHeight * 0.82);
              canvas.width = Math.max(1, newWidth);
              canvas.height = Math.max(1, newHeight);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            compressed = canvas.toDataURL('image/jpeg', currentQuality);
          }

          if (!compressed || compressed === 'data:,' || compressed.length < 200) {
            return resolve(rawDataUrl);
          }
          resolve(compressed);
        } catch (err) {
          console.warn('Canvas compression fallback to raw image:', err);
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        // Fallback to raw data URL on decode failure
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
};

const StorageInventory = () => {
  const { vessels, addVessel, updateVessel, deleteVessel, uploadCloudImage, deleteCloudImage, companyProfile, events = [], rawMaterials = [] } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [photoPreviewItem, setPhotoPreviewItem] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const photoFileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

  // Storage Categories & Custom "+ Category" Option State
  const BASE_STORAGE_CATEGORIES = [
    'Cooking Vessel',
    'Serving Gear',
    'Utensils',
    'Heating & Fuel'
  ];

  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('cater_storage_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [modalCustomCategory, setModalCustomCategory] = useState('');

  const availableCategories = useMemo(() => {
    const set = new Set(BASE_STORAGE_CATEGORIES);
    customCategories.forEach(c => { if (c && c.trim()) set.add(c.trim()); });
    (vessels || []).forEach(v => { if (v && v.category && v.category.trim()) set.add(v.category.trim()); });
    return Array.from(set);
  }, [customCategories, vessels]);

  const handleAddCategory = (catName) => {
    const trimmed = (catName !== undefined ? catName : newCategoryInput).trim();
    if (!trimmed) return null;
    if (!customCategories.includes(trimmed) && !BASE_STORAGE_CATEGORIES.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('cater_storage_custom_categories', JSON.stringify(updated));
      } catch (e) {}
    }
    setNewCategoryInput('');
    setIsAddCategoryOpen(false);
    return trimmed;
  };

  const [form, setForm] = useState({ name: '', category: 'Cooking Vessel', totalQty: 10, availableQty: 10, inUseQty: 0, damagedQty: 0, location: 'Main Store A', valuePerUnit: 1000, photo: '' });

  // Gate Pass Modal & Tracking State
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [gatePassEventSearch, setGatePassEventSearch] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [gatePassForm, setGatePassForm] = useState({
    vehicleNo: 'KA-01-MJ-9921',
    driverName: 'Ramesh Kumar',
    driverPhone: '9876543210',
    issuedBy: 'Store Manager'
  });

  const formatCurrency = (amount) => `${companyProfile?.currency || '₹'} ${Number(amount || 0).toLocaleString('en-IN')}`;

  const totalCount = vessels.reduce((acc, v) => acc + (Number(v.totalQty) || 0), 0);
  const damagedCount = vessels.reduce((acc, v) => acc + (Number(v.damagedQty) || 0), 0);
  const totalValue = vessels.reduce((sum, v) => sum + ((Number(v.totalQty) || 0) * (Number(v.valuePerUnit) || 0)), 0);

  const filteredGatePassEvents = (events || []).filter(e => {
    if (!gatePassEventSearch.trim()) return true;
    const q = gatePassEventSearch.toLowerCase();
    return (
      (e.id && e.id.toLowerCase().includes(q)) ||
      (e.customer?.name && e.customer.name.toLowerCase().includes(q)) ||
      (e.eventType && e.eventType.toLowerCase().includes(q)) ||
      (e.date && e.date.toLowerCase().includes(q))
    );
  });

  const selectedEvent = events.find(e => e.id === selectedEventId) || filteredGatePassEvents[0] || events[0];
  const fallbackEvent = {
    id: 'GP-DISPATCH',
    customer: { name: 'General Event Transport' },
    eventType: 'Catering Asset Dispatch',
    date: new Date().toISOString().split('T')[0]
  };
  const activeEvent = selectedEvent || fallbackEvent;

  const handleDownloadGatePass = async () => {
    try {
      setIsDownloading(true);
      const consumables = (rawMaterials || []).slice(0, 8).map(m => ({
        name: m.name,
        category: m.category,
        qty: 25,
        unit: m.unit || 'Kg'
      }));

      const vesselList = (vessels || []).slice(0, 10).map(v => ({
        name: v.name,
        category: v.category,
        sentQty: v.totalQty || 10,
        returnedQty: (v.totalQty || 10) - (v.damagedQty || 0),
        damagedQty: v.damagedQty || 0,
        status: v.damagedQty > 0 ? 'Partial Damage' : 'Verified Return'
      }));

      const gatePassData = {
        gatePassNo: `GP-${activeEvent.id}`,
        vehicleNo: gatePassForm.vehicleNo || 'KA-01-MJ-9921',
        driverName: gatePassForm.driverName || 'Ramesh Kumar',
        driverPhone: gatePassForm.driverPhone || '9876543210',
        issuedBy: gatePassForm.issuedBy || 'Store Incharge',
        dispatchTime: new Date().toLocaleString('en-IN'),
        consumables,
        vessels: vesselList
      };

      const res = generateGatePassPdf(activeEvent, gatePassData, companyProfile);
      if (res && res.blob) {
        downloadPdfBlob(res.blob, res.filename || `GatePass_${activeEvent.id}.pdf`);
      }
    } catch (err) {
      console.error('Error generating gate pass PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintGatePass = async () => {
    try {
      setIsPrinting(true);
      const consumables = (rawMaterials || []).slice(0, 8).map(m => ({
        name: m.name,
        category: m.category,
        qty: 25,
        unit: m.unit || 'Kg'
      }));

      const vesselList = (vessels || []).slice(0, 10).map(v => ({
        name: v.name,
        category: v.category,
        sentQty: v.totalQty || 10,
        returnedQty: (v.totalQty || 10) - (v.damagedQty || 0),
        damagedQty: v.damagedQty || 0,
        status: v.damagedQty > 0 ? 'Partial Damage' : 'Verified Return'
      }));

      const gatePassData = {
        gatePassNo: `GP-${activeEvent.id}`,
        vehicleNo: gatePassForm.vehicleNo || 'KA-01-MJ-9921',
        driverName: gatePassForm.driverName || 'Ramesh Kumar',
        driverPhone: gatePassForm.driverPhone || '9876543210',
        issuedBy: gatePassForm.issuedBy || 'Store Incharge',
        dispatchTime: new Date().toLocaleString('en-IN'),
        consumables,
        vessels: vesselList
      };

      const res = generateGatePassPdf(activeEvent, gatePassData, companyProfile);
      if (res && (res.blobUrl || res.blob)) {
        printPdfBlob(res.blobUrl || res.blob);
      }
    } catch (err) {
      console.error('Error printing gate pass:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const filtered = vessels.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handlePhotoUpload = async (e, targetItem = null) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const isImageFile = allowedMimes.includes(file.type.toLowerCase()) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImageFile) {
      alert('Supported formats: JPG, PNG, and WEBP only.');
      return;
    }
    // Safety limit for ridiculously large raw files (> 60MB)
    if (file.size > 60 * 1024 * 1024) {
      alert('Photo file size exceeds 60MB safety limit. Please choose a photo under 60MB.');
      return;
    }

    try {
      setIsCompressing(true);
      const isAbove5Mb = file.size > 5 * 1024 * 1024;
      if (isAbove5Mb) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setUploadStatus(`Photo is ${sizeMb}MB: Auto-compressing to under 5MB...`);
      } else {
        setUploadStatus('Optimizing image...');
      }
      const dataUrl = await compressImage(file);

      setUploadStatus('Uploading to AWS S3 Cloud...');
      const uploadRes = await uploadCloudImage(dataUrl, file.name, 'vessels');

      setIsCompressing(false);
      setUploadStatus('');

      let finalPhotoUrl = dataUrl;
      if (uploadRes && uploadRes.success && uploadRes.url) {
        finalPhotoUrl = uploadRes.url;
      } else if (uploadRes && uploadRes.configured === false) {
        alert('AWS S3 Cloud Storage is not yet configured in backend/.env. The photo has been temporarily saved in local session. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in backend/.env for direct AWS S3 storage.');
      } else if (uploadRes && uploadRes.error) {
        alert(`AWS S3 Upload Notice: ${uploadRes.error}. Temporary local preview retained.`);
      }

      const itemToUpdate = targetItem || photoPreviewItem;
      if (itemToUpdate) {
        const targetId = itemToUpdate.id || itemToUpdate._id;
        const updated = { ...itemToUpdate, id: targetId, photo: finalPhotoUrl };
        setPhotoPreviewItem(updated);
        setImgError(false);
        updateVessel(updated);
      } else {
        setForm(prev => ({ ...prev, photo: finalPhotoUrl }));
      }
    } catch (err) {
      setIsCompressing(false);
      setUploadStatus('');
      console.error('Photo upload error:', err);
      alert('Failed to process image. Please try another photo.');
    }
  };

  const handleRemovePhoto = (targetItem = null) => {
    const itemToUpdate = targetItem || photoPreviewItem;
    if (itemToUpdate) {
      const targetId = itemToUpdate.id || itemToUpdate._id;
      if (itemToUpdate.photo && itemToUpdate.photo.includes('amazonaws.com')) {
        deleteCloudImage(itemToUpdate.photo);
      }
      const updated = { ...itemToUpdate, id: targetId, photo: '' };
      setPhotoPreviewItem(updated);
      setImgError(false);
      updateVessel(updated);
    } else {
      setForm(prev => ({ ...prev, photo: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalCategory = form.category;
    if (form.category === '__custom__') {
      finalCategory = handleAddCategory(modalCustomCategory) || 'Cooking Vessel';
    }

    const payload = {
      ...form,
      category: finalCategory,
      photo: form.photo || '',
      totalQty: Number(form.totalQty),
      availableQty: Number(form.availableQty),
      inUseQty: Number(form.inUseQty),
      damagedQty: Number(form.damagedQty),
      valuePerUnit: Number(form.valuePerUnit)
    };
    if (editingItem) {
      updateVessel({ ...payload, id: editingItem.id || editingItem._id });
    } else {
      addVessel(payload);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setModalCustomCategory('');
    setForm({ name: '', category: availableCategories[0] || 'Cooking Vessel', totalQty: 10, availableQty: 10, inUseQty: 0, damagedQty: 0, location: 'Main Store A', valuePerUnit: 1000, photo: '' });
  };

  const openEdit = (v) => {
    setEditingItem(v);
    const isKnown = availableCategories.includes(v.category);
    setForm({
      ...v,
      category: isKnown ? v.category : (v.category ? '__custom__' : (availableCategories[0] || 'Cooking Vessel')),
      photo: v.photo || ''
    });
    setModalCustomCategory(isKnown ? '' : (v.category || ''));
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Storage Inventory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track vessels, utensils, cooking equipment and storage assets.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsGatePassModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Truck size={18} /><span>Generate Event Gate Pass PDF</span>
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setForm({ name: '', category: 'Cooking Vessel', totalQty: 10, availableQty: 10, inUseQty: 0, damagedQty: 0, location: 'Main Store A', valuePerUnit: 1000, photo: '' }); setIsModalOpen(true); }}>
            <Plus size={18} /><span>Add Vessel / Gear</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpis" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Vessels & Utensils</h3>
            <div className="kpi-value">{totalCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>units</span></div>
            {damagedCount > 0 && (<div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.25rem', fontWeight: 600 }}>{damagedCount} damaged/lost</div>)}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input type="text" placeholder="Search vessels & equipment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}>
            <option value="All">All Categories ({vessels.length})</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => setIsAddCategoryOpen(!isAddCategoryOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}
            title="Add a custom storage category"
          >
            <Plus size={14} /><span>+ Category</span>
          </button>
        </div>
      </div>

      {/* Quick Add Custom Category Dialog */}
      {isAddCategoryOpen && (
        <div className="glass-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(156, 21, 25, 0.04)', border: '1px solid rgba(156, 21, 25, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '260px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>New Storage Category:</span>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Dining Crockery, Transport Crates, Melamine Sets, Linens..."
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setIsAddCategoryOpen(false); }}
              style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => handleAddCategory()}
              disabled={!newCategoryInput.trim()}
              style={{ fontSize: '0.8rem', fontWeight: 600 }}
            >
              Add Category
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => { setIsAddCategoryOpen(false); setNewCategoryInput(''); }}
              style={{ fontSize: '0.8rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>Photo</th>
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
                <tr key={v.id || v._id}>
                  <td style={{ width: '50px', textAlign: 'center' }}>
                    {v.photo ? (
                      <img
                        key={v.photo ? `${v.id || v._id}_${v.photo.length}_${v.photo.slice(-20)}` : 'ves_thumb'}
                        src={v.photo}
                        alt={v.name}
                        onClick={() => { setImgError(false); setPhotoPreviewItem(v); }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.nextElementSibling;
                          if (fb) fb.style.display = 'flex';
                        }}
                        style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'block', margin: '0 auto' }}
                        title="Click to view / manage photo"
                      />
                    ) : null}
                    <div
                      onClick={() => { setImgError(false); setPhotoPreviewItem(v); }}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.04)',
                        display: v.photo ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        margin: '0 auto',
                        cursor: 'pointer'
                      }}
                      title={v.photo ? "Photo error - click to manage" : "Click to add photo"}
                    >
                      <Camera size={16} />
                    </div>
                  </td>
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
              {filtered.length === 0 && (<tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No vessels or equipment found.</td></tr>)}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.75rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setForm({ ...form, category: '__custom__' })}
                    >
                      + Add New
                    </button>
                  </div>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom__">+ Add Custom Category...</option>
                  </select>
                  {form.category === '__custom__' && (
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Type new category name..."
                      value={modalCustomCategory}
                      onChange={(e) => setModalCustomCategory(e.target.value)}
                      style={{ marginTop: '0.5rem', width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--primary-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  )}
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Asset Value / Unit ({companyProfile?.currency || '₹'})</label>
                <input type="number" min="0" required placeholder="e.g. 5000" value={form.valuePerUnit} onChange={(e) => setForm({ ...form, valuePerUnit: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>

              {/* Photo Upload Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.5)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Item Photo (JPG, PNG, WEBP — Max 10MB)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {form.photo ? (
                    <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img
                        key={form.photo ? `form_${form.photo.length}_${form.photo.slice(-20)}` : 'form_img'}
                        src={form.photo}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, photo: '' }))}
                        style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Remove Photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: '70px', height: '70px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      {isCompressing ? (
                        <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      ) : (
                        <Camera size={24} />
                      )}
                    </div>
                  )}

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={e => handlePhotoUpload(e)}
                      disabled={isCompressing}
                      style={{ fontSize: '0.82rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>JPG, PNG, WEBP (Photos &gt;5MB compressed automatically)</span>
                    {isCompressing && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{uploadStatus || 'Optimizing image...'}</span>
                    )}
                    {form.photo && !isCompressing && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setForm(f => ({ ...f, photo: '' }))}
                        style={{ width: 'fit-content', fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={12} /> Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Vessel' : 'Save Vessel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Gate Pass Generation Modal */}
      {isGatePassModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '640px', width: '92%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={22} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Event Material Gate Pass & Asset Return</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Issue Storage Consumables & Track Inbound/Outbound Vessels</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsGatePassModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Search & Select Event Booking:</label>
                <div style={{ position: 'relative', marginBottom: '0.45rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type client name, event ID, date, or occasion to filter..."
                    value={gatePassEventSearch}
                    onChange={e => {
                      setGatePassEventSearch(e.target.value);
                      const q = e.target.value.toLowerCase();
                      const matched = (events || []).filter(ev => 
                        (ev.id && ev.id.toLowerCase().includes(q)) ||
                        (ev.customer?.name && ev.customer.name.toLowerCase().includes(q)) ||
                        (ev.eventType && ev.eventType.toLowerCase().includes(q)) ||
                        (ev.date && ev.date.toLowerCase().includes(q))
                      );
                      if (matched.length > 0) {
                        setSelectedEventId(matched[0].id);
                      }
                    }}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {gatePassEventSearch && (
                    <button
                      type="button"
                      onClick={() => setGatePassEventSearch('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.88rem' }}
                >
                  {filteredGatePassEvents.length > 0 ? (
                    filteredGatePassEvents.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        {evt.id} - {evt.customer?.name} ({evt.eventType} · {evt.date})
                      </option>
                    ))
                  ) : (
                    <option value="">No matching events found</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Dispatch Vehicle No:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gatePassForm.vehicleNo}
                    onChange={e => setGatePassForm({ ...gatePassForm, vehicleNo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Driver Name & Mobile:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gatePassForm.driverName}
                    onChange={e => setGatePassForm({ ...gatePassForm, driverName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.55)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                  Section A: Consumable Storage Provisions
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Includes Rice, Spices, Dairy, Oil, Disposables, Napkins auto-computed for {selectedEvent?.customer?.name || 'Selected Event'}.
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.55)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                  Section B: Vessels & Catering Equipment Return Tracker
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Tracks {vessels.length} vessel asset types (Degchis, Chafing Dishes, Gas Cylinders, Drums) outbound & verified return.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrintGatePass}
                disabled={isPrinting || !selectedEventId}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Printer size={16} /> {isPrinting ? 'Preparing Print...' : 'Print Gate Pass'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  await handleDownloadGatePass();
                  setIsGatePassModalOpen(false);
                }}
                disabled={isDownloading || !selectedEventId}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                <Download size={16} /> {isDownloading ? 'Generating PDF...' : 'Download Gate Pass PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Item Photo Preview & Management Modal */}
      {photoPreviewItem && (
        <div className="modal-overlay" onClick={() => { setPhotoPreviewItem(null); setImgError(false); }}>
          <div
            className="glass-card modal-card"
            style={{ maxWidth: '520px', width: '92%', padding: '1.5rem', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{photoPreviewItem.name}</h2>
                <span className="badge badge-info" style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>{photoPreviewItem.category}</span>
                {photoPreviewItem.photo && (photoPreviewItem.photo.startsWith('http://') || photoPreviewItem.photo.startsWith('https://')) && (
                  <span className="badge badge-success" style={{ fontSize: '0.72rem', marginTop: '0.2rem', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Cloud size={11} /> AWS S3
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setPhotoPreviewItem(null); setImgError(false); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ margin: '1rem 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', minHeight: '220px', maxHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.03)', position: 'relative' }}>
              {isCompressing ? (
                <div style={{ padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem auto' }}></div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{uploadStatus || 'Optimizing & uploading photo...'}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Cloud Object Storage (AWS S3)</div>
                </div>
              ) : photoPreviewItem.photo && !imgError ? (
                <img
                  key={photoPreviewItem.photo ? `modal_${photoPreviewItem.id || photoPreviewItem._id}_${photoPreviewItem.photo.length}_${photoPreviewItem.photo.slice(-20)}` : 'modal_img'}
                  src={photoPreviewItem.photo}
                  alt={photoPreviewItem.name}
                  onError={() => setImgError(true)}
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', display: 'block' }}
                />
              ) : imgError ? (
                <div style={{ padding: '2rem 1.5rem', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={44} style={{ color: 'var(--color-danger, #ef4444)', margin: '0 auto 0.6rem auto', display: 'block' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Unable to display photo</div>
                  <div style={{ fontSize: '0.82rem', marginBottom: '1rem', maxWidth: '340px', margin: '0 auto 1rem auto' }}>
                    The photo data may have been corrupted or improperly encoded. Please replace it with a fresh image.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => photoFileInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                    >
                      <Upload size={14} /> Upload Fresh Photo
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => handleRemovePhoto(photoPreviewItem)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-danger, #ef4444)' }}
                    >
                      <Trash2 size={14} /> Clear Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                  <Package size={48} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <div>No photo attached to this item yet.</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => handlePhotoUpload(e, photoPreviewItem)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isCompressing}
                onClick={() => photoFileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
              >
                <Upload size={14} /> {photoPreviewItem.photo ? 'Replace Photo' : 'Upload Photo'}
              </button>

              {photoPreviewItem.photo && (
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  disabled={isCompressing}
                  onClick={() => handleRemovePhoto(photoPreviewItem)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                >
                  <Trash2 size={14} /> Remove Photo
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setPhotoPreviewItem(null); setImgError(false); }}
                style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageInventory;
