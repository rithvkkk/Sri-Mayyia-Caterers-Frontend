import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Users,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Phone,
  DollarSign,
  Briefcase,
  Building2,
  ShieldCheck,
  Search,
  Clock,
  Award
} from 'lucide-react';

const AgencyLabor = () => {
  const {
    currentRole,
    events,
    updateEvent,
    agencies,
    addAgency,
    updateAgency,
    deleteAgency,
    laborRates,
    setLaborRates,
    labourWorkers,
    addLabourWorker,
    updateLabourWorker,
    deleteLabourWorker,
    refreshEventTotals,
    companyProfile
  } = useContext(AppContext);

  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' | 'roster' | 'payouts' | 'agencies'
  
  // Selection states for Event Roster
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedAgencyId, setSelectedAgencyId] = useState(agencies[0]?.id || '');
  const [selectedLaborType, setSelectedLaborType] = useState(laborRates[0]?.type || '');
  const [workerCount, setWorkerCount] = useState('10');
  const [shiftCount, setShiftCount] = useState('1');

  // Search & Filter
  const [searchWorkerTerm, setSearchWorkerTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Worker Modal State
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    role: 'Waiter / Service Staff',
    phone: '',
    dailyRate: 900,
    type: 'Direct',
    agencyId: 'Direct Hire',
    status: 'Active'
  });

  // Agency Modal State
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    contact: '',
    phone: '',
    categories: ['Waiter / Service Staff', 'Captain/Supervisor']
  });

  const currentEvent = events.find(e => e.id === selectedEventId);
  const isOps = currentRole === 'Admin' || currentRole === 'Manager';
  const isFinance = currentRole === 'Accountant';
  const isAgency = currentRole === 'Agency';
  const hasWriteAccess = isOps || isFinance;

  const formatCurrency = (amt) => `${companyProfile.currency} ${Number(amt || 0).toLocaleString('en-IN')}`;

  // Worker Submit
  const handleWorkerSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...workerForm,
      dailyRate: Number(workerForm.dailyRate)
    };

    if (editingWorker) {
      updateLabourWorker({ ...payload, id: editingWorker.id });
    } else {
      addLabourWorker(payload);
    }

    setIsWorkerModalOpen(false);
    setEditingWorker(null);
    setWorkerForm({
      name: '',
      role: 'Waiter / Service Staff',
      phone: '',
      dailyRate: 900,
      type: 'Direct',
      agencyId: 'Direct Hire',
      status: 'Active'
    });
  };

  // Agency Submit
  const handleAgencySubmit = (e) => {
    e.preventDefault();
    if (editingAgency) {
      updateAgency({ ...agencyForm, id: editingAgency.id });
    } else {
      addAgency(agencyForm);
    }
    setIsAgencyModalOpen(false);
    setEditingAgency(null);
    setAgencyForm({
      name: '',
      contact: '',
      phone: '',
      categories: ['Waiter / Service Staff', 'Captain/Supervisor']
    });
  };

  // Event Roster Add
  const handleAddLaborToEvent = (e) => {
    e.preventDefault();
    if (!currentEvent || !selectedAgencyId || !selectedLaborType) return;

    const agencyObj = agencies.find(a => a.id === selectedAgencyId);
    const rateObj = laborRates.find(l => l.type === selectedLaborType);
    if (!agencyObj || !rateObj) return;

    const count = parseInt(workerCount, 10) || 0;
    const shifts = parseInt(shiftCount, 10) || 0;
    const totalPayout = count * shifts * rateObj.rate;

    const newAllocation = {
      agencyId: selectedAgencyId,
      laborType: selectedLaborType,
      count,
      shifts,
      totalPayout,
      status: 'Pending'
    };

    const updatedEvent = {
      ...currentEvent,
      laborAllocations: [...(currentEvent.laborAllocations || []), newAllocation]
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);

    setWorkerCount('10');
    setShiftCount('1');
  };

  const handleRemoveLabor = (index) => {
    if (!hasWriteAccess || !currentEvent) return;
    const updatedAllocations = currentEvent.laborAllocations.filter((_, idx) => idx !== index);
    const updatedEvent = { ...currentEvent, laborAllocations: updatedAllocations };
    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  const handleUpdateStatus = (index, newStatus) => {
    if (!hasWriteAccess || !currentEvent) return;
    const updatedAllocations = currentEvent.laborAllocations.map((alloc, idx) =>
      idx === index ? { ...alloc, status: newStatus } : alloc
    );
    const updatedEvent = { ...currentEvent, laborAllocations: updatedAllocations };
    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  // Filtered Workers
  const filteredWorkers = labourWorkers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchWorkerTerm.toLowerCase()) || w.phone.includes(searchWorkerTerm);
    const matchesRole = roleFilter === 'All' || w.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate Metrics
  const totalStaffCount = labourWorkers.length;
  const activeStaffCount = labourWorkers.filter(w => w.status === 'Active').length;
  
  // Total pending payouts across all events
  const totalPendingPayouts = events.reduce((sum, ev) => {
    const allocs = ev.laborAllocations || [];
    return sum + allocs.filter(a => a.status === 'Pending' || a.status === 'Verified').reduce((s, a) => s + (a.totalPayout || 0), 0);
  }, 0);

  const totalPaidPayouts = events.reduce((sum, ev) => {
    const allocs = ev.laborAllocations || [];
    return sum + allocs.filter(a => a.status === 'Paid').reduce((s, a) => s + (a.totalPayout || 0), 0);
  }, 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Labour Management System</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Directory, Event Shift Roster, Attendance Verification, and Agency Payouts.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeSubTab === 'directory' && hasWriteAccess && (
            <button className="btn btn-primary" onClick={() => { setEditingWorker(null); setIsWorkerModalOpen(true); }}>
              <Plus size={18} />
              <span>Register Worker / Staff</span>
            </button>
          )}
          {activeSubTab === 'agencies' && hasWriteAccess && (
            <button className="btn btn-primary" onClick={() => { setEditingAgency(null); setIsAgencyModalOpen(true); }}>
              <Plus size={18} />
              <span>Add Agency Partner</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpis" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Registered Labour Staff</h3>
            <div className="kpi-value">{totalStaffCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>members</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem', fontWeight: 600 }}>
              ✅ {activeStaffCount} active & available
            </div>
          </div>
          <div className="kpi-icon icon-blue">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Contracting Agencies</h3>
            <div className="kpi-value">{agencies.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>partners</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Verified supply vendors
            </div>
          </div>
          <div className="kpi-icon icon-purple">
            <Building2 size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Pending Shift Payouts</h3>
            <div className="kpi-value">{formatCurrency(totalPendingPayouts)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.25rem', fontWeight: 600 }}>
              ⏳ Awaiting clearance
            </div>
          </div>
          <div className="kpi-icon icon-amber">
            <Clock size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Disbursed Wages (Paid)</h3>
            <div className="kpi-value">{formatCurrency(totalPaidPayouts)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem', fontWeight: 600 }}>
              ✔ Fully settled shifts
            </div>
          </div>
          <div className="kpi-icon icon-green">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`btn ${activeSubTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Users size={18} />
          <span>Worker Directory ({labourWorkers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roster')}
          className={`btn ${activeSubTab === 'roster' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <UserCheck size={18} />
          <span>Event Shift Allocations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payouts')}
          className={`btn ${activeSubTab === 'payouts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <DollarSign size={18} />
          <span>Payouts & Attendance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('agencies')}
          className={`btn ${activeSubTab === 'agencies' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <Building2 size={18} />
          <span>Agency Masters & Rates</span>
        </button>
      </div>

      {/* SUB TAB 1: WORKER DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div>
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
              <Search size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search staff by name or phone..."
                value={searchWorkerTerm}
                onChange={(e) => setSearchWorkerTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="All">All Roles</option>
                <option value="Head Chef">Head Chef</option>
                <option value="Assistant Chef">Assistant Chef</option>
                <option value="Captain/Supervisor">Captain/Supervisor</option>
                <option value="Waiter / Service Staff">Waiter / Service Staff</option>
                <option value="Kitchen Helper">Kitchen Helper</option>
                <option value="Utility Cleaner">Utility Cleaner</option>
              </select>
            </div>
          </div>

          <div className="glass-card">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Worker Name</th>
                    <th>Role / Designation</th>
                    <th>Contact Phone</th>
                    <th>Employment Type</th>
                    <th>Daily Shift Rate</th>
                    <th>Status</th>
                    {hasWriteAccess && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map(w => (
                    <tr key={w.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {w.id}</div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 600 }}>{w.role}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <Phone size={14} className="accent-text" />
                          <span>{w.phone}</span>
                        </div>
                      </td>
                      <td>
                        {w.type === 'Direct' ? (
                          <span className="badge badge-success">Direct Hire</span>
                        ) : (
                          <span className="badge badge-purple">Agency ({agencies.find(a=>a.id===w.agencyId)?.name || 'Partner'})</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(w.dailyRate)} / shift
                      </td>
                      <td>
                        {w.status === 'Active' ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-warning">{w.status}</span>
                        )}
                      </td>
                      {hasWriteAccess && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => { setEditingWorker(w); setWorkerForm(w); setIsWorkerModalOpen(true); }} title="Edit Worker">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-secondary btn-small" onClick={() => deleteLabourWorker(w.id)} style={{ color: 'var(--color-danger)' }} title="Delete Worker">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredWorkers.length === 0 && (
                    <tr>
                      <td colSpan={hasWriteAccess ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No labour staff members found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: EVENT SHIFT ROSTER */}
      {activeSubTab === 'roster' && (
        <div>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Select Active Event for Staff Allocation</h2>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.id} - {e.customer.name} ({e.eventType})</option>
              ))}
            </select>
          </div>

          {currentEvent ? (
            <div className={`responsive-grid ${hasWriteAccess ? 'two-cols-left-heavier' : ''}`}>
              {/* Roster Table */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Allocated Shift Segments for {currentEvent.id}</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Agency / Direct</th>
                        <th>Staffing Role</th>
                        <th>Headcount</th>
                        <th>Shifts</th>
                        <th>Total Wage</th>
                        <th>Audit Status</th>
                        {hasWriteAccess && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(currentEvent.laborAllocations || []).map((alloc, idx) => {
                        const agencyObj = agencies.find(a => a.id === alloc.agencyId);
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{agencyObj ? agencyObj.name : 'Direct / In-House'}</td>
                            <td>{alloc.laborType}</td>
                            <td>{alloc.count} workers</td>
                            <td>{alloc.shifts} shift(s)</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(alloc.totalPayout)}</td>
                            <td>
                              <span className={`badge ${
                                alloc.status === 'Paid' ? 'badge-success' :
                                alloc.status === 'Verified' ? 'badge-info' : 'badge-warning'
                              }`}>{alloc.status}</span>
                            </td>
                            {hasWriteAccess && (
                              <td>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {alloc.status === 'Pending' && (
                                    <button className="btn btn-secondary btn-small" onClick={() => handleUpdateStatus(idx, 'Verified')}>Verify</button>
                                  )}
                                  {alloc.status === 'Verified' && (
                                    <button className="btn btn-primary btn-small" onClick={() => handleUpdateStatus(idx, 'Paid')}>Pay</button>
                                  )}
                                  <button className="btn btn-secondary btn-small" onClick={() => handleRemoveLabor(idx)} style={{ color: 'var(--color-danger)' }}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {(currentEvent.laborAllocations || []).length === 0 && (
                        <tr>
                          <td colSpan={hasWriteAccess ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No staff allocated for this event yet. Use the form to assign workers.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Roster Assignment Form */}
              {hasWriteAccess && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={18} className="accent-text" />
                    <span>Assign Shift Labor</span>
                  </h3>

                  <form onSubmit={handleAddLaborToEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Agency Partner / Supplier</label>
                      <select
                        value={selectedAgencyId}
                        onChange={e => setSelectedAgencyId(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      >
                        {agencies.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Staffing Role / Category</label>
                      <select
                        value={selectedLaborType}
                        onChange={e => setSelectedLaborType(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      >
                        {laborRates.map(l => (
                          <option key={l.id} value={l.type}>{l.type} ({formatCurrency(l.rate)}/shift)</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Headcount (Workers)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={workerCount}
                          onChange={e => setWorkerCount(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Number of Shifts</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={shiftCount}
                          onChange={e => setShiftCount(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                      <Plus size={16} />
                      <span>Add Roster Segment</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No active events found. Please create an event first.
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: PAYOUTS & ATTENDANCE */}
      {activeSubTab === 'payouts' && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Event Shift Attendance & Payout Summary</h2>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Event Ref</th>
                  <th>Client & Date</th>
                  <th>Total Staff Count</th>
                  <th>Pending Wages</th>
                  <th>Verified Wages</th>
                  <th>Paid Wages</th>
                  <th>Total Labor Cost</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const allocs = ev.laborAllocations || [];
                  const headCount = allocs.reduce((s, a) => s + (a.count || 0), 0);
                  const pending = allocs.filter(a => a.status === 'Pending').reduce((s, a) => s + (a.totalPayout || 0), 0);
                  const verified = allocs.filter(a => a.status === 'Verified').reduce((s, a) => s + (a.totalPayout || 0), 0);
                  const paid = allocs.filter(a => a.status === 'Paid').reduce((s, a) => s + (a.totalPayout || 0), 0);
                  const total = allocs.reduce((s, a) => s + (a.totalPayout || 0), 0);

                  return (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{ev.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ev.customer.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ev.date}</div>
                      </td>
                      <td>{headCount} workers</td>
                      <td style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{formatCurrency(pending)}</td>
                      <td style={{ color: 'var(--color-info)', fontWeight: 600 }}>{formatCurrency(verified)}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{formatCurrency(paid)}</td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 4: AGENCIES & RATE CARDS */}
      {activeSubTab === 'agencies' && (
        <div className="responsive-grid two-cols">
          {/* Agency List */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Contracting Agencies</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {agencies.map(a => (
                <div key={a.id} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>{a.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Contact: <strong>{a.contact}</strong> ({a.phone})
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {(a.categories || []).map((cat, i) => (
                        <span key={i} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{cat}</span>
                      ))}
                    </div>
                  </div>
                  {hasWriteAccess && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-small" onClick={() => { setEditingAgency(a); setAgencyForm(a); setIsAgencyModalOpen(true); }}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-secondary btn-small" onClick={() => deleteAgency(a.id)} style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Baseline Rate Cards */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Master Rate Cards</h2>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staffing Role</th>
                    <th>Standard Shift Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {laborRates.map((lr, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{lr.type}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(lr.rate)} / shift</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: WORKER MODAL */}
      {isWorkerModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '500px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingWorker ? 'Edit Worker Profile' : 'Register New Worker'}
            </h2>

            <form onSubmit={handleWorkerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Worker Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshwar Sharma"
                  value={workerForm.name}
                  onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Role / Skill</label>
                  <select
                    value={workerForm.role}
                    onChange={e => setWorkerForm({ ...workerForm, role: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Head Chef">Head Chef</option>
                    <option value="Assistant Chef">Assistant Chef</option>
                    <option value="Captain/Supervisor">Captain/Supervisor</option>
                    <option value="Waiter / Service Staff">Waiter / Service Staff</option>
                    <option value="Kitchen Helper">Kitchen Helper</option>
                    <option value="Utility Cleaner">Utility Cleaner</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={workerForm.phone}
                    onChange={e => setWorkerForm({ ...workerForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Employment Type</label>
                  <select
                    value={workerForm.type}
                    onChange={e => setWorkerForm({ ...workerForm, type: e.target.value, agencyId: e.target.value === 'Direct' ? 'Direct Hire' : agencies[0]?.id })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Direct">Direct Permanent</option>
                    <option value="Agency">Agency Contract</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Daily Rate (₹/shift)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={workerForm.dailyRate}
                    onChange={e => setWorkerForm({ ...workerForm, dailyRate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {workerForm.type === 'Agency' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Agency Partner</label>
                  <select
                    value={workerForm.agencyId}
                    onChange={e => setWorkerForm({ ...workerForm, agencyId: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    {agencies.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsWorkerModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingWorker ? 'Update Worker' : 'Save Worker'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AGENCY MODAL */}
      {isAgencyModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '500px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {editingAgency ? 'Edit Agency Partner' : 'Add Agency Partner'}
            </h2>

            <form onSubmit={handleAgencySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Agency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Hospitality Services"
                  value={agencyForm.name}
                  onChange={e => setAgencyForm({ ...agencyForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Harsh Vyas"
                    value={agencyForm.contact}
                    onChange={e => setAgencyForm({ ...agencyForm, contact: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98111 22233"
                    value={agencyForm.phone}
                    onChange={e => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAgencyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAgency ? 'Update Agency' : 'Save Agency'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyLabor;
