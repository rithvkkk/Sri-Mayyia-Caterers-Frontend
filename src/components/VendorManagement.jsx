import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { calculatePdfReport, generateSupplierPO, printPdfBlob, downloadPdfBlob } from '../utils/pdfGenerator';
import { initialVendorCategories } from '../utils/mockData';
import { Store, ShoppingBag, FileText, Download, Eye, X, Plus, Trash2, Save, Share2, Edit2, Check, ShieldAlert, Search, Printer, Tag, ChevronDown, ChevronRight, Layers, Package, IndianRupee } from 'lucide-react';

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
    linkSupplierToMaterial,
    unlinkSupplierFromMaterial,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    updateEvent,
    refreshEventTotals,
    vendorCategories = []
  } = useContext(AppContext);

  const vendorCategoriesList = (vendorCategories && vendorCategories.length > 0)
    ? vendorCategories
    : initialVendorCategories;

  const [activeView, setActiveView] = useState('materials'); // 'materials' | 'suppliers' | 'allocation'
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [activeCatFilter, setActiveCatFilter] = useState('All');
  const [supplierCatFilter, setSupplierCatFilter] = useState('All');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState('All');
  const [poPreview, setPoPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingPoId, setProcessingPoId] = useState(null);

  // Expandable row states
  const [expandedSupplierId, setExpandedSupplierId] = useState(null);
  const [expandedMaterialId, setExpandedMaterialId] = useState(null);

  // Link Supplier <-> Material Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null); // { type: 'supplier'|'material', target }
  const [linkForm, setLinkForm] = useState({
    materialId: '',
    supplierId: '',
    price: '',
    unit: '',
    notes: ''
  });

  // Inline supplier-material price editing
  const [editingVendorPriceKey, setEditingVendorPriceKey] = useState(null); // `${matId}_${supId}`
  const [editingVendorPriceVal, setEditingVendorPriceVal] = useState('');

  useEffect(() => {
    if (events && events.length > 0) {
      if (!selectedEventId || !events.some(e => e.id === selectedEventId)) {
        setSelectedEventId(events[0].id);
      }
    }
  }, [events, selectedEventId]);
  
  // Inline price editing for master raw material
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  // Material form modal
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    name: '', category: 'Grocery', customCategory: '', unit: 'kg', costPerUnit: 0
  });

  // Supplier form modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    category: 'Grocery',
    subCategory: 'Rice & Grains',
    phone: '',
    address: '',
    status: 'Active',
    notes: ''
  });

  // State for manual material entry form (allocation)
  const [newMaterial, setNewMaterial] = useState({
    rawMaterialId: '', requiredQty: '', supplierId: ''
  });

  const currentEvent = events.find(e => e.id === selectedEventId);
  const roleLower = (currentRole || 'admin').toLowerCase();
  const isOps = !currentRole || roleLower === 'admin' || roleLower === 'hr' || roleLower === 'hr manager' || roleLower === 'manager' || roleLower.includes('admin') || roleLower.includes('manag');
  const hasAccess = !currentRole || roleLower !== 'agency';

  if (!hasAccess) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Vendor management is restricted for external Agency profiles. Please log in as an Admin, HR, or Accountant.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return `${companyProfile?.currency || '₹'} ${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  // === MATERIALS FUNCTIONS ===
  const allMaterialCategories = useMemo(() => {
    const base = [
      'Grocery',
      'Dairy',
      'Veg/Fruit',
      'Vegetables',
      'Fuel',
      'Spices & Condiments',
      'Ghee & Oils',
      'Dry Fruits',
      'Provisions',
      'Bakery',
      'Sweets & Snacks',
      'Beverages',
      'Disposable Items'
    ];
    const set = new Set(base);
    if (Array.isArray(vendorCategoriesList)) {
      vendorCategoriesList.forEach(vc => {
        if (vc && vc.name) set.add(vc.name);
      });
    }
    if (Array.isArray(rawMaterials)) {
      rawMaterials.forEach(rm => {
        if (rm && rm.category) set.add(rm.category);
      });
    }
    return Array.from(set).sort();
  }, [vendorCategoriesList, rawMaterials]);

  const materialCategories = useMemo(() => ['All', ...allMaterialCategories], [allMaterialCategories]);

  // === SUPPLIER & MATERIAL RELATIONSHIP HELPERS ===
  const getMaterialsForSupplier = (supplierId) => {
    const sId = String(supplierId);
    return rawMaterials.filter(rm =>
      Array.isArray(rm.suppliers) && rm.suppliers.some(sp => String(sp.supplierId) === sId)
    ).map(rm => {
      const pricing = rm.suppliers.find(sp => String(sp.supplierId) === sId);
      return {
        ...rm,
        supplierPrice: pricing?.price !== undefined ? pricing.price : rm.costPerUnit,
        supplierUnit: pricing?.unit || rm.unit,
        supplierNotes: pricing?.notes || '',
        isDefault: pricing?.isDefault || false
      };
    });
  };

  const filteredMaterials = rawMaterials.filter(m => {
    if (!m) return false;
    const term = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !term ||
      (m.name || '').toLowerCase().includes(term) ||
      (m.category || '').toLowerCase().includes(term) ||
      (m.unit || '').toLowerCase().includes(term) ||
      (Array.isArray(m.suppliers) && m.suppliers.some(s => (s.supplierName || '').toLowerCase().includes(term)));
    const matchesCat = activeCatFilter === 'All' || (m.category || '').toLowerCase() === activeCatFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

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
    const matId = material.id || material._id;
    updateRawMaterial({ ...material, id: matId, costPerUnit: newPrice });
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
      const isKnown = allMaterialCategories.includes(material.category);
      setMaterialForm({
        name: material.name || '',
        category: isKnown ? (material.category || 'Grocery') : '__custom__',
        customCategory: isKnown ? '' : (material.category || ''),
        unit: material.unit || 'kg',
        costPerUnit: material.costPerUnit || 0
      });
    } else {
      setEditingMaterial(null);
      setMaterialForm({ name: '', category: 'Grocery', customCategory: '', unit: 'kg', costPerUnit: 0 });
    }
    setIsMaterialModalOpen(true);
  };

  const handleMaterialSubmit = (e) => {
    e.preventDefault();
    const finalCategory = materialForm.category === '__custom__'
      ? (materialForm.customCategory || '').trim() || 'General'
      : materialForm.category;

    const payload = {
      name: (materialForm.name || '').trim(),
      category: finalCategory,
      unit: (materialForm.unit || '').trim(),
      costPerUnit: Number(materialForm.costPerUnit) || 0
    };

    if (editingMaterial) {
      const targetId = editingMaterial.id || editingMaterial._id;
      updateRawMaterial({ ...editingMaterial, ...payload, id: targetId });
    } else {
      addRawMaterial(payload);
    }
    setIsMaterialModalOpen(false);
    setEditingMaterial(null);
    setMaterialForm({ name: '', category: 'Grocery', customCategory: '', unit: 'kg', costPerUnit: 0 });
  };

  // === SUPPLIER FUNCTIONS ===
  const selectedCatObj = vendorCategoriesList.find(c => c.name === supplierForm.category);
  const currentSubCategories = selectedCatObj?.subCategories || [];

  const filteredSuppliers = suppliers.filter(s => {
    const term = (searchTerm || '').trim().toLowerCase();
    const sCat = s.category || 'Uncategorized';
    const sSub = s.subCategory || '';
    const sStatus = s.status || (s.active !== false ? 'Active' : 'Inactive');
    const sId = String(s.id || s._id);

    // Also match names of materials supplied by this vendor
    const suppliedMaterials = rawMaterials.filter(rm =>
      Array.isArray(rm.suppliers) && rm.suppliers.some(sp => String(sp.supplierId) === sId)
    );
    const suppliedMatNames = suppliedMaterials.map(rm => (rm.name || '').toLowerCase()).join(' ');

    const matchesSearch = !term ||
      (s.name && s.name.toLowerCase().includes(term)) ||
      sCat.toLowerCase().includes(term) ||
      sSub.toLowerCase().includes(term) ||
      (s.phone && s.phone.toLowerCase().includes(term)) ||
      (s.contact && s.contact.toLowerCase().includes(term)) ||
      (s.address && s.address.toLowerCase().includes(term)) ||
      suppliedMatNames.includes(term);

    const matchesCat = supplierCatFilter === 'All' || sCat === supplierCatFilter;
    const matchesStatus = supplierStatusFilter === 'All' || sStatus === supplierStatusFilter;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const openSupplierForm = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name || '',
        category: supplier.category || 'Grocery',
        subCategory: supplier.subCategory || '',
        phone: supplier.phone || supplier.contact || '',
        address: supplier.address || '',
        status: supplier.status || (supplier.active !== false ? 'Active' : 'Inactive'),
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      const defaultCat = vendorCategoriesList[0]?.name || 'Grocery';
      const defaultCatObj = vendorCategoriesList.find(c => c.name === defaultCat);
      const defaultSub = defaultCatObj?.subCategories?.[0] || '';
      setSupplierForm({
        name: '',
        category: defaultCat,
        subCategory: defaultSub,
        phone: '',
        address: '',
        status: 'Active',
        notes: ''
      });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      alert('Supplier name is required');
      return;
    }
    const supPayload = {
      ...supplierForm,
      name: supplierForm.name.trim(),
      phone: (supplierForm.phone || '').trim(),
      address: (supplierForm.address || '').trim(),
      category: supplierForm.category || 'Uncategorized',
      subCategory: supplierForm.subCategory || '',
      status: supplierForm.status || 'Active',
      active: supplierForm.status !== 'Inactive',
      notes: (supplierForm.notes || '').trim()
    };
    if (editingSupplier) {
      updateSupplier({ ...supPayload, id: editingSupplier.id || editingSupplier._id });
    } else {
      addSupplier(supPayload);
    }
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  // === LINKING MODAL ACTIONS ===
  const openLinkModal = (type, target) => {
    setLinkTarget({ type, target });
    if (type === 'supplier') {
      const firstMat = rawMaterials[0];
      setLinkForm({
        materialId: firstMat ? (firstMat.id || firstMat._id) : '',
        supplierId: target.id || target._id,
        price: firstMat ? (firstMat.costPerUnit || '') : '',
        unit: firstMat ? (firstMat.unit || 'kg') : 'kg',
        notes: ''
      });
    } else {
      const firstSup = suppliers[0];
      setLinkForm({
        materialId: target.id || target._id,
        supplierId: firstSup ? (firstSup.id || firstSup._id) : '',
        price: target.costPerUnit || '',
        unit: target.unit || 'kg',
        notes: ''
      });
    }
    setIsLinkModalOpen(true);
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    const priceNum = parseFloat(linkForm.price);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Please enter a valid price');
      return;
    }
    const sup = suppliers.find(s => String(s.id || s._id) === String(linkForm.supplierId));
    const targetMat = rawMaterials.find(r => String(r.id || r._id) === String(linkForm.materialId));
    const supplierPricing = {
      supplierId: String(linkForm.supplierId),
      supplierName: sup?.name || 'Supplier',
      price: priceNum,
      unit: linkForm.unit || targetMat?.unit || 'kg',
      notes: (linkForm.notes || '').trim()
    };
    await linkSupplierToMaterial(linkForm.materialId, supplierPricing);
    setIsLinkModalOpen(false);
  };

  const handleUnlink = async (materialId, supplierId) => {
    if (window.confirm('Are you sure you want to remove this vendor pricing link?')) {
      await unlinkSupplierFromMaterial(materialId, supplierId);
    }
  };

  const handleSaveVendorPrice = async (materialId, supplierId, newPrice) => {
    const p = parseFloat(newPrice);
    if (isNaN(p) || p < 0) {
      alert('Please enter a valid price');
      return;
    }
    const rm = rawMaterials.find(r => (r.id || r._id) === materialId);
    const sup = suppliers.find(s => String(s.id || s._id) === String(supplierId));
    const existing = rm?.suppliers?.find(sp => String(sp.supplierId) === String(supplierId));
    await linkSupplierToMaterial(materialId, {
      supplierId: String(supplierId),
      supplierName: existing?.supplierName || sup?.name || 'Supplier',
      price: p,
      unit: existing?.unit || rm?.unit || 'kg',
      notes: existing?.notes || ''
    });
    setEditingVendorPriceKey(null);
    setEditingVendorPriceVal('');
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
    const rm = rawMaterials.find(r => (r.id || r._id) === newMaterial.rawMaterialId);
    const sup = suppliers.find(s => (s.id || s._id) === newMaterial.supplierId);
    if (!rm || !sup) return;

    // Check if supplier has custom pricing for this raw material
    const supPricing = rm.suppliers?.find(sp => String(sp.supplierId) === String(sup.id || sup._id));
    const unitPrice = supPricing && supPricing.price > 0 ? Number(supPricing.price) : Number(rm.costPerUnit);
    const totalCost = parseFloat(newMaterial.requiredQty) * unitPrice;

    const manualMat = {
      name: rm.name, category: rm.category,
      requiredQty: parseFloat(newMaterial.requiredQty), unit: supPricing?.unit || rm.unit,
      costPerUnit: unitPrice, totalCost,
      supplier: { _id: sup.id || sup._id, name: sup.name, contact: sup.phone || sup.contact || '', category: sup.category }
    };
    const updatedEvent = { ...currentEvent, manualMaterials: [...materialList, manualMat] };
    
    // Clear inputs immediately for zero delay
    setNewMaterial({ rawMaterialId: '', requiredQty: '', supplierId: '' });
    
    // Trigger synchronous finance calculation & background sync
  };

  const handleRemoveMaterial = (indexToRemove) => {
    const updatedMaterials = materialList.filter((_, idx) => idx !== indexToRemove);
    const updatedEvent = { ...currentEvent, manualMaterials: updatedMaterials };
    updateEvent(updatedEvent);
  };

  const getSupplierItems = (sup) => {
    if (!sup) return [];
    const targetName = (sup.name || (typeof sup === 'string' ? sup : '')).trim().toLowerCase();
    const targetId = String(sup.id || sup._id || '').trim().toLowerCase();

    return materialList.filter(m => {
      if (!m) return false;
      const s = m.supplier;
      if (!s) return false;
      if (typeof s === 'string') {
        const sTrim = s.trim().toLowerCase();
        return sTrim === targetName || (targetId && sTrim === targetId);
      }
      const sName = (s.name || '').trim().toLowerCase();
      const sId = String(s.id || s._id || '').trim().toLowerCase();
      return (targetName && sName === targetName) || (targetId && sId === targetId) || (targetName && sId === targetName) || (targetId && sName === targetId);
    });
  };

  const handleSendPO = (sup) => {
    const supItems = getSupplierItems(sup);
    const itemsForPO = supItems.length > 0 ? supItems : materialList;
    if (!itemsForPO.length) { 
      alert('No materials assigned to this supplier for the selected event.'); 
      return; 
    }
    const supplierForPDF = { 
      name: sup.name || (typeof sup === 'string' ? sup : 'Supplier'), 
      contact: sup.contact || sup.phone || 'N/A', 
      category: sup.category || '', 
      _id: sup.id || sup._id || 'sup'
    };
    try {
      const result = generateSupplierPO(supplierForPDF, itemsForPO, currentEvent, companyProfile);
      if (result) {
        setPoPreview({ ...result, supplierName: supplierForPDF.name });
      }
    } catch (err) {
      console.error('Error previewing Supplier PO:', err);
      alert('Could not generate PO preview: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDirectDownloadPO = (sup) => {
    const supItems = getSupplierItems(sup);
    const itemsForPO = supItems.length > 0 ? supItems : materialList;
    if (!itemsForPO.length) { 
      alert('No materials assigned to this supplier for the selected event.'); 
      return; 
    }
    const supplierForPDF = { 
      name: sup.name || (typeof sup === 'string' ? sup : 'Supplier'), 
      contact: sup.contact || sup.phone || 'N/A', 
      category: sup.category || '', 
      _id: sup.id || sup._id || 'sup'
    };
    const supKey = sup.id || sup._id || sup.name;
    setProcessingPoId(supKey);
    try {
      const result = generateSupplierPO(supplierForPDF, itemsForPO, currentEvent, companyProfile);
      if (result && (result.blob || result.blobUrl)) {
        downloadPdfBlob(result.blob || result.blobUrl, result.filename);
      } else {
        alert('Could not generate Supplier PO PDF.');
      }
    } catch (err) {
      console.error('Error downloading Supplier PO:', err);
      alert('Could not download PO PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setTimeout(() => setProcessingPoId(null), 800);
    }
  };

  const handleDownloadPO = () => { 
    if (!poPreview) return; 
    downloadPdfBlob(poPreview.blob || poPreview.blobUrl, poPreview.filename); 
  };
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
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

          {activeView === 'suppliers' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
                <select
                  value={supplierCatFilter}
                  onChange={(e) => setSupplierCatFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                >
                  <option value="All">All Categories</option>
                  {vendorCategoriesList.map(cat => (
                    <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
                <select
                  value={supplierStatusFilter}
                  onChange={(e) => setSupplierStatusFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {isOps && (
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => openSupplierForm()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  <Plus size={15} /> Add Supplier
                </button>
              )}
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
                  <th style={{ width: '30px' }}></th>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Master Base Cost</th>
                  <th>Linked Suppliers & Pricing</th>
                  {isOps && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map(m => {
                  const matId = m.id || m._id;
                  const isExpanded = expandedMaterialId === matId;
                  const suppliersList = Array.isArray(m.suppliers) ? m.suppliers : [];

                  return (
                    <React.Fragment key={matId}>
                      <tr>
                        <td style={{ width: '30px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setExpandedMaterialId(isExpanded ? null : matId)}>
                          {suppliersList.length > 0 ? (
                            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {matId}</div>
                        </td>
                        <td><span className="badge badge-info">{m.category}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{m.unit}</td>
                        <td>
                          {editingPriceId === matId ? (
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
                              onClick={() => isOps && handlePriceEdit(matId, m.costPerUnit)}
                              title={isOps ? 'Click to edit base price' : ''}
                            >
                              {formatCurrency(m.costPerUnit)} / {m.unit}
                              {isOps && <Edit2 size={12} style={{ opacity: 0.4 }} />}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            {suppliersList.map(sp => (
                              <span
                                key={sp.supplierId}
                                className="badge"
                                style={{
                                  background: 'rgba(156, 21, 25, 0.08)',
                                  border: '1px solid rgba(156, 21, 25, 0.25)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.5rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <strong>{sp.supplierName}:</strong> {formatCurrency(sp.price)}/{sp.unit || m.unit}
                              </span>
                            ))}
                            {suppliersList.length === 0 && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Master catalog price only
                              </span>
                            )}
                            {isOps && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                onClick={() => openLinkModal('material', m)}
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                title="Link a supplier with vendor-specific price"
                              >
                                <Plus size={12} /> Link Vendor
                              </button>
                            )}
                          </div>
                        </td>
                        {isOps && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button className="btn btn-secondary btn-small" onClick={() => openMaterialForm(m)} title="Edit Material">
                                <Edit2 size={14} />
                              </button>
                              <button className="btn btn-secondary btn-small" onClick={() => deleteRawMaterial(matId)} style={{ color: 'var(--color-danger)' }} title="Delete Material">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expandable details of all suppliers providing this material */}
                      {isExpanded && suppliersList.length > 0 && (
                        <tr style={{ background: 'rgba(255, 255, 255, 0.45)' }}>
                          <td colSpan={isOps ? 7 : 6} style={{ padding: '0.75rem 1.25rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--bg-card)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                  Suppliers Providing {m.name} ({suppliersList.length} vendors)
                                </span>
                                {isOps && (
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-small"
                                    onClick={() => openLinkModal('material', m)}
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                                  >
                                    <Plus size={12} /> Link Another Vendor
                                  </button>
                                )}
                              </div>
                              <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                                <thead>
                                  <tr>
                                    <th>Supplier Name</th>
                                    <th>Vendor Price</th>
                                    <th>Base Catalog Price</th>
                                    <th>Price Variance</th>
                                    <th>Notes / Terms</th>
                                    {isOps && <th style={{ textAlign: 'right', width: '90px' }}>Actions</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {suppliersList.map(sp => {
                                    const editKey = `${matId}_${sp.supplierId}`;
                                    const isEditingPrice = editingVendorPriceKey === editKey;
                                    const diff = Number(sp.price) - Number(m.costPerUnit);

                                    return (
                                      <tr key={sp.supplierId}>
                                        <td style={{ fontWeight: 600 }}>{sp.supplierName}</td>
                                        <td>
                                          {isEditingPrice ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                              <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={editingVendorPriceVal}
                                                onChange={(e) => setEditingVendorPriceVal(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveVendorPrice(matId, sp.supplierId, editingVendorPriceVal);
                                                  if (e.key === 'Escape') setEditingVendorPriceKey(null);
                                                }}
                                                autoFocus
                                                style={{ width: '75px', padding: '0.2rem 0.35rem', fontSize: '0.8rem' }}
                                              />
                                              <button onClick={() => handleSaveVendorPrice(matId, sp.supplierId, editingVendorPriceVal)} style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer' }}>
                                                <Check size={14} />
                                              </button>
                                              <button onClick={() => setEditingVendorPriceKey(null)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                                                <X size={14} />
                                              </button>
                                            </div>
                                          ) : (
                                            <div
                                              style={{ cursor: isOps ? 'pointer' : 'default', fontWeight: 700 }}
                                              onClick={() => {
                                                if (isOps) {
                                                  setEditingVendorPriceKey(editKey);
                                                  setEditingVendorPriceVal(String(sp.price));
                                                }
                                              }}
                                              title={isOps ? 'Click to edit vendor price' : ''}
                                            >
                                              {formatCurrency(sp.price)} / {sp.unit || m.unit}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(m.costPerUnit)} / {m.unit}</td>
                                        <td>
                                          {diff === 0 ? (
                                            <span style={{ color: 'var(--text-muted)' }}>Same as Master</span>
                                          ) : diff > 0 ? (
                                            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>+{formatCurrency(diff)}</span>
                                          ) : (
                                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>-{formatCurrency(Math.abs(diff))}</span>
                                          )}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{sp.notes || '—'}</td>
                                        {isOps && (
                                          <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem' }}>
                                              <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() => { setEditingVendorPriceKey(editKey); setEditingVendorPriceVal(String(sp.price)); }}
                                                title="Edit Price"
                                                style={{ padding: '0.2rem' }}
                                              >
                                                <Edit2 size={12} />
                                              </button>
                                              <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() => handleUnlink(matId, sp.supplierId)}
                                                title="Unlink Supplier"
                                                style={{ padding: '0.2rem', color: 'var(--color-danger)' }}
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan={isOps ? "7" : "6"} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        {searchTerm ? `No materials found matching "${searchTerm.trim()}".` : 'No materials found matching filters.'}
                      </p>
                      {searchTerm && (
                        <button className="btn btn-secondary btn-small" onClick={() => setSearchTerm('')}>
                          Clear Search
                        </button>
                      )}
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
                  <th style={{ width: '30px' }}></th>
                  <th>Supplier Name</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Phone / Contact</th>
                  <th>Address</th>
                  <th>Supplied Materials</th>
                  <th>Status</th>
                  {isOps && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(s => {
                  const supId = s.id || s._id;
                  const sCategory = s.category || 'Uncategorized';
                  const sSubCategory = s.subCategory || '—';
                  const isActive = s.status ? s.status === 'Active' : s.active !== false;
                  const isExpanded = expandedSupplierId === supId;
                  const suppliedMaterials = getMaterialsForSupplier(supId);

                  // Group materials by category
                  const groupedMaterials = suppliedMaterials.reduce((acc, rm) => {
                    const cat = rm.category || 'General';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(rm);
                    return acc;
                  }, {});

                  return (
                    <React.Fragment key={supId}>
                      <tr>
                        <td style={{ width: '30px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setExpandedSupplierId(isExpanded ? null : supId)}>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td>
                          <div
                            style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                            onClick={() => setExpandedSupplierId(isExpanded ? null : supId)}
                          >
                            {s.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {supId}</div>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontWeight: 600 }}>{sCategory}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: sSubCategory === '—' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                            {sSubCategory}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{s.phone || s.contact || 'N/A'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.address || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => setExpandedSupplierId(isExpanded ? null : supId)}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Package size={13} />
                            <span>{suppliedMaterials.length} materials</span>
                          </button>
                        </td>
                        <td>
                          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {isOps && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                className="btn btn-primary btn-small"
                                onClick={() => openLinkModal('supplier', s)}
                                title="Add Material & Pricing to this Vendor"
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                <Plus size={13} /> Material
                              </button>
                              <button className="btn btn-secondary btn-small" onClick={() => openSupplierForm(s)} title="Edit Supplier">
                                <Edit2 size={14} />
                              </button>
                              <button className="btn btn-secondary btn-small" onClick={() => deleteSupplier(supId)} style={{ color: 'var(--color-danger)' }} title="Delete Supplier">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expandable Vendor Materials Drawer grouped by Category */}
                      {isExpanded && (
                        <tr style={{ background: 'rgba(255, 255, 255, 0.45)' }}>
                          <td colSpan={isOps ? 9 : 8} style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', background: 'var(--bg-card)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                  <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)' }}>
                                    <Layers size={16} />
                                    <span>Materials & Pricing Provided by {s.name} ({suppliedMaterials.length} items)</span>
                                  </h3>
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                                    Configured unit prices and terms stored in database for {s.name}.
                                  </p>
                                </div>
                                {isOps && (
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-small"
                                    onClick={() => openLinkModal('supplier', s)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                  >
                                    <Plus size={14} /> Add Material to {s.name}
                                  </button>
                                )}
                              </div>

                              {suppliedMaterials.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                                  <Package size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>No materials are linked to this vendor yet.</p>
                                  {isOps && (
                                    <button className="btn btn-secondary btn-small" onClick={() => openLinkModal('supplier', s)}>
                                      <Plus size={13} /> Link First Material
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {Object.keys(groupedMaterials).sort().map(categoryName => {
                                    const items = groupedMaterials[categoryName];
                                    return (
                                      <div key={categoryName} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div style={{ background: 'rgba(156, 21, 25, 0.05)', padding: '0.45rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Tag size={14} style={{ color: 'var(--color-primary)' }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{categoryName}</span>
                                          </div>
                                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{items.length} items</span>
                                        </div>

                                        <table className="custom-table" style={{ fontSize: '0.82rem', margin: 0 }}>
                                          <thead>
                                            <tr>
                                              <th>Material Name</th>
                                              <th>Unit</th>
                                              <th>Vendor Price</th>
                                              <th>Base Catalog Cost</th>
                                              <th>Variance</th>
                                              <th>Notes / Grade</th>
                                              {isOps && <th style={{ textAlign: 'right', width: '90px' }}>Actions</th>}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {items.map(rm => {
                                              const matId = rm.id || rm._id;
                                              const editKey = `${matId}_${supId}`;
                                              const isEditingPrice = editingVendorPriceKey === editKey;
                                              const diff = Number(rm.supplierPrice) - Number(rm.costPerUnit);

                                              return (
                                                <tr key={matId}>
                                                  <td style={{ fontWeight: 600 }}>{rm.name}</td>
                                                  <td style={{ color: 'var(--text-secondary)' }}>{rm.supplierUnit || rm.unit}</td>
                                                  <td>
                                                    {isEditingPrice ? (
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          step="0.01"
                                                          value={editingVendorPriceVal}
                                                          onChange={(e) => setEditingVendorPriceVal(e.target.value)}
                                                          onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveVendorPrice(matId, supId, editingVendorPriceVal);
                                                            if (e.key === 'Escape') setEditingVendorPriceKey(null);
                                                          }}
                                                          autoFocus
                                                          style={{ width: '75px', padding: '0.2rem 0.35rem', fontSize: '0.8rem' }}
                                                        />
                                                        <button onClick={() => handleSaveVendorPrice(matId, supId, editingVendorPriceVal)} style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer' }}>
                                                          <Check size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingVendorPriceKey(null)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                                                          <X size={14} />
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div
                                                        style={{ cursor: isOps ? 'pointer' : 'default', fontWeight: 700, color: 'var(--color-primary)' }}
                                                        onClick={() => {
                                                          if (isOps) {
                                                            setEditingVendorPriceKey(editKey);
                                                            setEditingVendorPriceVal(String(rm.supplierPrice));
                                                          }
                                                        }}
                                                        title={isOps ? 'Click to edit vendor price' : ''}
                                                      >
                                                        {formatCurrency(rm.supplierPrice)} / {rm.supplierUnit || rm.unit}
                                                        {isOps && <Edit2 size={11} style={{ opacity: 0.35, marginLeft: '0.25rem' }} />}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(rm.costPerUnit)} / {rm.unit}</td>
                                                  <td>
                                                    {diff === 0 ? (
                                                      <span style={{ color: 'var(--text-muted)' }}>Match</span>
                                                    ) : diff > 0 ? (
                                                      <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>+{formatCurrency(diff)}</span>
                                                    ) : (
                                                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>-{formatCurrency(Math.abs(diff))}</span>
                                                    )}
                                                  </td>
                                                  <td style={{ color: 'var(--text-secondary)' }}>{rm.supplierNotes || '—'}</td>
                                                  {isOps && (
                                                    <td style={{ textAlign: 'right' }}>
                                                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem' }}>
                                                        <button
                                                          className="btn btn-secondary btn-small"
                                                          onClick={() => { setEditingVendorPriceKey(editKey); setEditingVendorPriceVal(String(rm.supplierPrice)); }}
                                                          title="Edit Price"
                                                          style={{ padding: '0.2rem' }}
                                                        >
                                                          <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                          className="btn btn-secondary btn-small"
                                                          onClick={() => handleUnlink(matId, supId)}
                                                          title="Remove Material from Vendor"
                                                          style={{ padding: '0.2rem', color: 'var(--color-danger)' }}
                                                        >
                                                          <Trash2 size={12} />
                                                        </button>
                                                      </div>
                                                    </td>
                                                  )}
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={isOps ? "9" : "8"} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        {searchTerm ? `No suppliers found matching "${searchTerm.trim()}".` : 'No suppliers found matching the selected filters.'}
                      </p>
                      {searchTerm && (
                        <button className="btn btn-secondary btn-small" onClick={() => setSearchTerm('')}>
                          Clear Search
                        </button>
                      )}
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
                    <button className="btn btn-secondary btn-small" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => handleShareReport('EN')}>
                      <Share2 size={13} /> Export PDF Report
                    </button>
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
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{companyProfile?.currency || '₹'} {mat.costPerUnit}</td>
                          <td style={{ fontWeight: 600 }}>{companyProfile?.currency || '₹'} {mat.totalCost.toLocaleString('en-IN')}</td>
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
                        <tr style={{ background: 'rgba(255, 255, 255, 0.65)' }}>
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
                        <span style={{ fontWeight: 600 }}>{companyProfile?.currency || '₹'} {categoryCosts[cat].toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', marginTop: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>Total Materials Budget:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                        {companyProfile?.currency || '₹'} {totalRawCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ background: 'rgba(156, 21, 25, 0.06)' }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Store size={18} style={{ color: 'var(--color-success)' }} />
                    <span>Supplier PO Allocations</span>
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Dispatch calculated requirements directly as procurement orders.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    {suppliersUsed.map(sup => {
                      const supItems = getSupplierItems(sup);
                      const supTotal = supItems.reduce((s, m) => s + (m.totalCost || 0), 0);
                      const supKey = sup.id || sup._id || sup.name;
                      const isBusy = processingPoId === supKey;
                      return (
                        <div key={supKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.55)' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sup.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sup.contact} | {sup.category}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '0.15rem' }}>{supItems.length} items · {companyProfile?.currency || '₹'} {supTotal.toLocaleString('en-IN')}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-small"
                              onClick={() => handleDirectDownloadPO(sup)}
                              disabled={isBusy}
                              title="Download Purchase Order PDF"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}
                            >
                              <Download size={13} /> {isBusy ? 'Preparing...' : 'Download PO PDF'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() => handleSendPO(sup)}
                              disabled={isBusy}
                              title="Preview / Share PO"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.5rem', fontSize: '0.72rem' }}
                            >
                              <Eye size={13} />
                            </button>
                          </div>
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
                  <select
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    {allMaterialCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom__">+ Add Custom Category...</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Unit of Measure</label>
                  <input type="text" required placeholder="kg, ltr, bag" value={materialForm.unit} onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              {materialForm.category === '__custom__' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Custom Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Produce"
                    value={materialForm.customCategory}
                    onChange={(e) => setMaterialForm({ ...materialForm, customCategory: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Cost / Unit ({companyProfile?.currency || '₹'})</label>
                <input type="number" min="0" step="0.01" required value={materialForm.costPerUnit} onChange={(e) => setMaterialForm({ ...materialForm, costPerUnit: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsMaterialModalOpen(false); setEditingMaterial(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingMaterial ? 'Update Material' : 'Save Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {isSupplierModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '560px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
            </h2>
            <form onSubmit={handleSupplierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaveri Coconut Farms"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category (Parent)</label>
                  <select
                    value={supplierForm.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const foundCat = vendorCategoriesList.find(c => c.name === newCat);
                      const firstSub = foundCat?.subCategories?.[0] || '';
                      setSupplierForm({ ...supplierForm, category: newCat, subCategory: firstSub });
                    }}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    {vendorCategoriesList.map(cat => (
                      <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Subcategory</label>
                  {currentSubCategories.length > 0 ? (
                    <select
                      value={supplierForm.subCategory}
                      onChange={(e) => setSupplierForm({ ...supplierForm, subCategory: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                      {currentSubCategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Regular, Tender, etc."
                      value={supplierForm.subCategory}
                      onChange={(e) => setSupplierForm({ ...supplierForm, subCategory: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Phone / Contact</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Supplier Status</label>
                  <select
                    value={supplierForm.status || 'Active'}
                    onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Address</label>
                <input
                  type="text"
                  placeholder="Market Road, City"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Notes / Specialization</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Regular coconut supplies, delivers before 5:00 AM"
                  value={supplierForm.notes || ''}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
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
            style={{ maxWidth: '780px', maxHeight: '92%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
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
            <div style={{ flex: 1, minHeight: '520px', display: 'flex', flexDirection: 'column', background: '#fff' }}>
              <iframe src={poPreview.blobUrl} title="PO Preview" style={{ width: '100%', height: '520px', border: 'none' }} />
              <div style={{ padding: '0.4rem 1rem', background: '#f1f5f9', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>PDF preview active</span>
                <a href={poPreview.blobUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                  Open PDF in New Window / Tab
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-color)', flexShrink: 0, justifyContent: 'flex-end', background: 'var(--bg-secondary)', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => poPreview && printPdfBlob(poPreview.blobUrl)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Printer size={16} /> Print Document
              </button>
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
      {/* Link Supplier <-> Material Modal */}
      {isLinkModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '540px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                {linkTarget?.type === 'supplier'
                  ? `Add Material to ${linkTarget?.target?.name}`
                  : `Link Supplier to ${linkTarget?.target?.name}`}
              </h2>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {linkTarget?.type === 'supplier' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Select Raw Material *
                  </label>
                  <select
                    className="form-select"
                    value={linkForm.materialId}
                    onChange={(e) => {
                      const matId = e.target.value;
                      const mat = rawMaterials.find(r => (r.id || r._id) === matId);
                      setLinkForm({
                        ...linkForm,
                        materialId: matId,
                        price: mat?.costPerUnit !== undefined ? mat.costPerUnit : linkForm.price,
                        unit: mat?.unit || linkForm.unit
                      });
                    }}
                    required
                  >
                    <option value="">-- Choose Material from Catalog --</option>
                    {rawMaterials.map(rm => (
                      <option key={rm.id || rm._id} value={rm.id || rm._id}>
                        {rm.name} ({rm.category}) — Base: {formatCurrency(rm.costPerUnit)}/{rm.unit}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Select Supplier / Vendor *
                  </label>
                  <select
                    className="form-select"
                    value={linkForm.supplierId}
                    onChange={(e) => setLinkForm({ ...linkForm, supplierId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Supplier from Directory --</option>
                    {suppliers.map(s => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name} ({s.category || 'Uncategorized'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Vendor Price ({companyProfile?.currency || '₹'}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={linkForm.price}
                    onChange={(e) => setLinkForm({ ...linkForm, price: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Unit of Measure *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="kg, ltr, bag, packet"
                    value={linkForm.unit}
                    onChange={(e) => setLinkForm({ ...linkForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Terms / Notes / Quality Specification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bulk discount 50kg+, First-grade export quality"
                  value={linkForm.notes}
                  onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLinkModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vendor Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
