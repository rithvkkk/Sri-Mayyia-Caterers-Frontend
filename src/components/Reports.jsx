import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { TrendingUp, Users, CalendarDays, DollarSign, Lock, Award } from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const Reports = () => {
  const { events, companyProfile, currentRole } = useContext(AppContext);

  const isAdmin = currentRole === 'Admin';

  // Calculate KPIs
  const totalEvents = events.length;
  const totalPax = events.reduce((sum, e) => sum + (e.subFunctions ? e.subFunctions.reduce((s, sf) => s + (sf.guestCount || 0), 0) : (e.guestCount || 0)), 0);
  
  // Revenue calculations
  const totalRevenue = events.reduce((sum, e) => {
    return sum + (e.billing?.totalAmount || e.financials?.grandTotal || 0);
  }, 0);

  // Expense & Net Profit calculations
  const totalExpense = events.reduce((sum, e) => {
    const costs = e.execution?.costs || {};
    const manualCosts = (e.manualMaterials || []).reduce((mSum, m) => mSum + (m.totalCost || 0), 0);
    return sum + (costs.rawMaterialsCost || manualCosts || 0) + (costs.laborCost || 0) + (costs.venueRent || 0) + (costs.otherExpenses || 0);
  }, 0);

  const netProfit = Math.max(0, totalRevenue - totalExpense);
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Chart Data Processing
  const revenueByMonth = events.reduce((acc, e) => {
    const d = new Date(e.date);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const key = `${month} ${year}`;
    
    if (!acc[key]) acc[key] = { name: key, revenue: 0 };
    const rev = (e.billing?.totalAmount || e.financials?.grandTotal || 0);
    acc[key].revenue += rev;
    return acc;
  }, {});
  const chartDataRevenue = Object.values(revenueByMonth);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Reports & Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>High-level overview of catering business performance, sales, and analytics.</p>
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
            <h3>Net Profit Margin</h3>
            {isAdmin ? (
              <div>
                <div className="kpi-value" style={{ color: 'var(--color-success)' }}>
                  {companyProfile.currency} {netProfit.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Margin: <strong>{profitMargin}%</strong>
                </div>
              </div>
            ) : (
              <div>
                <div className="kpi-value" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={15} /> Restricted to Admin
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Admin clearance required
                </div>
              </div>
            )}
          </div>
          <div className="kpi-icon icon-amber">
            {isAdmin ? <Award size={24} /> : <Lock size={24} />}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <div className="glass-card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
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
      </div>
    </div>
  );
};

export default Reports;
