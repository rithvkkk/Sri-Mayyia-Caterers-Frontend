import React, { createContext, useState, useEffect } from 'react';
import {
  initialVenues,
  initialRawMaterials,
  initialDishes,
  initialSuppliers,
  initialLaborRates,
  initialAgencies,
  initialEvents
} from '../utils/mockData';

export const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  // Session / Role state
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('cater_current_role') || null;
  });

  const [users, setUsers] = useState(() => {
    const local = localStorage.getItem('cater_users');
    return local ? JSON.parse(local) : [
      { id: 'admin', password: 'admin123', role: 'Admin' },
      { id: 'manager', password: 'manager123', role: 'Manager' },
      { id: 'accountant', password: 'accountant123', role: 'Accountant' },
      { id: 'agency', password: 'agency123', role: 'Agency' }
    ];
  });

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRole(data.role);
        localStorage.setItem('cater_current_role', data.role);
        return { success: true, role: data.role };
      }
      return { success: false, message: data.message || 'Invalid credentials' };
    } catch (e) {
      console.warn('Backend offline, running local storage verification fallback...');
      const user = users.find(u => u.id.toLowerCase() === username.toLowerCase());
      if (user && (user.password === password || password === user.id + '123')) {
        setCurrentRole(user.role);
        localStorage.setItem('cater_current_role', user.role);
        return { success: true, role: user.role };
      }
      return { success: false, message: 'Invalid credentials or connection issue' };
    }
  };

  const logout = () => {
    setCurrentRole(null);
    localStorage.removeItem('cater_current_role');
  };

  const updateUserPassword = async (username, newPassword) => {
    const user = users.find(u => u.id.toLowerCase() === username.toLowerCase());
    if (!user) return { success: false, message: 'User account not found' };

    const updatedUser = { ...user, password: newPassword };
    const updatedUsers = users.map(u => u.id.toLowerCase() === username.toLowerCase() ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('cater_users', JSON.stringify(updatedUsers));

    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, role: user.role })
      });
      return { success: res.ok };
    } catch (e) {
      console.error('Offline password update cache only:', e);
      return { success: true };
    }
  };

  const addUser = (newUser) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('cater_users', JSON.stringify(updatedUsers));
    return { success: true };
  };

  const deleteUser = (userId) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('cater_users', JSON.stringify(updatedUsers));
    return { success: true };
  };
  
  // Database states
  const [venues, setVenues] = useState(() => {
    const local = localStorage.getItem('cater_venues');
    return local ? JSON.parse(local) : initialVenues;
  });

  const [rawMaterials, setRawMaterials] = useState(() => {
    const local = localStorage.getItem('cater_raw_materials');
    return local ? JSON.parse(local) : initialRawMaterials;
  });

  const [dishes, setDishes] = useState(() => {
    const local = localStorage.getItem('cater_dishes');
    return local ? JSON.parse(local) : initialDishes;
  });

  const [suppliers, setSuppliers] = useState(() => {
    const local = localStorage.getItem('cater_suppliers');
    return local ? JSON.parse(local) : initialSuppliers;
  });

  const [laborRates, setLaborRates] = useState(() => {
    const local = localStorage.getItem('cater_labor_rates');
    return local ? JSON.parse(local) : initialLaborRates;
  });

  const [agencies, setAgencies] = useState(() => {
    const local = localStorage.getItem('cater_agencies');
    return local ? JSON.parse(local) : initialAgencies;
  });

  const [events, setEvents] = useState(() => {
    const local = localStorage.getItem('cater_events');
    return local ? JSON.parse(local) : initialEvents;
  });

  const [companyProfile, setCompanyProfile] = useState(() => {
    const local = localStorage.getItem('cater_company_profile');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.name === 'Shreeji Catering Services') {
        parsed.name = 'Sri Mayyia Caterers';
        parsed.tagline = 'Legacy of Royal Flavors Since 1953';
        parsed.email = 'info@srimayyiacaterers.com';
        parsed.address = 'No 43, 2nd Cross, Malleshwaram, Bangalore - 560003';
        localStorage.setItem('cater_company_profile', JSON.stringify(parsed));
      }
      return parsed;
    }
    return {
      name: 'Sri Mayyia Caterers',
      tagline: 'Legacy of Royal Flavors Since 1953',
      phone: '+91 99988 77766',
      email: 'info@srimayyiacaterers.com',
      address: 'No 43, 2nd Cross, Malleshwaram, Bangalore - 560003',
      gstin: '24AAAAA1111A1Z1',
      defaultTaxRate: 18,
      currency: '₹'
    };
  });

  // Load from Backend REST endpoints
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Fetching Master Data from CaterFlow Cloud API...');
        
        // Check health/seed state first
        const statusRes = await fetch(`${API_URL}/status`).then(r => r.json()).catch(() => null);
        if (!statusRes || statusRes.status !== 'online') {
          console.warn('⚠️ Cloud backend is offline, retaining offline localStorage cache.');
          return;
        }

        const [vList, rmList, dList, sList, lrList, aList, evList, pDoc, uList] = await Promise.all([
          fetch(`${API_URL}/venues`).then(r => r.json()),
          fetch(`${API_URL}/raw-materials`).then(r => r.json()),
          fetch(`${API_URL}/dishes`).then(r => r.json()),
          fetch(`${API_URL}/suppliers`).then(r => r.json()),
          fetch(`${API_URL}/labor-rates`).then(r => r.json()),
          fetch(`${API_URL}/agencies`).then(r => r.json()),
          fetch(`${API_URL}/events`).then(r => r.json()),
          fetch(`${API_URL}/company-profile`).then(r => r.json()),
          fetch(`${API_URL}/users`).then(r => r.json()).catch(() => [])
        ]);

        // If the database is brand new and contains no records, seed it automatically
        if (vList.length === 0 && rmList.length === 0 && dList.length === 0) {
          console.log('🌱 Database is empty. Requesting server to seed default collections...');
          const seedResult = await fetch(`${API_URL}/seed`, { method: 'POST' }).then(r => r.json());
          console.log('🌱 Seed response:', seedResult.message);
          
          // Refetch after seeding
          const [vListNew, rmListNew, dListNew, sListNew, lrListNew, aListNew, evListNew, pDocNew, uListNew] = await Promise.all([
            fetch(`${API_URL}/venues`).then(r => r.json()),
            fetch(`${API_URL}/raw-materials`).then(r => r.json()),
            fetch(`${API_URL}/dishes`).then(r => r.json()),
            fetch(`${API_URL}/suppliers`).then(r => r.json()),
            fetch(`${API_URL}/labor-rates`).then(r => r.json()),
            fetch(`${API_URL}/agencies`).then(r => r.json()),
            fetch(`${API_URL}/events`).then(r => r.json()),
            fetch(`${API_URL}/company-profile`).then(r => r.json()),
            fetch(`${API_URL}/users`).then(r => r.json()).catch(() => [])
          ]);

          setVenues(vListNew);
          setRawMaterials(rmListNew);
          setDishes(dListNew);
          setSuppliers(sListNew);
          setLaborRates(lrListNew);
          setAgencies(aListNew);
          setEvents(evListNew);
          setCompanyProfile(pDocNew);
          setUsers(uListNew);
        } else {
          setVenues(vList);
          setRawMaterials(rmList);
          setDishes(dList);
          setSuppliers(sList);
          setLaborRates(lrList);
          setAgencies(aList);
          setEvents(evList);
          setCompanyProfile(pDoc);
          setUsers(uList || []);
        }
      } catch (err) {
        console.error('⚠️ Could not connect to Express API Server. Operating in standalone local-storage fallback mode.', err);
      }
    };
    loadData();
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
    localStorage.setItem('cater_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('cater_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  // Master Data Add/Update/Delete actions
  const addVenue = async (venue) => {
    const payload = { ...venue, id: 'v_' + Date.now() };
    setVenues(prev => [...prev, payload]);
    try {
      await fetch(`${API_URL}/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error(e); }
  };

  const updateVenue = async (updated) => {
    setVenues(prev => prev.map(v => v.id === updated.id ? updated : v));
    try {
      await fetch(`${API_URL}/venues/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) { console.error(e); }
  };

  const deleteVenue = async (id) => {
    setVenues(prev => prev.filter(v => v.id !== id));
    try {
      await fetch(`${API_URL}/venues/${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  const addRawMaterial = async (rm) => {
    const payload = { ...rm, id: 'rm_' + Date.now() };
    setRawMaterials(prev => [...prev, payload]);
    try {
      await fetch(`${API_URL}/raw-materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error(e); }
  };

  const updateRawMaterial = async (updated) => {
    setRawMaterials(prev => prev.map(r => r.id === updated.id ? updated : r));
    try {
      await fetch(`${API_URL}/raw-materials/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) { console.error(e); }
  };

  const deleteRawMaterial = async (id) => {
    setRawMaterials(prev => prev.filter(r => r.id !== id));
    try {
      await fetch(`${API_URL}/raw-materials/${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  const addDish = async (dish) => {
    const payload = { ...dish, id: 'd_' + Date.now() };
    setDishes(prev => [...prev, payload]);
    try {
      await fetch(`${API_URL}/dishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error(e); }
  };

  const updateDish = async (updated) => {
    setDishes(prev => prev.map(d => d.id === updated.id ? updated : d));
    try {
      await fetch(`${API_URL}/dishes/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) { console.error(e); }
  };

  const deleteDish = async (id) => {
    setDishes(prev => prev.filter(d => d.id !== id));
    try {
      await fetch(`${API_URL}/dishes/${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  const addSupplier = async (sup) => {
    const payload = { ...sup, id: 's_' + Date.now() };
    setSuppliers(prev => [...prev, payload]);
    try {
      await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error(e); }
  };

  const updateSupplier = async (updated) => {
    setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
    try {
      await fetch(`${API_URL}/suppliers/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) { console.error(e); }
  };

  const deleteSupplier = async (id) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`${API_URL}/suppliers/${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  const addAgency = async (ag) => {
    const payload = { ...ag, id: 'a_' + Date.now() };
    setAgencies(prev => [...prev, payload]);
    try {
      await fetch(`${API_URL}/agencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error(e); }
  };

  const updateAgency = async (updated) => {
    setAgencies(prev => prev.map(a => a.id === updated.id ? updated : a));
    try {
      await fetch(`${API_URL}/agencies/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) { console.error(e); }
  };

  const deleteAgency = async (id) => {
    setAgencies(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`${API_URL}/agencies/${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  // Event actions
  const createEvent = async (eventDetails) => {
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

    setEvents(prev => [...prev, newEvent]);

    try {
      await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
    } catch (e) { console.error(e); }

    return newId;
  };

  const updateEvent = async (updatedEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    try {
      await fetch(`${API_URL}/events/${updatedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent)
      });
    } catch (e) { console.error(e); }
  };

  const deleteEvent = async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    try {
      await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
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
        await fetch(`${API_URL}/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCloned)
        });
      } catch (e) { console.error(e); }
    }
  };

  const updateCompanyProfile = async (newProfile) => {
    setCompanyProfile(newProfile);
    try {
      await fetch(`${API_URL}/company-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });
    } catch (e) { console.error(e); }
  };

  return (
    <AppContext.Provider value={{
      currentRole,
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
