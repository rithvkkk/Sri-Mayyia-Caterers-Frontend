import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Calendar, Phone, Mail, MapPin, Users, Plus, PlusCircle, Trash2, ShieldAlert, CheckCircle, Clipboard, Search, Save } from 'lucide-react';

const X = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EventBooking = () => {
  const {
    currentRole,
    currentUser,
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    venues,
    companyProfile
  } = useContext(AppContext);

  // States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDraft, setEditDraft] = useState(null); // null = view mode
  const [saving, setSaving] = useState(false);
  
  // Form states for creation
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [venueId, setVenueId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [pricePerPlate, setPricePerPlate] = useState('');
  
  // Subfunctions builder in form
  const [subFunctionsList, setSubFunctionsList] = useState([
    { name: '', guestCount: '', menuItems: [] }
  ]);

  const isSalesExec = currentRole === 'Sales Executive' || currentRole === 'Sales';
  const isEditable = currentRole === 'Admin' || currentRole === 'Manager' || isSalesExec;

  // Filter visible events for Sales Executives so they only see sales assigned/created by them
  const visibleEvents = isSalesExec
    ? events.filter(e => e.createdBy === currentUser || e.createdByName === currentUser || e.salesExecutive === currentUser)
    : events;

  const selectedEvent = visibleEvents.find(e => e.id === selectedEventId) || visibleEvents[0];

  // When selected event changes, exit edit mode
  React.useEffect(() => { setEditDraft(null); }, [selectedEventId]);

  const startEdit = () => {
    if (!selectedEvent) return;
    setEditDraft({
      name: selectedEvent.customer.name,
      phone: selectedEvent.customer.phone || '',
      email: selectedEvent.customer.email || '',
      eventType: selectedEvent.eventType || '',
      venueId: selectedEvent.venueId || '',
      date: selectedEvent.date || '',
      status: selectedEvent.status || 'Inquiry'
    });
  };

  const handleSaveEvent = async () => {
    if (!editDraft || !selectedEvent) return;
    setSaving(true);
    const updated = {
      ...selectedEvent,
      customer: { ...selectedEvent.customer, name: editDraft.name, phone: editDraft.phone, email: editDraft.email },
      eventType: editDraft.eventType,
      venueId: editDraft.venueId,
      date: editDraft.date,
      status: editDraft.status
    };
    await updateEvent(updated);
    setSaving(false);
    setEditDraft(null);
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !eventDate) {
      alert('Client Name and Date are required!');
      return;
    }

    const payload = {
      customer: { name: clientName, phone: clientPhone, email: clientEmail },
      eventType,
      venueId,
      date: eventDate,
      pricePerPlate: parseFloat(pricePerPlate) || 800,
      subFunctions: subFunctionsList.map((sf, idx) => ({
        id: `sf-${Date.now()}-${idx}`,
        name: sf.name,
        guestCount: parseInt(sf.guestCount, 10) || 100,
        menuItems: []
      }))
    };

    const newId = await createEvent(payload);
    alert(`Event Created Successfully! Generated Event ID: ${newId}`);
    
    // reset form
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setEventType('');
    setVenueId('');
    setEventDate('');
    setPricePerPlate('');
    setSubFunctionsList([{ name: '', guestCount: '', menuItems: [] }]);
    setShowCreateModal(false);
    setSelectedEventId(newId);
  };

  const addSubFunctionRow = () => {
    setSubFunctionsList([...subFunctionsList, { name: '', guestCount: '', menuItems: [] }]);
  };

  const removeSubFunctionRow = (index) => {
    if (subFunctionsList.length === 1) return;
    setSubFunctionsList(subFunctionsList.filter((_, idx) => idx !== index));
  };

  const updateSubFunctionRow = (index, field, value) => {
    setSubFunctionsList(subFunctionsList.map((sf, idx) => 
      idx === index ? { ...sf, [field]: value } : sf
    ));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Event Bookings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Central repository mapped directly by unique parent Event IDs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <PlusCircle size={18} />
          <span>Create New Booking</span>
        </button>
      </div>

      <div className="responsive-grid two-cols-left-heavy">
        
        {/* Left Column: Events List */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Active Parental Event Records</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', minWidth: '220px', flex: '1', maxWidth: '320px' }}>
              <Search size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name or phone…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Result count when filtering */}
          {searchQuery && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {visibleEvents.filter(e =>
                e.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.customer.phone || '').includes(searchQuery)
              ).length} result(s) for "{searchQuery}"
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {visibleEvents.filter(e =>
              !searchQuery ||
              e.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (e.customer.phone || '').includes(searchQuery)
            ).map(e => {
              const venue = venues.find(v => v.id === e.venueId);
              const isSelected = selectedEventId === e.id;
              const totalGuests = e.subFunctions.reduce((sum, sf) => sum + sf.guestCount, 0);

              return (
                <div
                  key={e.id}
                  className="event-card"
                  style={{
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedEventId(e.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{e.id}</span>
                    <span className={`badge ${
                      e.status === 'Completed' ? 'badge-success' : 
                      e.status === 'Confirmed' ? 'badge-info' : 'badge-warning'
                    }`}>{e.status}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{e.customer.name} - {e.eventType}</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>{e.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} />
                        <span>{venue ? venue.name : 'TBD Venue'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={14} />
                        <span>{totalGuests} total Pax</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {searchQuery && events.filter(e =>
              e.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (e.customer.phone || '').includes(searchQuery)
            ).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No events match "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detail Registry */}
        <div>
          {selectedEvent ? (
            <div className="glass-card" style={{ border: '1px solid var(--color-primary)' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Booking File: {selectedEvent.id}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isEditable && !editDraft && (
                    <button className="btn btn-secondary btn-small" onClick={startEdit} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      ✏️ Edit
                    </button>
                  )}
                  {editDraft && (
                    <>
                      <button className="btn btn-secondary btn-small" onClick={() => setEditDraft(null)}>Cancel</button>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={handleSaveEvent}
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </>
                  )}
                  {isEditable && !editDraft && (
                    <button className="btn btn-danger btn-small" onClick={() => {
                      if (confirm(`Delete Event ${selectedEvent.id}?`)) {
                        deleteEvent(selectedEvent.id);
                        setSelectedEventId(null);
                      }
                    }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Info — editable or read-only */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Customer Profile</h3>
                {editDraft ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} />
                    </div>
                    <div className="responsive-grid two-cols" style={{ gap: '0.5rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Phone</label>
                        <input className="form-input" value={editDraft.phone} onChange={e => setEditDraft(d => ({ ...d, phone: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={editDraft.email} onChange={e => setEditDraft(d => ({ ...d, email: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 600 }}>{selectedEvent.customer.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Phone size={14} /> <span>{selectedEvent.customer.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Mail size={14} /> <span>{selectedEvent.customer.email}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Event details — editable or read-only */}
              {editDraft ? (
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Event Details</h3>
                  <div className="responsive-grid two-cols" style={{ gap: '0.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Occasion Type</label>
                      <input list="edit-event-type-opts" className="form-input" value={editDraft.eventType} onChange={e => setEditDraft(d => ({ ...d, eventType: e.target.value }))} />
                      <datalist id="edit-event-type-opts">
                        {['Wedding Reception','Engagement Ceremony','Corporate Dinner','Birthday Party','Anniversary Celebration','Baby Shower','Farewell Party','Conference Lunch'].map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Event Date</label>
                      <input className="form-input" type="date" value={editDraft.date} onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                      <label className="form-label">Venue</label>
                      <input list="edit-venue-opts" className="form-input" value={venues.find(v => v.id === editDraft.venueId)?.name || editDraft.venueId} onChange={e => {
                        const matched = venues.find(v => v.name === e.target.value);
                        setEditDraft(d => ({ ...d, venueId: matched ? matched.id : e.target.value }));
                      }} />
                      <datalist id="edit-venue-opts">
                        {venues.map(v => <option key={v.id} value={v.name} />)}
                      </datalist>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Sub functions list */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Configured Sub-functions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedEvent.subFunctions.map(sf => (
                    <div key={sf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sf.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sf.menuItems.length} Dishes assigned</div>
                      </div>
                      <span className="badge badge-info">{sf.guestCount} Pax</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status adjuster */}
              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Booking Status</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Inquiry', 'Confirmed', 'Completed'].map(status => {
                    const isActive = (editDraft ? editDraft.status : selectedEvent.status) === status;
                    return (
                      <button
                        key={status}
                        onClick={() => editDraft ? setEditDraft(d => ({ ...d, status })) : updateEvent({ ...selectedEvent, status })}
                        className="btn btn-small"
                        style={{
                          flexGrow: 1,
                          background: isActive ? 'var(--primary-grad)' : 'rgba(255,255,255,0.03)',
                          border: isActive ? 'none' : '1px solid var(--border-color)',
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed', textAlign: 'center', padding: '3.5rem', color: 'var(--text-secondary)' }}>
              <Clipboard size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>Select a parent Event ID file from the records list to access customer contact details and sub-functions.</p>
            </div>
          )}
        </div>

      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem' }}>Initiate Booking & Event ID File</h2>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setShowCreateModal(false)}><X size={14} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Client Full Name</label>
                <input className="form-input" placeholder="e.g. Anil Patel" value={clientName} onChange={e => setClientName(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Client Mobile No</label>
                  <input className="form-input" placeholder="+91" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Email Address</label>
                  <input className="form-input" type="email" placeholder="client@domain.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Event Occasion Type</label>
                  <input
                    list="event-type-options"
                    className="form-input"
                    placeholder="Type or select occasion…"
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                  />
                  <datalist id="event-type-options">
                    <option value="Wedding Reception" />
                    <option value="Engagement Ceremony" />
                    <option value="Corporate Dinner" />
                    <option value="Birthday Party" />
                    <option value="Anniversary Celebration" />
                    <option value="Baby Shower" />
                    <option value="Farewell Party" />
                    <option value="Conference Lunch" />
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Execution Venue</label>
                  <input
                    list="venue-options"
                    className="form-input"
                    placeholder="Type or select venue…"
                    value={venues.find(v => v.id === venueId)?.name || ''}
                    onChange={e => {
                      const matched = venues.find(v => v.name === e.target.value);
                      if (matched) setVenueId(matched.id);
                      else setVenueId(e.target.value);
                    }}
                  />
                  <datalist id="venue-options">
                    {venues.map(v => (
                      <option key={v.id} value={v.name}>{v.name} (Max {v.capacity} Pax)</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Execution Date</label>
                  <input className="form-input" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Price per Plate ({companyProfile.currency})</label>
                  <input className="form-input" type="number" value={pricePerPlate} onChange={e => setPricePerPlate(e.target.value)} />
                </div>
              </div>

              {/* Sub-functions builder */}
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Event Sub-functions & Guest Counts</h4>
                  <button type="button" className="btn btn-secondary btn-small" onClick={addSubFunctionRow}>
                    <Plus size={12} /> Add Instance
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {subFunctionsList.map((sf, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        className="form-input"
                        placeholder="e.g. Wedding Lunch"
                        value={sf.name}
                        onChange={e => updateSubFunctionRow(index, 'name', e.target.value)}
                        style={{ flexGrow: 2 }}
                        required
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Headcount"
                        value={sf.guestCount}
                        onChange={e => updateSubFunctionRow(index, 'guestCount', parseInt(e.target.value, 10))}
                        style={{ flexGrow: 1, width: '100px' }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => removeSubFunctionRow(index)}
                        disabled={subFunctionsList.length === 1}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Generate Event File</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default EventBooking;
