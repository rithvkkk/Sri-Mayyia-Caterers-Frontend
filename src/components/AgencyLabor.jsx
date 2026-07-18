import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Users, UserCheck, ShieldAlert, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const AgencyLabor = () => {
  const {
    currentRole,
    events,
    updateEvent,
    agencies,
    laborRates,
    refreshEventTotals,
    companyProfile
  } = useContext(AppContext);

  // States
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedAgencyId, setSelectedAgencyId] = useState(agencies[0]?.id || '');
  const [selectedLaborType, setSelectedLaborType] = useState(laborRates[0]?.type || '');
  const [workerCount, setWorkerCount] = useState('10');
  const [shiftCount, setShiftCount] = useState('1');

  // Agency login simulation
  // Since we have a general "Agency" role, we can allow them to select which Agency they represent (e.g. Royal Hospitality Services)
  const [activeAgencySimulationId, setActiveAgencySimulationId] = useState('a1');

  const currentEvent = events.find(e => e.id === selectedEventId);

  const isOps = currentRole === 'Admin' || currentRole === 'Manager';
  const isFinance = currentRole === 'Accountant';
  const isAgency = currentRole === 'Agency';

  const hasWriteAccess = isOps || isFinance;

  // Add a labor allocation row to current event
  const handleAddLabor = (e) => {
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
      status: 'Pending' // Pending, Verified, Paid
    };

    const updatedEvent = {
      ...currentEvent,
      laborAllocations: [...(currentEvent.laborAllocations || []), newAllocation]
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);

    // Reset inputs
    setWorkerCount('10');
    setShiftCount('1');
    alert('Labor allocation added to event successfully!');
  };

  // Remove labor allocation
  const handleRemoveLabor = (index) => {
    if (!hasWriteAccess || !currentEvent) return;

    const updatedAllocations = currentEvent.laborAllocations.filter((_, idx) => idx !== index);
    const updatedEvent = {
      ...currentEvent,
      laborAllocations: updatedAllocations
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  // Verify/Approve payout status
  const handleUpdateStatus = (index, newStatus) => {
    if (!hasWriteAccess || !currentEvent) return;

    const updatedAllocations = currentEvent.laborAllocations.map((alloc, idx) => 
      idx === index ? { ...alloc, status: newStatus } : alloc
    );

    const updatedEvent = {
      ...currentEvent,
      laborAllocations: updatedAllocations
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  // Agency perimeter view: filter allocations
  const getVisibleAllocations = () => {
    if (!currentEvent) return [];
    if (isAgency) {
      // Find the agency represented by simulation state
      const simulatedAgency = agencies.find(a => a.id === activeAgencySimulationId);
      if (!simulatedAgency) return [];
      return (currentEvent.laborAllocations || [])
        .map((alloc, idx) => ({ ...alloc, originalIndex: idx }))
        .filter(alloc => alloc.agencyId === simulatedAgency.id);
    }
    return (currentEvent.laborAllocations || []).map((alloc, idx) => ({ ...alloc, originalIndex: idx }));
  };

  const visibleAllocations = getVisibleAllocations();
  const totalLaborCost = visibleAllocations.reduce((sum, item) => sum + (item.status === 'Cancelled' ? 0 : item.totalPayout), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Agency & Labor Coordination</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Allocate field labor, manage contracting agencies, and audit shift payouts.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAgency && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select className="form-select" value={activeAgencySimulationId} onChange={e => setActiveAgencySimulationId(e.target.value)}>
                {agencies.map(a => (
                  <option key={a.id} value={a.id}>Acting Agency: {a.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {currentEvent && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.id} - {e.customer.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {currentEvent ? (
        <div className={`responsive-grid ${hasWriteAccess ? 'two-cols-left-heavier' : ''}`}>
          
          {/* Main Roster Panel */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              {isAgency ? 'Vendor Allocated Shifts' : 'Staffing Roster Matrix'}
            </h2>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Agency Partner</th>
                    <th>Staffing Role</th>
                    <th>Headcount</th>
                    <th>Shifts</th>
                    <th>Est. Payout</th>
                    <th>Audit Status</th>
                    {hasWriteAccess && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleAllocations.map((alloc, idx) => {
                    const agencyObj = agencies.find(a => a.id === alloc.agencyId);
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{agencyObj ? agencyObj.name : 'Unknown Agency'}</td>
                        <td>{alloc.laborType}</td>
                        <td>{alloc.count} workers</td>
                        <td>{alloc.shifts} shift(s)</td>
                        <td style={{ fontWeight: 600 }}>{companyProfile.currency} {alloc.totalPayout.toLocaleString('en-IN')}</td>
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
                                <button className="btn btn-secondary btn-small" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleUpdateStatus(alloc.originalIndex, 'Verified')}>
                                  Verify
                                </button>
                              )}
                              {alloc.status === 'Verified' && (
                                <button className="btn btn-primary btn-small" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleUpdateStatus(alloc.originalIndex, 'Paid')}>
                                  Pay
                                </button>
                              )}
                              <button className="btn btn-danger btn-small" style={{ padding: '0.25rem' }} onClick={() => handleRemoveLabor(alloc.originalIndex)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {visibleAllocations.length === 0 && (
                    <tr>
                      <td colSpan={hasWriteAccess ? 7 : 6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No staffing allocations recorded for this event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {isAgency ? 'Represented Agency Total Payout:' : 'Aggregated Labor Expenses:'}
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                {companyProfile.currency} {totalLaborCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Allocation input form (For Admin, Manager, and Accountant) */}
          {hasWriteAccess && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} className="accent-text" />
                <span>Roster Shift Staff</span>
              </h3>
              
              <form onSubmit={handleAddLabor}>
                <div className="form-group">
                  <label className="form-label">Agency Partner</label>
                  <select className="form-select" value={selectedAgencyId} onChange={e => setSelectedAgencyId(e.target.value)}>
                    {agencies.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Staffing Role</label>
                  <select className="form-select" value={selectedLaborType} onChange={e => setSelectedLaborType(e.target.value)}>
                    {laborRates.map(l => (
                      <option key={l.id} value={l.type}>{l.type} ({companyProfile.currency} {l.rate}/shift)</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Staff Count</label>
                    <input className="form-input" type="number" min="1" value={workerCount} onChange={e => setWorkerCount(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shifts</label>
                    <input className="form-input" type="number" min="1" value={shiftCount} onChange={e => setShiftCount(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <Plus size={16} />
                  <span>Roster Staff Segment</span>
                </button>
              </form>
            </div>
          )}

        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p>Please configure an active booking to view the labor coordination matrices.</p>
        </div>
      )}

    </div>
  );
};

export default AgencyLabor;
