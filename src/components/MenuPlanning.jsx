import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ClipboardCopy, Package, ArrowRight, ShieldAlert, CheckCircle, HelpCircle, Save } from 'lucide-react';

const MenuPlanning = () => {
  const {
    currentRole,
    currentUser,
    events,
    updateEvent,
    dishes,
    refreshEventTotals
  } = useContext(AppContext);

  const isSalesExec = currentRole === 'Sales Executive' || currentRole === 'Sales';
  const visibleEvents = isSalesExec
    ? events.filter(e => e.createdBy === currentUser || e.createdByName === currentUser || e.salesExecutive === currentUser)
    : events;

  // States
  const [selectedEventId, setSelectedEventId] = useState(visibleEvents[0]?.id || '');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [cloneSourceId, setCloneSourceId] = useState('');

  const [draftSubFunctions, setDraftSubFunctions] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEditable = currentRole === 'Admin' || currentRole === 'Manager' || isSalesExec;
  const currentEvent = visibleEvents.find(e => e.id === selectedEventId) || visibleEvents[0];

  // Sync draft when event changes
  React.useEffect(() => {
    if (currentEvent) {
      // Need deep copy for subFunctions arrays
      setDraftSubFunctions(JSON.parse(JSON.stringify(currentEvent.subFunctions)));
    } else {
      setDraftSubFunctions(null);
    }
  }, [selectedEventId, currentEvent]);

  // Initialize selected sub-function
  React.useEffect(() => {
    if (draftSubFunctions && draftSubFunctions.length > 0) {
      if (!draftSubFunctions.find(sf => sf.id === selectedSubId)) {
        setSelectedSubId(draftSubFunctions[0].id);
      }
    } else {
      setSelectedSubId('');
    }
  }, [draftSubFunctions]);

  const selectedSub = draftSubFunctions?.find(sf => sf.id === selectedSubId);

  // Package definitions
  const packages = {
    platinum: {
      name: 'Platinum Royal Feast',
      items: ['d1', 'd2', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10']
    },
    gold: {
      name: 'Gold Festive Choice',
      items: ['d1', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd11']
    },
    silver: {
      name: 'Silver Classic Choice',
      items: ['d3', 'd4', 'd6', 'd7', 'd8', 'd11']
    }
  };

  const applyPackage = (pkgKey) => {
    if (!isEditable || !selectedSub) return;
    const pkg = packages[pkgKey];
    
    // Update sub-function menu items
    setDraftSubFunctions(prev => {
      return prev.map(sf => {
        if (sf.id === selectedSub.id) {
          return { ...sf, menuItems: [...pkg.items] };
        }
        return sf;
      });
    });

    alert(`Applied ${pkg.name} package to ${selectedSub.name}`);
  };

  const toggleDish = (dishId) => {
    if (!isEditable || !selectedSub) return;
    
    setDraftSubFunctions(prev => {
      return prev.map(sf => {
        if (sf.id === selectedSub.id) {
          const exists = sf.menuItems.includes(dishId);
          return {
            ...sf,
            menuItems: exists ? sf.menuItems.filter(id => id !== dishId) : [...sf.menuItems, dishId]
          };
        }
        return sf;
      });
    });
  };

  const handleSaveMenu = async () => {
    if (!isEditable || !currentEvent || !draftSubFunctions) return;
    setSaving(true);
    const updatedEvent = {
      ...currentEvent,
      subFunctions: draftSubFunctions
    };
    await updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
    setSaving(false);
  };

  const handleCloneConfig = () => {
    if (!isEditable || !selectedEventId || !cloneSourceId) return;
    const sourceEvent = events.find(e => e.id === cloneSourceId);
    if (!sourceEvent) return;

    // Simple cloning logic:
    // If the target has same number of sub-functions, we map them; else we copy the first sub-function's menu to all.
    setDraftSubFunctions(prev => {
      return prev.map((sf, idx) => {
        const sourceSub = sourceEvent.subFunctions[idx] || sourceEvent.subFunctions[0];
        return {
          ...sf,
          menuItems: sourceSub ? [...sourceSub.menuItems] : []
        };
      });
    });

    setCloneSourceId('');
    alert(`Menu configurations cloned successfully from ${sourceEvent.id}! Please click Save Menu to apply.`);
  };

  if (currentRole === 'Accountant' || currentRole.includes('Store')) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Operational menu planning details are restricted for this role. Please log in as an Admin, Manager, or Sales Executive.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Menu Planner</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Map dishes to sub-functions using A La Carte select or standard event packages.</p>
        </div>
        {isEditable && currentEvent && (
          <button 
            className="btn btn-primary" 
            onClick={handleSaveMenu} 
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Menu'}
          </button>
        )}
      </div>

      <div className="responsive-grid two-cols-right-heavy">
        
        {/* Left Column: Event & Template Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Active Parent Event</h3>
            <div className="form-group">
              <label className="form-label">Select Event ID</label>
              <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                {visibleEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.id} - {e.customer.name}</option>
                ))}
              </select>
            </div>
            
            {currentEvent && (
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Select Sub-Function Instance</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {draftSubFunctions?.map(sf => (
                    <button
                      key={sf.id}
                      onClick={() => setSelectedSubId(sf.id)}
                      className={`btn btn-secondary ${selectedSubId === sf.id ? 'active' : ''}`}
                      style={{
                        justifyContent: 'space-between',
                        background: selectedSubId === sf.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: selectedSubId === sf.id ? 'var(--color-primary)' : 'var(--border-color)',
                        color: selectedSubId === sf.id ? 'var(--color-primary)' : 'var(--text-primary)'
                      }}
                    >
                      <span>{sf.name}</span>
                      <span className="badge badge-info">{sf.guestCount} Pax</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historical Duplication Widget */}
          {isEditable && currentEvent && (
            <div className="glass-card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardCopy size={16} className="accent-text" />
                <span>Clone Event Menu Template</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Copy the entire menu allocation config from a past completed or active Event ID.
              </p>
              
              <div className="form-group">
                <label className="form-label">Source Event ID</label>
                <select className="form-select" value={cloneSourceId} onChange={e => setCloneSourceId(e.target.value)}>
                  <option value="">Choose past event...</option>
                  {events.filter(e => e.id !== selectedEventId).map(e => (
                    <option key={e.id} value={e.id}>{e.id} - {e.customer.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!cloneSourceId}
                onClick={handleCloneConfig}
              >
                <span>Duplicate Menu Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Menu Builder */}
        <div className="glass-card">
          {selectedSub ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem' }}>Menu Board: {selectedSub.name}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selected items: {selectedSub.menuItems.length} | Target guests: {selectedSub.guestCount} Pax</p>
                </div>


              </div>

              {/* Dish Selection Grid */}
              {['Starters', 'Mains', 'Desserts', 'Beverages'].map(cat => {
                const catDishes = dishes.filter(d => d.category === cat);
                return (
                  <div key={cat} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem' }}>{cat}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {catDishes.map(dish => {
                        const isSelected = selectedSub.menuItems.includes(dish.id);
                        return (
                          <div
                            key={dish.id}
                            style={{
                              padding: '0.75rem 1rem',
                              border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                              background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.01)',
                              borderRadius: '10px',
                              cursor: isEditable ? 'pointer' : 'default',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all var(--transition-fast)'
                            }}
                            onClick={() => toggleDish(dish.id)}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#fff' : 'var(--text-primary)' }}>{dish.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {dish.recipe ? `${dish.recipe.length} ingredients` : '0 recipe items'}
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                                <CheckCircle size={16} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <HelpCircle size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>Please select an Event sub-function instance from the sidebar to plan menu courses.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MenuPlanning;
