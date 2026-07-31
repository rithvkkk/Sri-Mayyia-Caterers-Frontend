import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { calculatePdfReport, printPdfBlob, downloadPdfBlob } from '../utils/pdfGenerator';
import { DollarSign, FileText, CheckCircle2, AlertCircle, Share2, ShieldAlert, Sliders, Eye, Download, X, Lock, Printer } from 'lucide-react';

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
  
  const currentEvent = events.find(e => e.id === selectedEventId);
  const isFinance = currentRole === 'Admin' || currentRole === 'Accountant';
  const hasAccess = currentRole !== 'Chef' && currentRole !== 'Agency';

  if (!hasAccess) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Quotation and invoice details are restricted for Chef and Agency roles. Please log in as an Admin, Manager, or Accountant.
        </p>
      </div>
    );
  }

  // Update specific billing details
  const handleBillingChange = (field, value) => {
    if (!isFinance) return;

    const val = parseFloat(value) || 0;
    
    // Update target structure
    const updatedEvent = {
      ...currentEvent,
      billing: {
        ...currentEvent.billing,
        [field]: val
      }
    };

    // Trigger context calculation
    events.forEach(e => {
      if (e.id === currentEvent.id) {
        e.billing[field] = val;
      }
    });

    refreshEventTotals(selectedEventId);
  };

  const handleOtherExpenseChange = (value) => {
    if (!isFinance) return;
    const val = parseFloat(value) || 0;
    
    events.forEach(e => {
      if (e.id === currentEvent.id) {
        e.execution.costs.otherExpenses = val;
      }
    });
    
    refreshEventTotals(selectedEventId);
  };

  // Compile calculations
  const venueObj = currentEvent ? venues.find(v => v.id === currentEvent.venueId) : null;
  const rawMaterialList = currentEvent ? calculateEventRawMaterials(currentEvent) : [];
  const rawMaterialsCost = currentEvent ? currentEvent.execution.costs.rawMaterialsCost : 0;
  const laborCost = currentEvent ? currentEvent.execution.costs.laborCost : 0;
  const venueRent = currentEvent ? currentEvent.execution.costs.venueRent : 0;
  const otherExpenses = currentEvent ? currentEvent.execution.costs.otherExpenses : 0;

  const totalCost = rawMaterialsCost + laborCost + venueRent + otherExpenses;
  const totalGuests = currentEvent ? currentEvent.subFunctions.reduce((sum, sf) => sum + sf.guestCount, 0) : 0;
  
  const revenue = currentEvent ? currentEvent.billing.subtotal : 0;
  const taxAmount = currentEvent ? currentEvent.billing.taxAmount : 0;
  const grandTotal = currentEvent ? currentEvent.billing.totalAmount : 0;
  const advancePaid = currentEvent ? currentEvent.billing.advancePaid : 0;
  const balanceDue = currentEvent ? currentEvent.billing.balanceDue : 0;
  
  const estimatedProfit = Math.max(0, revenue - totalCost);
  const profitMarginPercent = revenue > 0 ? (estimatedProfit / revenue) * 100 : 0;

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
      // If downloaded directly without previewing first
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Quotation & Financial Invoices</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Audit event profit margins, record advances, and compile official invoices.</p>
        </div>

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

      {currentEvent ? (
        <div className="responsive-grid two-cols-left-heavy">
          
          {/* Left Column: Financial Audit & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Markup Controls (finance edits) */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} className="accent-text" />
                <span>Financial Markup Controls</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Price Per Plate:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{companyProfile.currency} {currentEvent.billing.pricePerPlate}</span>
                  </label>
                  <input
                    type="range"
                    min="300"
                    max="3000"
                    step="50"
                    value={currentEvent.billing.pricePerPlate}
                    onChange={e => handleBillingChange('pricePerPlate', e.target.value)}
                    disabled={!isFinance}
                    style={{ width: '100%', cursor: isFinance ? 'pointer' : 'not-allowed' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Min: ₹300</span>
                    <span>Max: ₹3,000</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Record Client Advance</label>
                    <input
                      className="form-input"
                      type="number"
                      value={advancePaid}
                      onChange={e => handleBillingChange('advancePaid', e.target.value)}
                      disabled={!isFinance}
                      placeholder="₹ Paid"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax Rate (GST %)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={currentEvent.billing.taxRate}
                      onChange={e => handleBillingChange('taxRate', e.target.value)}
                      disabled={!isFinance}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Record Miscellaneous / Other Expenses</label>
                  <input
                    className="form-input"
                    type="number"
                    value={otherExpenses}
                    onChange={e => handleOtherExpenseChange(e.target.value)}
                    disabled={!isFinance}
                    placeholder="Log overheads..."
                  />
                </div>
              </div>
            </div>

            {/* Event Cost Breakdown Ledger */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Pro-Forma Cost Matrix</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Venue Rental Fee:</span>
                  <span>{companyProfile.currency} {venueRent.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Raw Ingredients Total:</span>
                  <span>{companyProfile.currency} {rawMaterialsCost.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Staffing Labor Total:</span>
                  <span>{companyProfile.currency} {laborCost.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Overhead Expenses:</span>
                  <span>{companyProfile.currency} {otherExpenses.toLocaleString('en-IN')}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, padding: '0.5rem 0' }}>
                  <span>Total Event Expenses:</span>
                  <span style={{ color: 'var(--color-danger)' }}>{companyProfile.currency} {totalCost.toLocaleString('en-IN')}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--color-success)', marginTop: '0.25rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>Estimated Net Margin:</div>
                  <div style={{ textAlign: 'right' }}>
                    {currentRole === 'Admin' ? (
                      <>
                        <div style={{ fontWeight: 700 }}>{companyProfile.currency} {estimatedProfit.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{profitMarginPercent.toFixed(1)}% margin ratio</div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', paddingTop: '0.2rem' }}>
                        <Lock size={12} /> Restricted to Admin
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Invoice Preview */}
          <div className="glass-card" style={{ border: '1px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{companyProfile.address}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GSTIN: {companyProfile.gstin}</p>
              </div>

              {/* Bill Details */}
              <div className="responsive-grid two-cols" style={{ gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                <div>
                  <div><strong>Invoice To:</strong></div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentEvent.customer.name}</div>
                  <div>Phone: {currentEvent.customer.phone}</div>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sf.guestCount} guests @ {companyProfile.currency} {currentEvent.billing.pricePerPlate}/plate</div>
                    </div>
                    <span style={{ fontWeight: 600 }}>{companyProfile.currency} {(sf.guestCount * currentEvent.billing.pricePerPlate).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Invoicing calculation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', paddingLeft: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal Taxable Amount:</span>
                  <span>{companyProfile.currency} {revenue.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST Goods & Service Tax ({currentEvent.billing.taxRate}%):</span>
                  <span>{companyProfile.currency} {taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span>Grand Invoice Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{companyProfile.currency} {grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                  <span>Advance Deposited:</span>
                  <span>{companyProfile.currency} {advancePaid.toLocaleString('en-IN')}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', color: balanceDue > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  <span>Outstanding Balance Due:</span>
                  <span>{companyProfile.currency} {balanceDue.toLocaleString('en-IN')}</span>
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
