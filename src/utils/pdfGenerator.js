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

export const calculatePdfReport = async (event, dataList, companyProfile, lang = 'EN', type = 'invoice', returnBlob = false) => {
  const ev = event || {};
  const cp = companyProfile || {};
  const t = (translations && translations[lang]) || translations.EN;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const primaryColor = [22, 30, 49]; // Slate Navy
  const accentColor = [59, 130, 246];  // Accent Blue
  
  const cpName = cp.name || 'Sri Mayyia Caterers';
  const cpTagline = cp.tagline || 'Traditional Caterers & Event Managers';
  const cpGstin = cp.gstin || 'N/A';
  const cpPhone = cp.phone || '';
  const cpAddress = cp.address || '';
  const cpCurrency = cp.currency || '₹';

  // Title / Corporate Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(cpName.toUpperCase(), 15, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(cpTagline, 15, 24);
  doc.text(`GSTIN: ${cpGstin} | Phone: ${cpPhone}`, 15, 30);
  doc.text(`Address: ${cpAddress}`, 15, 35);
  
  // Invoice / Report Banner Type
  doc.setFillColor(...accentColor);
  doc.rect(145, 12, 50, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const titleText = type === 'invoice' ? t.titleInvoice : t.titleMaterials;
  doc.text(titleText, 147, 18, { maxWidth: 46 });

  // Event Details Registry metadata
  const clientName = (ev.customer && typeof ev.customer === 'object' ? ev.customer.name : ev.customer) || 'Valued Client';
  const evId = ev.id || 'EVT-DOC';
  const evDate = ev.date || (ev.dates && ev.dates[0]) || new Date().toISOString().split('T')[0];
  const evType = ev.eventType || 'Catering Event';

  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${t.clientName}:`, 15, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, 45, 50);

  doc.setFont('helvetica', 'bold');
  doc.text(`${t.eventId}:`, 15, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(evId, 45, 56);

  doc.setFont('helvetica', 'bold');
  doc.text(`${t.eventDate}:`, 125, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(evDate, 155, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Event Type:', 125, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(evType, 155, 56);

  // Line Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 62, 195, 62);

  // Table Generation based on report type
  if (type === 'invoice') {
    // Invoice details table
    const subFunctions = Array.isArray(ev.subFunctions) && ev.subFunctions.length > 0
      ? ev.subFunctions
      : [{ id: 'sf-1', name: 'Main Function & Reception', guestCount: 100 }];

    const tableHeaders = [[t.desc, t.pax, t.rate, t.amount]];
    const tableBody = subFunctions.map(sf => {
      const gCount = parseInt(sf.guestCount, 10) || 0;
      const pRate = parseFloat(ev.billing?.pricePerPlate) || 800;
      return [
        sf.name || 'Catering Function',
        `${gCount} Pax`,
        `${cpCurrency} ${pRate.toLocaleString('en-IN')}`,
        `${cpCurrency} ${Number(gCount * pRate).toLocaleString('en-IN')}`
      ];
    });

    doc.autoTable({
      head: tableHeaders,
      body: tableBody,
      startY: 68,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    const finalY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 100) + 10;
    
    // Financial Aggregates box right-aligned
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    let currentY = finalY;
    const addFinanceRow = (label, val, highlight = false, isRawText = false) => {
      doc.setFont('helvetica', highlight ? 'bold' : 'normal');
      doc.setTextColor(highlight ? accentColor[0] : 50, highlight ? accentColor[1] : 50, highlight ? accentColor[2] : 50);
      doc.text(label, 115, currentY);
      const textVal = isRawText ? String(val) : `${cpCurrency} ${Number(val || 0).toLocaleString('en-IN')}`;
      doc.text(textVal, 195, currentY, { align: 'right' });
      currentY += 6;
    };

    const isGst = ev.billing?.taxType !== 'NON_GST' && Number(ev.billing?.taxRate) !== 0;
    const isInter = Boolean(ev.billing?.isInterState);
    const taxRate = isGst ? (ev.billing?.taxRate !== undefined ? Number(ev.billing.taxRate) : 5) : 0;
    const totalPax = subFunctions.reduce((s, sf) => s + (parseInt(sf.guestCount, 10) || 0), 0) || 100;
    const subtotalAmt = ev.billing?.subtotal || (totalPax * (ev.billing?.pricePerPlate || 800));
    const taxAmt = isGst ? (subtotalAmt * (taxRate / 100)) : 0;
    const grandAmt = subtotalAmt + taxAmt;
    const balAmt = grandAmt - (ev.billing?.advancePaid || 0);

    addFinanceRow(t.subtotal, subtotalAmt);
    if (isGst) {
      if (!isInter) {
        addFinanceRow(`CGST (${(taxRate / 2).toFixed(1)}%):`, taxAmt / 2);
        addFinanceRow(`SGST (${(taxRate / 2).toFixed(1)}%):`, taxAmt / 2);
      } else {
        addFinanceRow(`IGST (${taxRate}%):`, taxAmt);
      }
    } else {
      addFinanceRow(`Taxation Mode:`, `Non-GST (0%)`, false, true);
    }
    addFinanceRow(t.grandTotal, grandAmt, true);
    addFinanceRow(t.advance, ev.billing?.advancePaid || 0);
    
    // Draw boundary line for balance
    doc.setDrawColor(150, 150, 150);
    doc.line(110, currentY - 2, 195, currentY - 2);
    
    addFinanceRow(t.balance, balAmt, true);

  } else {
    // Materials requirements table
    const tableHeaders = [[t.ingName, t.category, t.qty, t.unitCost, t.totalCost, t.supplier]];
    const safeDataList = Array.isArray(dataList) ? dataList : [];
    const tableBody = safeDataList.map(mat => [
      mat.name || 'Ingredient',
      mat.category || 'General',
      `${mat.requiredQty || 0} ${mat.unit || 'kg'}`,
      `${cpCurrency} ${Number(mat.costPerUnit || 0).toLocaleString('en-IN')}`,
      `${cpCurrency} ${Number(mat.totalCost || 0).toLocaleString('en-IN')}`,
      mat.supplier?.name || 'Local Supplier'
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableBody.length ? tableBody : [['General Provisions', 'Provisions', '1 batch', `${cpCurrency} 0`, `${cpCurrency} 0`, 'Local Supplier']],
      startY: 68,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
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

    const finalY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 100) + 10;
    const totalMaterialsCost = safeDataList.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL ESTIMATED MATERIALS BUDGET:', 100, finalY);
    doc.text(`${cpCurrency} ${Number(totalMaterialsCost || 0).toLocaleString('en-IN')}`, 195, finalY, { align: 'right' });
  }

  // Footer Message & Page Numbers
  const pageHeight = doc.internal.pageSize.height;
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, pageHeight - 20, 195, pageHeight - 20);

    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(t.footerMsg || 'Thank you for choosing our services.', 15, pageHeight - 14);
    doc.text(`Generated securely by ${cpName} Enterprise ERP`, 15, pageHeight - 9);
    doc.text(`Page ${i} of ${totalPages}`, 195, pageHeight - 9, { align: 'right' });
  }

  // Standardized filename
  const safeEvId = String(evId).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const filename = `${type === 'invoice' ? 'Invoice' : 'Materials'}_${safeEvId || 'Document'}.pdf`;
  
  let pdfBlob;
  try {
    pdfBlob = doc.output('blob');
  } catch (e) {
    pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  }
  const blobUrl = URL.createObjectURL(pdfBlob);
  
  // IF requested to just return the blob (for preview modal)
  if (returnBlob) {
    return { blob: pdfBlob, blobUrl, filename };
  }

  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Web Share API
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${type === 'invoice' ? 'Tax Invoice' : 'Materials List'} - ${evId}`,
        text: `Share catering report for ${evId} in ${lang}.`
      });
      return true;
    } catch (err) {
      console.error('Web Share failed, falling back to download', err);
    }
  }

  // Fallback to universal blob download
  downloadPdfBlob(pdfBlob, filename);
  return true;
};

