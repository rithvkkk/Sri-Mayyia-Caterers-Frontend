import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { calculatePdfReport, printPdfBlob, downloadPdfBlob } from '../utils/pdfGenerator';
import {
  IndianRupee, FileText, CheckCircle2, AlertCircle, Share2, ShieldAlert,
  Sliders, Eye, Download, X, Lock, Printer, Truck, UserCheck, Plus, Trash2,
  TrendingUp, Percent, Sparkles, Droplets, Brain, Calculator, XCircle, AlertTriangle, Check
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (events && events.length > 0) {
      if (!selectedEventId || !events.some(e => e.id === selectedEventId)) {
        setSelectedEventId(events[0].id);
      }
    }
  }, [events, selectedEventId]);
  
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
  const roleLower = (currentRole || 'admin').toLowerCase();
  const isFinance = !currentRole || roleLower === 'admin' || roleLower === 'hr' || roleLower === 'hr manager' || roleLower === 'accountant' || roleLower.includes('admin') || roleLower.includes('account');
  const hasAccess = !currentRole || (roleLower !== 'chef' && roleLower !== 'agency');

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
  const formatCurrency = (amt) => `${companyProfile?.currency || '₹'} ${Number(amt || 0).toLocaleString('en-IN')}`;

  // Update specific billing details
  const handleBillingChange = (field, value) => {
    if (!currentEvent) return;
    let val = value;
    if (field === 'pricePerPlate' || field === 'advancePaid' || field === 'taxRate') {
      val = parseFloat(value) || 0;
    }
    
    const updatedBilling = {
      ...(currentEvent.billing || {}),
      [field]: val
    };

    if (field === 'taxType') {
      if (value === 'NON_GST') {
        updatedBilling.taxType = 'NON_GST';
        updatedBilling.taxRate = 0;
      } else {
        updatedBilling.taxType = 'GST';
        if (!updatedBilling.taxRate || Number(updatedBilling.taxRate) === 0) {
          updatedBilling.taxRate = 5;
        }
      }
    }
    
    const updatedEvent = {
      ...currentEvent,
      billing: updatedBilling
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
  const costPerPlate = totalGuests > 0 ? (totalCost / totalGuests) : 0;
  
  // Customer Bargain Simulator State & Sync
  const [bargainPriceInput, setBargainPriceInput] = useState(() => currentEvent?.billing?.pricePerPlate || 650);

  useEffect(() => {
    if (currentEvent?.billing?.pricePerPlate) {
      setBargainPriceInput(currentEvent.billing.pricePerPlate);
    }
  }, [selectedEventId, currentEvent?.billing?.pricePerPlate]);

  // Bargain Calculations
  const bargainedPrice = parseFloat(bargainPriceInput) || 0;
  const bargainedSubtotal = totalGuests * bargainedPrice;
  const bargainedProfit = bargainedSubtotal - totalCost;
  const bargainedMarginPercent = bargainedSubtotal > 0 ? (bargainedProfit / bargainedSubtotal) * 100 : 0;
  const floorPricePerPlate = totalGuests > 0 ? Math.ceil(totalCost / totalGuests) : 0;
  const recommendedPrice20 = totalGuests > 0 ? Math.ceil((totalCost / 0.80) / totalGuests) : 0;
  const recommendedPrice25 = totalGuests > 0 ? Math.ceil((totalCost / 0.75) / totalGuests) : 0;

  // Simulated Plate Price from Markup Slider
  const simulatedPlatePrice = costPerPlate > 0 ? Math.ceil(costPerPlate * (1 + markupPercent / 100)) : 0;

  const handleApplySimulatedPrice = () => {
    if (currentEvent && simulatedPlatePrice > 0) {
      const updated = {
        ...currentEvent,
        billing: {
          ...currentEvent.billing,
          pricePerPlate: simulatedPlatePrice
        }
      };
      updateEvent(updated);
      setBargainPriceInput(simulatedPlatePrice);
    }
  };

  // Invoice & Billing Computed Values
  const pricePerPlate = currentEvent?.billing?.pricePerPlate || 800;
  const advancePaid = currentEvent?.billing?.advancePaid || 0;
  const isGstEnabled = currentEvent?.billing?.taxType !== 'NON_GST';
  const taxRate = isGstEnabled ? (currentEvent?.billing?.taxRate !== undefined ? currentEvent.billing.taxRate : 5) : 0;
  const isInterState = Boolean(currentEvent?.billing?.isInterState);
  const revenue = totalGuests * pricePerPlate;
  const taxAmount = isGstEnabled ? (revenue * (taxRate / 100)) : 0;
  const cgstAmount = isGstEnabled && !isInterState ? (taxAmount / 2) : 0;
  const sgstAmount = isGstEnabled && !isInterState ? (taxAmount / 2) : 0;
  const igstAmount = isGstEnabled && isInterState ? taxAmount : 0;
  const grandTotal = revenue + taxAmount;
  const balanceDue = grandTotal - advancePaid;
  const profitAmount = revenue - totalCost;
  const estimatedProfit = profitAmount;
  const profitMarginPercent = revenue > 0 ? (profitAmount / revenue) * 100 : 0;

  // Determine Bargain Feasibility Status
  let bargainStatus = {
    badge: 'ACCEPT DEAL',
    badgeClass: 'badge-success',
    color: '#000000',
    bgColor: 'rgba(0,0,0,0.08)',
    borderColor: 'rgba(0,0,0,0.08)',
    icon: CheckCircle2,
    title: 'Highly Profitable Deal — Safe to Accept!',
    description: `At ${formatCurrency(bargainedPrice)}/plate, you make ${formatCurrency(bargainedProfit)} net profit (${bargainedMarginPercent.toFixed(1)}% margin).`
  };

  if (bargainedProfit < 0) {
    bargainStatus = {
      badge: 'REJECT DEAL (NET LOSS)',
      badgeClass: 'badge-danger',
      color: '#9C1519',
      bgColor: 'rgba(156, 21, 25, 0.12)',
      borderColor: 'rgba(156, 21, 25, 0.4)',
      icon: XCircle,
      title: 'REJECT DEAL — You Will Lose Money!',
      description: `Accepting ${formatCurrency(bargainedPrice)}/plate results in a NET LOSS of ${formatCurrency(Math.abs(bargainedProfit))}. Absolute minimum zero-profit floor price is ${formatCurrency(floorPricePerPlate)}/plate.`
    };
  } else if (bargainedMarginPercent < 10) {
    bargainStatus = {
      badge: 'HIGH RISK (MINIMAL PROFIT)',
      badgeClass: 'badge-warning',
      color: '#B88E4C',
      bgColor: 'rgba(210, 172, 103, 0.15)',
      borderColor: 'rgba(210, 172, 103, 0.4)',
      icon: AlertTriangle,
      title: 'High Risk Deal — Minimal Margin',
      description: `At ${formatCurrency(bargainedPrice)}/plate, your profit is only ${formatCurrency(bargainedProfit)} (${bargainedMarginPercent.toFixed(1)}% margin). Any ingredient over-consumption will turn this into a loss!`
    };
  } else if (bargainedMarginPercent < 20) {
    bargainStatus = {
      badge: 'ACCEPT WITH CAUTION',
      badgeClass: 'badge-warning',
      color: '#D2AC67',
      bgColor: 'rgba(210, 172, 103, 0.1)',
      borderColor: 'rgba(210, 172, 103, 0.3)',
      icon: AlertCircle,
      title: 'Tight Profit Margin',
      description: `At ${formatCurrency(bargainedPrice)}/plate, you earn ${formatCurrency(bargainedProfit)} (${bargainedMarginPercent.toFixed(1)}% margin). Acceptable, but keep tight control on food portioning.`
    };
  }

  const handlePreviewInvoice = async () => {
    if (!currentEvent) {
      alert('Please select an event before generating invoice.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const result = await calculatePdfReport(currentEvent, rawMaterialList, companyProfile, 'EN', 'invoice', true);
      if (result && result.blobUrl) {
        setInvoicePreview(result);
      } else {
        alert('Could not generate invoice preview.');
      }
    } catch (err) {
      console.error('Error previewing invoice:', err);
      alert('Failed to generate invoice preview: ' + (err?.message || 'Check event details'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadInvoice = async (previewResult = null) => {
    if (!currentEvent) {
      alert('Please select an event before downloading invoice.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const isDataObj = previewResult && (previewResult.blob || previewResult.blobUrl);
      const data = isDataObj ? previewResult : invoicePreview;
      if (data && (data.blob || data.blobUrl)) {
        downloadPdfBlob(data.blob || data.blobUrl, data.filename || `Invoice_${currentEvent?.id || 'doc'}.pdf`);
      } else {
        const result = await calculatePdfReport(currentEvent, rawMaterialList, companyProfile, 'EN', 'invoice', true);
        if (result && (result.blob || result.blobUrl)) {
          downloadPdfBlob(result.blob || result.blobUrl, result.filename || `Invoice_${currentEvent.id}.pdf`);
        } else {
          alert('Could not prepare invoice PDF for download.');
        }
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice PDF: ' + (err?.message || 'Check event details'));
    } finally {
      setIsGeneratingPdf(false);
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
    if (invoicePreview?.blobUrl) {
      try { URL.revokeObjectURL(invoicePreview.blobUrl); } catch (e) {}
    }
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
            
            {/* Customer Bargain Price & Profitability Decision Simulator */}
            <div className="glass-card" style={{ border: `1.5px solid ${bargainStatus.borderColor}`, background: bargainStatus.bgColor, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.55rem', color: bargainStatus.color, fontWeight: 700 }}>
                  <Calculator size={22} />
                  <span>Customer Bargain & Price Decision Simulator</span>
                </h3>
                <span className={`badge ${bargainStatus.badgeClass}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}>
                  {bargainStatus.badge}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.1rem' }}>
                If the customer bargains for a lower price per plate, enter their offered price here to instantly test if the event is profitable, risky, or loss-making!
              </p>

              <div className="responsive-grid two-cols" style={{ gap: '1rem', marginBottom: '1.1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Customer's Bargained Price Per Plate:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                      {companyProfile.currency}
                    </span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ paddingLeft: '2.2rem', fontSize: '1.25rem', fontWeight: 800, color: bargainStatus.color, border: `1.5px solid ${bargainStatus.borderColor}` }}
                      value={bargainPriceInput}
                      onChange={e => setBargainPriceInput(e.target.value)}
                      placeholder="e.g. 550"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Quick Price Floor Benchmarks:</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', fontWeight: 600 }}
                      onClick={() => setBargainPriceInput(floorPricePerPlate)}
                      title="Zero-profit cost per plate floor"
                    >
                      Abs Min Floor: {formatCurrency(floorPricePerPlate)}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', fontWeight: 600 }}
                      onClick={() => setBargainPriceInput(recommendedPrice20)}
                    >
                      20% Target: {formatCurrency(recommendedPrice20)}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', fontWeight: 600 }}
                      onClick={() => setBargainPriceInput(recommendedPrice25)}
                    >
                      25% Target: {formatCurrency(recommendedPrice25)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Bargain Feasibility Banner */}
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: `1px solid ${bargainStatus.borderColor}`, marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <bargainStatus.icon size={26} style={{ color: bargainStatus.color, flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: '1rem', margin: '0 0 0.25rem 0', color: bargainStatus.color, fontWeight: 700 }}>{bargainStatus.title}</h4>
                    <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-primary)' }}>{bargainStatus.description}</p>
                  </div>
                </div>

                {/* Metric Grid Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Direct Cost</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formatCurrency(totalCost)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Bargain Revenue</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formatCurrency(bargainedSubtotal)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Bargain Net Profit</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: bargainedProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {formatCurrency(bargainedProfit)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Profit Margin</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: bargainedMarginPercent >= 15 ? 'var(--color-success)' : (bargainedMarginPercent >= 0 ? 'var(--color-warning)' : 'var(--color-danger)') }}>
                      {bargainedMarginPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Abs Min Floor</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(floorPricePerPlate)}/pax</div>
                  </div>
                </div>
              </div>

              {/* Apply Bargain Button */}
              {isFinance && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => handleBillingChange('pricePerPlate', bargainedPrice)}
                  >
                    <Check size={16} /> Apply Bargained {formatCurrency(bargainedPrice)}/Plate to Event Invoice
                  </button>
                </div>
              )}
            </div>

            {/* Financial Markup Simulator & Controls */}
            <div className="glass-card" style={{ border: '1px solid rgba(255, 255, 255, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} className="accent-text" />
                  <span>Financial Markup Controls & Margin Simulator</span>
                </h3>
                <span className="badge badge-info">Cost per pax: {formatCurrency(costPerPlate)}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                {/* Target Markup Percentage Slider & Presets */}
                <div style={{ background: 'rgba(255, 255, 255, 0.65)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
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
                  <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(156, 21, 25, 0.06)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
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

                {/* Advance & GST Calculation Settings */}
                <div style={{ background: 'rgba(255, 255, 255, 0.55)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Taxation & Invoice Structure:</label>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className={`btn btn-small ${isGstEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleBillingChange('taxType', 'GST')}
                        disabled={!isFinance}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                      >
                        With GST (Tax Invoice)
                      </button>
                      <button
                        type="button"
                        className={`btn btn-small ${!isGstEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleBillingChange('taxType', 'NON_GST')}
                        disabled={!isFinance}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                      >
                        Without GST (Commercial Quote)
                      </button>
                    </div>
                  </div>

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
                    {isGstEnabled ? (
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <label className="form-label" style={{ margin: 0 }}>GST Rate (%)</label>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <input
                              type="checkbox"
                              checked={isInterState}
                              onChange={e => handleBillingChange('isInterState', e.target.checked)}
                              disabled={!isFinance}
                            />
                            Inter-State (IGST)
                          </label>
                        </div>
                        <select
                          className="form-select"
                          value={taxRate}
                          onChange={e => handleBillingChange('taxRate', parseFloat(e.target.value))}
                          disabled={!isFinance}
                        >
                          <option value="5">5% GST (Standard Catering)</option>
                          <option value="12">12% GST (Corporate Dining)</option>
                          <option value="18">18% GST (Luxury Full Service)</option>
                          <option value="0">0% GST (Exempted)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Invoice Category</label>
                        <input
                          className="form-input"
                          value="Non-GST Commercial Quotation / Bill of Supply"
                          disabled
                          style={{ fontSize: '0.78rem', background: 'rgba(0,0,0,0.04)' }}
                        />
                      </div>
                    )}
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
                <div style={{ fontWeight: 700, color: '#000000', fontSize: '1rem' }}>
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
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
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
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
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
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(6, 182, 212, 0.03) 100%)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#000000' }}>
                  <Droplets size={17} />
                  <span>Consumables & Logistics Telemetry</span>
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(156, 21, 25, 0.06)', color: '#000000', fontWeight: 600 }}>
                  Automated Buffers ({currentEvent.guestCount || 100} Pax)
                </span>
              </div>

              {/* Formula Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>300ml Water Bottles (1.25x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#000000' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.25)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Units</span>
                  </div>
                </div>

                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Finger Bowls & Lemons (1.15x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#000000' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.15)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Sets</span>
                  </div>
                </div>

                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>2-Ply Soft Napkins (1.30x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#000000' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.30)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Units</span>
                  </div>
                </div>

                <div style={{ padding: '0.5rem 0.65rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fresh Plantain Leaves (1.10x)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#000000' }}>
                    {Math.ceil((currentEvent.guestCount || 100) * 1.10)} <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Leaves</span>
                  </div>
                </div>
              </div>

              {/* Service Logistics & Hostesses */}
              <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
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
                  <span style={{ color: '#000000', fontWeight: 600 }}>{formatCurrency(transportCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Overhead Expenses:</span>
                  <span>{formatCurrency(otherExpenses)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, padding: '0.5rem 0' }}>
                  <span>Total Event Expenses:</span>
                  <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalCost)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(156, 21, 25, 0.06)', borderRadius: '8px', borderLeft: '3px solid var(--color-success)', marginTop: '0.25rem' }}>
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
                <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: 'rgba(156, 21, 25, 0.04)', borderRadius: '8px', border: '1px solid rgba(156, 21, 25, 0.12)', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Brain size={14} />
                      <span>Historical Learning Benchmark:</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#000000', fontWeight: 600 }}>20 Events Telemetry</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    Historical benchmark for <strong>{currentEvent.eventType}</strong> averages <strong>42.8% net margin</strong> (₹342/Pax food cost). Current quote delivers <strong>{profitMarginPercent.toFixed(1)}%</strong> ({profitMarginPercent >= 40 ? 'On Target' : 'Below Historical Target'}).
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Provisions & Kitchen Wastage Breakdown Card */}
            <div className="glass-card" style={{ border: '1px solid rgba(255, 255, 255, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calculator size={17} className="accent-text" />
                  <span>Itemized Provisions & Kitchen Wastage Breakdown</span>
                </h3>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  Standard 5% Wastage Buffer Applied
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Accurate mathematical material calculation across {totalGuests} Pax based on recipe portions, 5% buffer, and supplier price catalog.
              </div>

              {rawMaterialList.length > 0 ? (
                <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Material / Provision</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'center' }}>Base Qty</th>
                        <th style={{ textAlign: 'center' }}>+5% Wastage</th>
                        <th style={{ textAlign: 'center' }}>Total Required</th>
                        <th style={{ textAlign: 'right' }}>Cost / Unit</th>
                        <th style={{ textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawMaterialList.map((item, idx) => (
                        <tr key={item.materialId || idx}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td><span className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>{item.category}</span></td>
                          <td style={{ textAlign: 'center' }}>{item.baseQty || (item.requiredQty ? (item.requiredQty / 1.05).toFixed(2) : 0)} {item.unit}</td>
                          <td style={{ textAlign: 'center', color: 'var(--color-warning)' }}>
                            +{item.wastageBufferQty || (item.requiredQty ? (item.requiredQty - item.requiredQty / 1.05).toFixed(2) : 0)} {item.unit}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.requiredQty} {item.unit}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(item.costPerUnit)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(item.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'rgba(0,0,0,0.02)', fontWeight: 700 }}>
                        <td colSpan={6} style={{ textAlign: 'right' }}>Total Raw Materials & Provisions:</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
                          {formatCurrency(rawMaterialList.reduce((s, i) => s + (i.totalCost || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No menu items selected or recipe provisions configured for this event.
                </div>
              )}
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
                <button 
                  className="btn btn-secondary btn-small" 
                  onClick={handlePreviewInvoice} 
                  disabled={isGeneratingPdf}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Eye size={14} /> {isGeneratingPdf ? 'Processing...' : 'Preview'}
                </button>
                <button 
                  className="btn btn-primary btn-small" 
                  onClick={() => handleDownloadInvoice()} 
                  disabled={isGeneratingPdf}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Download size={14} /> {isGeneratingPdf ? 'Preparing...' : 'Download PDF'}
                </button>
              </div>
            </div>

            {/* Bill Sheet */}
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.5)' }}>
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
                
                {isGstEnabled ? (
                  <>
                    {!isInterState ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          <span>• CGST Central Tax ({(taxRate / 2).toFixed(1)}%):</span>
                          <span>{formatCurrency(cgstAmount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          <span>• SGST State Tax ({(taxRate / 2).toFixed(1)}%):</span>
                          <span>{formatCurrency(sgstAmount)}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <span>• IGST Integrated Tax ({taxRate}%):</span>
                        <span>{formatCurrency(igstAmount)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontSize: '0.78rem' }}>
                    <span>Taxation Format:</span>
                    <span>0% (Non-GST Commercial Quotation)</span>
                  </div>
                )}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1rem', background: 'rgba(156, 21, 25, 0.06)', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '20px', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <CheckCircle2 size={16} />
                    <span>INVOICE FULLY CLEARED</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 1rem', background: 'rgba(156, 21, 25, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '20px', color: 'var(--color-warning)', fontSize: '0.85rem', fontWeight: 600 }}>
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
          <IndianRupee size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
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

              <div style={{ padding: '0.75rem', background: 'rgba(156, 21, 25, 0.06)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

              <div style={{ padding: '0.75rem', background: 'rgba(156, 21, 25, 0.06)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <div className="modal-overlay" onClick={closePreview}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '820px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Tax Invoice Preview</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>{invoicePreview.filename}</p>
              </div>
              <button type="button" className="btn btn-secondary btn-small" onClick={closePreview}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ flexGrow: 1, padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', background: '#525659' }}>
              <iframe 
                src={invoicePreview.blobUrl} 
                style={{ width: '100%', height: '100%', border: 'none', flexGrow: 1 }}
                title="Invoice Preview"
              />
              <div style={{ padding: '0.45rem 1rem', background: '#f8fafc', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>PDF rendered successfully</span>
                <a 
                  href={invoicePreview.blobUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Open PDF in New Window / Tab
                </a>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-secondary)' }}>
              <button className="btn btn-secondary" onClick={() => invoicePreview && printPdfBlob(invoicePreview.blobUrl)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Printer size={16} /> Print Document
              </button>
              <button className="btn btn-secondary" onClick={() => handleDownloadInvoice(invoicePreview)} disabled={isGeneratingPdf} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Download size={16} /> Download PDF
              </button>
              <button className="btn btn-primary" onClick={handleShareNative} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

