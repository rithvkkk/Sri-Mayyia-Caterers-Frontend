import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import CustomChart from './Shared/CustomChart';
import { Calendar, DollarSign, Award, Bell, Clipboard, PlusCircle, CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

const Dashboard = ({ setActiveTab }) => {
  const { events, venues, companyProfile, currentRole } = useContext(AppContext);

  const [selectedDateFilter, setSelectedDateFilter] = React.useState(null);
  const bookingsCardRef = React.useRef(null);
  const [displayMonth, setDisplayMonth] = React.useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = React.useState(new Date().getFullYear());

  const handleDayClick = (cd) => {
    if (!cd.dateStr) return;
    setSelectedDateFilter(cd.dateStr);
    if (bookingsCardRef.current) {
      bookingsCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isAdmin = currentRole === 'Admin';

  // Dynamic calculations based on stored events
  const totalEvents = events.length;
  
  const totalSales = events.reduce((sum, e) => sum + (e.billing?.totalAmount || 0), 0);
  
  const totalExpense = events.reduce((sum, e) => {
    const costs = e.execution?.costs || {};
    return sum + (costs.rawMaterialsCost || 0) + (costs.laborCost || 0) + (costs.venueRent || 0) + (costs.otherExpenses || 0);
  }, 0);
  
  const netProfit = Math.max(0, totalSales - totalExpense);

  const formatVal = (val) => {
    return companyProfile.currency + ' ' + Math.round(val).toLocaleString('en-IN');
  };

  // Get venue name helper
  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.id === venueId);
    return venue ? venue.name : 'TBD Venue';
  };

  // Status badge helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="badge badge-success">Completed</span>;
      case 'Confirmed':
        return <span className="badge badge-info">Confirmed</span>;
      case 'Inquiry':
        return <span className="badge badge-warning">Inquiry</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Dynamic Calendar setup
  const calendarDays = [];
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const startDayOffset = new Date(displayYear, displayMonth, 1).getDay(); 
  
  // Fill empty slots
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push({ day: '', events: [] });
  }

  // Fill calendar days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateStr);
    calendarDays.push({ day: d, dateStr, events: dayEvents });
  }

  const filteredEvents = selectedDateFilter
    ? events.filter(e => e.date === selectedDateFilter)
    : events;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Executive Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to {companyProfile.name} Central Control Console.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('bookings')}>
          <PlusCircle size={18} />
          <span>New Event Booking</span>
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid-kpis">
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Events</h3>
            <div className="kpi-value">{totalEvents}</div>
          </div>
          <div className="kpi-icon icon-blue">
            <Clipboard size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Sales</h3>
            <div className="kpi-value">{formatVal(totalSales)}</div>
          </div>
          <div className="kpi-icon icon-green">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Expenses</h3>
            <div className="kpi-value">{formatVal(totalExpense)}</div>
          </div>
          <div className="kpi-icon icon-danger">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Net Profit</h3>
            {isAdmin ? (
              <div className="kpi-value">{formatVal(netProfit)}</div>
            ) : (
              <div className="kpi-value" style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={16} /> Restricted to Admin
              </div>
            )}
          </div>
          <div className="kpi-icon icon-amber">
            {isAdmin ? <Award size={22} /> : <Lock size={22} />}
          </div>
        </div>
      </div>

      {/* Dashboard Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Calendar & Upcoming Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Dynamic Event Calendar widget */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} className="accent-text" />
                <span>Event Calendar</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary btn-small" 
                  style={{ padding: '0.2rem' }}
                  onClick={() => {
                    if (displayMonth === 0) {
                      setDisplayMonth(11);
                      setDisplayYear(displayYear - 1);
                    } else {
                      setDisplayMonth(displayMonth - 1);
                    }
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '95px', textAlign: 'center' }}>
                  {new Date(displayYear, displayMonth).toLocaleString('default', { month: 'short', year: 'numeric' })}
                </span>
                <button 
                  className="btn btn-secondary btn-small" 
                  style={{ padding: '0.2rem' }}
                  onClick={() => {
                    if (displayMonth === 11) {
                      setDisplayMonth(0);
                      setDisplayYear(displayYear + 1);
                    } else {
                      setDisplayMonth(displayMonth + 1);
                    }
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
              {calendarDays.map((cd, index) => {
                const hasEvent = cd.events && cd.events.length > 0;
                const isSelected = selectedDateFilter === cd.dateStr;
                const today = new Date();
                const isToday = cd.dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                return (
                  <div
                    key={index}
                    style={{
                      height: '38px',
                      background: isSelected 
                        ? 'var(--color-primary)' 
                        : 'rgba(0,0,0,0.02)',
                      border: isSelected 
                        ? '2px solid var(--color-warning)' 
                        : (cd.day ? '1px solid var(--border-color)' : 'none'),
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: cd.day ? 'pointer' : 'default',
                      boxShadow: isSelected ? '0 0 10px rgba(255, 153, 51, 0.4)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    title={hasEvent ? cd.events.map(ev => `${ev.id}: ${ev.customer.name} (${ev.eventType})`).join(', ') : ''}
                    onClick={() => {
                      if (cd.day) {
                        handleDayClick(cd);
                      }
                    }}
                  >
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: cd.day ? 600 : 300, 
                      color: isToday 
                        ? '#ef4444' 
                        : (isSelected ? '#fff' : 'var(--text-primary)') 
                    }}>
                      {cd.day}
                    </span>
                    {hasEvent && (
                      <span style={{
                        position: 'absolute',
                        bottom: '3px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--color-warning)' : 'var(--color-primary)'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                <span>Event Scheduled</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }} />
                <span>Available Slots</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>{new Date().getDate()}</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          <div ref={bookingsCardRef} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CheckCircle size={20} className="accent-text" />
                <span>
                  Upcoming & Active Bookings 
                  {selectedDateFilter && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginLeft: '0.5rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      On {new Date(selectedDateFilter).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </span>
              </h2>
              {selectedDateFilter && (
                <button 
                  className="btn btn-secondary btn-small" 
                  onClick={() => setSelectedDateFilter(null)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Show All Events
                </button>
              )}
            </div>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Client Name</th>
                    <th>Event Type</th>
                    <th>Venue</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(e => (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('bookings')}>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{e.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.customer.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{e.customer.phone}</div>
                      </td>
                      <td>{e.eventType}</td>
                      <td>{getVenueName(e.venueId)}</td>
                      <td>{new Date(e.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{renderStatusBadge(e.status)}</td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        No events scheduled on this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Operations Summary */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} className="accent-text" />
              <span>Real-Time Operational Alerts</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {events.filter(e => e.status === 'Inquiry').map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px' }}>
                  <Clock size={16} style={{ color: 'var(--color-warning)' }} />
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{e.id} Inquiry Pending:</span> client {e.customer.name} requires menu mapping and cost breakdown.
                  </div>
                </div>
              ))}
              {events.filter(e => e.status === 'Confirmed' && e.billing.balanceDue > 0).map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--color-primary)' }} />
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{e.id} Balance Due:</span> outstanding sum of {formatVal(e.billing.balanceDue)} remaining for {e.customer.name}.
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No active operational alerts. Perfect system health.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Expense vs Sales Distribution</h2>
            <CustomChart sales={totalSales} expense={totalExpense} currency={companyProfile.currency} currentRole={currentRole} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
