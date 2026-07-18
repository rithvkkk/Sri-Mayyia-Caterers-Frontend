import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ChefHat, ArrowRight, ShieldAlert, Utensils, HelpCircle } from 'lucide-react';

const MenuExecution = () => {
  const {
    currentRole,
    events,
    updateEvent,
    dishes
  } = useContext(AppContext);

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const currentEvent = events.find(e => e.id === selectedEventId);

  const isOps = currentRole === 'Admin' || currentRole === 'Manager';
  const isChef = currentRole === 'Chef';
  const hasAccess = isOps || isChef;

  // Extract all unique dishes selected for this event across all sub-functions
  const getEventDishes = () => {
    if (!currentEvent) return [];
    const ids = new Set();
    currentEvent.subFunctions.forEach(sf => {
      sf.menuItems.forEach(id => ids.add(id));
    });
    return Array.from(ids).map(id => {
      const dish = dishes.find(d => d.id === id);
      if (!dish) return null;

      // Calculate total headcount for this dish
      const totalPax = currentEvent.subFunctions
        .filter(sf => sf.menuItems.includes(id))
        .reduce((sum, sf) => sum + sf.guestCount, 0);

      // Get current route and status
      const route = currentEvent.execution.teamRoutes[id] || 'internal';
      const status = currentEvent.execution.dishStatuses?.[id] || 'Pending';

      return {
        ...dish,
        totalPax,
        route, // internal, outsourced, agency
        status // Pending, Prep, Cooking, Ready, Served
      };
    }).filter(Boolean);
  };

  const eventDishes = getEventDishes();

  // Update dish kitchen routing
  const handleRouteChange = (dishId, newRoute) => {
    if (!isOps) return;
    const updatedRoutes = {
      ...currentEvent.execution.teamRoutes,
      [dishId]: newRoute
    };

    const updatedEvent = {
      ...currentEvent,
      execution: {
        ...currentEvent.execution,
        teamRoutes: updatedRoutes
      }
    };

    updateEvent(updatedEvent);
  };

  // Update dish execution status
  const handleStatusChange = (dishId, newStatus) => {
    if (!hasAccess) return;
    const updatedStatuses = {
      ...currentEvent.execution.dishStatuses,
      [dishId]: newStatus
    };

    const updatedEvent = {
      ...currentEvent,
      execution: {
        ...currentEvent.execution,
        dishStatuses: updatedStatuses
      }
    };

    updateEvent(updatedEvent);
  };

  if (currentRole === 'Accountant' || currentRole === 'Agency') {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Kitchen execution board controls are restricted for Accountants and Agencies. Please switch user to Admin, Manager, or Chef.
        </p>
      </div>
    );
  }

  // Filter dishes by column statuses
  const pendingDishes = eventDishes.filter(d => d.status === 'Pending' || d.status === 'Prep');
  const cookingDishes = eventDishes.filter(d => d.status === 'Cooking');
  const servedDishes = eventDishes.filter(d => d.status === 'Ready' || d.status === 'Served');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Kitchen Execution Board</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Route menu items to designated kitchen channels and track preparation steps.</p>
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.id} - {e.customer.name}</option>
            ))}
          </select>
        </div>
      </div>

      {currentEvent ? (
        <div>
          {/* Legend and Overview details */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChefHat size={18} className="accent-text" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Event: {currentEvent.customer.name} ({currentEvent.eventType})</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="badge badge-info" style={{ textTransform: 'none', padding: '0.15rem 0.4rem' }}>Internal</span>
                <span>House Chefs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="badge badge-warning" style={{ textTransform: 'none', padding: '0.15rem 0.4rem' }}>Outsourced</span>
                <span>Third-party Vendor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="badge badge-purple" style={{ textTransform: 'none', padding: '0.15rem 0.4rem' }}>Agency</span>
                <span>Partner Culinary Team</span>
              </div>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="kanban-grid">
            
            {/* Column 1: Pending & Prep */}
            <div className="kanban-column">
              <div className="kanban-column-header">
                <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)' }} />
                  <span>Pending & Preparing</span>
                </span>
                <span className="badge badge-warning">{pendingDishes.length}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '550px' }}>
                {pendingDishes.map(d => (
                  <div key={d.id} className="kanban-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</span>
                      <span className={`badge ${
                        d.route === 'internal' ? 'badge-info' : 
                        d.route === 'outsourced' ? 'badge-warning' : 'badge-purple'
                      }`}>{d.route}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>Headcount: {d.totalPax} Pax</span>
                      <span>Status: <strong style={{ color: 'var(--color-warning)' }}>{d.status}</strong></span>
                    </div>

                    {/* Routing selection controls */}
                    {isOps && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Assign Culinary Team:</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {['internal', 'outsourced', 'agency'].map(r => (
                            <button
                              key={r}
                              className="btn btn-secondary btn-small"
                              style={{ flexGrow: 1, padding: '0.15rem 0.35rem', fontSize: '0.7rem', textTransform: 'capitalize', background: d.route === r ? 'rgba(59,130,246,0.1)' : 'transparent' }}
                              onClick={() => handleRouteChange(d.id, r)}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action button to promote status */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      {d.status === 'Pending' ? (
                        <button className="btn btn-primary btn-small" style={{ width: '100%', fontSize: '0.75rem', padding: '0.3rem' }} onClick={() => handleStatusChange(d.id, 'Prep')}>
                          Start Prep Work
                        </button>
                      ) : (
                        <button className="btn btn-accent btn-small" style={{ width: '100%', fontSize: '0.75rem', padding: '0.3rem' }} onClick={() => handleStatusChange(d.id, 'Cooking')}>
                          <span>Send to Cooking</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {pendingDishes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No pending items in queue.</div>
                )}
              </div>
            </div>

            {/* Column 2: Cooking */}
            <div className="kanban-column" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div className="kanban-column-header">
                <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                  <span>Cooking / Kitchen Fire</span>
                </span>
                <span className="badge badge-info">{cookingDishes.length}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '550px' }}>
                {cookingDishes.map(d => (
                  <div key={d.id} className="kanban-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</span>
                      <span className={`badge ${
                        d.route === 'internal' ? 'badge-info' : 
                        d.route === 'outsourced' ? 'badge-warning' : 'badge-purple'
                      }`}>{d.route}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>Headcount: {d.totalPax} Pax</span>
                      <span style={{ color: 'var(--color-primary)' }}>Cooking...</span>
                    </div>

                    {/* Quick back promotion */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-secondary btn-small" style={{ flexGrow: 1, padding: '0.2rem', fontSize: '0.7rem' }} onClick={() => handleStatusChange(d.id, 'Prep')}>
                        Back to Prep
                      </button>
                      <button className="btn btn-primary btn-small" style={{ flexGrow: 2, padding: '0.2rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }} onClick={() => handleStatusChange(d.id, 'Ready')}>
                        <span>Mark Ready</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {cookingDishes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No dishes currently cooking.</div>
                )}
              </div>
            </div>

            {/* Column 3: Ready & Served */}
            <div className="kanban-column" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="kanban-column-header">
                <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
                  <span>Ready & Served</span>
                </span>
                <span className="badge badge-success">{servedDishes.length}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '550px' }}>
                {servedDishes.map(d => (
                  <div key={d.id} className="kanban-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-success)' }}>{d.name}</span>
                      <span className={`badge ${
                        d.route === 'internal' ? 'badge-info' : 
                        d.route === 'outsourced' ? 'badge-warning' : 'badge-purple'
                      }`}>{d.route}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>Headcount: {d.totalPax} Pax</span>
                      <span>Served Status: <strong style={{ color: 'var(--color-success)' }}>{d.status}</strong></span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-secondary btn-small" style={{ flexGrow: 1, padding: '0.2rem', fontSize: '0.7rem' }} onClick={() => handleStatusChange(d.id, 'Cooking')}>
                        Re-Cook
                      </button>
                      {d.status === 'Ready' && (
                        <button className="btn btn-accent btn-small" style={{ flexGrow: 2, padding: '0.2rem', fontSize: '0.7rem' }} onClick={() => handleStatusChange(d.id, 'Served')}>
                          Confirm Served
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {servedDishes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No ready items yet.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Utensils size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p>Please configure an active booking to view the kitchen Kanban board.</p>
        </div>
      )}

    </div>
  );
};

export default MenuExecution;
