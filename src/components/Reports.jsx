import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { BarChart3, TrendingUp, Users, CalendarDays, DollarSign } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const Reports = () => {
  const { events, companyProfile } = useContext(AppContext);

  // Calculate KPIs
  const totalEvents = events.length;
  const totalPax = events.reduce((sum, e) => sum + e.guestCount, 0);
  
  // Calculate revenue based on financials if available
  const totalRevenue = events.reduce((sum, e) => {
    return sum + (e.financials?.grandTotal || 0);
  }, 0);

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;

  // Chart Data Processing
  const revenueByMonth = events.reduce((acc, e) => {
    const d = new Date(e.date);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const key = `${month} ${year}`;
    
    if (!acc[key]) acc[key] = { name: key, revenue: 0 };
    acc[key].revenue += (e.financials?.grandTotal || 0);
    return acc;
  }, {});
  const chartDataRevenue = Object.values(revenueByMonth);

  const eventTypesDist = events.reduce((acc, e) => {
    const type = e.eventType || 'Other';
    if (!acc[type]) acc[type] = { name: type, count: 0 };
    acc[type].count += 1;
    return acc;
  }, {});
  const chartDataTypes = Object.values(eventTypesDist);
  const COLORS = ['#800020', '#FF9933', '#0f766e', '#0891b2', '#8b5cf6'];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Reports & Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>High-level overview of your catering business performance.</p>
      </div>

      <div className="grid-kpis">
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Expected Revenue</h3>
            <div className="kpi-value">{companyProfile.currency} {totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="kpi-icon icon-green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Events Booked</h3>
            <div className="kpi-value">{totalEvents}</div>
          </div>
          <div className="kpi-icon icon-blue">
            <CalendarDays size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Guests Served (Pax)</h3>
            <div className="kpi-value">{totalPax.toLocaleString('en-IN')}</div>
          </div>
          <div className="kpi-icon icon-purple">
            <Users size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Upcoming Events</h3>
            <div className="kpi-value">{upcomingEvents}</div>
          </div>
          <div className="kpi-icon icon-amber">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>
      
      <div className="responsive-grid two-cols" style={{ marginTop: '2rem' }}>
        <div className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Revenue Over Time</h3>
          <div style={{ flexGrow: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} />
                <Tooltip 
                  formatter={(value) => [`${companyProfile.currency} ${value.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Event Category Distribution</h3>
          <div style={{ flexGrow: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {chartDataTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            {chartDataTypes.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
                <span style={{ fontWeight: 600 }}>({entry.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
