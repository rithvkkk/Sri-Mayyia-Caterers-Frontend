import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  TrendingUp, Users, CalendarDays, IndianRupee, Lock, Award, 
  Download, Printer, Filter, PieChart as PieChartIcon, BarChart3, 
  DollarSign, Percent, ArrowUpRight, ArrowDownRight, Layers, Store, 
  ShoppingBag, Truck, UserCheck, Building, Tag, FileText, ChevronDown 
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

const CATEGORY_COLORS = {
  'Raw Materials': '#D2AC67',
  'Staffing & Labor': '#3B82F6',
  'Transport & Porters': '#F59E0B',
  'Venue Rentals': '#8B5CF6',
  'Agency Commission': '#EC4899',
  'Miscellaneous Overheads': '#64748B'
};

const PIE_PALETTE = ['#D2AC67', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B', '#10B981', '#06B6D4'];

const Reports = () => {
  const { events = [], rawMaterials = [], suppliers = [], companyProfile, currentRole } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'overview'
  const [dateFilterPreset, setDateFilterPreset] = useState('ALL'); // 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');

  const roleLower = (currentRole || 'admin').toLowerCase();
  const isAdminOrFinance = !currentRole || roleLower === 'admin' || roleLower === 'hr' || roleLower === 'hr manager' || roleLower === 'accountant' || roleLower.includes('admin') || roleLower.includes('account');

  const currencySymbol = companyProfile?.currency || '₹';
  const formatCurrency = (amount) => `${currencySymbol} ${Number(amount || 0).toLocaleString('en-IN')}`;

  // Unique Event Types for filter dropdown
  const uniqueEventTypes = useMemo(() => {
    const types = new Set();
    events.forEach(e => {
      if (e.eventType) types.add(e.eventType);
    });
    return Array.from(types).sort();
  }, [events]);

  // Unique Vendors for filter dropdown
  const uniqueSuppliers = useMemo(() => {
    const sups = new Set();
    suppliers.forEach(s => {
      if (s.name) sups.add(s.name);
    });
    events.forEach(e => {
      (e.manualMaterials || []).forEach(m => {
        if (m.supplier?.name) sups.add(m.supplier.name);
      });
    });
    return Array.from(sups).sort();
  }, [suppliers, events]);

  // Date filtering logic
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return events.filter(e => {
      // Event Type filter
      if (selectedEventType !== 'ALL' && e.eventType !== selectedEventType) {
        return false;
      }

      // Vendor filter: check if event has materials from this vendor
      if (selectedVendorFilter !== 'ALL') {
        const hasVendor = (e.manualMaterials || []).some(m => 
          m.supplier?.name === selectedVendorFilter || String(m.supplier?._id) === selectedVendorFilter
        );
        if (!hasVendor) return false;
      }

      // Date Presets filter
      if (!e.date) return true;
      const eventDate = new Date(e.date);
      if (isNaN(eventDate.getTime())) return true;

      if (dateFilterPreset === 'THIS_MONTH') {
        return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
      } else if (dateFilterPreset === 'LAST_MONTH') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return eventDate.getFullYear() === lastMonthYear && eventDate.getMonth() === lastMonth;
      } else if (dateFilterPreset === 'THIS_QUARTER') {
        const currentQuarter = Math.floor(currentMonth / 3);
        const eventQuarter = Math.floor(eventDate.getMonth() / 3);
        return eventDate.getFullYear() === currentYear && eventQuarter === currentQuarter;
      } else if (dateFilterPreset === 'THIS_YEAR') {
        return eventDate.getFullYear() === currentYear;
      } else if (dateFilterPreset === 'CUSTOM') {
        if (customStartDate && new Date(e.date) < new Date(customStartDate)) return false;
        if (customEndDate && new Date(e.date) > new Date(customEndDate)) return false;
        return true;
      }
      return true;
    });
  }, [events, dateFilterPreset, customStartDate, customEndDate, selectedEventType, selectedVendorFilter]);

  // === COMPREHENSIVE FINANCIAL AGGREGATION ===
  const financialTelemetry = useMemo(() => {
    let totalRevenue = 0;
    let totalRawMaterialsCost = 0;
    let totalLaborCost = 0;
    let totalTransportCost = 0;
    let totalVenueRent = 0;
    let totalCommissionCost = 0;
    let totalOtherExpenses = 0;
    let totalGuests = 0;

    const vendorSpendMap = {};
    const materialCostMap = {};
    const monthlyLedger = {};

    filteredEvents.forEach(e => {
      const eGuests = e.subFunctions && e.subFunctions.length > 0
        ? e.subFunctions.reduce((sum, sf) => sum + (parseInt(sf?.guestCount, 10) || 0), 0)
        : (parseInt(e.guestCount, 10) || 0);
      totalGuests += eGuests;

      const pricePerPlate = e.billing?.pricePerPlate || 800;
      const evSubtotal = eGuests * pricePerPlate;
      const evRev = e.billing?.totalAmount || evSubtotal;
      totalRevenue += evRev;

      // Extract Costs
      const manualCosts = (e.manualMaterials || []).reduce((sum, m) => sum + (Number(m.totalCost) || 0), 0);
      const rmCost = manualCosts > 0 ? manualCosts : (Number(e.execution?.costs?.rawMaterialsCost) || 0);
      const lbCost = Number(e.execution?.costs?.laborCost) || 0;
      const trCost = Number(e.transport?.totalTransportCost) || Number(e.execution?.costs?.transportCost) || 0;
      const vnCost = Number(e.execution?.costs?.venueRent) || 0;
      const ovCost = Number(e.execution?.costs?.otherExpenses) || 0;

      // Commission: use stored billing.commissionAmount or calculate from commissionRate
      const commRate = Number(e.billing?.commissionRate) || 0;
      const cmCost = e.execution?.costs?.commissionCost !== undefined
        ? Number(e.execution.costs.commissionCost)
        : (e.billing?.commissionAmount !== undefined ? Number(e.billing.commissionAmount) : parseFloat(((evRev * commRate) / 100).toFixed(2)));

      totalRawMaterialsCost += rmCost;
      totalLaborCost += lbCost;
      totalTransportCost += trCost;
      totalVenueRent += vnCost;
      totalCommissionCost += cmCost;
      totalOtherExpenses += ovCost;

      const eventTotalExpense = rmCost + lbCost + trCost + vnCost + ovCost + cmCost;

      // Track Vendor Spending from manualMaterials
      (e.manualMaterials || []).forEach(m => {
        const vendorName = m.supplier?.name || 'Local / Unassigned';
        const cost = Number(m.totalCost) || 0;
        if (!vendorSpendMap[vendorName]) {
          vendorSpendMap[vendorName] = {
            name: vendorName,
            category: m.supplier?.category || m.category || 'General',
            contact: m.supplier?.contact || '',
            totalCost: 0,
            items: new Set()
          };
        }
        vendorSpendMap[vendorName].totalCost += cost;
        if (m.name) vendorSpendMap[vendorName].items.add(m.name);
      });

      // Track Material / Ingredient Costs
      (e.manualMaterials || []).forEach(m => {
        const matName = m.name || 'Unspecified Item';
        if (!materialCostMap[matName]) {
          materialCostMap[matName] = {
            name: matName,
            category: m.category || 'Grocery',
            unit: m.unit || 'kg',
            totalQty: 0,
            totalCost: 0
          };
        }
        materialCostMap[matName].totalQty += (Number(m.requiredQty) || 0);
        materialCostMap[matName].totalCost += (Number(m.totalCost) || 0);
      });

      // Monthly Trend Aggregation
      if (e.date) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          if (!monthlyLedger[key]) {
            monthlyLedger[key] = {
              name: key,
              dateObj: d,
              revenue: 0,
              expenses: 0,
              profit: 0
            };
          }
          monthlyLedger[key].revenue += evRev;
          monthlyLedger[key].expenses += eventTotalExpense;
          monthlyLedger[key].profit += (evRev - eventTotalExpense);
        }
      }
    });

    const totalExpenses = totalRawMaterialsCost + totalLaborCost + totalTransportCost + totalVenueRent + totalCommissionCost + totalOtherExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    const expenseRatio = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0.0';

    // Category Breakdown Array for Charts & Tables
    const categoryBreakdown = [
      { name: 'Raw Materials', amount: totalRawMaterialsCost, color: CATEGORY_COLORS['Raw Materials'], icon: ShoppingBag },
      { name: 'Staffing & Labor', amount: totalLaborCost, color: CATEGORY_COLORS['Staffing & Labor'], icon: UserCheck },
      { name: 'Transport & Porters', amount: totalTransportCost, color: CATEGORY_COLORS['Transport & Porters'], icon: Truck },
      { name: 'Venue Rentals', amount: totalVenueRent, color: CATEGORY_COLORS['Venue Rentals'], icon: Building },
      { name: 'Agency Commission', amount: totalCommissionCost, color: CATEGORY_COLORS['Agency Commission'], icon: DollarSign },
      { name: 'Miscellaneous Overheads', amount: totalOtherExpenses, color: CATEGORY_COLORS['Miscellaneous Overheads'], icon: Tag }
    ].map(cat => ({
      ...cat,
      percentage: totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.amount - a.amount);

    const largestExpenseCat = categoryBreakdown[0] || { name: 'None', amount: 0, percentage: '0' };

    // Vendor Spend List
    const vendorSpendList = Object.values(vendorSpendMap).map(v => ({
      ...v,
      itemCount: v.items.size,
      itemsList: Array.from(v.items).slice(0, 4).join(', ') + (v.items.size > 4 ? ` +${v.items.size - 4} more` : ''),
      percentage: totalRawMaterialsCost > 0 ? ((v.totalCost / totalRawMaterialsCost) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.totalCost - a.totalCost);

    // Material Cost List
    const materialCostList = Object.values(materialCostMap).map(m => ({
      ...m,
      percentage: totalRawMaterialsCost > 0 ? ((m.totalCost / totalRawMaterialsCost) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.totalCost - a.totalCost);

    const largestSingleMaterial = materialCostList[0] || { name: 'None', totalCost: 0 };

    // Monthly Trend sorted chronologically
    const monthlyTrendData = Object.values(monthlyLedger).sort((a, b) => a.dateObj - b.dateObj);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      expenseRatio,
      totalGuests,
      totalRawMaterialsCost,
      totalLaborCost,
      totalTransportCost,
      totalVenueRent,
      totalCommissionCost,
      totalOtherExpenses,
      categoryBreakdown,
      largestExpenseCat,
      vendorSpendList,
      materialCostList,
      largestSingleMaterial,
      monthlyTrendData
    };
  }, [filteredEvents]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Report Section,Item Name,Category,Quantity / Detail,Total Amount (INR),Percentage of Total'
    ];

    const rows = [];

    // Summary
    rows.push(`Summary,Total Expected Revenue,Financials,-,${financialTelemetry.totalRevenue},100%`);
    rows.push(`Summary,Total Operational Expenses,Financials,-,${financialTelemetry.totalExpenses},${financialTelemetry.expenseRatio}%`);
    rows.push(`Summary,Net Operating Profit,Financials,-,${financialTelemetry.netProfit},${financialTelemetry.profitMargin}%`);
    rows.push(`Summary,Total Agency Commission,Expense,-,${financialTelemetry.totalCommissionCost},-`);

    // Category Breakdown
    financialTelemetry.categoryBreakdown.forEach(cat => {
      rows.push(`Category Breakdown,${cat.name},Operational Expense,-,${cat.amount},${cat.percentage}%`);
    });

    // Vendor Spend
    financialTelemetry.vendorSpendList.forEach(v => {
      rows.push(`Vendor Spend,"${v.name}",${v.category},"${v.itemsList}",${v.totalCost},${v.percentage}%`);
    });

    // Materials
    financialTelemetry.materialCostList.forEach(m => {
      rows.push(`Material Consumption,"${m.name}",${m.category},${m.totalQty} ${m.unit},${m.totalCost},${m.percentage}%`);
    });

    // Events Ledger
    filteredEvents.forEach(e => {
      const eGuests = e.subFunctions && e.subFunctions.length > 0
        ? e.subFunctions.reduce((sum, sf) => sum + (parseInt(sf?.guestCount, 10) || 0), 0)
        : (parseInt(e.guestCount, 10) || 0);
      const pricePerPlate = e.billing?.pricePerPlate || 800;
      const evRev = e.billing?.totalAmount || (eGuests * pricePerPlate);
      const manualCosts = (e.manualMaterials || []).reduce((sum, m) => sum + (Number(m.totalCost) || 0), 0);
      const rmCost = manualCosts > 0 ? manualCosts : (Number(e.execution?.costs?.rawMaterialsCost) || 0);
      const lbCost = Number(e.execution?.costs?.laborCost) || 0;
      const trCost = Number(e.transport?.totalTransportCost) || Number(e.execution?.costs?.transportCost) || 0;
      const vnCost = Number(e.execution?.costs?.venueRent) || 0;
      const ovCost = Number(e.execution?.costs?.otherExpenses) || 0;
      const commRate = Number(e.billing?.commissionRate) || 0;
      const cmCost = e.execution?.costs?.commissionCost !== undefined
        ? Number(e.execution.costs.commissionCost)
        : (e.billing?.commissionAmount !== undefined ? Number(e.billing.commissionAmount) : parseFloat(((evRev * commRate) / 100).toFixed(2)));
      const evExp = rmCost + lbCost + trCost + vnCost + ovCost + cmCost;
      const evProf = evRev - evExp;
      rows.push(`Events Ledger,"${e.id} - ${e.customer?.name || 'Customer'}",${e.eventType || 'Event'},${e.date || '-'},Rev: ${evRev} | Exp: ${evExp} | Profit: ${evProf} | Comm: ${cmCost},-`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join('\n'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mayyias_Expense_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Reports & Expense Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Comprehensive expense audit, category breakdown, vendor spend analysis, and operational margins.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <PieChartIcon size={18} /><span>Complete Expense Analysis</span>
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}
        >
          <BarChart3 size={18} /><span>Executive Revenue Overview</span>
        </button>
      </div>

      {/* Dynamic Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Date Range:</span>
            <select
              value={dateFilterPreset}
              onChange={(e) => setDateFilterPreset(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Time ({events.length} Events)</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
          </div>

          {dateFilterPreset === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="form-input"
                style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="form-input"
                style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Occasion:</span>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Occasions</option>
              {uniqueEventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Vendor:</span>
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Vendors</option>
              {uniqueSuppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredEvents.length}</strong> of {events.length} events
        </div>
      </div>

      {/* ===== TAB 1: COMPLETE EXPENSE ANALYSIS ===== */}
      {activeTab === 'expenses' && (
        <>
          {/* Key Financial KPIs Strip */}
          <div className="grid-kpis" style={{ marginBottom: '1.75rem' }}>
            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Total Operational Expenses</h3>
                <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>
                  {formatCurrency(financialTelemetry.totalExpenses)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {financialTelemetry.expenseRatio}% of total revenue
                </div>
              </div>
              <div className="kpi-icon icon-amber">
                <ArrowDownRight size={22} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Total Billed Revenue</h3>
                <div className="kpi-value" style={{ color: 'var(--color-success)' }}>
                  {formatCurrency(financialTelemetry.totalRevenue)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Across {filteredEvents.length} events ({financialTelemetry.totalGuests.toLocaleString('en-IN')} Pax)
                </div>
              </div>
              <div className="kpi-icon icon-green">
                <IndianRupee size={22} />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Net Operating Profit</h3>
                {isAdminOrFinance ? (
                  <div>
                    <div className="kpi-value" style={{ color: financialTelemetry.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {formatCurrency(financialTelemetry.netProfit)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Operating Margin: <strong>{financialTelemetry.profitMargin}%</strong>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="kpi-value" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={15} /> Restricted
                    </div>
                  </div>
                )}
              </div>
              <div className="kpi-icon icon-purple">
                {isAdminOrFinance ? <Percent size={22} /> : <Lock size={22} />}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Total Agency Commissions</h3>
                <div className="kpi-value" style={{ color: 'var(--color-primary)' }}>
                  {formatCurrency(financialTelemetry.totalCommissionCost)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Top Cost: <strong>{financialTelemetry.largestExpenseCat.name}</strong> ({financialTelemetry.largestExpenseCat.percentage}%)
                </div>
              </div>
              <div className="kpi-icon icon-blue">
                <DollarSign size={22} />
              </div>
            </div>
          </div>

          {/* Visualizations Row: Category Donut & Monthly Trend */}
          <div className="responsive-grid two-cols" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Chart 1: Category Expense Breakdown */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '390px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <PieChartIcon size={18} className="accent-text" />
                  <span>Expense Breakdown by Category</span>
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatCurrency(financialTelemetry.totalExpenses)} Total
                </span>
              </div>

              {financialTelemetry.totalExpenses > 0 ? (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financialTelemetry.categoryBreakdown.filter(c => c.amount > 0)}
                        cx="50%"
                        cy="48%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {financialTelemetry.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || PIE_PALETTE[index % PIE_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [formatCurrency(value), name]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No expense records found for the selected filter criteria.
                </div>
              )}
            </div>

            {/* Chart 2: Revenue vs Expenses Monthly Trend */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '390px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Monthly Revenue vs. Operational Expenses</span>
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
                    <span>Revenue</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }} />
                    <span>Expenses</span>
                  </span>
                </div>
              </div>

              {financialTelemetry.monthlyTrendData.length > 0 ? (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialTelemetry.monthlyTrendData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                        tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                      />
                      <Tooltip
                        formatter={(value, name) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Expenses']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                      <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No chronological monthly data available.
                </div>
              )}
            </div>

          </div>

          {/* Section 1: Detailed Category Expense Breakdown */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Category Expense Breakdown</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Audited operational expenses grouped by department and procurement category.
                </p>
              </div>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                {categoryBreakdownCount(financialTelemetry.categoryBreakdown)} Active Categories
              </span>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th>Share of Budget</th>
                    <th>Total Incurred Cost</th>
                    <th>% of Total Expenses</th>
                    <th>Key Allocation Drivers</th>
                  </tr>
                </thead>
                <tbody>
                  {financialTelemetry.categoryBreakdown.map(cat => {
                    const IconComponent = cat.icon;
                    return (
                      <tr key={cat.name}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color }}>
                              <IconComponent size={16} />
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</span>
                          </div>
                        </td>
                        <td style={{ minWidth: '140px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${cat.percentage}%`, height: '100%', background: cat.color, borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, width: '38px', textAlign: 'right' }}>{cat.percentage}%</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {formatCurrency(cat.amount)}
                        </td>
                        <td>
                          <span className="badge" style={{ background: `${cat.color}15`, color: cat.color, fontWeight: 700 }}>
                            {cat.percentage}% of Spend
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {cat.name === 'Raw Materials' && `Groceries, Dairy, Veg, Fuel (${financialTelemetry.materialCostList.length} items)`}
                          {cat.name === 'Staffing & Labor' && `Chefs, Waiters, Helpers & Agency Teams`}
                          {cat.name === 'Transport & Porters' && `Delivery Trucks, Fuel Odometer Trips & Event Site Porters`}
                          {cat.name === 'Venue Rentals' && `Hall & Convention Center booking fees`}
                          {cat.name === 'Agency Commission' && `Booking agent, venue promoter & planner commissions`}
                          {cat.name === 'Miscellaneous Overheads' && `Generator fuel, consumables, sanitization, site permits`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Vendor & Supplier Spending Breakdown */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Store size={18} className="accent-text" />
                  <span>Vendor & Supplier Spend Analysis</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Which third-party vendors and suppliers are receiving the largest procurement disbursements?
                </p>
              </div>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                {financialTelemetry.vendorSpendList.length} Vendors Recorded
              </span>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Category</th>
                    <th>Items Supplied</th>
                    <th>Total Spend</th>
                    <th>% of Materials Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {financialTelemetry.vendorSpendList.map(v => (
                    <tr key={v.name}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.name}</div>
                        {v.contact && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{v.contact}</div>}
                      </td>
                      <td>
                        <span className="badge badge-info">{v.category}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{v.itemsList}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{v.itemCount} unique items</div>
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {formatCurrency(v.totalCost)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '80px', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${v.percentage}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{v.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {financialTelemetry.vendorSpendList.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No supplier allocations recorded for the selected events.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: High-Cost Materials Consumption Analysis */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShoppingBag size={18} className="accent-text" />
                  <span>High-Cost Ingredients & Material Consumption</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Individual materials and provisions sorted by total financial consumption.
                </p>
              </div>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                {financialTelemetry.materialCostList.length} Items Consumed
              </span>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ingredient / Material Name</th>
                    <th>Category</th>
                    <th>Total Qty Consumed</th>
                    <th>Total Expenditure</th>
                    <th>% of Food Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {financialTelemetry.materialCostList.slice(0, 15).map(m => (
                    <tr key={m.name}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</td>
                      <td>
                        <span className="badge badge-info">{m.category}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {m.totalQty.toLocaleString('en-IN')} {m.unit}
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {formatCurrency(m.totalCost)}
                      </td>
                      <td>
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {m.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {financialTelemetry.materialCostList.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No material consumption logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Event-Wise Profitability & Commission Ledger */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={18} className="accent-text" />
                  <span>Event-Wise Cost & Profitability Ledger</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Audit pro-forma expenses, commission deductions, and net margins for each booked event.
                </p>
              </div>
              <span className="badge badge-success" style={{ fontWeight: 700 }}>
                {filteredEvents.length} Events Audited
              </span>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Event ID & Customer</th>
                    <th>Date & Occasion</th>
                    <th>Guests</th>
                    <th>Revenue</th>
                    <th>Total Expenses</th>
                    <th>Commission Paid</th>
                    <th>Net Profit</th>
                    <th>Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(e => {
                    const eGuests = e.subFunctions && e.subFunctions.length > 0
                      ? e.subFunctions.reduce((sum, sf) => sum + (parseInt(sf?.guestCount, 10) || 0), 0)
                      : (parseInt(e.guestCount, 10) || 0);

                    const pricePerPlate = e.billing?.pricePerPlate || 800;
                    const evRev = e.billing?.totalAmount || (eGuests * pricePerPlate);

                    const manualCosts = (e.manualMaterials || []).reduce((sum, m) => sum + (Number(m.totalCost) || 0), 0);
                    const rmCost = manualCosts > 0 ? manualCosts : (Number(e.execution?.costs?.rawMaterialsCost) || 0);
                    const lbCost = Number(e.execution?.costs?.laborCost) || 0;
                    const trCost = Number(e.transport?.totalTransportCost) || Number(e.execution?.costs?.transportCost) || 0;
                    const vnCost = Number(e.execution?.costs?.venueRent) || 0;
                    const ovCost = Number(e.execution?.costs?.otherExpenses) || 0;

                    const commRate = Number(e.billing?.commissionRate) || 0;
                    const cmCost = e.execution?.costs?.commissionCost !== undefined
                      ? Number(e.execution.costs.commissionCost)
                      : (e.billing?.commissionAmount !== undefined ? Number(e.billing.commissionAmount) : parseFloat(((evRev * commRate) / 100).toFixed(2)));

                    const evExpenses = rmCost + lbCost + trCost + vnCost + ovCost + cmCost;
                    const evProfit = evRev - evExpenses;
                    const evMargin = evRev > 0 ? ((evProfit / evRev) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={e.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{e.customer?.name || 'Customer'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ID: {e.id}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{e.date || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{e.eventType || 'Catering'}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{eGuests} Pax</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(evRev)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatCurrency(evExpenses)}</td>
                        <td>
                          {cmCost > 0 ? (
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              {formatCurrency(cmCost)} ({commRate}%)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 800, color: evProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {formatCurrency(evProfit)}
                        </td>
                        <td>
                          <span
                            className={`badge ${Number(evMargin) >= 20 ? 'badge-success' : Number(evMargin) >= 10 ? 'badge-warning' : 'badge-danger'}`}
                            style={{ fontWeight: 700 }}
                          >
                            {evMargin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No events match current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB 2: EXECUTIVE REVENUE OVERVIEW ===== */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid-kpis" style={{ marginBottom: '2rem' }}>
            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Total Expected Revenue</h3>
                <div className="kpi-value">{formatCurrency(financialTelemetry.totalRevenue)}</div>
              </div>
              <div className="kpi-icon icon-green"><IndianRupee size={24} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Total Events Booked</h3>
                <div className="kpi-value">{filteredEvents.length}</div>
              </div>
              <div className="kpi-icon icon-blue"><CalendarDays size={24} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Total Guests Served (Pax)</h3>
                <div className="kpi-value">{financialTelemetry.totalGuests.toLocaleString('en-IN')}</div>
              </div>
              <div className="kpi-icon icon-purple"><Users size={24} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-details">
                <h3>Net Profit Margin</h3>
                {isAdminOrFinance ? (
                  <div>
                    <div className="kpi-value" style={{ color: 'var(--color-success)' }}>
                      {formatCurrency(financialTelemetry.netProfit)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Margin: <strong>{financialTelemetry.profitMargin}%</strong>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="kpi-value" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={15} /> Restricted to Admin
                    </div>
                  </div>
                )}
              </div>
              <div className="kpi-icon icon-amber">
                {isAdminOrFinance ? <Award size={24} /> : <Lock size={24} />}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Revenue Over Time</h3>
            <div style={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialTelemetry.monthlyTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for count
function categoryBreakdownCount(breakdown) {
  return breakdown.filter(c => c.amount > 0).length;
}

export default Reports;
