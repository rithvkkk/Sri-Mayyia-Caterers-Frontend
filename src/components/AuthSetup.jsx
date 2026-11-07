import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { initialMenuCategories, initialVendorCategories, initialLabourCategories } from '../utils/mockData';
import { Trash2, Plus, Edit2, Check, X, ShieldAlert, Award, FileText, Shield, Key, Lock, Eye, EyeOff, Layers, Tag, Users, Search, Copy, Hash, Loader2, Save, CheckCircle, AlertTriangle, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { MODULES, MODULE_NAMES, ACCESS_LEVELS, DEFAULT_RBAC_MATRIX } from '../utils/rbacMatrix';

const DishTableRow = React.memo(({ dish, isSelected, currency, onSelect }) => {
  return (
    <tr style={{ background: isSelected ? 'rgba(156, 21, 25, 0.08)' : 'transparent', fontWeight: isSelected ? 600 : 'normal' }}>
      <td>
        <span className="badge badge-secondary" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.74rem' }}>
          {dish.dishNumber || 'DISH-????'}
        </span>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{dish.name}</div>
        {dish.cuisine && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{dish.cuisine}</div>}
      </td>
      <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{dish.category}</span></td>
      <td style={{ fontWeight: 600 }}>{currency} {dish.price}</td>
      <td>{dish.recipe ? dish.recipe.length : 0} items</td>
      <td>
        <button className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-small`} onClick={() => onSelect(dish)}>
          <Edit2 size={12} /> {isSelected ? 'Editing' : 'Edit Recipe'}
        </button>
      </td>
    </tr>
  );
});
DishTableRow.displayName = 'DishTableRow';

const AuthSetup = () => {
  const {
    currentRole,
    users, updateUser, updateUserPassword, addUser, deleteUser,
    venues, addVenue, updateVenue, deleteVenue,
    rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial,
    dishes, addDish, getNextDishNumber, updateDish, deleteDish,
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

  // Search, Filter & Pagination States for Menu Dishes & Recipes
  const [dishSearchTerm, setDishSearchTerm] = useState('');
  const [dishCategoryFilter, setDishCategoryFilter] = useState('All');
  const [dishCurrentPage, setDishCurrentPage] = useState(1);
  const [dishPageSize, setDishPageSize] = useState(25);

  // Search & Filter States for Raw Materials
  const [rawMaterialSearchTerm, setRawMaterialSearchTerm] = useState('');
  const [rawMaterialCategoryFilter, setRawMaterialCategoryFilter] = useState('All');

  // Fast O(1) Lookup Maps & Pre-sorted lists for Raw Materials (Eliminates lag)
  const rawMaterialsObjMap = useMemo(() => {
    const map = new Map();
    (rawMaterials || []).forEach(rm => {
      if (rm) {
        if (rm.id) map.set(rm.id, rm);
        if (rm._id) map.set(rm._id, rm);
      }
    });
    return map;
  }, [rawMaterials]);

  const rawMaterialsNameMap = useMemo(() => {
    const map = new Map();
    (rawMaterials || []).forEach(rm => {
      if (rm) {
        const name = (rm.name || '').toLowerCase();
        if (rm.id) map.set(rm.id, name);
        if (rm._id) map.set(rm._id, name);
      }
    });
    return map;
  }, [rawMaterials]);

  const sortedRawMaterials = useMemo(() => {
    return [...(rawMaterials || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [rawMaterials]);

  // Combined list of all available categories for dishes (master categories + existing dish categories)
  const allAvailableDishCategories = useMemo(() => {
    const set = new Set();
    (effectiveMasterMenuCategories || []).forEach(cat => {
      const name = typeof cat === 'string' ? cat : cat?.name;
      if (name && name.trim()) set.add(name.trim());
    });
    (dishes || []).forEach(d => {
      if (d && d.category && d.category.trim()) {
        set.add(d.category.trim());
      }
    });
    if (set.size === 0) set.add('WELCOME DRINK');
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [effectiveMasterMenuCategories, dishes]);

  // Derived unique categories for Dishes
  const dishCategoriesList = useMemo(() => {
    return allAvailableDishCategories;
  }, [allAvailableDishCategories]);

  // Filtered dishes with multi-field search and category filtering
  const filteredDishes = useMemo(() => {
    const term = (dishSearchTerm || '').trim().toLowerCase();
    return (dishes || []).filter(d => {
      if (!d) return false;
      const matchesCat = dishCategoryFilter === 'All' || d.category === dishCategoryFilter;
      if (!matchesCat) return false;
      if (!term) return true;

      // 0. Match dish number (e.g. DISH-0001 or 0001)
      if (d.dishNumber && String(d.dishNumber).toLowerCase().includes(term)) return true;
      // 1. Match dish name
      if (d.name && d.name.toLowerCase().includes(term)) return true;
      // 2. Match category
      if (d.category && d.category.toLowerCase().includes(term)) return true;
      // 3. Match cuisine / subCategory
      if (d.cuisine && d.cuisine.toLowerCase().includes(term)) return true;
      if (d.subCategory && d.subCategory.toLowerCase().includes(term)) return true;
      // 4. Match ID
      if (d.id && String(d.id).toLowerCase().includes(term)) return true;
      // 5. Match recipe raw material ingredients via O(1) Map
      if (Array.isArray(d.recipe) && d.recipe.length > 0) {
        const hasIngredientMatch = d.recipe.some(ri => {
          const matName = rawMaterialsNameMap.get(ri.materialId);
          return matName && matName.includes(term);
        });
        if (hasIngredientMatch) return true;
      }

      return false;
    });
  }, [dishes, dishSearchTerm, dishCategoryFilter, rawMaterialsNameMap]);

  // Pagination calculations for dishes table
  const totalDishPages = useMemo(() => {
    if (dishPageSize === 'All') return 1;
    return Math.max(1, Math.ceil(filteredDishes.length / Number(dishPageSize)));
  }, [filteredDishes.length, dishPageSize]);

  const paginatedDishes = useMemo(() => {
    if (dishPageSize === 'All') return filteredDishes;
    const start = (dishCurrentPage - 1) * Number(dishPageSize);
    return filteredDishes.slice(start, start + Number(dishPageSize));
  }, [filteredDishes, dishCurrentPage, dishPageSize]);

  const handleSelectDish = useCallback((dish) => {
    startEdit(dish);
  }, []);

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
  const [isSavingDish, setIsSavingDish] = useState(false);
  const [dishSaveMessage, setDishSaveMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Add Dish Modal & Form States
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [dishForm, setDishForm] = useState({
    dishNumber: '',
    name: '',
    category: '',
    subCategory: '',
    cuisine: '',
    price: 100,
    dietary: ['Vegetarian'],
    recipe: [],
    instructions: ''
  });
  const [dishFormErrors, setDishFormErrors] = useState({});
  const [isSubmittingDish, setIsSubmittingDish] = useState(false);

  // Inline Category Creation Modal States
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'MENU' });
  const [categoryFormError, setCategoryFormError] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

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
    const qty = parseFloat(materialQty);
    if (isNaN(qty) || qty <= 0) return;
    const exists = newRecipeItems.find(item => item.materialId === selectedMaterialId);
    if (exists) {
      setNewRecipeItems(newRecipeItems.map(item => 
        item.materialId === selectedMaterialId ? { ...item, quantity: qty } : item
      ));
    } else {
      setNewRecipeItems([...newRecipeItems, { materialId: selectedMaterialId, quantity: qty }]);
    }
    setSelectedMaterialId('');
    setMaterialQty('');
  };

  const removeRecipeItemFromTemp = (matId) => {
    setNewRecipeItems(newRecipeItems.filter(item => item.materialId !== matId));
  };

  // Generic Edit/Add Action
  const startEdit = (item) => {
    const itemId = item.id || item._id;
    setEditingId(itemId);
    setTempData({ ...item, id: itemId, _id: itemId });
    setDishSaveMessage(null);
    if (item.recipe && Array.isArray(item.recipe)) {
      setNewRecipeItems([...item.recipe]);
    } else {
      setNewRecipeItems([]);
    }
  };

  const saveEdit = async (type) => {
    if (type === 'dish') {
      const dishId = tempData.id || tempData._id;
      if (!dishId) {
        setDishSaveMessage({ type: 'error', text: 'Dish ID is missing' });
        return;
      }
      if (!tempData.dishNumber || !String(tempData.dishNumber).trim()) {
        setDishSaveMessage({ type: 'error', text: 'Dish number is required' });
        return;
      }
      const cleanNum = String(tempData.dishNumber).trim().toUpperCase();
      const duplicate = (dishes || []).find(d => 
        (d.id !== dishId && d._id !== dishId) && 
        d.dishNumber && 
        d.dishNumber.trim().toUpperCase() === cleanNum
      );
      if (duplicate) {
        setDishSaveMessage({ type: 'error', text: `This Dish Number is already assigned to another dish (${duplicate.name}). Please choose a different number.` });
        return;
      }
      if (!tempData.name || !tempData.name.trim()) {
        setDishSaveMessage({ type: 'error', text: 'Dish name is required' });
        return;
      }
      setIsSavingDish(true);
      setDishSaveMessage(null);
      try {
        const savedDish = await updateDish({
          ...tempData,
          id: dishId,
          _id: dishId,
          dishNumber: cleanNum,
          name: tempData.name.trim(),
          category: tempData.category ? tempData.category.trim() : 'WELCOME DRINK',
          subCategory: tempData.subCategory ? tempData.subCategory.trim() : (tempData.cuisine ? tempData.cuisine.trim() : ''),
          cuisine: tempData.cuisine ? tempData.cuisine.trim() : (tempData.subCategory ? tempData.subCategory.trim() : ''),
          price: Number(tempData.price) || 0,
          recipe: newRecipeItems,
          instructions: tempData.instructions ? tempData.instructions.trim() : ''
        });
        if (savedDish) {
          setTempData({ ...savedDish, id: dishId, _id: dishId });
          if (Array.isArray(savedDish.recipe)) {
            setNewRecipeItems([...savedDish.recipe]);
          }
        }
        setDishSaveMessage({ type: 'success', text: 'Dish & Recipe saved to MongoDB successfully!' });
        setTimeout(() => {
          setDishSaveMessage(null);
          cancelEdit();
        }, 1200);
      } catch (err) {
        console.error('Failed to update dish in MongoDB:', err);
        setDishSaveMessage({ type: 'error', text: err.message || 'Failed to update dish in MongoDB' });
      } finally {
        setIsSavingDish(false);
      }
      return;
    }

    if (type === 'venue') {
      updateVenue(tempData);
    } else if (type === 'material') {
      updateRawMaterial(tempData);
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
    setDishSaveMessage(null);
    setIsSavingDish(false);
  };

  const handleOpenAddDishModal = async () => {
    cancelEdit();
    setDishFormErrors({});
    let nextNum = 'DISH-????';
    try {
      if (typeof getNextDishNumber === 'function') {
        nextNum = await getNextDishNumber();
      }
    } catch (e) {
      console.warn('Could not fetch next dish number:', e);
    }
    const defaultCat = allAvailableDishCategories[0] || 'WELCOME DRINK';
    setDishForm({
      dishNumber: nextNum,
      name: '',
      category: defaultCat,
      subCategory: '',
      cuisine: '',
      price: 100,
      dietary: ['Vegetarian'],
      recipe: [],
      instructions: ''
    });
    setIsAddDishModalOpen(true);
  };

  const handleSaveDish = async (e) => {
    if (e) e.preventDefault();
    if (isSubmittingDish) return;

    const errors = {};
    if (!dishForm.dishNumber || !String(dishForm.dishNumber).trim()) {
      errors.dishNumber = 'Dish number is required';
    } else {
      const cleanNum = String(dishForm.dishNumber).trim().toUpperCase();
      const duplicate = (dishes || []).find(d => d.dishNumber && d.dishNumber.trim().toUpperCase() === cleanNum);
      if (duplicate) {
        errors.dishNumber = 'This Dish Number is already assigned to another dish. Please choose a different number.';
      }
    }
    if (!dishForm.name || !dishForm.name.trim()) {
      errors.name = 'Dish name is required';
    }
    if (!dishForm.category || !dishForm.category.trim()) {
      errors.category = 'Please select or create a category';
    }
    if (dishForm.price === undefined || isNaN(Number(dishForm.price)) || Number(dishForm.price) < 0) {
      errors.price = 'Price must be a non-negative number';
    }

    if (Object.keys(errors).length > 0) {
      setDishFormErrors(errors);
      return;
    }

    setIsSubmittingDish(true);
    setDishFormErrors({});
    try {
      const cleanNum = String(dishForm.dishNumber).trim().toUpperCase();
      const created = await addDish({
        ...dishForm,
        dishNumber: cleanNum,
        name: dishForm.name.trim(),
        category: dishForm.category.trim(),
        subCategory: dishForm.subCategory ? dishForm.subCategory.trim() : '',
        cuisine: dishForm.cuisine ? dishForm.cuisine.trim() : '',
        price: Number(dishForm.price) || 0,
        dietary: dishForm.dietary || ['Vegetarian'],
        instructions: dishForm.instructions ? dishForm.instructions.trim() : ''
      });

      setIsAddDishModalOpen(false);
      // Automatically select and open the newly created dish for recipe editing
      if (created) {
        startEdit(created);
      }
    } catch (err) {
      if (err.message && err.message.includes('already assigned')) {
        setDishFormErrors({ dishNumber: err.message });
      } else {
        setDishFormErrors({ general: err.message || 'Failed to create dish' });
      }
    } finally {
      setIsSubmittingDish(false);
    }
  };

  const handleSaveCategory = async (e) => {
    if (e) e.preventDefault();
    if (isSubmittingCategory) return;

    const trimmedName = (categoryForm.name || '').trim();
    if (!trimmedName) {
      setCategoryFormError('Category name is required');
      return;
    }

    // Case-insensitive duplicate check
    const isDuplicate = allAvailableDishCategories.some(
      cat => cat.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setCategoryFormError(`Category "${trimmedName}" already exists`);
      return;
    }

    setIsSubmittingCategory(true);
    setCategoryFormError('');
    try {
      const cleanName = trimmedName.toUpperCase();
      const prefix = (categoryForm.type || 'MENU') === 'LIVE_STATION' ? 'ls_' : 'mc_';
      const created = await addMenuCategory({
        id: prefix + Date.now(),
        name: cleanName,
        type: categoryForm.type || 'MENU',
        description: cleanName,
        displayOrder: (effectiveMenuCategories.length + 1),
        active: true
      });

      // Auto-select in the dish form without losing any entered fields!
      setDishForm(prev => ({
        ...prev,
        category: created?.name || cleanName
      }));
      setDishFormErrors(prev => ({ ...prev, category: null }));

      // ALSO auto-select in the existing dish editor if currently editing a dish!
      if (editingId) {
        setTempData(prev => ({
          ...prev,
          category: created?.name || cleanName
        }));
      }

      setIsAddCategoryModalOpen(false);
      setCategoryForm({ name: '', type: 'MENU' });
    } catch (err) {
      setCategoryFormError(err.message || 'Failed to create category');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const createNewItem = (type) => {
    if (type === 'venue') {
      addVenue({ name: 'New Venue', capacity: 100, price: 50000, address: 'Address' });
    } else if (type === 'material') {
      addRawMaterial({ name: 'New Material', category: 'Grocery', unit: 'kg', costPerUnit: 50 });
    } else if (type === 'dish') {
      handleOpenAddDishModal();
    } else if (type === 'supplier') {
      const defaultCat = effectiveVendorCategories[0]?.name || 'Grocery';
      const defaultSub = effectiveVendorCategories[0]?.subCategories?.[0] || '';
      addSupplier({ name: 'New Supplier', category: defaultCat, subCategory: defaultSub, contact: 'Name', phone: '+91', secondaryPhone: '' });
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
                  <th>Contacts (Owner / Manager)</th>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <input
                              className="form-input"
                              placeholder="Owner Phone"
                              value={tempData.ownerContactNumber || ''}
                              onChange={e => setTempData({ ...tempData, ownerContactNumber: e.target.value })}
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                            />
                            <input
                              className="form-input"
                              placeholder="Manager Phone"
                              value={tempData.managerContactNumber || tempData.contactNumber || ''}
                              onChange={e => setTempData({ ...tempData, managerContactNumber: e.target.value, contactNumber: e.target.value })}
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            {v.ownerContactNumber && (
                              <div><span style={{ color: 'var(--text-muted)' }}>Owner:</span> <strong>{v.ownerName ? `${v.ownerName} (${v.ownerContactNumber})` : v.ownerContactNumber}</strong></div>
                            )}
                            {(v.managerContactNumber || v.contactNumber) && (
                              <div><span style={{ color: 'var(--text-muted)' }}>Mgr:</span> <strong>{v.managerName || v.contactPerson ? `${v.managerName || v.contactPerson} (${v.managerContactNumber || v.contactNumber})` : (v.managerContactNumber || v.contactNumber)}</strong></div>
                            )}
                            {!v.ownerContactNumber && !v.managerContactNumber && !v.contactNumber && (
                              <span style={{ color: 'var(--text-muted)' }}>Not configured</span>
                            )}
                          </div>
                        )}
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
              <button className="btn btn-primary btn-small" onClick={handleOpenAddDishModal}>
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
                placeholder="Search dishes by number (e.g. DISH-0001), name, cuisine, ingredients..."
                value={dishSearchTerm}
                onChange={e => { setDishSearchTerm(e.target.value); setDishCurrentPage(1); }}
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
                  onClick={() => { setDishSearchTerm(''); setDishCurrentPage(1); }}
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
                onChange={e => { setDishCategoryFilter(e.target.value); setDishCurrentPage(1); }}
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
                  onClick={() => { setDishSearchTerm(''); setDishCategoryFilter('All'); setDishCurrentPage(1); }}
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
            <div className="table-container" style={{ maxHeight: '620px', overflowY: 'auto', overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
              <table className="custom-table" style={{ width: '100%', minWidth: '460px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Dish Number</th>
                    <th>Dish Name</th>
                    <th>Category</th>
                    <th>Price/Plate</th>
                    <th>Recipe Items</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDishes.map(d => (
                    <DishTableRow
                      key={d.id || d._id}
                      dish={d}
                      isSelected={editingId === d.id || editingId === d._id}
                      currency={companyProfile?.currency || '₹'}
                      onSelect={handleSelectDish}
                    />
                  ))}
                  {filteredDishes.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
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
                            onClick={() => { setDishSearchTerm(''); setDishCategoryFilter('All'); setDishCurrentPage(1); }}
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

              {/* Pagination Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.75rem',
                borderTop: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.78rem',
                background: 'rgba(255, 255, 255, 0.45)',
                marginTop: 'auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Show:</span>
                  <select
                    value={dishPageSize}
                    onChange={e => {
                      setDishPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value));
                      setDishCurrentPage(1);
                    }}
                    style={{
                      padding: '0.2rem 0.45rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                    <option value="All">All ({filteredDishes.length})</option>
                  </select>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {filteredDishes.length === 0 ? '0 dishes' : `${(dishCurrentPage - 1) * (dishPageSize === 'All' ? filteredDishes.length : dishPageSize) + 1} - ${dishPageSize === 'All' ? filteredDishes.length : Math.min(dishCurrentPage * dishPageSize, filteredDishes.length)} of ${filteredDishes.length}`}
                  </span>
                </div>

                {dishPageSize !== 'All' && totalDishPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setDishCurrentPage(1)}
                      disabled={dishCurrentPage === 1}
                      title="First page"
                      style={{ padding: '0.2rem 0.4rem' }}
                    >
                      <ChevronsLeft size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setDishCurrentPage(p => Math.max(1, p - 1))}
                      disabled={dishCurrentPage === 1}
                      title="Previous page"
                      style={{ padding: '0.2rem 0.4rem' }}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span style={{ fontWeight: 600, padding: '0 0.35rem', color: 'var(--text-primary)' }}>
                      Page {dishCurrentPage} of {totalDishPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setDishCurrentPage(p => Math.min(totalDishPages, p + 1))}
                      disabled={dishCurrentPage === totalDishPages}
                      title="Next page"
                      style={{ padding: '0.2rem 0.4rem' }}
                    >
                      <ChevronRight size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setDishCurrentPage(totalDishPages)}
                      disabled={dishCurrentPage === totalDishPages}
                      title="Last page"
                      style={{ padding: '0.2rem 0.4rem' }}
                    >
                      <ChevronsRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Selected Dish details & Recipe editor */}
            <div>
              {editingId ? (
                <div className="glass-card" style={{ background: 'rgba(17, 24, 39, 0.5)', border: '1px solid var(--color-primary)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Configure: {tempData.name}</span>
                      {tempData.dishNumber && (
                        <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700 }}>
                          {tempData.dishNumber}
                        </span>
                      )}
                    </div>
                    <button className="btn btn-danger btn-small" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => deleteDish(tempData.id || tempData._id)}>
                      <Trash2 size={12} /> Delete Dish
                    </button>
                  </h3>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Dish Number</label>
                      <input
                        className="form-input"
                        value={tempData.dishNumber || ''}
                        onChange={e => setTempData({ ...tempData, dishNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g. DISH-0001"
                        style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Dish Name</label>
                      <input className="form-input" value={tempData.name || ''} onChange={e => setTempData({ ...tempData, name: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <label className="form-label" style={{ margin: 0 }}>Category</label>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          style={{ padding: '0.12rem 0.45rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => {
                            setCategoryForm({ name: '', type: 'MENU' });
                            setCategoryFormError('');
                            setIsAddCategoryModalOpen(true);
                          }}
                          title="Create a new menu category"
                        >
                          <Plus size={12} /> Add Category
                        </button>
                      </div>
                      <select
                        className="form-select"
                        value={tempData.category || ''}
                        onChange={e => {
                          if (e.target.value === '__CREATE_NEW__') {
                            setCategoryForm({ name: '', type: 'MENU' });
                            setCategoryFormError('');
                            setIsAddCategoryModalOpen(true);
                          } else {
                            setTempData({ ...tempData, category: e.target.value });
                          }
                        }}
                      >
                        {allAvailableDishCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        {tempData.category && !allAvailableDishCategories.includes(tempData.category) && (
                          <option value={tempData.category}>{tempData.category}</option>
                        )}
                        <option value="__CREATE_NEW__" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          ➕ Create New Category...
                        </option>
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
                        const material = rawMaterialsObjMap.get(item.materialId);
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
                          {sortedRawMaterials.map(rm => (
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

                  {dishSaveMessage && (
                    <div style={{
                      marginTop: '0.85rem',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: dishSaveMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: dishSaveMessage.type === 'success' ? '#166534' : '#991b1b',
                      border: `1px solid ${dishSaveMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      {dishSaveMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      <span>{dishSaveMessage.text}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button className="btn btn-secondary" disabled={isSavingDish} onClick={cancelEdit}>Cancel</button>
                    <button
                      className="btn btn-primary"
                      disabled={isSavingDish}
                      onClick={() => saveEdit('dish')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '160px', justifyContent: 'center' }}
                    >
                      {isSavingDish ? (
                        <>
                          <Loader2 size={15} className="spinner" />
                          <span>Saving to MongoDB...</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Save Recipe &amp; Dish</span>
                        </>
                      )}
                    </button>
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
                  <th>Subcategory</th>
                  <th>Contact Person</th>
                  <th>Primary Phone</th>
                  <th>Secondary Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => {
                  const isEditing = editingId === s.id;
                  const catObj = effectiveVendorCategories.find(c => c.name === (isEditing ? tempData.category : s.category));
                  const availableSubs = catObj?.subCategories || [];
                  return (
                    <tr key={s.id}>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.name || ''} onChange={e => setTempData({ ...tempData, name: e.target.value })} />
                        ) : s.name}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="form-select"
                            value={tempData.category || ''}
                            onChange={e => {
                              const newCat = e.target.value;
                              const found = effectiveVendorCategories.find(c => c.name === newCat);
                              setTempData({ ...tempData, category: newCat, subCategory: found?.subCategories?.[0] || '' });
                            }}
                          >
                            {effectiveVendorCategories.map(c => (
                              <option key={c.id || c._id || c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="badge badge-info" style={{ fontWeight: 600 }}>{s.category || 'General'}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          availableSubs.length > 0 ? (
                            <select
                              className="form-select"
                              value={tempData.subCategory || ''}
                              onChange={e => setTempData({ ...tempData, subCategory: e.target.value })}
                            >
                              <option value="">-- None --</option>
                              {availableSubs.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="form-input"
                              placeholder="Subcategory"
                              value={tempData.subCategory || ''}
                              onChange={e => setTempData({ ...tempData, subCategory: e.target.value })}
                            />
                          )
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: s.subCategory ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {s.subCategory || '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" value={tempData.contact || ''} onChange={e => setTempData({ ...tempData, contact: e.target.value })} />
                        ) : (s.contact || '—')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" placeholder="Primary Phone" value={tempData.phone || ''} onChange={e => setTempData({ ...tempData, phone: e.target.value })} />
                        ) : (s.phone || '—')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="form-input" placeholder="Secondary Phone" value={tempData.secondaryPhone || ''} onChange={e => setTempData({ ...tempData, secondaryPhone: e.target.value })} />
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: s.secondaryPhone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {s.secondaryPhone || '—'}
                          </span>
                        )}
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
                        {isEditing && u.id !== 'admin' ? (
                          <select
                            className="form-input"
                            value={tempData.role || u.role}
                            onChange={e => setTempData({ ...tempData, role: e.target.value })}
                            style={{ fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
                          >
                            <option value="Sales Executive">Sales Executive</option>
                            <option value="Admin">Admin</option>
                            <option value="Chef">Chef</option>
                            <option value="HR Manager">HR Manager</option>
                            <option value="Inhouse Inventory Manager">Inhouse Inventory Manager</option>
                            <option value="Accountant">Accountant</option>
                            <option value="Agency">Agency</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            u.role === 'Admin' ? 'badge-danger' :
                            (u.role === 'HR' || u.role === 'HR Manager' || u.role === 'Manager') ? 'badge-info' :
                            (u.role.includes('Inventory') || u.role.includes('Store')) ? 'badge-warning' :
                            (u.role === 'Accountant' || u.role === 'Accounts Manager') ? 'badge-success' : 'badge-purple'
                          }`}>{u.role}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="form-input"
                            type="text"
                            value={tempData.password || ''}
                            onChange={e => setTempData({ ...tempData, password: e.target.value })}
                            style={{ maxWidth: '180px' }}
                            placeholder="Enter new password (optional)"
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
                              const res = await updateUser(tempData.id, {
                                role: tempData.role || u.role,
                                password: tempData.password
                              });
                              if (res && res.success) {
                                alert('User account updated successfully!');
                              } else {
                                alert('Failed to update user account.');
                              }
                              cancelEdit();
                            }}><Check size={14} /></button>
                            <button className="btn btn-secondary btn-small" onClick={cancelEdit}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => startEdit(u)}>
                              <Edit2 size={12} /> Edit Role / Password
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

      {/* ─────────────────── ADD DISH MODAL ─────────────────── */}
      {isAddDishModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmittingDish && setIsAddDishModalOpen(false)}>
          <div
            className="glass-card modal-card"
            style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>Add New Master Dish</h2>
                  <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', padding: '0.2rem 0.55rem' }}>
                    {dishForm.dishNumber || 'Generating...'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Register culinary recipe formula, pricing, and category classification.
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmittingDish}
                onClick={() => setIsAddDishModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Dish Number (Editable) & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Dish Number <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={async () => {
                        try {
                          if (typeof getNextDishNumber === 'function') {
                            const num = await getNextDishNumber();
                            setDishForm(prev => ({ ...prev, dishNumber: num }));
                            if (dishFormErrors.dishNumber) {
                              setDishFormErrors(prev => ({ ...prev, dishNumber: null }));
                            }
                          }
                        } catch (err) {}
                      }}
                      title="Re-generate next sequential Dish Number"
                      style={{ padding: '0.15rem 0.45rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <RotateCcw size={11} /> Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={dishForm.dishNumber}
                    onChange={e => {
                      setDishForm({ ...dishForm, dishNumber: e.target.value.toUpperCase() });
                      if (dishFormErrors.dishNumber) {
                        setDishFormErrors(prev => ({ ...prev, dishNumber: null }));
                      }
                    }}
                    placeholder="e.g. DISH-0105"
                    className="form-input"
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      borderColor: dishFormErrors.dishNumber ? 'var(--color-danger)' : undefined
                    }}
                  />
                  {dishFormErrors.dishNumber ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>{dishFormErrors.dishNumber}</span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auto-assigned or manually customizable sequential identifier</span>
                  )}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Selling Price / Plate ({companyProfile?.currency || '₹'}) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="form-input"
                    placeholder="e.g. 120"
                    value={dishForm.price}
                    onChange={e => {
                      setDishForm({ ...dishForm, price: parseFloat(e.target.value) || 0 });
                      if (dishFormErrors.price) setDishFormErrors({ ...dishFormErrors, price: null });
                    }}
                  />
                  {dishFormErrors.price && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-danger)', fontWeight: 600 }}>{dishFormErrors.price}</span>
                  )}
                </div>
              </div>

              {/* Dish Name */}
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Dish Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Badam Halwa, Paneer Butter Masala, Fresh Tender Coconut Payasam"
                  value={dishForm.name}
                  onChange={e => {
                    setDishForm({ ...dishForm, name: e.target.value });
                    if (dishFormErrors.name) setDishFormErrors({ ...dishFormErrors, name: null });
                  }}
                />
                {dishFormErrors.name && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-danger)', fontWeight: 600 }}>{dishFormErrors.name}</span>
                )}
              </div>

              {/* Category with inline '+ Create New Category' */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Category <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setCategoryForm({ name: '', type: 'MENU' });
                      setCategoryFormError('');
                      setIsAddCategoryModalOpen(true);
                    }}
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Plus size={13} /> Create New Category
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="form-select"
                    required
                    style={{ flex: 1 }}
                    value={dishForm.category}
                    onChange={e => {
                      if (e.target.value === '__CREATE_NEW__') {
                        setCategoryForm({ name: '', type: 'MENU' });
                        setCategoryFormError('');
                        setIsAddCategoryModalOpen(true);
                      } else {
                        setDishForm({ ...dishForm, category: e.target.value });
                        if (dishFormErrors.category) setDishFormErrors({ ...dishFormErrors, category: null });
                      }
                    }}
                  >
                    <option value="">-- Select Category --</option>
                    {allAvailableDishCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__CREATE_NEW__" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      ➕ Create New Category...
                    </option>
                  </select>
                </div>
                {dishFormErrors.category && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-danger)', fontWeight: 600 }}>{dishFormErrors.category}</span>
                )}
              </div>

              {/* Cuisine / Sub-Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Sub-Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Traditional Sweets, Gravy, Starters"
                    value={dishForm.subCategory}
                    onChange={e => setDishForm({ ...dishForm, subCategory: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Cuisine Style</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. South Indian, North Indian, Chinese, Continental"
                    value={dishForm.cuisine}
                    onChange={e => setDishForm({ ...dishForm, cuisine: e.target.value })}
                  />
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Dietary Specifications</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.2rem' }}>
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Jain', 'Nut-Free', 'Special Signature'].map(diet => {
                    const active = (dishForm.dietary || []).includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => {
                          const prev = dishForm.dietary || [];
                          const next = active ? prev.filter(d => d !== diet) : [...prev, diet];
                          setDishForm({ ...dishForm, dietary: next });
                        }}
                        className={`btn btn-small ${active ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '16px',
                          border: active ? 'none' : '1px solid var(--border-color)'
                        }}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kitchen Directives & Instructions */}
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Kitchen Directives & Service Instructions</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="e.g. Garnish with fried cashews & saffron strands; prepare 20 mins prior to service."
                  value={dishForm.instructions}
                  onChange={e => setDishForm({ ...dishForm, instructions: e.target.value })}
                />
              </div>

              {/* General Form Error */}
              {dishFormErrors.general && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                  {dishFormErrors.general}
                </div>
              )}

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSubmittingDish}
                  onClick={() => setIsAddDishModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingDish}
                  style={{ minWidth: '120px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {isSubmittingDish ? (
                    <>
                      <Loader2 size={15} className="spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Save Dish
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── INLINE CATEGORY CREATION SUB-MODAL ─────────────────── */}
      {isAddCategoryModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => !isSubmittingCategory && setIsAddCategoryModalOpen(false)}>
          <div
            className="glass-card modal-card"
            style={{ maxWidth: '440px', width: '90%', zIndex: 1210 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Create New Category</h3>
              <button
                type="button"
                disabled={isSubmittingCategory}
                onClick={() => setIsAddCategoryModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Category Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="form-input"
                  placeholder="e.g. WELCOME DRINK, ARTISAN BREADS, CHATS"
                  value={categoryForm.name}
                  onChange={e => {
                    setCategoryForm({ ...categoryForm, name: e.target.value });
                    setCategoryFormError('');
                  }}
                />
                {categoryFormError && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-danger)', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
                    {categoryFormError}
                  </span>
                )}
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Classification Type</label>
                <select
                  className="form-select"
                  value={categoryForm.type || 'MENU'}
                  onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value })}
                >
                  <option value="MENU">MENU (Master Food & Dish Menu)</option>
                  <option value="LIVE_STATION">LIVE_STATION (Live Counter Setup)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  disabled={isSubmittingCategory}
                  onClick={() => setIsAddCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-small"
                  disabled={isSubmittingCategory}
                  style={{ minWidth: '100px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  {isSubmittingCategory ? (
                    <>
                      <Loader2 size={14} className="spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Create Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthSetup;