/**
 * Direct Invoice PDF Generator alias returning { blob, blobUrl, filename }
 */
export const generateInvoicePdf = (event, rawMaterials, companyProfile) => {
  return calculatePdfReport(event, rawMaterials, companyProfile, 'EN', 'invoice', true);
};

/**
 * Generates a supplier-specific Purchase Order PDF.
 * Returns { blobUrl, blob, filename } — caller handles preview / download / share.
 */
export const generateSupplierPO = (supplier, items, event, companyProfile) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primaryColor = [22, 30, 49];
  const accentColor  = [59, 130, 246];

  const cp = companyProfile || {};
  const cpName = cp.name || 'Sri Mayyia Caterers';
  const cpPhone = cp.phone || '+91 99988 77766';
  const cpAddress = cp.address || 'Malleshwaram, Bangalore';
  const cpGstin = cp.gstin || '29AAAAA0000A1Z5';
  const cpCurrency = cp.currency || '₹';

  const sup = supplier || {};
  const supName = sup.name || 'Vendor / Supplier';
  const supContact = sup.contact || sup.phone || 'N/A';
  const supCategory = sup.category || 'General';

  const ev = event || {};
  const evId = ev.id || 'PO-REQ';
  const clientName = (ev.customer && typeof ev.customer === 'object' ? ev.customer.name : ev.customer) || 'Valued Client';
  const evDate = ev.date || (ev.dates && ev.dates[0]) || new Date().toISOString().split('T')[0];

  // Header band
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(cpName.toUpperCase(), 15, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`${cpPhone} | ${cpAddress}`, 15, 24);
  doc.text(`GSTIN: ${cpGstin}`, 15, 30);

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
  doc.text(supName, 55, 50);
  doc.setFontSize(9);
  doc.text(`Contact: ${supContact} | Category: ${supCategory}`, 15, 56);

  // Event ref
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`REF EVENT: ${evId}`, 130, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client: ${clientName}`, 130, 56);
  doc.text(`Event Date: ${evDate}`, 130, 62);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 66, 195, 66);

  // Items table
  const safeItems = Array.isArray(items) ? items : [];
  const headers = [['#', 'Ingredient', 'Category', 'Qty Required', 'Unit Cost', 'Total Est.']];
  const rows = safeItems.map((m, i) => {
    const unitCost = Number(m.costPerUnit || 0);
    const totalCost = Number(m.totalCost !== undefined && m.totalCost !== null ? m.totalCost : unitCost * (m.requiredQty || 0));
    return [
      i + 1,
      m.name || 'Ingredient Item',
      m.category || 'General',
      `${m.requiredQty || 0} ${m.unit || 'kg'}`,
      `${cpCurrency} ${unitCost.toLocaleString('en-IN')}`,
      `${cpCurrency} ${totalCost.toLocaleString('en-IN')}`
    ];
  });

  doc.autoTable({
    head: headers,
    body: rows.length ? rows : [[1, 'General Provisions', 'Grocery', '1 batch', `${cpCurrency} 0`, `${cpCurrency} 0`]],
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

  const finalY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 100) + 8;
  const grandTotal = safeItems.reduce((s, m) => {
    const cost = Number(m.totalCost !== undefined && m.totalCost !== null ? m.totalCost : (m.costPerUnit || 0) * (m.requiredQty || 0));
    return s + (isNaN(cost) ? 0 : cost);
  }, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('TOTAL ORDER VALUE:', 115, finalY);
  doc.setTextColor(...accentColor);
  doc.text(`${cpCurrency} ${grandTotal.toLocaleString('en-IN')}`, 195, finalY, { align: 'right' });

  // Footer
  const ph = doc.internal.pageSize.height;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, ph - 22, 195, ph - 22);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Authorized Signature: ____________________', 15, ph - 14);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 150, ph - 14);
  doc.text(`${cpName} — Catering Management System`, 15, ph - 8);

  const safeSupFilename = supName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const filename = `PO_${evId}_${safeSupFilename || 'Supplier'}.pdf`;
  
  let blob;
  try {
    blob = doc.output('blob');
  } catch (e) {
    blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  }
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, blob, filename };
};

/**
 * Generates an Indian Style Occasion Menu Card PDF.
 * Templates:
 *  - 'baleyele': Royal South Indian Baleyele Banquet (Plantain Leaf Seated Feast)
 *  - 'wedding': Grand Wedding & Sangeet Ceremonial Gala
 *  - 'pooja': Sacred Pooja & Sattvic Grihapravesham
 *  - 'gala': Corporate & Festive Grand Banquet
 */
export const generateOccasionMenuPdf = (event, subFunction, companyProfile, templateId = 'baleyele', dishesList = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;
  const ph = doc.internal.pageSize.height;

  const maroon = [156, 21, 25];
  const gold = [210, 172, 103];
  const darkCharcoal = [43, 10, 12];

  // Ornate Double Border Frame
  doc.setLineWidth(1.2);
  doc.setDrawColor(...maroon);
  doc.rect(8, 8, pw - 16, ph - 16);

  doc.setLineWidth(0.5);
  doc.setDrawColor(...gold);
  doc.rect(10.5, 10.5, pw - 21, ph - 21);

  // Decorative Corner Accents
  const drawCornerAccent = (x, y, flipX = 1, flipY = 1) => {
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(x, y, x + (12 * flipX), y);
    doc.line(x, y, x, y + (12 * flipY));
    doc.circle(x + (3 * flipX), y + (3 * flipY), 1, 'F');
  };
  drawCornerAccent(12, 12, 1, 1);
  drawCornerAccent(pw - 12, 12, -1, 1);
  drawCornerAccent(12, ph - 12, 1, -1);
  drawCornerAccent(pw - 12, ph - 12, -1, -1);

  // Header Banner
  doc.setFillColor(...maroon);
  doc.rect(11, 11, pw - 22, 36, 'F');

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.6);
  doc.rect(13, 13, pw - 26, 32);

  let auspiciousText = '|| SHREE GANESHAYA NAMAH ||';
  let templateTitle = 'ROYAL BALEYELE GRAND FEAST MENU';
  if (templateId === 'wedding') {
    auspiciousText = '|| SHREE LAKSHMI VENKATESHWARA PRASANNA ||';
    templateTitle = 'GRAND WEDDING & SANGEET BANQUET';
  } else if (templateId === 'pooja') {
    auspiciousText = '|| SATTVIC PRASADAM & UDUPAM BANQUET ||';
    templateTitle = 'GRUPRAPRAVESHAM & SACRED POOJA MENU';
  } else if (templateId === 'gala') {
    auspiciousText = '|| FESTIVE CELEBRATIONS & GASTRONOMY ||';
    templateTitle = 'GRAND CORPORATE GALA MENU';
  }

  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(auspiciousText, pw / 2, 19, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(companyProfile.name.toUpperCase(), pw / 2, 27, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...gold);
  doc.text(templateTitle, pw / 2, 34, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(235, 235, 235);
  doc.text(`Phone: ${companyProfile.phone} | GSTIN: ${companyProfile.gstin}`, pw / 2, 40, { align: 'center' });

  // Metadata Box
  doc.setFillColor(247, 242, 232);
  doc.rect(15, 52, pw - 30, 20, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.rect(15, 52, pw - 30, 20);

  doc.setTextColor(...darkCharcoal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Customer: ${event.customer?.name || 'Valued Guest'}`, 20, 59);
  doc.text(`Occasion: ${subFunction?.name || event.eventType}`, 20, 66);

  doc.text(`Date: ${subFunction?.date || event.date}`, 130, 59);
  doc.text(`Pax Headcount: ${subFunction?.guestCount || 100} Guests`, 130, 66);

  let y = 80;
  doc.setDrawColor(...maroon);
  doc.setLineWidth(0.8);
  doc.line(20, y, pw - 20, y);
  doc.setFillColor(...maroon);
  doc.circle(pw / 2, y, 2.5, 'F');
  y += 8;

  // Group dishes by category
  const menuDishIds = subFunction?.menuItems || [];
  const selectedDishes = dishesList.filter(d => menuDishIds.includes(d.id));

  const categories = [
    'Beverages & Welcome Drinks',
    'Appetizers, Chaats & Street Food',
    'Global & Fusion Cuisines',
    'South Indian Specialties',
    'North Indian Specialties',
    'Sides, Accompaniments & Salads',
    'Desserts, Sweets & Ice Creams',
    'After-Meal / Traditional Finishers'
  ];

  const grouped = {};
  categories.forEach(cat => {
    grouped[cat] = selectedDishes.filter(d => d.category === cat);
  });

  categories.forEach(cat => {
    const items = grouped[cat];
    if (!items || items.length === 0) return;

    if (y > ph - 35) {
      doc.addPage();
      doc.setLineWidth(1.2);
      doc.setDrawColor(...maroon);
      doc.rect(8, 8, pw - 16, ph - 16);
      doc.setLineWidth(0.5);
      doc.setDrawColor(...gold);
      doc.rect(10.5, 10.5, pw - 21, ph - 21);
      y = 20;
    }

    doc.setFillColor(...maroon);
    doc.rect(18, y, pw - 36, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(cat.toUpperCase(), pw / 2, y + 5, { align: 'center' });
    y += 11;

    const col1X = 22;
    const col2X = 112;

    items.forEach((dish, idx) => {
      if (y > ph - 25) {
        doc.addPage();
        doc.setLineWidth(1.2);
        doc.setDrawColor(...maroon);
        doc.rect(8, 8, pw - 16, ph - 16);
        doc.setLineWidth(0.5);
        doc.setDrawColor(...gold);
        doc.rect(10.5, 10.5, pw - 21, ph - 21);
        y = 20;
      }

      const isCol2 = idx % 2 === 1;
      const curX = isCol2 ? col2X : col1X;

      doc.setFillColor(...gold);
      doc.circle(curX, y - 1, 1.2, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(dish.name, curX + 3.5, y);

      if (dish.type) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text(`(${dish.type})`, curX + 3.5 + doc.getTextWidth(dish.name) + 2, y);
      }

      if (isCol2 || idx === items.length - 1) {
        y += 6.5;
      }
    });

    y += 4;
  });

  if (subFunction?.clientNotes) {
    if (y > ph - 45) {
      doc.addPage();
      doc.setLineWidth(1.2);
      doc.setDrawColor(...maroon);
      doc.rect(8, 8, pw - 16, ph - 16);
      doc.setLineWidth(0.5);
      doc.setDrawColor(...gold);
      doc.rect(10.5, 10.5, pw - 21, ph - 21);
      y = 20;
    }

    doc.setFillColor(247, 242, 232);
    doc.rect(15, y, pw - 30, 18, 'F');
    doc.setDrawColor(...gold);
    doc.rect(15, y, pw - 30, 18);

    doc.setTextColor(...maroon);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KITCHEN DIRECTIVES & SPECIAL CLIENT INSTRUCTIONS:', 18, y + 5);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(subFunction.clientNotes, pw - 40);
    doc.text(splitNotes, 18, y + 10);
    y += 22;
  }

  // Footer
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(15, ph - 18, pw - 15, ph - 18);

  doc.setTextColor(...maroon);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SHREE MAYYIA CATERERS — SWASTIK TRADITIONAL GASTRONOMY', pw / 2, ph - 12, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Authentic Udupi & Mysuru Ceremonial Feast Specialists | Contact: ' + companyProfile.phone, pw / 2, ph - 7, { align: 'center' });

  const filename = `${event.id}_${(subFunction?.name || 'Menu').replace(/\s+/g, '_')}_${templateId.toUpperCase()}_MENU.pdf`;
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return { blobUrl, blob, filename };
};

