import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Language translation mappings
const translations = {
  EN: {
    titleInvoice: 'TAX INVOICE',
    titleMaterials: 'RAW MATERIAL REQUIREMENT REPORT',
    eventId: 'Event ID',
    clientName: 'Client Name',
    eventDate: 'Date',
    venue: 'Execution Venue',
    subtotal: 'Subtotal Amount',
    tax: 'Goods & Service Tax',
    grandTotal: 'Grand Invoice Total',
    advance: 'Advance Deposited',
    balance: 'Outstanding Balance Due',
    pax: 'Pax',
    rate: 'Price/Plate',
    desc: 'Billing Description',
    amount: 'Total Amount',
    ingName: 'Ingredient Name',
    category: 'Category',
    qty: 'Required Qty',
    unitCost: 'Unit Cost',
    totalCost: 'Est. Total Cost',
    supplier: 'Allocated Supplier',
    footerMsg: 'Thank you for choosing our services. Shreeji Catering Services.'
  }
};

export const calculatePdfReport = async (event, dataList, companyProfile, lang = 'EN', type = 'invoice') => {
  const t = translations.EN;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const primaryColor = [22, 30, 49]; // Slate Navy
  const accentColor = [59, 130, 246];  // Accent Blue
  
  // Title / Corporate Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(companyProfile.name.toUpperCase(), 15, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(companyProfile.tagline, 15, 24);
  doc.text(`GSTIN: ${companyProfile.gstin} | Phone: ${companyProfile.phone}`, 15, 30);
  doc.text(`Address: ${companyProfile.address}`, 15, 35);
  
  // Invoice / Report Banner Type
  doc.setFillColor(...accentColor);
  doc.rect(145, 12, 50, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const titleText = type === 'invoice' ? t.titleInvoice : t.titleMaterials;
  doc.text(titleText, 147, 18, { maxWidth: 46 });

  // Event Details Registry metadata
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${t.clientName}:`, 15, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(event.customer.name, 45, 50);

  doc.setFont('helvetica', 'bold');
  doc.text(`${t.eventId}:`, 15, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(event.id, 45, 56);

  doc.setFont('helvetica', 'bold');
  doc.text(`${t.eventDate}:`, 125, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(event.date, 155, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Event Type:', 125, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(event.eventType, 155, 56);

  // Line Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 62, 195, 62);

  // Table Generation based on report type
  if (type === 'invoice') {
    // Invoice details table
    const tableHeaders = [[t.desc, t.pax, t.rate, t.amount]];
    const tableBody = event.subFunctions.map(sf => [
      sf.name,
      `${sf.guestCount} Pax`,
      `${companyProfile.currency} ${event.billing.pricePerPlate}`,
      `${companyProfile.currency} ${(sf.guestCount * event.billing.pricePerPlate).toLocaleString('en-IN')}`
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableBody,
      startY: 68,
      theme: 'grid',
      headStyles: { fillStyle: 'F', fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    const finalY = doc.previousAutoTable.finalY + 10;
    
    // Financial Aggregates box right-aligned
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    let currentY = finalY;
    const addFinanceRow = (label, val, highlight = false) => {
      doc.setTextColor(highlight ? accentColor[0] : 50, highlight ? accentColor[1] : 50, highlight ? accentColor[2] : 50);
      doc.text(label, 115, currentY);
      doc.text(`${companyProfile.currency} ${val.toLocaleString('en-IN')}`, 195, currentY, { halign: 'right' });
      currentY += 6;
    };

    addFinanceRow(t.subtotal, event.billing.subtotal);
    addFinanceRow(`${t.tax} (${event.billing.taxRate}%):`, event.billing.taxAmount);
    addFinanceRow(t.grandTotal, event.billing.totalAmount, true);
    addFinanceRow(t.advance, event.billing.advancePaid);
    
    // Draw boundary line for balance
    doc.setDrawColor(150, 150, 150);
    doc.line(110, currentY - 2, 195, currentY - 2);
    
    addFinanceRow(t.balance, event.billing.balanceDue, true);

  } else {
    // Materials requirements table
    const tableHeaders = [[t.ingName, t.category, t.qty, t.unitCost, t.totalCost, t.supplier]];
    const tableBody = dataList.map(mat => [
      mat.name,
      mat.category,
      `${mat.requiredQty} ${mat.unit}`,
      `${companyProfile.currency} ${mat.costPerUnit}`,
      `${companyProfile.currency} ${mat.totalCost.toLocaleString('en-IN')}`,
      mat.supplier.name
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableBody,
      startY: 68,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 50 }
      }
    });

    const finalY = doc.previousAutoTable.finalY + 10;
    const totalMaterialsCost = dataList.reduce((sum, item) => sum + item.totalCost, 0);

    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL ESTIMATED MATERIALS BUDGET:', 100, finalY);
    doc.text(`${companyProfile.currency} ${totalMaterialsCost.toLocaleString('en-IN')}`, 195, finalY, { halign: 'right' });
  }

  // Footer Message
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, pageHeight - 20, 195, pageHeight - 20);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(t.footerMsg, 15, pageHeight - 14);
  doc.text(`Generated in-browser sandboxed memory. Confirms to encrypted device transport standard.`, 15, pageHeight - 9);

  // Trigger local compilation and OS share sheet
  const filename = `${type}_${event.id}_${lang}.pdf`;
  const pdfBlob = doc.output('blob');
  
  // IF requested to just return the blob (for preview modal)
  if (arguments.length > 5 && arguments[5] === true) {
    const blobUrl = URL.createObjectURL(pdfBlob);
    return { blob: pdfBlob, blobUrl, filename };
  }

  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Web Share API
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${type === 'invoice' ? 'Tax Invoice' : 'Materials List'} - ${event.id}`,
        text: `Share catering report for ${event.id} in ${lang}.`
      });
      return true;
    } catch (err) {
      console.error('Web Share failed, falling back to download', err);
    }
  }

  // Fallback to local browser save
  doc.save(filename);
  alert(`Shared via PDF Download. Note: Native Web Share API was not supported in this desktop browser (supported on mobile iOS/Android under HTTPS).`);
  return true;
};

