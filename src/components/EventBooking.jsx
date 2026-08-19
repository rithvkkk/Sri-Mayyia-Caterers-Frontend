import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Calendar, Phone, Mail, MapPin, Users, Plus, PlusCircle, Trash2,
  ShieldAlert, CheckCircle, Clipboard, Search, Save, ArrowUpDown,
  Filter, Bell, Clock, AlertCircle, Check, CalendarDays, Edit2, X as LucideX
} from 'lucide-react';

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

  // Modal & Selection States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDraft, setEditDraft] = useState(null); // null = view mode
  const [saving, setSaving] = useState(false);

  // Sorting & Filtering States
  const [dateSort, setDateSort] = useState('asc'); // 'asc' (earliest/upcoming), 'desc' (furthest/latest), 'none'
  const [statusSort, setStatusSort] = useState('none'); // 'none', 'inquiry-first', 'confirmed-first', 'completed-first'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Inquiry', 'Confirmed', 'Completed'

  // Form states for creation
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [venueId, setVenueId] = useState('');
  const [primaryDate, setPrimaryDate] = useState('');
  const [additionalDates, setAdditionalDates] = useState([]);
  const [newDateInput, setNewDateInput] = useState('');
  const [pricePerPlate, setPricePerPlate] = useState('');
  
  // Subfunctions builder in form
  const [subFunctionsList, setSubFunctionsList] = useState([
    { name: '', date: '', guestCount: '', menuItems: [], clientNotes: '' }
  ]);

  // Reminder form states (for active event)
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('10:00');
  const [reminderPriority, setReminderPriority] = useState('High'); // High, Medium, Low
  const [showReminderForm, setShowReminderForm] = useState(false);

  const isSalesExec = currentRole === 'Sales Executive' || currentRole === 'Sales';
  const isEditable = currentRole === 'Admin' || currentRole === 'HR' || currentRole === 'HR Manager' || currentRole === 'Manager' || isSalesExec;

  // Filter visible events for Sales Executives so they only see sales assigned/created by them
  const baseVisibleEvents = isSalesExec
    ? events.filter(e => e.createdBy === currentUser || e.createdByName === currentUser || e.salesExecutive === currentUser)
    : events;

  // Apply Search, Status Filtering, and Multi-criteria Sorting
  const processedEvents = [...baseVisibleEvents]
    // 1. Search Query Filter
    .filter(e => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (e.customer?.name || '').toLowerCase().includes(q) ||
        (e.customer?.phone || '').includes(q) ||
        (e.id || '').toLowerCase().includes(q) ||
        (e.eventType || '').toLowerCase().includes(q)
      );
    })
    // 2. Status Pill Filter
    .filter(e => {
      if (statusFilter === 'all') return true;
      return e.status === statusFilter;
    })
    // 3. Sorting (Date + Status)
    .sort((a, b) => {
      // Primary Sort: Status Priority if active
      if (statusSort === 'inquiry-first') {
        const priority = { 'Inquiry': 1, 'Confirmed': 2, 'Completed': 3, 'Cancelled': 4 };
        const diff = (priority[a.status] || 99) - (priority[b.status] || 99);
        if (diff !== 0) return diff;
      } else if (statusSort === 'confirmed-first') {
        const priority = { 'Confirmed': 1, 'Inquiry': 2, 'Completed': 3, 'Cancelled': 4 };
        const diff = (priority[a.status] || 99) - (priority[b.status] || 99);
        if (diff !== 0) return diff;
      } else if (statusSort === 'completed-first') {
        const priority = { 'Completed': 1, 'Confirmed': 2, 'Inquiry': 3, 'Cancelled': 4 };
        const diff = (priority[a.status] || 99) - (priority[b.status] || 99);
        if (diff !== 0) return diff;
      }

      // Secondary/Standard Sort: Date
      const dateA = new Date(a.date || (a.dates && a.dates[0]) || '1970-01-01').getTime();
      const dateB = new Date(b.date || (b.dates && b.dates[0]) || '1970-01-01').getTime();

      if (dateSort === 'asc') {
        return dateA - dateB; // Earliest first
      } else if (dateSort === 'desc') {
        return dateB - dateA; // Furthest/Newest first
      }
      return 0;
    });

  const selectedEvent = processedEvents.find(e => e.id === selectedEventId) || processedEvents[0] || events[0];

  // When selected event changes, exit edit mode and close reminder form
  React.useEffect(() => {
    setEditDraft(null);
    setShowReminderForm(false);
  }, [selectedEventId]);

  // Edit Mode Initializer
  const startEdit = () => {
    if (!selectedEvent) return;
    const allDates = selectedEvent.dates && selectedEvent.dates.length > 0
      ? selectedEvent.dates
      : [selectedEvent.date || ''];

    setEditDraft({
      name: selectedEvent.customer.name,
      phone: selectedEvent.customer.phone || '',
      email: selectedEvent.customer.email || '',
      eventType: selectedEvent.eventType || '',
      venueId: selectedEvent.venueId || '',
      date: selectedEvent.date || allDates[0] || '',
      dates: allDates,
      newDateToAdd: '',
      status: selectedEvent.status || 'Inquiry'
    });
  };

  const handleSaveEvent = async () => {
    if (!editDraft || !selectedEvent) return;
    setSaving(true);
    const cleanedDates = (editDraft.dates || []).filter(Boolean);
    const finalDate = editDraft.date || cleanedDates[0] || selectedEvent.date;

    const updated = {
      ...selectedEvent,
      customer: { ...selectedEvent.customer, name: editDraft.name, phone: editDraft.phone, email: editDraft.email },
      eventType: editDraft.eventType,
      venueId: editDraft.venueId,
      date: finalDate,
      dates: cleanedDates.length > 0 ? cleanedDates : [finalDate],
      status: editDraft.status
    };
    await updateEvent(updated);
    setSaving(false);
    setEditDraft(null);
  };

  // Date handlers in Create Modal
  const handleAddDateToCreation = () => {
    if (!newDateInput) return;
    if (!additionalDates.includes(newDateInput) && newDateInput !== primaryDate) {
      setAdditionalDates([...additionalDates, newDateInput].sort());
    }
    setNewDateInput('');
  };

  const handleRemoveAdditionalDate = (dateToRemove) => {
    setAdditionalDates(additionalDates.filter(d => d !== dateToRemove));
  };

  // Date handlers in Edit Draft
  const handleAddDateToEditDraft = () => {
    if (!editDraft.newDateToAdd) return;
    if (!editDraft.dates.includes(editDraft.newDateToAdd)) {
      setEditDraft({
        ...editDraft,
        dates: [...editDraft.dates, editDraft.newDateToAdd].sort(),
        newDateToAdd: ''
      });
    } else {
      setEditDraft({ ...editDraft, newDateToAdd: '' });
    }
  };

  const handleRemoveDateFromEditDraft = (dateToRemove) => {
    if (editDraft.dates.length <= 1) {
      alert('At least one event date is required.');
      return;
    }
    const filtered = editDraft.dates.filter(d => d !== dateToRemove);
    setEditDraft({
      ...editDraft,
      dates: filtered,
      date: editDraft.date === dateToRemove ? filtered[0] : editDraft.date
    });
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !primaryDate) {
      alert('Client Name and at least one Event Date are required!');
      return;
    }

    const allDates = Array.from(new Set([primaryDate, ...additionalDates])).filter(Boolean).sort();

    const payload = {
      customer: { name: clientName, phone: clientPhone, email: clientEmail },
      eventType,
      venueId,
      date: primaryDate,
      dates: allDates,
      pricePerPlate: parseFloat(pricePerPlate) || 800,
      reminders: [],
      subFunctions: subFunctionsList.map((sf, idx) => ({
        id: `sf-${Date.now()}-${idx}`,
        name: sf.name,
        date: sf.date || primaryDate,
        guestCount: parseInt(sf.guestCount, 10) || 100,
        menuItems: [],
        clientNotes: sf.clientNotes || ''
      }))
    };

    const newId = await createEvent(payload);
    alert(`Event Created Successfully! Generated Event ID: ${newId}`);
    
    // Reset form
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setEventType('');
    setVenueId('');
    setPrimaryDate('');
    setAdditionalDates([]);
    setNewDateInput('');
    setPricePerPlate('');
    setSubFunctionsList([{ name: '', date: '', guestCount: '', menuItems: [], clientNotes: '' }]);
    setShowCreateModal(false);
    setSelectedEventId(newId);
  };

  const addSubFunctionRow = () => {
    setSubFunctionsList([...subFunctionsList, { name: '', date: primaryDate || '', guestCount: '', menuItems: [], clientNotes: '' }]);
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

  // Reminder Actions for Selected Event
  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !reminderNote || !reminderDate) {
      alert('Reminder note and date are required!');
      return;
    }

    const newReminder = {
      id: `rem-${Date.now()}`,
      date: reminderDate,
      time: reminderTime || '10:00',
      note: reminderNote,
      priority: reminderPriority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updatedEvent = {
      ...selectedEvent,
      reminders: [...(selectedEvent.reminders || []), newReminder]
    };

    await updateEvent(updatedEvent);
    setReminderNote('');
    setReminderDate('');
    setShowReminderForm(false);
  };

  const handleToggleReminderStatus = async (reminderId) => {
    if (!selectedEvent) return;
    const updatedReminders = (selectedEvent.reminders || []).map(rem =>
      rem.id === reminderId ? { ...rem, completed: !rem.completed } : rem
    );
    await updateEvent({ ...selectedEvent, reminders: updatedReminders });
  };

  const handleSnoozeReminder = async (reminderId, days = 2) => {
    if (!selectedEvent) return;
    const updatedReminders = (selectedEvent.reminders || []).map(rem => {
      if (rem.id === reminderId) {
        const currentDate = new Date(rem.date);
        currentDate.setDate(currentDate.getDate() + days);
        const snoozedDate = currentDate.toISOString().split('T')[0];
        return { ...rem, date: snoozedDate, completed: false };
      }
      return rem;
    });
    await updateEvent({ ...selectedEvent, reminders: updatedReminders });
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!selectedEvent) return;
    const updatedReminders = (selectedEvent.reminders || []).filter(rem => rem.id !== reminderId);
    await updateEvent({ ...selectedEvent, reminders: updatedReminders });
  };

  const handleQuickPresetDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setReminderDate(d.toISOString().split('T')[0]);
  };

  // Count pending inquiry reminders across visible events for top notification
  const totalPendingInquiryReminders = baseVisibleEvents
    .filter(e => e.status === 'Inquiry')
    .reduce((count, e) => count + (e.reminders || []).filter(r => !r.completed).length, 0);

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Event Bookings & Master Files</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Multi-date scheduling, chronological and status sorting, and enquired order reminder tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {totalPendingInquiryReminders > 0 && (
            <div className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}>
              <Bell size={14} className="pulse-animation" />
              <span><strong>{totalPendingInquiryReminders}</strong> Inquiry Follow-up{totalPendingInquiryReminders > 1 ? 's' : ''} Pending</span>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <PlusCircle size={18} />
            <span>Create New Booking</span>
          </button>
        </div>
      </div>

      {/* Sorting & Filter Control Toolbar */}
      <div className="glass-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Filter size={14} /> Filter Status:
          </span>
          {['all', 'Inquiry', 'Confirmed', 'Completed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn btn-small"
              style={{
                background: statusFilter === st ? 'var(--primary-grad)' : 'rgba(255,255,255,0.04)',
                border: statusFilter === st ? 'none' : '1px solid var(--border-color)',
                color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                padding: '0.3rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {st === 'all' ? 'All Bookings' : st}
              <span style={{ marginLeft: '0.35rem', opacity: 0.8, fontSize: '0.72rem' }}>
                ({st === 'all' ? baseVisibleEvents.length : baseVisibleEvents.filter(e => e.status === st).length})
              </span>
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CalendarDays size={14} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sort Date:</span>
            <select
              className="form-select"
              value={dateSort}
              onChange={e => setDateSort(e.target.value)}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minWidth: '150px', background: 'var(--bg-card)' }}
            >
              <option value="asc">Earliest / Upcoming</option>
              <option value="desc">Furthest / Newest</option>
              <option value="none">Default Order</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sort Status:</span>
            <select
              className="form-select"
              value={statusSort}
              onChange={e => setStatusSort(e.target.value)}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minWidth: '150px', background: 'var(--bg-card)' }}
            >
              <option value="none">Standard Sequence</option>
              <option value="inquiry-first">Inquiry First (Follow-ups)</option>
              <option value="confirmed-first">Confirmed First (Operations)</option>
              <option value="completed-first">Completed First</option>
            </select>
          </div>
        </div>

      </div>

      <div className="responsive-grid two-cols-left-heavy">
        
        {/* Left Column: Events List */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
              Parental Event Records ({processedEvents.length})
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', minWidth: '220px', flex: '1', maxWidth: '300px' }}>
              <Search size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search name, phone, ID…"
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '720px', overflowY: 'auto' }}>
            {processedEvents.map(e => {
              const venue = venues.find(v => v.id === e.venueId);
              const isSelected = selectedEvent?.id === e.id;
              const totalGuests = (e.subFunctions || []).reduce((sum, sf) => sum + (parseInt(sf.guestCount, 10) || 0), 0);
              const eventDatesList = e.dates && e.dates.length > 0 ? e.dates : [e.date];
              const pendingReminders = (e.reminders || []).filter(r => !r.completed);

              return (
                <div
                  key={e.id}
                  className="event-card"
                  style={{
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.06)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: '1rem',
                    borderRadius: '10px'
                  }}
                  onClick={() => setSelectedEventId(e.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)' }}>{e.id}</span>
                      {pendingReminders.length > 0 && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Bell size={10} /> {pendingReminders.length} reminder{pendingReminders.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className={`badge ${
                      e.status === 'Completed' ? 'badge-success' : 
                      e.status === 'Confirmed' ? 'badge-info' : 'badge-warning'
                    }`}>{e.status}</span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      {e.customer?.name} - <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{e.eventType}</span>
                    </h3>

                    {/* Multi-Date Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      {eventDatesList.map((dt, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            color: '#93c5fd',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px'
                          }}
                        >
                          <Calendar size={11} />
                          <span>{dt}</span>
                        </span>
                      ))}
                      {eventDatesList.length > 1 && (
                        <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '0.15rem 0.35rem' }}>
                          {eventDatesList.length} Days Multi-Date
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={13} />
                        <span>{venue ? venue.name : 'TBD Venue'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={13} />
                        <span>{totalGuests} Total Pax</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {processedEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No events match your current filter or search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Detail Registry & Follow-up Engine */}
        <div>
          {selectedEvent ? (
            <div className="glass-card" style={{ border: '1px solid var(--color-primary)' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Booking File: {selectedEvent.id}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Occasion: <strong>{selectedEvent.eventType}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isEditable && !editDraft && (
                    <button className="btn btn-secondary btn-small" onClick={startEdit} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Edit2 size={13} />
                      <span>Edit</span>
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

              {/* Customer Profile */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Customer Profile
                </h3>
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
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedEvent.customer?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Phone size={14} /> <span>{selectedEvent.customer?.phone || 'No phone recorded'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Mail size={14} /> <span>{selectedEvent.customer?.email || 'No email recorded'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Date Schedule & Venue — View or Edit */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Event Execution Dates & Venue
                  </h3>
                  {editDraft && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Multi-date editor</span>
                  )}
                </div>

                {editDraft ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Occasion Type</label>
                      <input list="edit-event-type-opts" className="form-input" value={editDraft.eventType} onChange={e => setEditDraft(d => ({ ...d, eventType: e.target.value }))} />
                      <datalist id="edit-event-type-opts">
                        {['Wedding Reception','Engagement Ceremony','Corporate Dinner','Birthday Party','Anniversary Celebration','Baby Shower','Farewell Party','Conference Lunch'].map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Venue</label>
                      <input list="edit-venue-opts" className="form-input" value={venues.find(v => v.id === editDraft.venueId)?.name || editDraft.venueId} onChange={e => {
                        const matched = venues.find(v => v.name === e.target.value);
                        setEditDraft(d => ({ ...d, venueId: matched ? matched.id : e.target.value }));
                      }} />
                      <datalist id="edit-venue-opts">
                        {venues.map(v => <option key={v.id} value={v.name} />)}
                      </datalist>
                    </div>

                    {/* Multi-Date Manager in Edit Mode */}
                    <div style={{ border: '1px dashed var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                      <label className="form-label" style={{ marginBottom: '0.4rem' }}>Scheduled Event Dates:</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                        {(editDraft.dates || []).map((dt, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid var(--color-primary)',
                              color: '#fff',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <Calendar size={12} />
                            <span>{dt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDateFromEditDraft(dt)}
                              style={{ background: 'none', border: 'none', color: '#ff8888', cursor: 'pointer', padding: 0, display: 'flex' }}
                            >
                              <LucideX size={13} />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="date"
                          className="form-input"
                          value={editDraft.newDateToAdd || ''}
                          onChange={e => setEditDraft({ ...editDraft, newDateToAdd: e.target.value })}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={handleAddDateToEditDraft}
                          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Plus size={13} /> Add Date
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                      {(selectedEvent.dates && selectedEvent.dates.length > 0 ? selectedEvent.dates : [selectedEvent.date]).map((dt, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.85rem',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#93c5fd',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}
                        >
                          <Calendar size={13} />
                          <span>Day {idx + 1}: {dt}</span>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={14} />
                      <span>{venues.find(v => v.id === selectedEvent.venueId)?.name || 'Venue to be finalized'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-functions */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Configured Sub-functions ({selectedEvent.subFunctions?.length || 0})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(selectedEvent.subFunctions || []).map(sf => (
                    <div key={sf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sf.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                          <span>{sf.date || selectedEvent.date}</span>
                          <span>{(sf.menuItems || []).length} Dishes</span>
                          {sf.clientNotes && <span style={{ color: '#fcd34d' }}>Special Instructions</span>}
                        </div>
                      </div>
                      <span className="badge badge-info">{sf.guestCount} Pax</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminders & Follow-up Section (Enquiry and Booking Reminders) */}
              <div style={{ padding: '1rem', background: selectedEvent.status === 'Inquiry' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)', border: selectedEvent.status === 'Inquiry' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bell size={16} style={{ color: selectedEvent.status === 'Inquiry' ? 'var(--color-warning)' : 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>
                      Follow-up Reminders {selectedEvent.status === 'Inquiry' && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginLeft: '0.3rem' }}>Enquiry Follow-up</span>}
                    </h3>
                  </div>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setShowReminderForm(!showReminderForm)}
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={13} /> {showReminderForm ? 'Cancel Reminder' : 'Add Reminder'}
                  </button>
                </div>

                {/* Reminder Add Form */}
                {showReminderForm && (
                  <form onSubmit={handleAddReminder} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px', marginBottom: '0.85rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Reminder Task / Follow-up Action</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Call client for menu confirmation & 20% token deposit"
                        value={reminderNote}
                        onChange={e => setReminderNote(e.target.value)}
                        required
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="responsive-grid three-cols" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Reminder Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={reminderDate}
                          onChange={e => setReminderDate(e.target.value)}
                          required
                          style={{ fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Time</label>
                        <input
                          type="time"
                          className="form-input"
                          value={reminderTime}
                          onChange={e => setReminderTime(e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Priority</label>
                        <select
                          className="form-select"
                          value={reminderPriority}
                          onChange={e => setReminderPriority(e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Quick Presets:</span>
                      <button type="button" className="btn btn-secondary btn-small" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }} onClick={() => handleQuickPresetDate(1)}>+ Tomorrow</button>
                      <button type="button" className="btn btn-secondary btn-small" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }} onClick={() => handleQuickPresetDate(3)}>+ 3 Days</button>
                      <button type="button" className="btn btn-secondary btn-small" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }} onClick={() => handleQuickPresetDate(7)}>+ 1 Week</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => setShowReminderForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary btn-small">Save Reminder</button>
                    </div>
                  </form>
                )}

                {/* Reminders List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(selectedEvent.reminders || []).length > 0 ? (
                    selectedEvent.reminders.map(rem => (
                      <div
                        key={rem.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          background: rem.completed ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.03)',
                          border: rem.completed ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--border-color)',
                          borderRadius: '6px',
                          opacity: rem.completed ? 0.65 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleReminderStatus(rem.id)}
                            style={{
                              background: rem.completed ? 'var(--color-success)' : 'transparent',
                              border: rem.completed ? 'none' : '1px solid var(--border-color)',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              color: '#fff'
                            }}
                          >
                            {rem.completed && <Check size={12} />}
                          </button>
                          <div>
                            <div style={{ fontSize: '0.85rem', textDecoration: rem.completed ? 'line-through' : 'none', fontWeight: rem.completed ? 400 : 600 }}>
                              {rem.note}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span>{rem.date} at {rem.time || '10:00'}</span>
                              <span style={{
                                color: rem.priority === 'High' ? '#ef4444' : rem.priority === 'Medium' ? '#f59e0b' : '#10b981',
                                fontWeight: 600
                              }}>
                                {rem.priority} Priority
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {!rem.completed && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() => handleSnoozeReminder(rem.id, 2)}
                              title="Snooze 2 Days"
                              style={{ fontSize: '0.68rem', padding: '0.15rem 0.35rem' }}
                            >
                              +2d Snooze
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteReminder(rem.id)}
                            style={{ padding: '0.15rem 0.35rem' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.3rem 0' }}>
                      No follow-up reminders scheduled for this booking file.
                    </div>
                  )}
                </div>
              </div>

              {/* Status Adjuster */}
              <div>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Booking Lifecycle Status
                </h3>
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
                          cursor: 'pointer',
                          padding: '0.45rem',
                          fontWeight: 600
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
              <p>Select a parent Event ID file from the records list to access customer contact details, multi-dates, and follow-up reminders.</p>
            </div>
          )}
        </div>

      </div>

      {/* Creation Modal with Multi-Date Support */}
      {showCreateModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem' }}>Initiate Booking & Event ID File</h2>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setShowCreateModal(false)}><X size={14} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '68vh', overflowY: 'auto' }}>
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

              {/* Multi-Date Selector Box */}
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CalendarDays size={16} className="accent-text" />
                  Event Execution Dates (Primary & Multi-Date Support)
                </label>

                <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Primary / Commencement Date</label>
                    <input className="form-input" type="date" value={primaryDate} onChange={e => setPrimaryDate(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Billing Price per Plate ({companyProfile.currency})</label>
                    <input className="form-input" type="number" placeholder="800" value={pricePerPlate} onChange={e => setPricePerPlate(e.target.value)} />
                  </div>
                </div>

                {/* Additional Dates Chips & Adder */}
                <div style={{ marginTop: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Additional Execution Dates:</span>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem', marginBottom: '0.5rem' }}>
                    {additionalDates.map((dt, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid var(--color-primary)',
                          color: '#fff',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <Calendar size={11} />
                        <span>{dt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalDate(dt)}
                          style={{ background: 'none', border: 'none', color: '#ff8888', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          <LucideX size={12} />
                        </button>
                      </span>
                    ))}
                    {additionalDates.length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No additional dates added (single-day event)</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={newDateInput}
                      onChange={e => setNewDateInput(e.target.value)}
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', maxWidth: '200px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={handleAddDateToCreation}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Plus size={12} /> + Add Another Date
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-functions builder */}
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Event Sub-functions & Headcounts</h4>
                  <button type="button" className="btn btn-secondary btn-small" onClick={addSubFunctionRow}>
                    <Plus size={12} /> Add Sub-function
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {subFunctionsList.map((sf, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        className="form-input"
                        placeholder="e.g. Wedding Lunch"
                        value={sf.name}
                        onChange={e => updateSubFunctionRow(index, 'name', e.target.value)}
                        style={{ flexGrow: 2, fontSize: '0.82rem' }}
                        required
                      />
                      <input
                        type="date"
                        className="form-input"
                        value={sf.date || primaryDate}
                        onChange={e => updateSubFunctionRow(index, 'date', e.target.value)}
                        style={{ width: '135px', fontSize: '0.82rem' }}
                        title="Subfunction execution date"
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Pax"
                        value={sf.guestCount}
                        onChange={e => updateSubFunctionRow(index, 'guestCount', parseInt(e.target.value, 10))}
                        style={{ width: '80px', fontSize: '0.82rem' }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => removeSubFunctionRow(index)}
                        disabled={subFunctionsList.length === 1}
                        style={{ padding: '0.35rem' }}
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
              <button type="submit" className="btn btn-primary">Generate Event Master File</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default EventBooking;