/**
 * Generates a Material Dispatch & Vessel Return Gate Pass PDF.
 * Returns { blobUrl, blob, filename }
 */
export const generateGatePassPdf = (event, gatePassData, companyProfile) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;
  const ph = doc.internal.pageSize.height;

  const primaryColor = [156, 21, 25];
  const accentColor = [210, 172, 103];

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(companyProfile.name.toUpperCase(), 15, 16);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Phone: ${companyProfile.phone} | Address: ${companyProfile.address}`, 15, 23);
  doc.text(`GSTIN: ${companyProfile.gstin}`, 15, 29);

  doc.setFillColor(...accentColor);
  doc.rect(140, 10, 58, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('MATERIAL GATE PASS', 143, 17);
  doc.setFontSize(8.5);
  doc.text(`NO: ${gatePassData.gatePassNo || ('GP-' + event.id)}`, 143, 23);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('EVENT REF:', 15, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${event.id} - ${event.customer?.name} (${event.eventType})`, 42, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('EVENT DATE:', 135, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(event.date, 165, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE NO:', 15, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(gatePassData.vehicleNo || 'KA-01-MJ-9921', 42, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('DRIVER NAME:', 135, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${gatePassData.driverName || 'Ramesh Kumar'} (${gatePassData.driverPhone || '9876543210'})`, 165, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('DISPATCH TIME:', 15, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(gatePassData.dispatchTime || new Date().toLocaleString('en-IN'), 42, 59);

  doc.setFont('helvetica', 'bold');
  doc.text('SECURITY OFFICER:', 135, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(gatePassData.issuedBy || 'Store Incharge', 165, 59);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 63, 195, 63);

  let yPos = 68;

  // SECTION A: CONSUMABLES & PROVISIONS DISPATCHED FROM STORAGE
  doc.setFillColor(247, 242, 232);
  doc.rect(15, yPos, pw - 30, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text('SECTION A: CONSUMABLE STORAGE PROVISIONS DISPATCHED', 18, yPos + 5);
  yPos += 9;

  const consumableHeaders = [['#', 'Item Name', 'Category', 'Qty Dispatched', 'Unit']];
  const consumableRows = (gatePassData.consumables || []).map((item, idx) => [
    idx + 1,
    item.name,
    item.category || 'Storage Provision',
    item.requiredQty || item.qty || 1,
    item.unit || 'Kg'
  ]);

  doc.autoTable({
    head: consumableHeaders,
    body: consumableRows.length ? consumableRows : [[1, 'Provisions & Groceries Pack', 'Storage Bulk', '1', 'Lot']],
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' }
    }
  });

  yPos = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || yPos) + 8;

  // SECTION B: VESSELS & RETURNABLE ASSETS TRACKING
  if (yPos > ph - 70) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(247, 242, 232);
  doc.rect(15, yPos, pw - 30, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text('SECTION B: VESSELS & CATERING ASSETS RETURN TRACKING (INBOUND / OUTBOUND)', 18, yPos + 5);
  yPos += 9;

  const vesselHeaders = [['#', 'Vessel / Gear Name', 'Category', 'Sent Out', 'Qty Returned', 'Damaged/Missing', 'Status']];
  const vesselRows = (gatePassData.vessels || []).map((item, idx) => [
    idx + 1,
    item.name,
    item.category || 'Cooking Vessel',
    item.sentQty || item.totalQty || 1,
    item.returnedQty !== undefined ? item.returnedQty : (item.sentQty || 1),
    item.damagedQty || 0,
    item.status || 'Verified Return'
  ]);

  doc.autoTable({
    head: vesselHeaders,
    body: vesselRows.length ? vesselRows : [[1, 'Cooking Degchis & Handis', 'Cooking Vessel', '10', '10', '0', 'Verified Return']],
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 23, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' }
    }
  });

  yPos = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || yPos) + 12;

  if (yPos > ph - 35) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  doc.text('STORE INCHARGE:', 15, yPos);
  doc.line(15, yPos + 8, 60, yPos + 8);

  doc.text('DRIVER SIGNATURE:', 80, yPos);
  doc.line(80, yPos + 8, 125, yPos + 8);

  doc.text('SECURITY GATE STAMP:', 145, yPos);
  doc.line(145, yPos + 8, 195, yPos + 8);

  doc.setDrawColor(220, 220, 220);
  doc.line(15, ph - 16, 195, ph - 16);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(`${companyProfile.name} — Official Material Gate Pass & Asset Return Certificate`, 15, ph - 10);
  doc.text(`Gate Pass Ref: ${gatePassData.gatePassNo || ('GP-' + event.id)}`, 150, ph - 10);

  const filename = `GatePass_${event.id}.pdf`;
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
    
    // Check if running in Electron/Desktop wrapper or standard browser
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn('Window print trigger notice:', e);
        }
      }, 600);
      return true;
    }

    // Fallback for popup-blocked environments
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
            if (document.body.contains(printFrame)) document.body.removeChild(printFrame);
            if (isCreatedUrl) URL.revokeObjectURL(url);
          }, 3000);
        } catch (e) {
          console.warn('Iframe print error fallback:', e);
        }
      }, 400);
    };
    return true;
  } catch (err) {
    console.error('Print Error:', err);
    return false;
  }
};

/**
 * Universal PDF Download Utility
 * Compatible with Web Browsers, Desktop EXE, and Mobile APK
 */
export const downloadPdfBlob = (blobOrUrl, filename = 'Document.pdf') => {
  if (!blobOrUrl) {
    console.error('downloadPdfBlob: No blob or URL provided');
    return false;
  }
  try {
    let url = blobOrUrl;
    let isCreatedUrl = false;
    if (blobOrUrl instanceof Blob) {
      url = URL.createObjectURL(blobOrUrl);
      isCreatedUrl = true;
    }

    const safeFilename = filename || 'Document.pdf';
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', safeFilename);
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      try {
        if (document.body.contains(a)) document.body.removeChild(a);
        if (isCreatedUrl) URL.revokeObjectURL(url);
      } catch (e) {
        // ignore cleanup error
      }
    }, 2500);
    return true;
  } catch (err) {
    console.error('Download Error, trying window.open fallback:', err);
    try {
      const fallbackUrl = blobOrUrl instanceof Blob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
      window.open(fallbackUrl, '_blank');
      return true;
    } catch (e) {
      console.error('Popup fallback also failed:', e);
      return false;
    }
  }
};