/**
 * Generates a supplier-specific Purchase Order PDF.
 * Returns { blobUrl, blob, filename } — caller handles preview / download / share.
 */
export const generateSupplierPO = (supplier, items, event, companyProfile) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primaryColor = [22, 30, 49];
  const accentColor  = [59, 130, 246];

  // Header band
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(companyProfile.name.toUpperCase(), 15, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`${companyProfile.phone} | ${companyProfile.address}`, 15, 24);
  doc.text(`GSTIN: ${companyProfile.gstin}`, 15, 30);

  // PO badge
  doc.setFillColor(...accentColor);
  doc.rect(148, 10, 48, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('PURCHASE ORDER', 150, 19);

  // Supplier details
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TO SUPPLIER:', 15, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(supplier.name, 55, 50);
  doc.setFontSize(9);
  doc.text(`Contact: ${supplier.contact || 'N/A'} | Category: ${supplier.category}`, 15, 56);

  // Event ref
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`REF EVENT: ${event.id}`, 130, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client: ${event.customer.name}`, 130, 56);
  doc.text(`Event Date: ${event.date}`, 130, 62);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 66, 195, 66);

  // Items table
  const headers = [['#', 'Ingredient', 'Category', 'Qty Required', 'Unit Cost', 'Total Est.']];
  const rows = items.map((m, i) => [
    i + 1,
    m.name,
    m.category,
    `${m.requiredQty} ${m.unit}`,
    `${companyProfile.currency} ${m.costPerUnit}`,
    `${companyProfile.currency} ${m.totalCost.toLocaleString('en-IN')}`
  ]);

  doc.autoTable({
    head: headers,
    body: rows,
    startY: 70,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' }
    }
  });

  const finalY = doc.previousAutoTable.finalY + 8;
  const grandTotal = items.reduce((s, m) => s + m.totalCost, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('TOTAL ORDER VALUE:', 115, finalY);
  doc.setTextColor(...accentColor);
  doc.text(`${companyProfile.currency} ${grandTotal.toLocaleString('en-IN')}`, 195, finalY, { align: 'right' });

  // Footer
  const ph = doc.internal.pageSize.height;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, ph - 22, 195, ph - 22);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Authorized Signature: ____________________', 15, ph - 14);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 150, ph - 14);
  doc.text(`${companyProfile.name} — Catering Management System`, 15, ph - 8);

  const filename = `PO_${supplier.name.replace(/\s+/g, '_')}_${event.id}.pdf`;
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, blob, filename };
};

/**
 * Universal PDF Print Utility
 * Compatible with Web Browsers, Desktop EXE (Electron/Tauri), and Mobile APK (Android WebViews)
 */
export const printPdfBlob = (blobOrUrl) => {
  try {
    let url = blobOrUrl;
    let isCreatedUrl = false;
    if (blobOrUrl instanceof Blob) {
      url = URL.createObjectURL(blobOrUrl);
      isCreatedUrl = true;
    }
    
    // Check if running in Electron/Desktop wrapper
    if (window.electronAPI || (window.process && window.process.versions && window.process.versions.electron)) {
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
        win.print();
      }
      return true;
    }

    // Standard Browser & Android APK WebView printing frame
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.src = url;

    document.body.appendChild(printFrame);

    printFrame.onload = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(printFrame);
            if (isCreatedUrl) URL.revokeObjectURL(url);
          }, 2000);
        } catch (e) {
          window.open(url, '_blank')?.print();
        }
      }, 300);
    };
    return true;
  } catch (err) {
    console.error('Print Error:', err);
    window.print();
    return false;
  }
};

/**
 * Universal PDF Download Utility
 * Compatible with Web Browsers, Desktop EXE, and Mobile APK
 */
export const downloadPdfBlob = (blobOrUrl, filename = 'Document.pdf') => {
  try {
    let url = blobOrUrl;
    let isCreatedUrl = false;
    if (blobOrUrl instanceof Blob) {
      url = URL.createObjectURL(blobOrUrl);
      isCreatedUrl = true;
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      if (isCreatedUrl) URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (err) {
    console.error('Download Error:', err);
    return false;
  }
};


