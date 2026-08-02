import React, { createContext, useState, useEffect } from 'react';
import {
  initialVenues,
  initialRawMaterials,
  initialDishes,
  initialSuppliers,
  initialLaborRates,
  initialAgencies,
  initialEvents,
  initialVessels,
  initialProvisions,
  initialVegetables,
  initialLabourWorkers
} from '../utils/mockData';

export const AppContext = createContext();

const getSafeLocal = (key, fallback) => {
  try {
    const local = localStorage.getItem(key);
    if (!local) return fallback;
    const parsed = JSON.parse(local);
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
      // Auto-migrate if old legacy mock dishes or events are cached in browser
      if (key === 'cater_dishes' && parsed.some(d => d.id === 'd1' || d.id === 'd2')) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      if (key === 'cater_events' && parsed.some(e => e.eventType === 'Wedding Reception')) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return parsed;
    }
    return parsed || fallback;
  } catch (e) {
    return fallback;
  }
};

export const AppProvider = ({ children }) => {
  const [activeApiUrl, setActiveApiUrl] = useState(() => {
    return import.meta.env.VITE_API_URL || '/api';
  });

  const apiCall = async (endpoint, options = {}) => {
    const envUrl = import.meta.env.VITE_API_URL;
    const primaryUrl = activeApiUrl || envUrl || '/api';
    
    const tryUrl = async (baseUrl, timeoutMs = 2500) => {
      if (!baseUrl) return null;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const cleanBase = baseUrl.replace(/\/$/, '');
        const cleanEndpoint = endpoint.replace(/^\//, '');
        
        let path = cleanEndpoint;
        // Auto-prepend 'api/' if baseUrl doesn't end with '/api' and endpoint isn't 'status'
        if (!cleanBase.endsWith('/api') && !cleanEndpoint.startsWith('api/') && cleanEndpoint !== 'status') {
          path = `api/${cleanEndpoint}`;
        }
        
        const fullUrl = `${cleanBase}/${path}`;
        const res = await fetch(fullUrl, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
          signal: controller.signal,
          ...options
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) return null;
        const data = await res.json().catch(() => null);
        if (data !== null) {
          if (baseUrl !== activeApiUrl) setActiveApiUrl(baseUrl);
          return data;
        }
      } catch (e) {
        clearTimeout(timeoutId);
      }
      return null;
    };

    // Fast path 1: Try primary URL
    const primaryRes = await tryUrl(primaryUrl, 2500);
    if (primaryRes !== null) return primaryRes;

    // Fallback path 2: Dynamic relative and local fallback
    const fallbacks = Array.from(new Set([
      envUrl,
      '/api',
      'http://localhost:5000'
    ])).filter(Boolean).filter(u => u !== primaryUrl);

    for (const url of fallbacks) {
      const res = await tryUrl(url, 1500);
      if (res !== null) return res;
    }

    return null;
  };

  // Session / Role / User state
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('cater_current_role') || null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('cater_current_user') || '';
  });

  const [users, setUsers] = useState([]);

  const login = async (username, password) => {
    if (syncStatus !== 'connected') {
      return { success: false, message: 'Cloud Server Connection Failed. Cannot log in until MongoDB is connected.' };
    }
    try {
      const data = await apiCall('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data && data.success) {
        setCurrentRole(data.role);
        setCurrentUser(data.username || username);
        localStorage.setItem('cater_current_role', data.role);
        localStorage.setItem('cater_current_user', data.username || username);
        return { success: true, role: data.role, username: data.username || username };
      }
      return { success: false, message: (data && data.message) || 'Invalid credentials' };
    } catch (e) {
      return { success: false, message: 'Cloud Server Connection Failed' };
    }
  };

  const logout = () => {
    setCurrentRole(null);
    setCurrentUser('');
    localStorage.removeItem('cater_current_role');
    localStorage.removeItem('cater_current_user');
    localStorage.removeItem('cater_last_activity');
  };

  // 1-Hour Inactivity Auto-Logout Handler (3,600,000 ms)
  const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

  useEffect(() => {
    if (!currentRole) return;

    let timeoutId;

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      localStorage.setItem('cater_last_activity', String(Date.now()));
      timeoutId = setTimeout(() => {
        logout();
        alert('🔒 Session Expired: You have been automatically logged out due to 1 hour of inactivity.');
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Check if session already expired while idle / backgrounded
    const lastActivity = parseInt(localStorage.getItem('cater_last_activity') || '0', 10);
    if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
      logout();
      alert('🔒 Session Expired: You have been automatically logged out due to inactivity.');
      return;
    }

    // Global user activity event listeners
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    
    // Start initial inactivity timer
    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [currentRole]);

  const updateUserPassword = async (username, newPassword) => {
    if (syncStatus !== 'connected') {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return { success: false, message: 'Cloud Server Connection Failed' };
    }
    const user = users.find(u => u.id.toLowerCase() === username.toLowerCase());
    if (!user) return { success: false, message: 'User account not found' };

    const res = await apiCall(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword, role: user.role })
    });

    if (!res) {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return { success: false, message: 'Cloud Server Connection Failed' };
    }

    const updatedUser = { ...user, password: newPassword };
    const updatedUsers = users.map(u => u.id.toLowerCase() === username.toLowerCase() ? updatedUser : u);
    setUsers(updatedUsers);
    return { success: true };
  };

  const addUser = async (newUser) => {
    if (syncStatus !== 'connected') {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return { success: false, message: 'Cloud Server Connection Failed' };
    }
    const res = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    });

    if (!res) {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return { success: false, message: 'Cloud Server Connection Failed' };
    }

    const updatedUsers = [...users, res || newUser];
    setUsers(updatedUsers);
    return { success: true };
  };

  const deleteUser = async (userId) => {
    if (syncStatus !== 'connected') {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return { success: false, message: 'Cloud Server Connection Failed' };
    }
    const res = await apiCall(`/users/${userId}`, { method: 'DELETE' });
    if (!res) {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return { success: false, message: 'Cloud Server Connection Failed' };
    }
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    return { success: true };
  };
  
  // Database states driven ONLY by MongoDB (No Mock Data Fallbacks)
  const [venues, setVenues] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [laborRates, setLaborRates] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [events, setEvents] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [provisions, setProvisions] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [labourWorkers, setLabourWorkers] = useState([]);

  const [companyProfile, setCompanyProfile] = useState({
    name: 'Sri Mayyia Caterers',
    tagline: 'Legacy of Royal Flavors Since 1953',
    phone: '+91 99988 77766',
    email: 'info@srimayyiacaterers.com',
    address: 'No 43, 2nd Cross, Malleshwaram, Bangalore - 560003',
    gstin: '24AAAAA1111A1Z1',
    defaultTaxRate: 18,
    currency: '₹'
  });

  const [syncStatus, setSyncStatus] = useState('syncing'); // 'connected' | 'syncing' | 'offline'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  // Bi-directional MongoDB live load & sync function
  const loadData = async (isBackground = false) => {
    try {
      if (!isBackground) setSyncStatus('syncing');
      
      let statusRes = await apiCall('/status');
      if (!statusRes) {
        statusRes = await apiCall('/api/status');
      }

      const fetchEndpoint = async (path) => {
        const apiPrefixed = path.startsWith('/api') ? path : `/api${path.replace(/^\//, '')}`;
        const res = await apiCall(apiPrefixed);
        if (res !== null) return res;
        return await apiCall(path);
      };

      const [vList, rmList, dList, sList, lrList, aList, evList, pDoc, uList, vesList, prvList, vegList, lwList] = await Promise.all([
        fetchEndpoint('/venues'),
        fetchEndpoint('/raw-materials'),
        fetchEndpoint('/dishes'),
        fetchEndpoint('/suppliers'),
        fetchEndpoint('/labor-rates'),
        fetchEndpoint('/agencies'),
        fetchEndpoint('/events'),
        fetchEndpoint('/company-profile'),
        fetchEndpoint('/users'),
        fetchEndpoint('/vessels'),
        fetchEndpoint('/provisions'),
        fetchEndpoint('/vegetables'),
        fetchEndpoint('/labour-workers')
      ]);

      const isServerReachable = statusRes?.status === 'online' || Array.isArray(vList) || Array.isArray(dList);

      if (!isServerReachable) {
        setSyncStatus('offline');
        return;
      }

      if (Array.isArray(vList)) setVenues(vList);
      if (Array.isArray(rmList)) setRawMaterials(rmList);
      if (Array.isArray(dList)) setDishes(dList);
      if (Array.isArray(sList)) setSuppliers(sList);
      if (Array.isArray(lrList)) setLaborRates(lrList);
      if (Array.isArray(aList)) setAgencies(aList);
      if (Array.isArray(evList)) setEvents(evList);
      if (pDoc && typeof pDoc === 'object' && pDoc.name) setCompanyProfile(pDoc);
      if (Array.isArray(uList) && uList.length > 0) setUsers(uList);
      if (Array.isArray(vesList)) setVessels(vesList);
      if (Array.isArray(prvList)) setProvisions(prvList);
      if (Array.isArray(vegList)) setVegetables(vegList);
      if (Array.isArray(lwList)) setLabourWorkers(lwList);

      setSyncStatus('connected');
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('⚠️ MongoDB connection offline:', err.message);
      setSyncStatus('offline');
    }
  };

  // Load initially and setup 8s polling interval + window focus trigger for bi-directional live sync
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);

    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cater_users', JSON.stringify(users));
  }, [users]);

  // Sync to localStorage (Fallback local cache)
  useEffect(() => {
    localStorage.setItem('cater_venues', JSON.stringify(venues));
  }, [venues]);

  useEffect(() => {
    localStorage.setItem('cater_raw_materials', JSON.stringify(rawMaterials));
  }, [rawMaterials]);

  useEffect(() => {
    localStorage.setItem('cater_dishes', JSON.stringify(dishes));
  }, [dishes]);

  useEffect(() => {
    localStorage.setItem('cater_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('cater_labor_rates', JSON.stringify(laborRates));
  }, [laborRates]);

  useEffect(() => {
    localStorage.setItem('cater_agencies', JSON.stringify(agencies));
  }, [agencies]);

  useEffect(() => {
    localStorage.setItem('cater_vessels', JSON.stringify(vessels));
  }, [vessels]);

  useEffect(() => {
    localStorage.setItem('cater_provisions', JSON.stringify(provisions));
  }, [provisions]);

  useEffect(() => {
    localStorage.setItem('cater_vegetables', JSON.stringify(vegetables));
  }, [vegetables]);

  useEffect(() => {
    localStorage.setItem('cater_labour_workers', JSON.stringify(labourWorkers));
  }, [labourWorkers]);

  useEffect(() => {
    localStorage.setItem('cater_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('cater_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  const requireMongoConnection = () => {
    if (syncStatus !== 'connected') {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return false;
    }
    return true;
  };

  // Master Data Add/Update/Delete actions
  const addVenue = async (venue) => {
    if (!requireMongoConnection()) return;
    const payload = { ...venue, id: 'v_' + Date.now() };
    const res = await apiCall('/venues', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVenues(prev => [...prev, res || payload]);
  };

  const updateVenue = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/venues/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVenues(prev => prev.map(v => v.id === updated.id ? (res || updated) : v));
  };

  const deleteVenue = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/venues/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVenues(prev => prev.filter(v => v.id !== id));
  };

  const addRawMaterial = async (rm) => {
    if (!requireMongoConnection()) return;
    const payload = { ...rm, id: 'rm_' + Date.now() };
    const res = await apiCall('/raw-materials', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setRawMaterials(prev => [...prev, res || payload]);
  };

  const updateRawMaterial = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/raw-materials/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setRawMaterials(prev => prev.map(r => r.id === updated.id ? (res || updated) : r));
  };

  const deleteRawMaterial = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/raw-materials/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setRawMaterials(prev => prev.filter(r => r.id !== id));
  };

  const addDish = async (dish) => {
    if (!requireMongoConnection()) return;
    const payload = { ...dish, id: 'd_' + Date.now() };
    const res = await apiCall('/dishes', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setDishes(prev => [...prev, res || payload]);
  };

  const updateDish = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/dishes/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setDishes(prev => prev.map(d => d.id === updated.id ? (res || updated) : d));
  };

  const deleteDish = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/dishes/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const addSupplier = async (sup) => {
    if (!requireMongoConnection()) return;
    const payload = { ...sup, id: 's_' + Date.now() };
    const res = await apiCall('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setSuppliers(prev => [...prev, res || payload]);
  };

  const updateSupplier = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/suppliers/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setSuppliers(prev => prev.map(s => s.id === updated.id ? (res || updated) : s));
  };

  const deleteSupplier = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/suppliers/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addAgency = async (ag) => {
    if (!requireMongoConnection()) return;
    const payload = { ...ag, id: 'a_' + Date.now() };
    const res = await apiCall('/agencies', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setAgencies(prev => [...prev, res || payload]);
  };

  const updateAgency = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/agencies/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setAgencies(prev => prev.map(a => a.id === updated.id ? (res || updated) : a));
  };

  const deleteAgency = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/agencies/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setAgencies(prev => prev.filter(a => a.id !== id));
  };

  // Vessel Actions
  const addVessel = async (ves) => {
    if (!requireMongoConnection()) return;
    const payload = { ...ves, id: 'ves_' + Date.now() };
    const res = await apiCall('/vessels', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVessels(prev => [...prev, res || payload]);
  };

  const updateVessel = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/vessels/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVessels(prev => prev.map(v => v.id === updated.id ? (res || updated) : v));
  };

  const deleteVessel = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/vessels/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVessels(prev => prev.filter(v => v.id !== id));
  };

  // Provision Actions
  const addProvision = async (prv) => {
    if (!requireMongoConnection()) return;
    const payload = { ...prv, id: 'prv_' + Date.now() };
    const res = await apiCall('/provisions', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setProvisions(prev => [...prev, res || payload]);
  };

  const updateProvision = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/provisions/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setProvisions(prev => prev.map(p => p.id === updated.id ? (res || updated) : p));
  };

  const deleteProvision = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/provisions/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setProvisions(prev => prev.filter(p => p.id !== id));
  };

  // Vegetable Actions
  const addVegetable = async (veg) => {
    if (!requireMongoConnection()) return;
    const payload = { ...veg, id: 'veg_' + Date.now() };
    const res = await apiCall('/vegetables', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVegetables(prev => [...prev, res || payload]);
  };

  const updateVegetable = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/vegetables/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVegetables(prev => prev.map(v => v.id === updated.id ? (res || updated) : v));
  };

  const deleteVegetable = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/vegetables/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setVegetables(prev => prev.filter(v => v.id !== id));
  };

  // Labour Worker Actions
  const addLabourWorker = async (lw) => {
    if (!requireMongoConnection()) return;
    const payload = { ...lw, id: 'lw_' + Date.now() };
    const res = await apiCall('/labour-workers', { method: 'POST', body: JSON.stringify(payload) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setLabourWorkers(prev => [...prev, res || payload]);
  };

  const updateLabourWorker = async (updated) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/labour-workers/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setLabourWorkers(prev => prev.map(w => w.id === updated.id ? (res || updated) : w));
  };

  const deleteLabourWorker = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/labour-workers/${id}`, { method: 'DELETE' });
    if (!res) { alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.'); return; }
    setLabourWorkers(prev => prev.filter(w => w.id !== id));
  };

  // Event actions
  const createEvent = async (eventDetails) => {
    if (!requireMongoConnection()) return null;
    const year = new Date().getFullYear();
    const lastEvent = events[events.length - 1];
    let nextNum = 1;
    if (lastEvent && lastEvent.id.startsWith(`EV-${year}`)) {
      const parts = lastEvent.id.split('-');
      nextNum = parseInt(parts[2], 10) + 1;
    }
    const newId = `EV-${year}-${String(nextNum).padStart(3, '0')}`;

    const newEvent = {
      id: newId,
      customer: eventDetails.customer || { name: '', phone: '', email: '' },
      eventType: eventDetails.eventType || 'Event',
      createdBy: currentUser || currentRole || 'admin',
      createdByName: currentUser || currentRole || 'admin',
      salesExecutive: currentUser || currentRole || 'admin',
      venueId: eventDetails.venueId || '',
      date: eventDetails.date || new Date().toISOString().split('T')[0],
      status: 'Inquiry',
      subFunctions: eventDetails.subFunctions || [],
      execution: {
        teamRoutes: {},
        dishStatuses: {},
        costs: {
          rawMaterialsCost: 0,
          laborCost: 0,
          venueRent: 0,
          otherExpenses: 0
        }
      },
      laborAllocations: [],
      billing: {
        pricePerPlate: eventDetails.pricePerPlate || 800,
        subtotal: 0,
        taxRate: companyProfile.defaultTaxRate,
        taxAmount: 0,
        totalAmount: 0,
        advancePaid: 0,
        balanceDue: 0,
        status: 'Unpaid'
      }
    };

    recalculateEventFinances(newEvent);

    const res = await apiCall('/events', { method: 'POST', body: JSON.stringify(newEvent) });
    if (!res) {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return null;
    }

    setEvents(prev => [...prev, res || newEvent]);
    return newId;
  };

  const updateEvent = async (updatedEvent) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/events/${updatedEvent.id}`, { method: 'PUT', body: JSON.stringify(updatedEvent) });
    if (!res) {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return;
    }
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? (res || updatedEvent) : e));
  };

  const deleteEvent = async (id) => {
    if (!requireMongoConnection()) return;
    const res = await apiCall(`/events/${id}`, { method: 'DELETE' });
    if (!res) {
      alert('❌ Cloud Server Connection Failed. Changes cannot be saved until MongoDB is connected.');
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Algorithmic Raw Material Requirements Calculation
  const calculateEventRawMaterials = (event) => {
    if (!event || !event.subFunctions) return [];

    const requirements = {};

    event.subFunctions.forEach(sub => {
      const guestCount = parseInt(sub.guestCount, 10) || 0;
      if (guestCount <= 0) return;

      sub.menuItems.forEach(dishId => {
        const dish = dishes.find(d => d.id === dishId);
        if (!dish || !dish.recipe) return;

        dish.recipe.forEach(recipeItem => {
          const matId = recipeItem.materialId;
          const qtyPerPlate = parseFloat(recipeItem.quantity) || 0;
          if (qtyPerPlate <= 0) return;

          const totalForDish = qtyPerPlate * guestCount;
          requirements[matId] = (requirements[matId] || 0) + totalForDish;
        });
      });
    });

    return Object.keys(requirements).map(matId => {
      const material = rawMaterials.find(rm => rm.id === matId);
      if (!material) return null;

      const totalQty = requirements[matId];
      const totalCost = totalQty * material.costPerUnit;
      const matchedSupplier = suppliers.find(s => s.category === material.category) || suppliers[0];

      return {
        materialId: matId,
        name: material.name,
        category: material.category,
        unit: material.unit,
        costPerUnit: material.costPerUnit,
        requiredQty: parseFloat(totalQty.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        supplier: matchedSupplier
      };
    }).filter(Boolean);
  };

  // Recalculates all costs & totals of an event dynamically
  const recalculateEventFinances = (event) => {
    const rawMaterialsCost = (event.manualMaterials || []).reduce((sum, item) => sum + (item.totalCost || 0), 0);

    const laborCost = (event.laborAllocations || []).reduce((sum, alloc) => {
      if (alloc.status === 'Cancelled') return sum;
      return sum + (parseFloat(alloc.totalPayout) || 0);
    }, 0);

    const venue = venues.find(v => v.id === event.venueId);
    const venueRent = venue ? venue.price : 0;

    const totalGuests = (event.subFunctions || []).reduce((sum, sub) => sum + (parseInt(sub.guestCount, 10) || 0), 0);
    const subtotal = totalGuests * (parseFloat(event.billing.pricePerPlate) || 0);

    const taxRate = parseFloat(event.billing.taxRate) || companyProfile.defaultTaxRate;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    const advancePaid = parseFloat(event.billing.advancePaid) || 0;
    const balanceDue = Math.max(0, totalAmount - advancePaid);

    let paymentStatus = 'Unpaid';
    if (advancePaid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Fully Paid';
    } else if (advancePaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    event.execution.costs = {
      rawMaterialsCost: parseFloat(rawMaterialsCost.toFixed(2)),
      laborCost: parseFloat(laborCost.toFixed(2)),
      venueRent,
      otherExpenses: event.execution.costs?.otherExpenses || 0
    };

    event.billing = {
      ...event.billing,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      balanceDue: parseFloat(balanceDue.toFixed(2)),
      status: paymentStatus
    };
  };

  const refreshEventTotals = async (eventId) => {
    let updatedCloned = null;
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const cloned = JSON.parse(JSON.stringify(e));
        recalculateEventFinances(cloned);
        updatedCloned = cloned;
        return cloned;
      }
      return e;
    }));

    if (updatedCloned) {
      try {
        await apiCall(`/events/${eventId}`, { method: 'PUT', body: JSON.stringify(updatedCloned) });
      } catch (e) { console.error(e); }
    }
  };

  const updateCompanyProfile = async (newProfile) => {
    setCompanyProfile(newProfile);
    try {
      await apiCall('/company-profile', { method: 'PUT', body: JSON.stringify(newProfile) });
    } catch (e) { console.error(e); }
  };

  const resetMasterDatabase = async () => {
    localStorage.setItem('cater_dishes', JSON.stringify(initialDishes));
    localStorage.setItem('cater_events', JSON.stringify(initialEvents));
    setDishes(initialDishes);
    setEvents(initialEvents);
    try {
      await apiCall('/seed', { method: 'POST' });
      await apiCall('/api/seed', { method: 'POST' });
    } catch (e) {
      console.warn('Backend seed offline, local state updated');
    }
  };

  return (
    <AppContext.Provider value={{
      resetMasterDatabase,
      currentRole,
      currentUser,
      setCurrentRole,
      login,
      logout,
      users,
      addUser,
      deleteUser,
      updateUserPassword,
      venues,
      addVenue,
      updateVenue,
      deleteVenue,
      rawMaterials,
      addRawMaterial,
      updateRawMaterial,
      deleteRawMaterial,
      dishes,
      addDish,
      updateDish,
      deleteDish,
      suppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      laborRates,
      setLaborRates,
      agencies,
      addAgency,
      updateAgency,
      deleteAgency,
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
      labourWorkers,
      addLabourWorker,
      updateLabourWorker,
      deleteLabourWorker,
      syncStatus,
      lastSyncedAt,
      triggerManualSync: () => loadData(false),
      events,
      createEvent,
      updateEvent,
      deleteEvent,
      refreshEventTotals,
      calculateEventRawMaterials,
      companyProfile,
      setCompanyProfile: updateCompanyProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};
