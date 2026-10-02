import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { initialMenuCategories, initialVendorCategories, initialLabourCategories } from '../utils/mockData';
import { Trash2, Plus, Edit2, Check, X, ShieldAlert, Award, FileText, Shield, Key, Lock, Eye, EyeOff, Layers, Tag, Users, Search, Copy } from 'lucide-react';
import { MODULES, MODULE_NAMES, ACCESS_LEVELS, DEFAULT_RBAC_MATRIX } from '../utils/rbacMatrix';

const AuthSetup = () => {
  const {
    currentRole,
    users, updateUserPassword, addUser, deleteUser,
    venues, addVenue, updateVenue, deleteVenue,
    rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial,
    dishes, addDish, updateDish, deleteDish,
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    agencies, addAgency, updateAgency, deleteAgency,
    companyProfile, setCompanyProfile,
    rbacMatrix, updateRolePermission,
    menuCategories = [], masterMenuCategories = [], liveStationCategories = [], addMenuCategory, updateMenuCategory, deleteMenuCategory,
    vendorCategories = [], addVendorCategory, updateVendorCategory, deleteVendorCategory,
    labourCategories = [], addLabourCategory, updateLabourCategory, deleteLabourCategory
  } = useContext(AppContext);

  // Tabs: profile, venues, materials, dishes, suppliers, agencies, users, rbac, categories
  const [activeTab, setActiveTab] = useState('profile');
  const [activeMasterSubTab, setActiveMasterSubTab] = useState('vendor'); // 'vendor' | 'labour' | 'menu'

  // Master Categories Form States
  const [newMenuCat, setNewMenuCat] = useState({ name: '', code: '', type: 'MENU', description: '' });
  const [menuCategoryTypeFilter, setMenuCategoryTypeFilter] = useState('ALL'); // 'ALL' | 'MENU' | 'LIVE_STATION'
  const [newVendorCat, setNewVendorCat] = useState({ name: '', subCategories: '' });
  const [newLabourCat, setNewLabourCat] = useState({ name: '' });

  // Effective lists
  const effectiveVendorCategories = (vendorCategories && vendorCategories.length > 0) ? vendorCategories : initialVendorCategories;
  const effectiveLabourCategories = (labourCategories && labourCategories.length > 0) ? labourCategories : initialLabourCategories;
  const effectiveMenuCategories = (menuCategories && menuCategories.length > 0) ? menuCategories : initialMenuCategories;
  const effectiveMasterMenuCategories = (masterMenuCategories && masterMenuCategories.length > 0)
    ? masterMenuCategories
    : effectiveMenuCategories.filter(c => c.type !== 'LIVE_STATION');

  // Search & Filter States for Menu Dishes & Recipes
  const [dishSearchTerm, setDishSearchTerm] = useState('');
  const [dishCategoryFilter, setDishCategoryFilter] = useState('All');

  // Search & Filter States for Raw Materials
  const [rawMaterialSearchTerm, setRawMaterialSearchTerm] = useState('');
  const [rawMaterialCategoryFilter, setRawMaterialCategoryFilter] = useState('All');

  // Derived unique categories for Dishes
  const dishCategoriesList = useMemo(() => {
    const set = new Set();
    (dishes || []).forEach(d => {
      if (d && d.category && d.category.trim()) {
        set.add(d.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dishes]);

  // Filtered dishes with multi-field search and category filtering
  const filteredDishes = useMemo(() => {
    const term = (dishSearchTerm || '').trim().toLowerCase();
    return (dishes || []).filter(d => {
      if (!d) return false;
      const matchesCat = dishCategoryFilter === 'All' || d.category === dishCategoryFilter;
      if (!matchesCat) return false;
      if (!term) return true;

      // 1. Match dish name
      if (d.name && d.name.toLowerCase().includes(term)) return true;
      // 2. Match category
      if (d.category && d.category.toLowerCase().includes(term)) return true;
      // 3. Match cuisine / subCategory
      if (d.cuisine && d.cuisine.toLowerCase().includes(term)) return true;
      if (d.subCategory && d.subCategory.toLowerCase().includes(term)) return true;
      // 4. Match ID
      if (d.id && String(d.id).toLowerCase().includes(term)) return true;
      // 5. Match recipe raw material ingredients
      if (Array.isArray(d.recipe) && d.recipe.length > 0) {
        const hasIngredientMatch = d.recipe.some(ri => {
          const mat = (rawMaterials || []).find(rm => rm.id === ri.materialId);
          return mat && mat.name && mat.name.toLowerCase().includes(term);
        });
        if (hasIngredientMatch) return true;
      }

      return false;
    });
  }, [dishes, dishSearchTerm, dishCategoryFilter, rawMaterials]);

  // Derived unique categories for Raw Materials
  const rawMaterialCategoriesList = useMemo(() => {
    const set = new Set();
    (rawMaterials || []).forEach(rm => {
      if (rm && rm.category && rm.category.trim()) {
        set.add(rm.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rawMaterials]);

  // Filtered raw materials with multi-field search
  const filteredRawMaterials = useMemo(() => {
    const term = (rawMaterialSearchTerm || '').trim().toLowerCase();
    return (rawMaterials || []).filter(rm => {
      if (!rm) return false;
      const matchesCat = rawMaterialCategoryFilter === 'All' || rm.category === rawMaterialCategoryFilter;
      if (!matchesCat) return false;
      if (!term) return true;

      return (
        (rm.name && rm.name.toLowerCase().includes(term)) ||
        (rm.category && rm.category.toLowerCase().includes(term)) ||
        (rm.unit && rm.unit.toLowerCase().includes(term)) ||
        (rm.id && String(rm.id).toLowerCase().includes(term))
      );
    });
  }, [rawMaterials, rawMaterialSearchTerm, rawMaterialCategoryFilter]);

  // Edit / Add States
  const [editingId, setEditingId] = useState(null);
  const [tempData, setTempData] = useState({});
  const [newRecipeItems, setNewRecipeItems] = useState([]); // [{ materialId, quantity }]
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState('');

  // User creation modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'Sales Executive'
  });

  // Admin password visibility states
  const isAdmin = currentRole === 'Admin';
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState(new Set());
  const [copiedUserId, setCopiedUserId] = useState(null);

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswordIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCopyPassword = (userId, pwd) => {
    if (!pwd || pwd.includes('•')) return;
    navigator.clipboard.writeText(pwd);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  // Check role authorization
  if (currentRole !== 'Admin') {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          Only users with the **Admin** role have access to configuration settings, company profiles, and master database definitions.
        </p>
      </div>
    );
  }

  // Company Profile Submit
  const handleProfileSave = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    setCompanyProfile({
      name: data.get('name'),
      tagline: data.get('tagline'),
      phone: data.get('phone'),
      email: data.get('email'),
      address: data.get('address'),
      gstin: data.get('gstin'),
      defaultTaxRate: parseFloat(data.get('defaultTaxRate')) || 0,
      currency: data.get('currency') || '₹'
    });
    alert('Company Profile saved successfully!');
  };

  // Recipe Builder Helpers
  const addRecipeItemToTemp = () => {
    if (!selectedMaterialId || !materialQty) return;
    const exists = newRecipeItems.find(item => item.materialId === selectedMaterialId);
    if (exists) {
      setNewRecipeItems(newRecipeItems.map(item => 
        item.materialId === selectedMaterialId ? { ...item, quantity: parseFloat(materialQty) } : item
      ));
    } else {
      setNewRecipeItems([...newRecipeItems, { materialId: selectedMaterialId, quantity: parseFloat(materialQty) }]);
    }
    setSelectedMaterialId('');
    setMaterialQty('');
  };

  const removeRecipeItemFromTemp = (matId) => {
    setNewRecipeItems(newRecipeItems.filter(item => item.materialId !== matId));
  };

  // Generic Edit/Add Action
  const startEdit = (item) => {
    setEditingId(item.id);
    setTempData({ ...item });
    if (item.recipe) {
      setNewRecipeItems([...item.recipe]);
    }
  };

  const saveEdit = (type) => {
    if (type === 'venue') {
      updateVenue(tempData);
    } else if (type === 'material') {
      updateRawMaterial(tempData);
    } else if (type === 'dish') {
      updateDish({ ...tempData, recipe: newRecipeItems });
    } else if (type === 'supplier') {
      updateSupplier(tempData);
    } else if (type === 'agency') {
      updateAgency(tempData);
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempData({});
    setNewRecipeItems([]);
    setSelectedMaterialId('');
    setMaterialQty('');
  };

  const createNewItem = (type) => {
    if (type === 'venue') {
      addVenue({ name: 'New Venue', capacity: 100, price: 50000, address: 'Address' });
    } else if (type === 'material') {
      addRawMaterial({ name: 'New Material', category: 'Grocery', unit: 'kg', costPerUnit: 50 });
    } else if (type === 'dish') {
      addDish({ name: 'New Dish', category: 'WELCOME DRINK', subCategory: 'General Items', price: 100, recipe: [], instructions: '' });
    } else if (type === 'supplier') {
      addSupplier({ name: 'New Supplier', category: 'Grocery', contact: 'Name', phone: '+91' });
    } else if (type === 'agency') {
      addAgency({ name: 'New Agency', contact: 'Name', phone: '+91', categories: ['Waiter / Service Staff'] });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Setup & Master Controls</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your corporate parameters, venues database, dish recipes, and vendor profiles.</p>
      </div>

      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('profile'); }}>Company Profile</button>
        <button className={`tab-btn ${activeTab === 'venues' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('venues'); }}>Venues</button>
        <button className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('materials'); }}>Raw Materials</button>
        <button className={`tab-btn ${activeTab === 'dishes' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('dishes'); }}>Menu Dishes & Recipes</button>
        <button className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('suppliers'); }}>Suppliers</button>
        <button className={`tab-btn ${activeTab === 'agencies' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('agencies'); }}>Agencies</button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('users'); }}>User Accounts</button>
        <button className={`tab-btn ${activeTab === 'rbac' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('rbac'); }}>RBAC Permission Matrix</button>
        <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => { cancelEdit(); setActiveTab('categories'); }}>Categories & Masters</button>
      </div>

      {/* Tab: Company Profile */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ maxWidth: '700px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award className="accent-text" size={20} />
            <span>Profile Configuration</span>
          </h2>
          <form onSubmit={handleProfileSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Catering Company Name</label>
                <input className="form-input" name="name" defaultValue={companyProfile.name} required />
              </div>
              <div className="form-group">
                <label className="form-label">Slogan / Tagline</label>
                <input className="form-input" name="tagline" defaultValue={companyProfile.tagline} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input className="form-input" name="phone" defaultValue={companyProfile.phone} required />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input className="form-input" name="email" type="email" defaultValue={companyProfile.email} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Office Address</label>
              <textarea className="form-textarea" name="address" rows="2" defaultValue={companyProfile.address} required></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">GSTIN Identification Number</label>
                <input className="form-input" name="gstin" defaultValue={companyProfile.gstin} required />
              </div>
              <div className="form-group">
                <label className="form-label">Default Tax Rate (GST %)</label>
                <input className="form-input" name="defaultTaxRate" type="number" defaultValue={companyProfile.defaultTaxRate} required />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input className="form-input" name="currency" defaultValue={companyProfile?.currency || '₹'} required />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>Save Profile Details</button>
          </form>
        </div>
      )}

      {/* Tab: Venues */}
      {activeTab === 'venues' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>Venues Master Database</h2>
            <button className="btn btn-primary btn-small" onClick={() => createNewItem('venue')}>
              <Plus size={16} /> Add Venue
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Venue Name</th>
                  <th>Guest Capacity</th>
                  <th>Base Pricing Rent</th>
                  <th>Location Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.map(v => {
                  const isEditing = editingId === v.id;
                  return (
                    <tr key={v.id}>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.name || ''} onChange={e => setTempData({ ...tempData, name: e.target.value })} />
                        ) : v.name}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" type="number" value={tempData.capacity || ''} onChange={e => setTempData({ ...tempData, capacity: parseInt(e.target.value, 10) })} />
                        ) : `${v.capacity} Pax`}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" type="number" value={tempData.price || ''} onChange={e => setTempData({ ...tempData, price: parseFloat(e.target.value) })} />
                        ) : `${companyProfile?.currency || '₹'} ${v.price.toLocaleString('en-IN')}`}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.address || ''} onChange={e => setTempData({ ...tempData, address: e.target.value })} />
                        ) : v.address}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-primary btn-small" onClick={() => saveEdit('venue')}><Check size={14} /></button>
                            <button className="btn btn-secondary btn-small" onClick={cancelEdit}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => startEdit(v)}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-small" onClick={() => deleteVenue(v.id)}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Raw Materials */}
      {activeTab === 'materials' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800 }}>Raw Ingredients & Fuel Master List</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Manage base raw inventory ingredients, cost rates, and storage categories used in recipe formulas.
              </p>
            </div>
            <button className="btn btn-primary btn-small" onClick={() => createNewItem('material')}>
              <Plus size={16} /> Add Ingredient
            </button>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            background: 'rgba(255, 255, 255, 0.55)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', maxWidth: '450px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search raw ingredients by name, category, unit..."
                value={rawMaterialSearchTerm}
                onChange={e => setRawMaterialSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 2.2rem 0.45rem 2.1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              {rawMaterialSearchTerm && (
                <button
                  type="button"
                  onClick={() => setRawMaterialSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
              <select
                value={rawMaterialCategoryFilter}
                onChange={e => setRawMaterialCategoryFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                <option value="All">All Categories ({rawMaterials.length})</option>
                {rawMaterialCategoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {(rawMaterialSearchTerm.trim() || rawMaterialCategoryFilter !== 'All') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => { setRawMaterialSearchTerm(''); setRawMaterialCategoryFilter('All'); }}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                >
                  Reset
                </button>
              )}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Showing {filteredRawMaterials.length} of {rawMaterials.length} ingredients
              </span>
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ingredient Name</th>
                  <th>Storage Category</th>
                  <th>Base Measurement Unit</th>
                  <th>Cost per Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRawMaterials.map(rm => {
                  const isEditing = editingId === rm.id;
                  return (
                    <tr key={rm.id}>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.name || ''} onChange={e => setTempData({ ...tempData, name: e.target.value })} />
                        ) : rm.name}
                      </td>
                      <td>
                        {isEditing ? (
                          <select className="form-select" value={tempData.category || ''} onChange={e => setTempData({ ...tempData, category: e.target.value })}>
                            <option>Grocery</option>
                            <option>Dairy</option>
                            <option>Veg/Fruit</option>
                            <option>Fuel</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            rm.category === 'Grocery' ? 'badge-info' : 
                            rm.category === 'Dairy' ? 'badge-success' : 
                            rm.category === 'Veg/Fruit' ? 'badge-warning' : 'badge-purple'
                          }`}>{rm.category}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.unit || ''} onChange={e => setTempData({ ...tempData, unit: e.target.value })} />
                        ) : rm.unit}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" type="number" value={tempData.costPerUnit || ''} onChange={e => setTempData({ ...tempData, costPerUnit: parseFloat(e.target.value) })} />
                        ) : `${companyProfile?.currency || '₹'} ${rm.costPerUnit}`}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-primary btn-small" onClick={() => saveEdit('material')}><Check size={14} /></button>
                            <button className="btn btn-secondary btn-small" onClick={cancelEdit}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => startEdit(rm)}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-small" onClick={() => deleteRawMaterial(rm.id)}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRawMaterials.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                          {rawMaterialSearchTerm.trim() ? (
                            <>No raw ingredients found matching &ldquo;<strong>{rawMaterialSearchTerm.trim()}</strong>&rdquo;{rawMaterialCategoryFilter !== 'All' ? ` in ${rawMaterialCategoryFilter}` : ''}.</>
                          ) : (
                            <>No raw ingredients found in category &ldquo;<strong>{rawMaterialCategoryFilter}</strong>&rdquo;.</>
                          )}
                        </p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => { setRawMaterialSearchTerm(''); setRawMaterialCategoryFilter('All'); }}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        >
                          Clear Search & Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Menu Items & Recipe Builder */}
      {activeTab === 'dishes' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800 }}>Master Dishes Database & Recipes</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Search master dishes, configure selling rates, kitchen directives, and raw ingredient formulas.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-small" onClick={() => createNewItem('dish')}>
                <Plus size={16} /> Add New Dish
              </button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            background: 'rgba(255, 255, 255, 0.55)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', maxWidth: '450px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search dishes by name, cuisine, ingredients..."
                value={dishSearchTerm}
                onChange={e => setDishSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 2.2rem 0.45rem 2.1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              {dishSearchTerm && (
                <button
                  type="button"
                  onClick={() => setDishSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
              <select
                value={dishCategoryFilter}
                onChange={e => setDishCategoryFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                <option value="All">All Categories ({dishes.length})</option>
                {dishCategoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {(dishSearchTerm.trim() || dishCategoryFilter !== 'All') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => { setDishSearchTerm(''); setDishCategoryFilter('All'); }}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                >
                  Reset
                </button>
              )}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Showing {filteredDishes.length} of {dishes.length} dishes
              </span>
            </div>
          </div>

          <div className="responsive-grid two-cols">
            
            {/* Left Box: Dishes List */}
            <div className="table-container" style={{ maxHeight: '620px', overflowY: 'auto', overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', minWidth: '420px' }}>
                <thead>
                  <tr>
                    <th>Dish Name</th>
                    <th>Category</th>
                    <th>Price/Plate</th>
                    <th>Recipe Items</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes.map(d => {
                    const isSelected = editingId === d.id;
                    return (
                      <tr key={d.id} style={{ background: isSelected ? 'rgba(156, 21, 25, 0.08)' : 'transparent', fontWeight: isSelected ? 600 : 'normal' }}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.name}</div>
                          {d.cuisine && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{d.cuisine}</div>}
                        </td>
                        <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{d.category}</span></td>
                        <td style={{ fontWeight: 600 }}>{companyProfile?.currency || '₹'} {d.price}</td>
                        <td>{d.recipe ? d.recipe.length : 0} items</td>
                        <td>
                          <button className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-small`} onClick={() => startEdit(d)}>
                            <Edit2 size={12} /> {isSelected ? 'Editing' : 'Edit Recipe'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDishes.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            {dishSearchTerm.trim() ? (
                              <>No dishes found matching &ldquo;<strong>{dishSearchTerm.trim()}</strong>&rdquo;{dishCategoryFilter !== 'All' ? ` in ${dishCategoryFilter}` : ''}.</>
                            ) : (
                              <>No dishes found in category &ldquo;<strong>{dishCategoryFilter}</strong>&rdquo;.</>
                            )}
                          </p>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => { setDishSearchTerm(''); setDishCategoryFilter('All'); }}
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                          >
                            Clear Search & Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Box: Selected Dish details & Recipe editor */}
            <div>
              {editingId ? (
                <div className="glass-card" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--color-primary)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Configure: {tempData.name}</span>
                    <button className="btn btn-danger btn-small" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => deleteDish(tempData.id)}>
                      <Trash2 size={12} /> Delete Dish
                    </button>
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Dish Name</label>
                    <input className="form-input" value={tempData.name || ''} onChange={e => setTempData({ ...tempData, name: e.target.value })} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={tempData.category || ''} onChange={e => setTempData({ ...tempData, category: e.target.value })}>
                        {effectiveMasterMenuCategories.map(cat => (
                          <option key={cat.id || cat._id || cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                        {tempData.category && !effectiveMasterMenuCategories.some(c => c.name === tempData.category) && (
                          <option value={tempData.category}>{tempData.category}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cuisine / Subcategory</label>
                      <input 
                        className="form-input" 
                        placeholder="e.g. South Indian, North Indian, Asian, Continental, Chinese, Vegan"
                        value={tempData.cuisine || tempData.subCategory || ''} 
                        onChange={e => setTempData({ ...tempData, cuisine: e.target.value, subCategory: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">A La Carte Selling Price</label>
                      <input className="form-input" type="number" value={tempData.price || ''} onChange={e => setTempData({ ...tempData, price: parseFloat(e.target.value) })} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Kitchen Directives & Service Instructions</label>
                    <textarea 
                      className="form-textarea" 
                      rows="2"
                      placeholder="e.g. Serve piping hot with roasted cashews and pure ghee garnish, prepare 30 mins before lunch"
                      value={tempData.instructions || ''} 
                      onChange={e => setTempData({ ...tempData, instructions: e.target.value })} 
                    />
                  </div>

                  {/* Recipe builder section */}
                  <div style={{ marginTop: '1rem', background: 'rgba(255, 255, 255, 0.5)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Recipe Aggregates (Per Plate)</h4>
                    
                    <div className="recipe-builder-list" style={{ marginBottom: '1rem' }}>
                      {newRecipeItems.map((item, idx) => {
                        const material = rawMaterials.find(rm => rm.id === item.materialId);
                        return (
                          <div key={idx} className="recipe-builder-row" style={{ padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ fontSize: '0.85rem' }}>{material ? material.name : 'Unknown Ingredient'}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.quantity} {material ? material.unit : 'unit'}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{companyProfile?.currency || '₹'} {material ? (material.costPerUnit * item.quantity).toFixed(2) : 0}</span>
                            <button type="button" className="btn btn-danger btn-small" style={{ padding: '0.15rem 0.35rem' }} onClick={() => removeRecipeItemFromTemp(item.materialId)}>
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                      {newRecipeItems.length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recipe defined yet. Add ingredients below.</div>
                      )}
                    </div>

                    {/* Ingredient input row */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <div style={{ flexGrow: 2, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Select Ingredient</span>
                        <select className="form-select" value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)}>
                          <option value="">Choose...</option>
                          {[...rawMaterials].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(rm => (
                            <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '80px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Qty / plate</span>
                        <input className="form-input" type="number" step="0.001" placeholder="e.g. 0.15" value={materialQty} onChange={e => setMaterialQty(e.target.value)} />
                      </div>
                      <button type="button" className="btn btn-secondary" onClick={addRecipeItemToTemp}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => saveEdit('dish')}>Save Recipe & Dish</button>
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.65)', borderStyle: 'dashed', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <FileText size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p>Select a dish from the left database list to view its ingredient recipe parameters or build one.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>Material Suppliers & Distributors</h2>
            <button className="btn btn-primary btn-small" onClick={() => createNewItem('supplier')}>
              <Plus size={16} /> Add Supplier
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Supply Category</th>
                  <th>Contact Person</th>
                  <th>Phone Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => {
                  const isEditing = editingId === s.id;
                  return (
                    <tr key={s.id}>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.name || ''} onChange={e => setTempData({ ...tempData, name: e.target.value })} />
                        ) : s.name}
                      </td>
                      <td>
                        {isEditing ? (
                          <select className="form-select" value={tempData.category || ''} onChange={e => setTempData({ ...tempData, category: e.target.value })}>
                            <option>Grocery</option>
                            <option>Dairy</option>
                            <option>Veg/Fruit</option>
                            <option>Fuel</option>
                          </select>
                        ) : s.category}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.contact || ''} onChange={e => setTempData({ ...tempData, contact: e.target.value })} />
                        ) : s.contact}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.phone || ''} onChange={e => setTempData({ ...tempData, phone: e.target.value })} />
                        ) : s.phone}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-primary btn-small" onClick={() => saveEdit('supplier')}><Check size={14} /></button>
                            <button className="btn btn-secondary btn-small" onClick={cancelEdit}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => startEdit(s)}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-small" onClick={() => deleteSupplier(s.id)}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Agencies */}
      {activeTab === 'agencies' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>Labor Contracting Agencies</h2>
            <button className="btn btn-primary btn-small" onClick={() => createNewItem('agency')}>
              <Plus size={16} /> Add Agency
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Agency Name</th>
                  <th>Contact Coordinator</th>
                  <th>Phone Number</th>
                  <th>Delegated Roster Staff Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map(a => {
                  const isEditing = editingId === a.id;
                  return (
                    <tr key={a.id}>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.name || ''} onChange={e => setTempData({ ...tempData, name: e.target.value })} />
                        ) : a.name}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.contact || ''} onChange={e => setTempData({ ...tempData, contact: e.target.value })} />
                        ) : a.contact}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.phone || ''} onChange={e => setTempData({ ...tempData, phone: e.target.value })} />
                        ) : a.phone}
                      </td>
                      <td>
                        {a.categories.join(', ')}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-primary btn-small" onClick={() => saveEdit('agency')}><Check size={14} /></button>
                            <button className="btn btn-secondary btn-small" onClick={cancelEdit}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => startEdit(a)}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-small" onClick={() => deleteAgency(a.id)}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users & Passwords */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ maxWidth: '850px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>System Accounts & Passwords</h2>
              {isAdmin && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Admin Security: Passwords masked by default. Toggle below to reveal plain text.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {isAdmin && (
                <button
                  type="button"
                  className={`btn ${showAllPasswords ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => {
                    const nextVal = !showAllPasswords;
                    setShowAllPasswords(nextVal);
                    if (nextVal) {
                      setVisiblePasswordIds(new Set(users.map(u => u.id)));
                    } else {
                      setVisiblePasswordIds(new Set());
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '0.45rem 0.8rem',
                    borderRadius: '6px'
                  }}
                  title={showAllPasswords ? 'Hide all passwords' : 'Show all passwords for Admin'}
                >
                  {showAllPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>{showAllPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              )}
              <button className="btn btn-primary btn-small" onClick={() => setIsUserModalOpen(true)}>
                <Plus size={16} /> Add User
              </button>
            </div>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>System Role</th>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span>Account Password</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !showAllPasswords;
                            setShowAllPasswords(nextVal);
                            if (nextVal) {
                              setVisiblePasswordIds(new Set(users.map(u => u.id)));
                            } else {
                              setVisiblePasswordIds(new Set());
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: showAllPasswords ? 'var(--color-primary)' : 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px'
                          }}
                          title={showAllPasswords ? 'Hide all passwords' : 'Show all passwords'}
                        >
                          {showAllPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isEditing = editingId === u.id;
                  const isPasswordRevealed = isAdmin && (showAllPasswords || visiblePasswordIds.has(u.id));
                  const rawPass = u.plainPassword || (u.password && !u.password.includes('•') ? u.password : '');
                  const displayPassword = isPasswordRevealed
                    ? (rawPass || '••••••••')
                    : '••••••••';
                  const isEncryptedWithoutPlain = isPasswordRevealed && !rawPass;

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{u.id}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'Admin' ? 'badge-danger' :
                          (u.role === 'HR' || u.role === 'HR Manager' || u.role === 'Manager') ? 'badge-info' :
                          (u.role.includes('Inventory') || u.role.includes('Store')) ? 'badge-warning' :
                          (u.role === 'Accountant' || u.role === 'Accounts Manager') ? 'badge-success' : 'badge-purple'
                        }`}>{u.role}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="form-input"
                            type="text"
                            value={tempData.password || ''}
                            onChange={e => setTempData({ ...tempData, password: e.target.value })}
                            style={{ maxWidth: '180px' }}
                            placeholder="Enter new password"
                            autoFocus
                          />
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <code style={{
                              fontSize: '0.92rem',
                              letterSpacing: isPasswordRevealed && rawPass ? '0.02em' : '0.12em',
                              background: isPasswordRevealed && rawPass ? 'rgba(128, 0, 32, 0.08)' : 'rgba(255, 255, 255, 0.5)',
                              color: isPasswordRevealed && rawPass ? 'var(--color-primary)' : 'inherit',
                              fontWeight: isPasswordRevealed && rawPass ? 700 : 500,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontFamily: 'monospace'
                            }}>
                              {displayPassword}
                            </code>

                            {isEncryptedWithoutPlain && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                (Set via Change Password)
                              </span>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                style={{
                                  padding: '0.2rem 0.4rem',
                                  minWidth: 'auto',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  gap: '0.25rem',
                                  fontSize: '0.75rem'
                                }}
                                onClick={() => togglePasswordVisibility(u.id)}
                                title={isPasswordRevealed ? 'Hide Password' : 'Show Password (Admin only)'}
                              >
                                {isPasswordRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                <span>{isPasswordRevealed ? 'Hide' : 'Show'}</span>
                              </button>
                            )}

                            {isAdmin && isPasswordRevealed && rawPass && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                style={{
                                  padding: '0.2rem 0.4rem',
                                  minWidth: 'auto',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: copiedUserId === u.id ? 'var(--color-success)' : 'inherit',
                                  cursor: 'pointer',
                                  gap: '0.25rem',
                                  fontSize: '0.75rem'
                                }}
                                onClick={() => handleCopyPassword(u.id, rawPass)}
                                title={copiedUserId === u.id ? 'Copied to clipboard!' : 'Copy Password'}
                              >
                                {copiedUserId === u.id ? <Check size={13} /> : <Copy size={13} />}
                                <span>{copiedUserId === u.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-primary btn-small" onClick={async () => {
                              const res = await updateUserPassword(tempData.id, tempData.password);
                              if (res.success) {
                                alert('Password updated successfully!');
                              } else {
                                alert('Failed to update password.');
                              }
                              cancelEdit();
                            }}><Check size={14} /></button>
                            <button className="btn btn-secondary btn-small" onClick={cancelEdit}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => startEdit(u)}>
                              <Edit2 size={12} /> Change Password
                            </button>
                            {u.id !== 'admin' && (
                              <button className="btn btn-danger btn-small" onClick={() => {
                                if (confirm(`Are you sure you want to delete user ${u.id}?`)) {
                                  deleteUser(u.id);
                                }
                              }}>
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: RBAC Permission Matrix */}
      {activeTab === 'rbac' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield className="accent-text" size={20} />
                <span>Role-Based Access Control (RBAC) Master Matrix</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Define granular Read, Write, or Hide access per module across all organizational roles.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
              <span className="badge badge-success">Write: Full Control</span>
              <span className="badge badge-warning">Read: View Only</span>
              <span className="badge badge-danger">Hide: Restricted</span>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Module / Sub-system</th>
                  {['Admin', 'Sales Executive', 'Chef', 'HR Manager', 'Store Incharge', 'Accountant', 'Agency'].map(role => (
                    <th key={role} style={{ textAlign: 'center', minWidth: '130px' }}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(MODULE_NAMES).map(([modKey, modLabel]) => (
                  <tr key={modKey}>
                    <td>
                      <strong>{modLabel}</strong>
                    </td>
                    {['Admin', 'Sales Executive', 'Chef', 'HR Manager', 'Store Incharge', 'Accountant', 'Agency'].map(role => {
                      const currentMatrix = rbacMatrix || DEFAULT_RBAC_MATRIX;
                      const rolePerms = currentMatrix[role] || {};
                      const currentLevel = role === 'Admin' ? ACCESS_LEVELS.WRITE : (rolePerms[modKey] || ACCESS_LEVELS.HIDE);
                      
                      return (
                        <td key={role} style={{ textAlign: 'center' }}>
                          {role === 'Admin' ? (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Write (Root)</span>
                          ) : (
                            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                              <button
                                type="button"
                                onClick={() => updateRolePermission(role, modKey, ACCESS_LEVELS.WRITE)}
                                title="Write (Full Edit)"
                                style={{
                                  padding: '0.25rem 0.45rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentLevel === ACCESS_LEVELS.WRITE ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                  color: currentLevel === ACCESS_LEVELS.WRITE ? '#fff' : 'var(--text-secondary)'
                                }}
                              >
                                Write
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRolePermission(role, modKey, ACCESS_LEVELS.READ)}
                                title="Read (View Only)"
                                style={{
                                  padding: '0.25rem 0.45rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentLevel === ACCESS_LEVELS.READ ? '#d97706' : 'rgba(255,255,255,0.05)',
                                  color: currentLevel === ACCESS_LEVELS.READ ? '#fff' : 'var(--text-secondary)'
                                }}
                              >
                                Read
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRolePermission(role, modKey, ACCESS_LEVELS.HIDE)}
                                title="Hide (Hidden from View)"
                                style={{
                                  padding: '0.25rem 0.45rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentLevel === ACCESS_LEVELS.HIDE ? 'rgba(239, 68, 68, 0.85)' : 'rgba(255,255,255,0.05)',
                                  color: currentLevel === ACCESS_LEVELS.HIDE ? '#fff' : 'var(--text-secondary)'
                                }}
                              >
                                Hide
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Categories & Masters */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${activeMasterSubTab === 'vendor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMasterSubTab('vendor')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Tag size={16} /> Vendor Categories & Subcategories ({effectiveVendorCategories.length})
            </button>
            <button
              type="button"
              className={`btn ${activeMasterSubTab === 'labour' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMasterSubTab('labour')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Users size={16} /> Labour Categories ({effectiveLabourCategories.length})
            </button>
            <button
              type="button"
              className={`btn ${activeMasterSubTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMasterSubTab('menu')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Layers size={16} /> Menu & Live Categories ({effectiveMenuCategories.length})
            </button>
          </div>

          {/* Sub-tab 1: Vendor Categories */}
          {activeMasterSubTab === 'vendor' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Vendor Hierarchical Categories</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Manage supplier master categories and cascading subcategories (e.g. Coconut → Tender/Regular, Thambula → Paper/Cloth/Jute)
                  </p>
                </div>
              </div>

              {/* Add category form */}
              <div style={{ background: 'rgba(255, 255, 255, 0.55)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 700 }}>Add Vendor Category</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Coconut"
                      value={newVendorCat.name}
                      onChange={e => setNewVendorCat({ ...newVendorCat, name: e.target.value })}
                      style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Subcategories (comma separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tender Coconut, Regular Coconut"
                      value={newVendorCat.subCategories}
                      onChange={e => setNewVendorCat({ ...newVendorCat, subCategories: e.target.value })}
                      style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!newVendorCat.name.trim()) {
                        alert('Please enter a category name');
                        return;
                      }
                      const subs = newVendorCat.subCategories.split(',').map(s => s.trim()).filter(Boolean);
                      addVendorCategory({
                        name: newVendorCat.name.trim(),
                        parentCategory: '',
                        subCategories: subs,
                        active: true
                      });
                      setNewVendorCat({ name: '', subCategories: '' });
                    }}
                    style={{ padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Plus size={15} /> Add Category
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '220px' }}>Parent Category</th>
                      <th>Subcategories</th>
                      <th style={{ width: '90px' }}>Status</th>
                      <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectiveVendorCategories.map((vc, idx) => (
                      <tr key={vc.id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{vc.name}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {(vc.subCategories || []).map((sub, sIdx) => (
                              <span key={sIdx} className="badge badge-secondary" style={{ fontSize: '0.74rem' }}>
                                {sub}
                              </span>
                            ))}
                            {(!vc.subCategories || vc.subCategories.length === 0) && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>General / Standard</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${vc.active !== false ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                            {vc.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => deleteVendorCategory(vc.id)}
                            style={{ color: 'var(--color-danger)' }}
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Labour Categories */}
          {activeMasterSubTab === 'labour' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Labour Workforce Categories</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    11 Core Skill Categories for event kitchen, service, and logistics crew
                  </p>
                </div>
              </div>

              {/* Add category form */}
              <div style={{ background: 'rgba(255, 255, 255, 0.55)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 700 }}>Add Labour Category</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr auto', gap: '0.75rem', alignItems: 'flex-end', maxWidth: '500px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sweet Assistant"
                      value={newLabourCat.name}
                      onChange={e => setNewLabourCat({ ...newLabourCat, name: e.target.value })}
                      style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!newLabourCat.name.trim()) {
                        alert('Please enter a category name');
                        return;
                      }
                      addLabourCategory({
                        name: newLabourCat.name.trim(),
                        active: true
                      });
                      setNewLabourCat({ name: '' });
                    }}
                    style={{ padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Plus size={15} /> Add Category
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Labour Category Name</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectiveLabourCategories.map((lc, idx) => (
                      <tr key={lc.id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lc.name}</td>
                        <td>
                          <span className={`badge ${lc.active !== false ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                            {lc.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => deleteLabourCategory(lc.id)}
                            style={{ color: 'var(--color-danger)' }}
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Menu & Live Station Categories */}
          {activeMasterSubTab === 'menu' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Menu & Live Station Categories</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Master Menu Categories (44) for dishes and Live Station Categories (46) for event counter setups
                  </p>
                </div>

                {/* Filter by Category Type */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn btn-small ${menuCategoryTypeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMenuCategoryTypeFilter('ALL')}
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', borderRadius: '16px' }}
                  >
                    All ({effectiveMenuCategories.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-small ${menuCategoryTypeFilter === 'MENU' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMenuCategoryTypeFilter('MENU')}
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', borderRadius: '16px' }}
                  >
                    Master Menu Categories ({effectiveMenuCategories.filter(c => c.type !== 'LIVE_STATION').length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-small ${menuCategoryTypeFilter === 'LIVE_STATION' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMenuCategoryTypeFilter('LIVE_STATION')}
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', borderRadius: '16px' }}
                  >
                    Live Stations ({effectiveMenuCategories.filter(c => c.type === 'LIVE_STATION').length})
                  </button>
                </div>
              </div>

              {/* Add category form */}
              <div style={{ background: 'rgba(255, 255, 255, 0.55)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 700 }}>Add Category</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end', maxWidth: '750px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. WELCOME DRINK"
                      value={newMenuCat.name}
                      onChange={e => setNewMenuCat({ ...newMenuCat, name: e.target.value })}
                      style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category Type</label>
                    <select
                      className="form-select"
                      value={newMenuCat.type || 'MENU'}
                      onChange={e => setNewMenuCat({ ...newMenuCat, type: e.target.value })}
                      style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                    >
                      <option value="MENU">MENU (Master Dish)</option>
                      <option value="LIVE_STATION">LIVE_STATION (Live Counter)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Display Order</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 45"
                      value={newMenuCat.displayOrder || ''}
                      onChange={e => setNewMenuCat({ ...newMenuCat, displayOrder: parseInt(e.target.value, 10) || 0 })}
                      style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!newMenuCat.name.trim()) {
                        alert('Please enter a category name');
                        return;
                      }
                      const cleanName = newMenuCat.name.trim().toUpperCase();
                      const prefix = (newMenuCat.type || 'MENU') === 'LIVE_STATION' ? 'ls_' : 'mc_';
                      addMenuCategory({
                        id: prefix + Date.now(),
                        name: cleanName,
                        type: newMenuCat.type || 'MENU',
                        description: newMenuCat.description || cleanName,
                        displayOrder: newMenuCat.displayOrder || (effectiveMenuCategories.length + 1),
                        active: true
                      });
                      setNewMenuCat({ name: '', code: '', type: 'MENU', description: '' });
                    }}
                    style={{ padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Plus size={15} /> Add Category
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Category Name</th>
                      <th style={{ width: '150px' }}>Type</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Order</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectiveMenuCategories
                      .filter(mc => {
                        if (menuCategoryTypeFilter === 'MENU') return mc.type !== 'LIVE_STATION';
                        if (menuCategoryTypeFilter === 'LIVE_STATION') return mc.type === 'LIVE_STATION';
                        return true;
                      })
                      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map((mc, idx) => (
                        <tr key={mc.id || mc._id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{mc.name}</td>
                          <td>
                            <span
                              className={`badge ${mc.type === 'LIVE_STATION' ? 'badge-warning' : 'badge-primary'}`}
                              style={{
                                fontSize: '0.72rem',
                                background: mc.type === 'LIVE_STATION' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(30, 58, 138, 0.1)',
                                color: mc.type === 'LIVE_STATION' ? '#ea580c' : '#1e3a8a',
                                border: mc.type === 'LIVE_STATION' ? '1px solid #ea580c' : '1px solid #1e3a8a'
                              }}
                            >
                              {mc.type === 'LIVE_STATION' ? '⚡ LIVE STATION' : '🍽️ MENU'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <code>{mc.displayOrder || (idx + 1)}</code>
                          </td>
                          <td>
                            <span className={`badge ${mc.active !== false ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                              {mc.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() => deleteMenuCategory(mc.id || mc._id)}
                              style={{ color: 'var(--color-danger)' }}
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User In-App Modal */}
      {isUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="glass-card modal-card" style={{ maxWidth: '480px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Add New System Account</h2>
              <button onClick={() => setIsUserModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const username = userForm.username.trim();
              if (!username || !userForm.password) {
                alert('Please enter Username and Password');
                return;
              }
              if (users.find(u => u.id.toLowerCase() === username.toLowerCase())) {
                alert('Username already exists!');
                return;
              }
              addUser({ id: username, password: userForm.password, role: userForm.role });
              alert(`User ${username} created successfully with role ${userForm.role}!`);
              setIsUserModalOpen(false);
              setUserForm({ username: '', password: '', role: 'Sales Executive' });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sales_john"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>System Role (Dropdown)</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                >
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Inhouse Inventory Manager">Inhouse Inventory Manager (Both Provision & Storage)</option>
                  <option value="Inhouse Provision Manager">Inhouse Provision Manager (Provision Inventory Only)</option>
                  <option value="Inhouse Storage Manager">Inhouse Storage Manager (Storage Inventory Only)</option>
                  <option value="Accounts Manager">Accounts Manager / Accountant</option>
                  <option value="HR">HR / HR Manager</option>
                  <option value="Chef">Chef (Kitchen Operations)</option>
                  <option value="Agency">Agency (External Staff Partner)</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthSetup;
