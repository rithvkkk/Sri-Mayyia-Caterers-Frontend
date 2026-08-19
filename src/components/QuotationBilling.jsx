import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { calculatePdfReport, printPdfBlob, downloadPdfBlob } from '../utils/pdfGenerator';
import {
  DollarSign, FileText, CheckCircle2, AlertCircle, Share2, ShieldAlert,
  Sliders, Eye, Download, X, Lock, Printer, Truck, UserCheck, Plus, Trash2,
  TrendingUp, Percent, Sparkles, Droplets, Brain
} from 'lucide-react';

const QuotationBilling = () => {
  const {
    currentRole,
    events,
    updateEvent,
    venues,
    calculateEventRawMaterials,
    refreshEventTotals,
    companyProfile
  } = useContext(AppContext);

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [invoicePreview, setInvoicePreview] = useState(null);
  
  // Markup Simulator State
  const [markupPercent, setMarkupPercent] = useState(30); // 30% default target markup

  // Transport Modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    type: 'Mini Truck (Tata 407)',
    vehicleNumber: '',
    trips: 1,
    costPerTrip: 2500
  });

  const [showPorterModal, setShowPorterModal] = useState(false);
  const [porterForm, setPorterForm] = useState({
    count: 4,
    ratePerPorter: 600,
    shifts: 1
  });

  const currentEvent = events.find(e => e.id === selectedEventId);
  const isFinance = currentRole === 'Admin' || currentRole === 'HR' || currentRole === 'HR Manager' || currentRole === 'Accountant';
  const hasAccess = currentRole !== 'Chef' && currentRole !== 'Agency';

  if (!hasAccess) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Quotation and invoice details are restricted for Chef and Agency roles. Please log in as an Admin, HR, or Accountant.
        </p>
      </div>
    );
  }

  // Helper formatting
  const formatCurrency = (amt) => `${companyProfile.currency} ${Number(amt || 0).toLocaleString('en-IN')}`;

  // Update specific billing details
  const handleBillingChange = (field, value) => {
    if (!isFinance || !currentEvent) return;
    const val = parseFloat(value) || 0;
    
    const updatedEvent = {
      ...currentEvent,
      billing: {
        ...currentEvent.billing,
        [field]: val
      }
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  const handleOtherExpenseChange = (value) => {
    if (!isFinance || !currentEvent) return;
    const val = parseFloat(value) || 0;
    
    const updatedEvent = {
      ...currentEvent,
      execution: {
        ...currentEvent.execution,
        costs: {
          ...currentEvent.execution.costs,
          otherExpenses: val
        }
      }
    };
    
    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  // Transport Helpers
  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!isFinance || !currentEvent) return;
    const trips = parseInt(vehicleForm.trips, 10) || 1;
    const costPerTrip = parseFloat(vehicleForm.costPerTrip) || 0;
    const newVehicle = {
      type: vehicleForm.type,
      vehicleNumber: vehicleForm.vehicleNumber || 'Unassigned',
      trips,
      costPerTrip,
      totalCost: trips * costPerTrip
    };

    const currentVehicles = currentEvent.transport?.vehicles || [];
    const updatedVehicles = [...currentVehicles, newVehicle];
    const currentPorters = currentEvent.transport?.porters || [];
    
    const totalVehiclesCost = updatedVehicles.reduce((s, v) => s + (v.totalCost || 0), 0);
    const totalPortersCost = currentPorters.reduce((s, p) => s + (p.totalCost || 0), 0);
    const totalTransportCost = totalVehiclesCost + totalPortersCost;

    const updatedEvent = {
      ...currentEvent,
      transport: {
        vehicles: updatedVehicles,
        porters: currentPorters,
        totalTransportCost
      }
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
    setShowVehicleModal(false);
    setVehicleForm({ type: 'Mini Truck (Tata 407)', vehicleNumber: '', trips: 1, costPerTrip: 2500 });
  };

  const handleRemoveVehicle = (index) => {
    if (!isFinance || !currentEvent) return;
    const currentVehicles = currentEvent.transport?.vehicles || [];
    const updatedVehicles = currentVehicles.filter((_, i) => i !== index);
    const currentPorters = currentEvent.transport?.porters || [];
    
    const totalVehiclesCost = updatedVehicles.reduce((s, v) => s + (v.totalCost || 0), 0);
    const totalPortersCost = currentPorters.reduce((s, p) => s + (p.totalCost || 0), 0);
    const totalTransportCost = totalVehiclesCost + totalPortersCost;

    const updatedEvent = {
      ...currentEvent,
      transport: {
        vehicles: updatedVehicles,
        porters: currentPorters,
        totalTransportCost
      }
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  const handleAddPorter = (e) => {
    e.preventDefault();
    if (!isFinance || !currentEvent) return;
    const count = parseInt(porterForm.count, 10) || 1;
    const rate = parseFloat(porterForm.ratePerPorter) || 0;
    const shifts = parseFloat(porterForm.shifts) || 1;
    const newPorter = {
      count,
      ratePerPorter: rate,
      shifts,
      totalCost: count * rate * shifts
    };

    const currentVehicles = currentEvent.transport?.vehicles || [];
    const currentPorters = currentEvent.transport?.porters || [];
    const updatedPorters = [...currentPorters, newPorter];
    
    const totalVehiclesCost = currentVehicles.reduce((s, v) => s + (v.totalCost || 0), 0);
    const totalPortersCost = updatedPorters.reduce((s, p) => s + (p.totalCost || 0), 0);
    const totalTransportCost = totalVehiclesCost + totalPortersCost;

    const updatedEvent = {
      ...currentEvent,
      transport: {
        vehicles: currentVehicles,
        porters: updatedPorters,
        totalTransportCost
      }
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
    setShowPorterModal(false);
    setPorterForm({ count: 4, ratePerPorter: 600, shifts: 1 });
  };

  const handleRemovePorter = (index) => {
    if (!isFinance || !currentEvent) return;
    const currentVehicles = currentEvent.transport?.vehicles || [];
    const currentPorters = currentEvent.transport?.porters || [];
    const updatedPorters = currentPorters.filter((_, i) => i !== index);
    
    const totalVehiclesCost = currentVehicles.reduce((s, v) => s + (v.totalCost || 0), 0);
    const totalPortersCost = updatedPorters.reduce((s, p) => s + (p.totalCost || 0), 0);
    const totalTransportCost = totalVehiclesCost + totalPortersCost;

    const updatedEvent = {
      ...currentEvent,
      transport: {
        vehicles: currentVehicles,
        porters: updatedPorters,
        totalTransportCost
      }
    };

    updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
  };

  // Compile calculations
  const rawMaterialList = currentEvent ? calculateEventRawMaterials(currentEvent) : [];
  const rawMaterialsCost = currentEvent ? (currentEvent.execution?.costs?.rawMaterialsCost || 0) : 0;
  const laborCost = currentEvent ? (currentEvent.execution?.costs?.laborCost || 0) : 0;
  const transportCost = currentEvent ? (currentEvent.transport?.totalTransportCost || currentEvent.execution?.costs?.transportCost || 0) : 0;
  const venueRent = currentEvent ? (currentEvent.execution?.costs?.venueRent || 0) : 0;
  const otherExpenses = currentEvent ? (currentEvent.execution?.costs?.otherExpenses || 0) : 0;

  const totalCost = rawMaterialsCost + laborCost + transportCost + venueRent + otherExpenses;
  const totalGuests = currentEvent ? currentEvent.subFunctions.reduce((sum, sf) => sum + sf.guestCount, 0) : 0;
  
  // Cost per plate baseline
  const costPerPlate = totalGuests > 0 ? (totalCost / totalGuests) : 0;
  
  // Simulated plate price based on target markup percentage
  const simulatedPlatePrice = Math.ceil((costPerPlate * (1 + markupPercent / 100)) / 10) * 10;
  
  const revenue = currentEvent ? currentEvent.billing.subtotal : 0;
  const taxAmount = currentEvent ? currentEvent.billing.taxAmount : 0;
  const grandTotal = currentEvent ? currentEvent.billing.totalAmount : 0;
  const advancePaid = currentEvent ? currentEvent.billing.advancePaid : 0;
  const balanceDue = currentEvent ? currentEvent.billing.balanceDue : 0;
  
  const estimatedProfit = Math.max(0, revenue - totalCost);
  const profitMarginPercent = revenue > 0 ? (estimatedProfit / revenue) * 100 : 0;

  const handleApplySimulatedPrice = () => {
    if (!isFinance || !currentEvent) return;
    handleBillingChange('pricePerPlate', simulatedPlatePrice);
  };

  const handlePreviewInvoice = async () => {
    if (!currentEvent) return;
    const result = await calculatePdfReport(currentEvent, rawMaterialList, companyProfile, 'EN', 'invoice', true);
    if (result && result.blobUrl) {
      setInvoicePreview(result);
    }
  };

  const handleDownloadInvoice = async (previewResult = null) => {
    const data = previewResult || invoicePreview;
    if (data) {
      const a = document.createElement('a');
      a.href = data.blobUrl;
      a.download = data.filename;
      a.click();
    } else if (currentEvent) {
      const result = await calculatePdfReport(currentEvent, rawMaterialList, companyProfile, 'EN', 'invoice', true);
      if (result) {
        const a = document.createElement('a');
        a.href = result.blobUrl;
        a.download = result.filename;
        a.click();
      }
    }
  };

  const handleShareNative = async () => {
    if (!invoicePreview) return;
    const file = new File([invoicePreview.blob], invoicePreview.filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Tax Invoice - ${currentEvent.id}`,
          text: `Invoice for ${currentEvent.id}`
        });
        return;
      } catch (e) { console.warn('Share cancelled', e); }
    }
    handleDownloadInvoice();
    alert('Native share not available on this browser. PDF has been downloaded instead.');
  };

  const closePreview = () => {
    if (invoicePreview?.blobUrl) URL.revokeObjectURL(invoicePreview.blobUrl);
    setInvoicePreview(null);
  };

  const transportVehicles = currentEvent?.transport?.vehicles || [];
  const transportPorters = currentEvent?.transport?.porters || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Quotation, Markup & Financial Billing</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Audit pro-forma expenses, apply financial markup controls, manage transport/porters, and issue invoices.</p>
        </div>

        {currentEvent && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.id} - {e.customer?.name} ({e.eventType})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentEvent ? (
        <div className="responsive-grid two-cols-left-heavy">
          
          {/* Left Column: Financial Audit, Markup & Transport Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Financial Markup Simulator & Controls */}
            <div className="glass-card" style={{ border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} className="accent-text" />
                  <span>Financial Markup Controls & Margin Simulator</span>
                </h3>
                <span className="badge badge-info">Cost per pax: {formatCurrency(costPerPlate)}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                {/* Target Markup Percentage Slider & Presets */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                      Target Financial Markup: <strong style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>{markupPercent}%</strong>
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Over base event costs</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={markupPercent}
                    onChange={e => setMarkupPercent(parseInt(e.target.value, 10))}
                    disabled={!isFinance}
                    style={{ width: '100%', marginBottom: '0.75rem', cursor: 'pointer' }}
                  />

                  {/* Preset Markup Buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { label: '15% Economy', val: 15 },
                      { label: '25% Standard', val: 25 },
                      { label: '35% Premium', val: 35 },
                      { label: '50% Luxury', val: 50 }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setMarkupPercent(preset.val)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.55rem',
                          background: markupPercent === preset.val ? 'var(--primary-grad)' : 'rgba(255,255,255,0.04)',
                          color: markupPercent === preset.val ? '#fff' : 'var(--text-secondary)',
                          border: markupPercent === preset.val ? 'none' : '1px solid var(--border-color)'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Simulator Result Box */}
                  <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Simulated Selling Price at {markupPercent}% Markup:</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {formatCurrency(simulatedPlatePrice)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ plate</span>
                      </div>
                    </div>
                    {isFinance && (
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={handleApplySimulatedPrice}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                      >
                        <Sparkles size={14} /> Apply to Active Booking
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Price Per Plate Override */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Charged Price Per Plate:</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                      {formatCurrency(currentEvent.billing?.pricePerPlate || 800)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="300"
                    max="4000"
                    step="25"
                    value={currentEvent.billing?.pricePerPlate || 800}
                    onChange={e => handleBillingChange('pricePerPlate', e.target.value)}
                    disabled={!isFinance}
                    style={{ width: '100%', cursor: isFinance ? 'pointer' : 'not-allowed' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    <span>Min: ₹300</span>
                    <span>Max: ₹4,000</span>
                  </div>
                </div>

                {/* Advance & Tax row */}
                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Client Advance Deposit</label>
                    <input
                      className="form-input"
                      type="number"
                      value={advancePaid}
                      onChange={e => handleBillingChange('advancePaid', e.target.value)}
                      disabled={!isFinance}
                      placeholder="₹ Advance Deposited"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">GST Tax Rate (%)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={currentEvent.billing?.taxRate || 5}
                      onChange={e => handleBillingChange('taxRate', e.target.value)}
                      disabled={!isFinance}
                    />
                  </div>
                </div>

                {/* Miscellaneous Expenses */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Miscellaneous / Venue Overheads</label>
                  <input
                    className="form-input"
                    type="number"
                    value={otherExpenses}
                    onChange={e => handleOtherExpenseChange(e.target.value)}
                    disabled={!isFinance}
                    placeholder="Log venue overheads, generator fuel, etc."
                  />
                </div>

              </div>
            </div>

            {/* Transport & Porter Logistics Expense Manager */}
            <div className="glass-card" style={{ border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={18} className="accent-text" />
                    <span>Transport, Vehicles & Porter Expenses</span>
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                    Commercial delivery trucks, tempos, and event site porters.
                  </p>
                </div>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1rem' }}>
                  {formatCurrency(transportCost)} Total
                </div>
              </div>

              {/* Vehicles Logistics Segment */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Commercial Logistics Vehicles:</span>
                  {isFinance && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setShowVehicleModal(true)}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Plus size={12} /> Add Vehicle Trip
                    </button>
                  )}
                </div>

                {transportVehicles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {transportVehicles.map((veh, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{veh.type} ({veh.vehicleNumber})</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{veh.trips} Trip(s) @ {formatCurrency(veh.costPerTrip)}/trip</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(veh.totalCost)}</span>
                          {isFinance && (
                            <button className="btn btn-danger btn-small" onClick={() => handleRemoveVehicle(idx)} style={{ padding: '0.2rem 0.35rem' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.35rem 0' }}>
                    No vehicle transport entries recorded for this event.
                  </div>
                )}
              </div>

              {/* Porters & Loading Staff Segment */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Porter & Loading Labor Charges:</span>
                  {isFinance && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setShowPorterModal(true)}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Plus size={12} /> Add Porter Charges
                    </button>
                  )}
                </div>

                {transportPorters.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {transportPorters.map((prt, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{prt.count} Porter Staff Members</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{prt.shifts} Shift(s) @ {formatCurrency(prt.ratePerPorter)}/porter</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(prt.totalCost)}</span>
                          {isFinance && (
                            <button className="btn btn-danger btn-small" onClick={() => handleRemovePorter(idx)} style={{ padding: '0.2rem 0.35rem' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.35rem 0' }}>
                    No porter charges recorded for this event.
                  </div>
                )}
              </div>

            </div>

            {/* Consumables, Tableware & Parcel Logistics Matrix (Master Data Telemetry) */}
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                  <Droplets size={17} />
                  <span>Consumables & Logistics Telemetry</span>
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
                  Automated Buffers ({currentEvent.guestCount || 100} Pax)
                </span>
              </div>

              {/* Formula Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>300ml Water Bottles (1.25x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.25)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Units</span>
                  </div>
                </div>

                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Finger Bowls & Lemons (1.15x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#facc15' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.15)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Sets</span>
                  </div>
                </div>

                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>2-Ply Soft Napkins (1.30x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.30)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Units</span>
                  </div>
                </div>

                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fresh Plantain Leaves (1.10x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.10)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Leaves</span>
                  </div>
                </div>
              </div>

              {/* Service Logistics & Hostesses */}
              <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <UserCheck size={14} className="accent-text" />
                  <span>Service Staffing Allocations:</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>• Table Stewards: <strong>{Math.max(2, Math.ceil((currentEvent.guestCount || 100) * 0.04))} staff</strong></span>
                  <span>• Liquid Servers: <strong>{Math.max(1, Math.ceil((currentEvent.guestCount || 100) * 0.02))} staff</strong></span>
                  <span>• Hospitality Hostesses: <strong>2 Welcome + 1 Madalakki + 1 Tambula</strong></span>
                </div>
              </div>
            </div>

            {/* Event Cost Breakdown Ledger */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Pro-Forma Cost Matrix</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Venue Rental Fee:</span>
                  <span>{formatCurrency(venueRent)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Raw Materials Cost:</span>
                  <span>{formatCurrency(rawMaterialsCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Staffing Labour Total:</span>
                  <span>{formatCurrency(laborCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Transport & Porters Total:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(transportCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Overhead Expenses:</span>
                  <span>{formatCurrency(otherExpenses)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, padding: '0.5rem 0' }}>
                  <span>Total Event Expenses:</span>
                  <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalCost)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--color-success)', marginTop: '0.25rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>Estimated Net Margin:</div>
                  <div style={{ textAlign: 'right' }}>
                    {currentRole === 'Admin' || currentRole === 'HR' || currentRole === 'HR Manager' || currentRole === 'Accountant' ? (
                      <>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-success)' }}>{formatCurrency(estimatedProfit)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{profitMarginPercent.toFixed(1)}% margin ratio</div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', paddingTop: '0.2rem' }}>
                        <Lock size={12} /> Restricted
                      </div>
                    )}
                  </div>
                </div>

                {/* Historical Learning Intelligence Comparison */}
                <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: 'rgba(99, 102, 241, 0.06)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Brain size={14} />
                      <span>Historical Learning Benchmark:</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>20 Events Telemetry</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    Historical benchmark for <strong>{currentEvent.eventType}</strong> averages <strong>42.8% net margin</strong> (₹342/Pax food cost). Current quote delivers <strong>{profitMarginPercent.toFixed(1)}%</strong> ({profitMarginPercent >= 40 ? 'On Target' : 'Below Historical Target'}).
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Invoice Preview */}
          <div className="glass-card" style={{ border: '1px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <FileText size={18} className="accent-text" />
                <span>Invoice Registry</span>
              </h2>
              
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button className="btn btn-secondary btn-small" onClick={handlePreviewInvoice} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Eye size={14} /> Preview
                </button>
                <button className="btn btn-primary btn-small" onClick={() => handleDownloadInvoice()} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>

            {/* Bill Sheet */}
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.25rem', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">{companyProfile.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>{companyProfile.address}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>GSTIN: {companyProfile.gstin}</p>
              </div>

              {/* Bill Details */}
              <div className="responsive-grid two-cols" style={{ gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                <div>
                  <div><strong>Invoice To:</strong></div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentEvent.customer?.name}</div>
                  <div>Phone: {currentEvent.customer?.phone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Event File ID:</strong> {currentEvent.id}</div>
                  <div><strong>Execution Date:</strong> {currentEvent.date}</div>
                  <div><strong>Event Occasion:</strong> {currentEvent.eventType}</div>
                </div>
              </div>

              {/* Sub-functions Guest Summary List */}
              <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>Billing Description</span>
                  <span style={{ textAlign: 'right' }}>Taxable Amt</span>
                </div>
                {currentEvent.subFunctions.map(sf => (
                  <div key={sf.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <div>
                      <div>{sf.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sf.guestCount} guests @ {formatCurrency(currentEvent.billing?.pricePerPlate || 800)}/plate</div>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(sf.guestCount * (currentEvent.billing?.pricePerPlate || 800))}</span>
                  </div>
                ))}
              </div>

              {/* Invoicing calculation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', paddingLeft: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal Taxable Amount:</span>
                  <span>{formatCurrency(revenue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST Goods & Service Tax ({currentEvent.billing?.taxRate || 5}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span>Grand Invoice Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(grandTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                  <span>Advance Deposited:</span>
                  <span>{formatCurrency(advancePaid)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', color: balanceDue > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  <span>Outstanding Balance Due:</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </div>

              {/* Status footer */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                {balanceDue === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '20px', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <CheckCircle2 size={16} />
                    <span>INVOICE FULLY CLEARED</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '20px', color: 'var(--color-warning)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <AlertCircle size={16} />
                    <span>PARTIAL PAYMENTS PENDING</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <DollarSign size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p>Please configure an active booking to view invoice registries.</p>
        </div>
      )}

      {/* MODAL 1: ADD VEHICLE LOGISTICS */}
      {showVehicleModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '480px', width: '90%' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={18} className="accent-text" />
              <span>Add Vehicle Transport Trip</span>
            </h2>

            <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Vehicle Type</label>
                <select
                  value={vehicleForm.type}
                  onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="Mini Truck (Tata 407)">Mini Truck (Tata 407)</option>
                  <option value="Commercial Tempo (Bolero Maxi)">Commercial Tempo (Bolero Maxi)</option>
                  <option value="Large Logistics Truck (Eicher 17ft)">Large Logistics Truck (Eicher 17ft)</option>
                  <option value="Refrigerated / Cold Storage Van">Refrigerated / Cold Storage Van</option>
                  <option value="Staff Transport Bus/Van">Staff Transport Bus/Van</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Vehicle Reg. / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. TN-09-CD-5678 (Fast Logistics)"
                  value={vehicleForm.vehicleNumber}
                  onChange={e => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Number of Trips</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={vehicleForm.trips}
                    onChange={e => setVehicleForm({ ...vehicleForm, trips: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Cost Per Trip (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={vehicleForm.costPerTrip}
                    onChange={e => setVehicleForm({ ...vehicleForm, costPerTrip: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Calculated Vehicle Expense:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatCurrency((parseInt(vehicleForm.trips, 10) || 1) * (parseFloat(vehicleForm.costPerTrip) || 0))}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Vehicle Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PORTER CHARGES */}
      {showPorterModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: '480px', width: '90%' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={18} className="accent-text" />
              <span>Add Porter & Loading Charges</span>
            </h2>

            <form onSubmit={handleAddPorter} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Porter Staff Count</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={porterForm.count}
                    onChange={e => setPorterForm({ ...porterForm, count: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Rate Per Porter (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={porterForm.ratePerPorter}
                    onChange={e => setPorterForm({ ...porterForm, ratePerPorter: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Shifts Count</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={porterForm.shifts}
                  onChange={e => setPorterForm({ ...porterForm, shifts: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Calculated Porter Total:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatCurrency((parseInt(porterForm.count, 10) || 1) * (parseFloat(porterForm.ratePerPorter) || 0) * (parseFloat(porterForm.shifts) || 1))}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPorterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Porter Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {invoicePreview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Invoice Preview</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{invoicePreview.filename}</p>
              </div>
              <button type="button" className="btn btn-secondary btn-small" onClick={closePreview}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ flexGrow: 1, padding: 0, position: 'relative' }}>
              <iframe 
                src={invoicePreview.blobUrl} 
                style={{ width: '100%', height: '100%', border: 'none', background: '#333' }}
                title="Invoice Preview"
              />
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => invoicePreview && printPdfBlob(invoicePreview.blobUrl)}>
                <Printer size={16} /> Print Document
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadInvoice}>
                <Download size={16} /> Download PDF
              </button>
              <button className="btn btn-primary" onClick={handleShareNative}>
                <Share2 size={16} /> Share via Apps
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuotationBilling;

