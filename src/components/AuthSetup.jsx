import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Trash2, Plus, Edit2, Check, X, ShieldAlert, Award, FileText } from 'lucide-react';

const AuthSetup = () => {
  const {
    currentRole,
    resetMasterDatabase,
    users, updateUserPassword, addUser, deleteUser,
    venues, addVenue, updateVenue, deleteVenue,
    rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial,
    dishes, addDish, updateDish, deleteDish,
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    agencies, addAgency, updateAgency, deleteAgency,
    companyProfile, setCompanyProfile
  } = useContext(AppContext);

  // Tabs: profile, venues, materials, dishes, suppliers, agencies
  const [activeTab, setActiveTab] = useState('profile');

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
      addDish({ name: 'New Dish', category: 'Starters', price: 100, recipe: [] });
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
                <input className="form-input" name="currency" defaultValue={companyProfile.currency} required />
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
                        ) : `${companyProfile.currency} ${v.price.toLocaleString('en-IN')}`}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>Raw Ingredients & Fuel Master List</h2>
            <button className="btn btn-primary btn-small" onClick={() => createNewItem('material')}>
              <Plus size={16} /> Add Ingredient
            </button>
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
                {rawMaterials.map(rm => {
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
                        ) : `${companyProfile.currency} ${rm.costPerUnit}`}
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Menu Items & Recipe Builder */}
      {activeTab === 'dishes' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2>Master Dishes Database & Recipes ({dishes.length} Items)</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-small" onClick={() => { if(window.confirm('Reset all dishes to the 180+ Real Master Production Items?')) resetMasterDatabase(); }}>
                🔄 Load 180+ Real Master Items
              </button>
              <button className="btn btn-primary btn-small" onClick={() => createNewItem('dish')}>
                <Plus size={16} /> Add New Dish
              </button>
            </div>
          </div>
          <div className="responsive-grid two-cols">
            
            {/* Left Box: Dishes List */}
            <div className="table-container">
              <table className="custom-table">
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
                  {dishes.map(d => {
                    const isSelected = editingId === d.id;
                    return (
                      <tr key={d.id} style={{ background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                        <td>{d.name}</td>
                        <td>{d.category}</td>
                        <td>{companyProfile.currency} {d.price}</td>
                        <td>{d.recipe ? d.recipe.length : 0} ingredients</td>
                        <td>
                          <button className="btn btn-secondary btn-small" onClick={() => startEdit(d)}>
                            <Edit2 size={12} /> Edit Recipe
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                        <option>Starters</option>
                        <option>Mains</option>
                        <option>Desserts</option>
                        <option>Beverages</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">A La Carte Selling Price</label>
                      <input className="form-input" type="number" value={tempData.price || ''} onChange={e => setTempData({ ...tempData, price: parseFloat(e.target.value) })} />
                    </div>
                  </div>

                  {/* Recipe builder section */}
                  <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Recipe Aggregates (Per Plate)</h4>
                    
                    <div className="recipe-builder-list" style={{ marginBottom: '1rem' }}>
                      {newRecipeItems.map((item, idx) => {
                        const material = rawMaterials.find(rm => rm.id === item.materialId);
                        return (
                          <div key={idx} className="recipe-builder-row" style={{ padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ fontSize: '0.85rem' }}>{material ? material.name : 'Unknown Ingredient'}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.quantity} {material ? material.unit : 'unit'}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{companyProfile.currency} {material ? (material.costPerUnit * item.quantity).toFixed(2) : 0}</span>
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
                          {rawMaterials.map(rm => (
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
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
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
        <div className="glass-card" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2>System Accounts & Passwords</h2>
            <button className="btn btn-primary btn-small" onClick={() => setIsUserModalOpen(true)}>
              <Plus size={16} /> Add User
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>System Role</th>
                  <th>Account Password</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isEditing = editingId === u.id;
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{u.id}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'Admin' ? 'badge-danger' :
                          u.role === 'Manager' ? 'badge-info' :
                          u.role === 'Accountant' ? 'badge-success' : 'badge-purple'
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
                          />
                        ) : (
                          <code style={{ fontSize: '0.95rem', letterSpacing: '0.05em', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{u.password}</code>
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
                  <option value="Store Manager">Store Manager (Both Provision & Storage Inventory)</option>
                  <option value="Provision Store Manager">Provision Store Manager (Provision Inventory Only)</option>
                  <option value="Storage Store Manager">Storage Store Manager (Storage Inventory Only)</option>
                  <option value="Accounts Manager">Accounts Manager / Accountant</option>
                  <option value="Manager">Manager</option>
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
