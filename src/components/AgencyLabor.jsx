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
  IndianRupee,
  Briefcase,
  Building2,
  ShieldCheck,
  Search,
  Clock,
  Award,
  Calendar,
  CalendarDays,
  Check,
  X as LucideX,
  Filter,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle
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
    labourAttendance,
    addLabourAttendance,
    updateLabourAttendance,
    deleteLabourAttendance,
    batchAddLabourAttendance,
    refreshEventTotals,
    companyProfile
  } = useContext(AppContext);

  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' | 'attendance' | 'roster' | 'payouts' | 'agencies'
  
  // Selection states for Event Roster
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedAgencyId, setSelectedAgencyId] = useState(agencies[0]?.id || '');
  const [selectedLaborType, setSelectedLaborType] = useState(laborRates[0]?.type || '');
  const [workerCount, setWorkerCount] = useState('10');
  const [shiftCount, setShiftCount] = useState('1');

  // Search & Filter
  const [searchWorkerTerm, setSearchWorkerTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Attendance Filters & Form
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [attendanceWorkerFilter, setAttendanceWorkerFilter] = useState('All');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    workerId: labourWorkers[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    eventId: events[0]?.id || '',
    shiftType: 'Full Day',
    shifts: 1,
    dailyRate: 900,
    status: 'Present',
    notes: ''
  });

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

  // Bulk Attendance Upload State
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [parsedBulkRows, setParsedBulkRows] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const currentEvent = events.find(e => e.id === selectedEventId);
  const roleLower = (currentRole || 'admin').toLowerCase();
  const isOps = !currentRole || roleLower === 'admin' || roleLower === 'hr' || roleLower === 'hr manager' || roleLower === 'manager' || roleLower.includes('admin') || roleLower.includes('manag');
  const isFinance = roleLower === 'accountant' || roleLower === 'accounts manager' || roleLower.includes('account');
  const isAgency = roleLower === 'agency';
  const hasWriteAccess = isOps || isFinance;

  const parseBulkAttendanceCsv = (rawText) => {
    if (!rawText.trim()) {
      setParsedBulkRows([]);
      return;
    }

    const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedBulkRows([]);
      return;
    }

    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('date') || firstLine.includes('worker') || firstLine.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows = dataLines.map((line, lineIdx) => {
      const delimiter = line.includes('\t') ? '\t' : ',';
      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

      const dateStr = cols[0] || '';
      const workerName = cols[1] || '';
      const roleStr = cols[2] || '';
      const shiftsStr = cols[3] || '1';
      const rateStr = cols[4] || '';
      const statusStr = cols[5] || 'Present';
      const notes = cols[6] || '';

      const errors = [];

      let formattedDate = dateStr;
      if (!dateStr) {
        errors.push('Date is missing');
      } else {
        const dMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        const dMatchSlash = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (dMatch) {
          formattedDate = `${dMatch[1]}-${dMatch[2].padStart(2, '0')}-${dMatch[3].padStart(2, '0')}`;
        } else if (dMatchSlash) {
          formattedDate = `${dMatchSlash[3]}-${dMatchSlash[2].padStart(2, '0')}-${dMatchSlash[1].padStart(2, '0')}`;
        } else {
          errors.push('Invalid Date format (use YYYY-MM-DD or DD/MM/YYYY)');
        }
      }

      if (!workerName) {
        errors.push('Worker Name is missing');
      }

      let matchedWorker = labourWorkers.find(w => w.name.toLowerCase() === workerName.toLowerCase());
      if (!matchedWorker && workerName) {
        matchedWorker = labourWorkers.find(w => w.name.toLowerCase().includes(workerName.toLowerCase()));
      }

      const shifts = parseFloat(shiftsStr);
      if (isNaN(shifts) || shifts <= 0) {
        errors.push('Shifts multiplier must be a number > 0');
      }

      const dailyRate = rateStr ? parseFloat(rateStr) : (matchedWorker ? matchedWorker.dailyRate : 900);
      if (isNaN(dailyRate) || dailyRate < 0) {
        errors.push('Daily rate must be a valid number >= 0');
      }

      const validStatuses = ['Present', 'Half Day', 'Overtime', 'Absent', 'Leave'];
      const normalizedStatus = validStatuses.find(s => s.toLowerCase() === statusStr.toLowerCase()) || (shifts < 1 && shifts > 0 ? 'Half Day' : 'Present');

      const isDuplicate = labourAttendance.some(att => 
        att.date === formattedDate && 
        ((att.workerName && att.workerName.toLowerCase() === workerName.toLowerCase()) || 
         (matchedWorker && att.workerId === matchedWorker.id))
      );
      if (isDuplicate) {
        errors.push(`Duplicate: Attendance already logged for ${workerName} on ${formattedDate}`);
      }

      const totalWage = (shifts || 1) * (dailyRate || 0);

      return {
        rowNumber: lineIdx + 1 + (hasHeader ? 1 : 0),
        date: formattedDate,
        workerName,
        matchedWorkerId: matchedWorker?.id || null,
        workerRole: roleStr || matchedWorker?.role || 'General Staff',
        shifts: shifts || 1,
        dailyRate: dailyRate || 900,
        totalWage,
        status: normalizedStatus,
        notes,
        isValid: errors.length === 0,
        errors
      };
    });

    setParsedBulkRows(rows);
  };

  const handleCommitBulkAttendance = async () => {
    const validRows = parsedBulkRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessingBulk(true);
    try {
      const recordsToIngest = validRows.map((row, idx) => ({
        id: `att_bulk_${Date.now()}_${idx}`,
        workerId: row.matchedWorkerId || `lw_${Date.now()}_${idx}`,
        workerName: row.workerName,
        date: row.date,
        eventId: events[0]?.id || 'In-House Central Kitchen',
        eventName: 'Bulk Attendance Ingestion',
        shiftType: row.shifts === 0.5 ? 'Half Day (Morning)' : (row.shifts > 1 ? 'Double Shift' : 'Full Day'),
        shifts: row.shifts,
        dailyRate: row.dailyRate,
        totalWage: row.totalWage,
        status: row.status,
        notes: row.notes || 'Bulk imported via CSV'
      }));

      await batchAddLabourAttendance(recordsToIngest);
      setIsBulkUploadModalOpen(false);
      setBulkCsvText('');
      setParsedBulkRows([]);
    } catch (err) {
      console.error('Bulk attendance error:', err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const downloadSampleAttendanceCsv = () => {
    const csvContent = "Date,Worker Name,Role,Shift Hours,Daily Rate,Status,Notes\n" +
      "2026-09-05,Sunil Varma,Head Cook / Master Chef,1,1500,Present,Lead main wedding kitchen\n" +
      "2026-09-05,Prakash Rao,Tandoor Specialist,1,1200,Present,Tandoor and Roti counter\n" +
      "2026-09-05,Anand Kumar,Assistant Cook,0.5,450,Half Day,Morning breakfast setup\n" +
      "2026-09-05,Manjunath S,Service Captain,1,1000,Present,Supervised dining hall\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Attendance_Upload_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amt) => `${companyProfile?.currency || '₹'} ${Number(amt || 0).toLocaleString('en-IN')}`;

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

  // Attendance Form Submit
  const handleAttendanceSubmit = (e) => {
    e.preventDefault();
    const worker = labourWorkers.find(w => w.id === attendanceForm.workerId);
    const matchedEvent = events.find(ev => ev.id === attendanceForm.eventId);
    const shiftsNum = parseFloat(attendanceForm.shifts) || 1;
    const rateNum = parseFloat(attendanceForm.dailyRate) || (worker ? worker.dailyRate : 900);
    const totalWage = shiftsNum * rateNum;

    const payload = {
      id: editingAttendance ? editingAttendance.id : `att_${Date.now()}`,
      workerId: attendanceForm.workerId,
      workerName: worker ? worker.name : 'Staff Member',
      date: attendanceForm.date,
      eventId: attendanceForm.eventId || 'In-House Kitchen',
      eventName: matchedEvent ? `${matchedEvent.id} - ${matchedEvent.customer?.name}` : (attendanceForm.eventId || 'In-House Duty'),
      shiftType: attendanceForm.shiftType,
      shifts: shiftsNum,
      dailyRate: rateNum,
      totalWage,
      status: attendanceForm.status,
      notes: attendanceForm.notes
    };

    if (editingAttendance) {
      updateLabourAttendance(payload);
    } else {
      addLabourAttendance(payload);
    }

    setIsAttendanceModalOpen(false);
    setEditingAttendance(null);
    setAttendanceForm({
      workerId: labourWorkers[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      eventId: events[0]?.id || '',
      shiftType: 'Full Day',
      shifts: 1,
      dailyRate: 900,
      status: 'Present',
      notes: ''
    });
  };

  const openLogAttendanceForWorker = (worker) => {
    setEditingAttendance(null);
    setAttendanceForm({
      workerId: worker.id,
      date: new Date().toISOString().split('T')[0],
      eventId: events[0]?.id || '',
      shiftType: 'Full Day',
      shifts: 1,
      dailyRate: worker.dailyRate,
      status: 'Present',
      notes: ''
    });
    setIsAttendanceModalOpen(true);
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

  // Filtered Attendance Logs
  const filteredAttendanceLogs = (labourAttendance || []).filter(log => {
    const matchesDate = !attendanceDateFilter || log.date === attendanceDateFilter;
    const matchesWorker = attendanceWorkerFilter === 'All' || log.workerId === attendanceWorkerFilter;
    return matchesDate && matchesWorker;
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

  const totalAttendanceDays = (labourAttendance || []).length;
  const totalAttendanceWages = (labourAttendance || []).reduce((s, a) => s + (Number(a.totalWage) || 0), 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Labour Management System</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Working days monitoring, staff roster, daily attendance verification, and agency payouts.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeSubTab === 'attendance' && hasWriteAccess && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setIsBulkUploadModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Upload size={18} />
                <span>Upload Attendance Data</span>
              </button>
              <button className="btn btn-primary" onClick={() => {
                setEditingAttendance(null);
                setAttendanceForm({
                  workerId: labourWorkers[0]?.id || '',
                  date: new Date().toISOString().split('T')[0],
                  eventId: events[0]?.id || '',
                  shiftType: 'Full Day',
                  shifts: 1,
                  dailyRate: labourWorkers[0]?.dailyRate || 900,
                  status: 'Present',
                  notes: ''
                });
                setIsAttendanceModalOpen(true);
              }}>
                <CalendarDays size={18} />
                <span>Log Working Day / Shift</span>
              </button>
            </>
          )}
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
            <div className="kpi-value">{totalStaffCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>active ({activeStaffCount})</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              In-house & Agency Pool
            </div>
          </div>
          <div className="kpi-icon icon-blue">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Working Days Logged</h3>
            <div className="kpi-value">{totalAttendanceDays} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>shifts</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.25rem', fontWeight: 600 }}>
              {formatCurrency(totalAttendanceWages)} accumulated
            </div>
          </div>
          <div className="kpi-icon icon-purple">
            <CalendarDays size={22} />
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
          <div className="kpi-icon icon-amber">
            <Building2 size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Pending Shift Payouts</h3>
            <div className="kpi-value">{formatCurrency(totalPendingPayouts)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.25rem', fontWeight: 600 }}>
              Awaiting clearance
            </div>
          </div>
          <div className="kpi-icon icon-green">
            <IndianRupee size={22} />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`btn ${activeSubTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <Users size={17} />
          <span>Worker Directory ({labourWorkers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`btn ${activeSubTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <CalendarDays size={17} />
          <span>Working Days & Attendance Monitoring ({totalAttendanceDays})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roster')}
          className={`btn ${activeSubTab === 'roster' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <UserCheck size={17} />
          <span>Event Shift Allocations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payouts')}
          className={`btn ${activeSubTab === 'payouts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <IndianRupee size={17} />
          <span>Payouts Clearance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('agencies')}
          className={`btn ${activeSubTab === 'agencies' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem' }}
        >
          <Building2 size={17} />
          <span>Agency Masters & Rates</span>
        </button>
      </div>

      {/* SUB TAB 1: WORKER DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div>
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem 0.85rem', borderRadius: '8px', flexGrow: 1, maxWidth: '400px' }}>
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

      {/* SUB TAB 2: LABOUR WORKING DAYS & ATTENDANCE MONITORING */}
      {activeSubTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Staff Working Days & Accumulated Shifts Matrix */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={18} className="accent-text" />
                  <span>Labour Staff Working Days & Shift Summary</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Live working day accumulation, daily shift rates, and earnings breakdown per staff member.
                </p>
              </div>

              {hasWriteAccess && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setIsBulkUploadModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Upload size={14} /> Upload Attendance Data
                  </button>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => {
                      setEditingAttendance(null);
                      setAttendanceForm({
                        workerId: labourWorkers[0]?.id || '',
                        date: new Date().toISOString().split('T')[0],
                        eventId: events[0]?.id || '',
                        shiftType: 'Full Day',
                        shifts: 1,
                        dailyRate: labourWorkers[0]?.dailyRate || 900,
                        status: 'Present',
                        notes: ''
                      });
                      setIsAttendanceModalOpen(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Log Attendance / Working Day
                  </button>
                </div>
              )}
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staff Name & Role</th>
                    <th>Type</th>
                    <th>Daily Rate</th>
                    <th>Days Worked</th>
                    <th>Total Shifts Logged</th>
                    <th>Total Wage Accrued</th>
                    <th>Status</th>
                    {hasWriteAccess && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {labourWorkers.map(worker => {
                    const workerLogs = (labourAttendance || []).filter(a => a.workerId === worker.id);
                    const uniqueDays = new Set(workerLogs.map(a => a.date)).size;
                    const totalShifts = workerLogs.reduce((s, a) => s + (Number(a.shifts) || 0), 0);
                    const totalEarned = workerLogs.reduce((s, a) => s + (Number(a.totalWage) || 0), 0);

                    return (
                      <tr key={worker.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{worker.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{worker.role}</div>
                        </td>
                        <td>
                          {worker.type === 'Direct' ? (
                            <span className="badge badge-success">Direct Hire</span>
                          ) : (
                            <span className="badge badge-purple">Agency</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(worker.dailyRate)} / day</td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0.2rem 0.55rem' }}>
                            {uniqueDays} Days
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{totalShifts} Shifts</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(totalEarned)}</td>
                        <td>
                          <span className={`badge ${worker.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                            {worker.status}
                          </span>
                        </td>
                        {hasWriteAccess && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => openLogAttendanceForWorker(worker)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                            >
                              <CalendarDays size={13} /> Log Duty
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Detailed Daily Attendance & Shift Logs Ledger */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CalendarDays size={18} className="accent-text" />
                  <span>Daily Attendance & Working Shift Logs</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Chronological records of all worker shift allocations, duty notes, and wage calculations.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Date:</span>
                  <input
                    type="date"
                    className="form-input"
                    value={attendanceDateFilter}
                    onChange={e => setAttendanceDateFilter(e.target.value)}
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                  />
                  {attendanceDateFilter && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setAttendanceDateFilter('')}
                      style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Worker:</span>
                  <select
                    className="form-select"
                    value={attendanceWorkerFilter}
                    onChange={e => setAttendanceWorkerFilter(e.target.value)}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  >
                    <option value="All">All Staff Members</option>
                    {labourWorkers.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date & Shift</th>
                    <th>Worker Name</th>
                    <th>Assigned Event / Duty</th>
                    <th>Shift & Rate</th>
                    <th>Total Wage</th>
                    <th>Status</th>
                    <th>Duty Notes</th>
                    {hasWriteAccess && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendanceLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} className="accent-text" />
                          <span>{log.date}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{log.shiftType}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.workerName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ID: {log.workerId}</div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 500 }}>
                          {log.eventName || log.eventId || 'In-House Duty'}
                        </span>
                      </td>
                      <td>
                        <div>{log.shifts} Shift{log.shifts > 1 ? 's' : ''}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>@ {formatCurrency(log.dailyRate)}/day</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(log.totalWage)}
                      </td>
                      <td>
                        <span className={`badge ${
                          log.status === 'Present' ? 'badge-success' :
                          log.status === 'Overtime' ? 'badge-purple' :
                          log.status === 'Half-Day' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>
                        {log.notes || '—'}
                      </td>
                      {hasWriteAccess && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem' }}>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => {
                                setEditingAttendance(log);
                                setAttendanceForm({
                                  workerId: log.workerId,
                                  date: log.date,
                                  eventId: log.eventId,
                                  shiftType: log.shiftType,
                                  shifts: log.shifts,
                                  dailyRate: log.dailyRate,
                                  status: log.status,
                                  notes: log.notes || ''
                                });
                                setIsAttendanceModalOpen(true);
                              }}
                              title="Edit Attendance Log"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => deleteLabourAttendance(log.id)}
                              style={{ color: 'var(--color-danger)' }}
                              title="Delete Attendance Log"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredAttendanceLogs.length === 0 && (
                    <tr>
                      <td colSpan={hasWriteAccess ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No attendance logs found matching the selected filter. Click "Log Attendance / Working Day" to record shifts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB 3: EVENT SHIFT ROSTER */}
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
                <div key={a.id} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* MODAL 3: ATTENDANCE & WORKING DAY MODAL */}
      {isAttendanceModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '520px', width: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={20} className="accent-text" />
              <span>{editingAttendance ? 'Edit Attendance & Shift Log' : 'Log Worker Shift & Working Day'}</span>
            </h2>

            <form onSubmit={handleAttendanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Select Labour Worker</label>
                <select
                  value={attendanceForm.workerId}
                  onChange={e => {
                    const selected = labourWorkers.find(w => w.id === e.target.value);
                    setAttendanceForm({
                      ...attendanceForm,
                      workerId: e.target.value,
                      dailyRate: selected ? selected.dailyRate : attendanceForm.dailyRate
                    });
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  required
                >
                  {labourWorkers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.role} - {formatCurrency(w.dailyRate)}/day)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Working Date</label>
                  <input
                    type="date"
                    required
                    value={attendanceForm.date}
                    onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Duty Status</label>
                  <select
                    value={attendanceForm.status}
                    onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="Present">Present (Full Shift)</option>
                    <option value="Overtime">Overtime (Extended)</option>
                    <option value="Half-Day">Half-Day (Partial)</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Assigned Event / Operational Venue</label>
                <select
                  value={attendanceForm.eventId}
                  onChange={e => setAttendanceForm({ ...attendanceForm, eventId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="In-House Central Kitchen">In-House Central Kitchen Production</option>
                  <option value="Catering Warehouse Prep">Catering Warehouse & Utensils Staging</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.id} - {ev.customer?.name} ({ev.eventType})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Shift Type</label>
                  <select
                    value={attendanceForm.shiftType}
                    onChange={e => {
                      const type = e.target.value;
                      let shiftMult = 1;
                      if (type === 'Half Day (Morning)' || type === 'Half Day (Evening)') shiftMult = 0.5;
                      else if (type === 'Double Shift') shiftMult = 2;
                      else if (type === 'Overtime') shiftMult = 1.5;
                      setAttendanceForm({ ...attendanceForm, shiftType: type, shifts: shiftMult });
                    }}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                  >
                    <option value="Full Day">Full Day (1 Shift)</option>
                    <option value="Half Day (Morning)">Morning Shift (0.5)</option>
                    <option value="Half Day (Evening)">Evening Shift (0.5)</option>
                    <option value="Double Shift">Double Shift (2.0)</option>
                    <option value="Overtime">Overtime Shift (1.5)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Shifts Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={attendanceForm.shifts}
                    onChange={e => setAttendanceForm({ ...attendanceForm, shifts: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Daily Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={attendanceForm.dailyRate}
                    onChange={e => setAttendanceForm({ ...attendanceForm, dailyRate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Wage Calculation Summary */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(156, 21, 25, 0.06)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculated Total Shift Wage:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatCurrency((parseFloat(attendanceForm.shifts) || 1) * (parseFloat(attendanceForm.dailyRate) || 0))}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Duty Notes & Task Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lead live Dosa counter, supervised morning hall setup..."
                  value={attendanceForm.notes}
                  onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingAttendance ? 'Update Attendance Log' : 'Save Attendance Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BULK ATTENDANCE UPLOAD */}
      {isBulkUploadModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={22} className="accent-text" />
                <div>
                  <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Bulk Attendance & Shift Upload</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Upload attendance records via CSV or paste tabular data directly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkUploadModalOpen(false);
                  setBulkCsvText('');
                  setParsedBulkRows([]);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <LucideX size={20} />
              </button>
            </div>

            {/* Instruction banner & sample download */}
            <div style={{ background: 'rgba(255, 255, 255, 0.55)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '540px' }}>
                <strong>Supported Columns:</strong> <code>Date</code>, <code>Worker Name</code>, <code>Role</code>, <code>Shift Hours</code>, <code>Daily Rate</code>, <code>Status</code>, <code>Notes</code>.
                Dates can be in <code>YYYY-MM-DD</code> or <code>DD/MM/YYYY</code> format. Existing staff names will be auto-matched.
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={downloadSampleAttendanceCsv}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
              >
                <Download size={14} /> Download Sample CSV
              </button>
            </div>

            {/* File input & Textarea */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Paste CSV Data or Choose File:</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="bulk-csv-file"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = evt => {
                        const content = evt.target?.result || '';
                        setBulkCsvText(content);
                        parseBulkAttendanceCsv(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <label
                  htmlFor="bulk-csv-file"
                  className="btn btn-secondary btn-small"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  <Upload size={14} /> Browse .CSV File
                </label>
              </div>
              <textarea
                rows={5}
                className="form-input"
                placeholder="Paste CSV rows here, e.g.:
2026-09-05,Sunil Varma,Head Cook,1,1500,Present,Lead wedding kitchen
2026-09-05,Prakash Rao,Tandoor Specialist,1,1200,Present,Tandoor counter"
                value={bulkCsvText}
                onChange={e => {
                  setBulkCsvText(e.target.value);
                  parseBulkAttendanceCsv(e.target.value);
                }}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.6rem' }}
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedBulkRows.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', gap: '0.5rem' }}>
                    <span>Parsed Preview ({parsedBulkRows.length} Rows)</span>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {parsedBulkRows.filter(r => r.isValid).length} Valid
                    </span>
                    {parsedBulkRows.some(r => !r.isValid) && (
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                        {parsedBulkRows.filter(r => !r.isValid).length} Invalid / Duplicate
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    Total Est. Wage: {formatCurrency(parsedBulkRows.filter(r => r.isValid).reduce((sum, r) => sum + r.totalWage, 0))}
                  </div>
                </div>

                <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>Row</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Worker Name</th>
                        <th>Role</th>
                        <th style={{ textAlign: 'center' }}>Shifts</th>
                        <th style={{ textAlign: 'right' }}>Daily Rate</th>
                        <th style={{ textAlign: 'right' }}>Wage</th>
                        <th>Validation Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedBulkRows.map(row => (
                        <tr key={row.rowNumber} style={{ background: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.06)' }}>
                          <td>{row.rowNumber}</td>
                          <td>
                            {row.isValid ? (
                              <span className="badge badge-success" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Check size={11} /> Valid
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <AlertTriangle size={11} /> Invalid
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.date || '—'}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{row.workerName || '—'}</div>
                            {row.matchedWorkerId && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Check size={11} /> Matched in directory
                              </span>
                            )}
                          </td>
                          <td>{row.workerRole}</td>
                          <td style={{ textAlign: 'center' }}>{row.shifts}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(row.dailyRate)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(row.totalWage)}</td>
                          <td>
                            {row.errors.length > 0 ? (
                              <div style={{ color: 'var(--color-danger)', fontSize: '0.72rem' }}>
                                {row.errors.join('; ')}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-success)', fontSize: '0.72rem' }}>Ready to upload</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsBulkUploadModalOpen(false);
                  setBulkCsvText('');
                  setParsedBulkRows([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isProcessingBulk || parsedBulkRows.filter(r => r.isValid).length === 0}
                onClick={handleCommitBulkAttendance}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Upload size={16} />
                <span>
                  {isProcessingBulk ? 'Importing Records...' : `Upload ${parsedBulkRows.filter(r => r.isValid).length} Valid Records`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgencyLabor;
