import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { menuTemplateAssets } from '../assets/menuTemplateAssets.js';

// Cross-environment helper for jspdf-autotable in ESM/Vite
const renderTable = (doc, options) => {
  if (typeof doc.autoTable === 'function') {
    return doc.autoTable(options);
  }
  if (typeof autoTable === 'function') {
    return autoTable(doc, options);
  }
  if (autoTable && typeof autoTable.default === 'function') {
    return autoTable.default(doc, options);
  }
  throw new Error('AutoTable plugin is not available on jsPDF');
};

/**
 * Clean currency string formatter for jsPDF (avoids U+00A0 and U+20B9 encoding bugs resulting in '¹')
 */
const formatCurrencyValue = (val, currencySymbol = 'Rs.') => {
  const num = Number(val || 0);
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  }).replace(/[\u00A0\u202F\u200B]/g, ' ');
  return `${currencySymbol} ${formatted}`;
};

// Language translation mappings
const translations = {
  EN: {
    titleInvoice: 'TAX INVOICE',
    titleMaterials: 'RAW MATERIAL REQUIREMENT REPORT',
    eventId: 'Quotation ID',
    clientName: 'Client Name',
    eventDate: 'Event Date',
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
    footerMsg: 'Thank you for choosing our services. Sri Mayyia Caterers.'
  }
};

/**
 * Authoritative Venue Resolver:
 * Resolves the venue string strictly from the event/database.
 * Returns '' if no venue is selected. NEVER invents or hardcodes a venue.
 */
export const resolveEventVenue = (event, venues = []) => {
  if (!event) return '';
  const isPlaceholder = (val) => {
    if (!val || typeof val !== 'string') return true;
    const lower = val.trim().toLowerCase();
    return ['unassigned', 'none', 'tbd', 'null', 'undefined', 'to be decided', 'n/a', 'na', 'tba', '-'].includes(lower);
  };

  if (typeof event.venue === 'string' && event.venue.trim().length > 0 && !isPlaceholder(event.venue)) {
    return event.venue.trim();
  }
  if (typeof event.venueName === 'string' && event.venueName.trim().length > 0 && !isPlaceholder(event.venueName)) {
    return event.venueName.trim();
  }
  const vid = event.venueId;
  if (!vid || typeof vid !== 'string' || vid.trim().length === 0 || isPlaceholder(vid)) {
    return '';
  }
  const cleanVid = vid.trim();
  const lowerVid = cleanVid.toLowerCase();
  if (Array.isArray(venues) && venues.length > 0) {
    const matched = venues.find(v => String(v.id || v._id) === cleanVid || (v.name && v.name.toLowerCase() === lowerVid));
    if (matched && matched.name) {
      return matched.name.trim();
    }
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const cached = JSON.parse(localStorage.getItem('cater_venues') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        const m = cached.find(v => String(v.id || v._id) === cleanVid || (v.name && v.name.toLowerCase() === lowerVid));
        if (m && m.name) return m.name.trim();
      }
    }
  } catch (e) {}

  const isInternalIdPattern = /^v\d+$/i.test(cleanVid) || /^v_\d+$/i.test(cleanVid) || /^[0-9a-fA-F]{24}$/.test(cleanVid);
  if (!isInternalIdPattern) {
    return cleanVid;
  }
  return '';
};

/**
 * Authoritative Instruction Collector:
 * Collects all explicit instructions from quotation, event, billing, and session client notes.
 */
export const collectEventInstructions = (event, subFunction = null) => {
  const instructions = [];

  if (event?.instructions && typeof event.instructions === 'string' && event.instructions.trim()) {
    instructions.push({
      title: 'Quotation & Service Instructions',
      text: event.instructions.trim()
    });
  }
  if (event?.billing?.instructions && typeof event.billing.instructions === 'string' && event.billing.instructions.trim()) {
    if (event.billing.instructions.trim() !== event?.instructions?.trim()) {
      instructions.push({
        title: 'Billing Instructions',
        text: event.billing.instructions.trim()
      });
    }
  }
  if (event?.menuNotes && typeof event.menuNotes === 'string' && event.menuNotes.trim()) {
    if (event.menuNotes.trim() !== event?.instructions?.trim()) {
      instructions.push({
        title: 'Menu & Kitchen Directives',
        text: event.menuNotes.trim()
      });
    }
  }

  if (subFunction && typeof subFunction === 'object') {
    if (subFunction.clientNotes && typeof subFunction.clientNotes === 'string' && subFunction.clientNotes.trim()) {
      instructions.push({
        title: `${subFunction.name || 'Session'} Instructions`,
        text: subFunction.clientNotes.trim()
      });
    }
  } else if (Array.isArray(event?.subFunctions)) {
    event.subFunctions.forEach(sf => {
      if (sf?.clientNotes && typeof sf.clientNotes === 'string' && sf.clientNotes.trim()) {
        instructions.push({
          title: `${sf.name || 'Session'} Instructions`,
          text: sf.clientNotes.trim()
        });
      }
    });
  }

  return instructions;
};

/**
 * Converts numeric amount into Indian currency words representation.
 * e.g., 750750 -> "Seven Lakh Fifty Thousand Seven Hundred Fifty Rupees only"
 */
export const numberToWordsIndian = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero Rupees only';
  if (n < 0) return 'Minus ' + numberToWordsIndian(-n);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (val) => {
    let str = '';
    if (val >= 100) {
      str += units[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val > 0) {
      if (val < 20) {
        str += units[val] + ' ';
      } else {
        str += tens[Math.floor(val / 10)] + ' ';
        if (val % 10 > 0) {
          str += units[val % 10] + ' ';
        }
      }
    }
    return str;
  };

  const crore = Math.floor(n / 10000000);
  const remCrore = n % 10000000;
  const lakh = Math.floor(remCrore / 100000);
  const remLakh = remCrore % 100000;
  const thousand = Math.floor(remLakh / 1000);
  const remainder = remLakh % 1000;

  let words = '';
  if (crore > 0) words += convertLessThanOneThousand(crore) + 'Crore ';
  if (lakh > 0) words += convertLessThanOneThousand(lakh) + 'Lakh ';
  if (thousand > 0) words += convertLessThanOneThousand(thousand) + 'Thousand ';
  if (remainder > 0) words += convertLessThanOneThousand(remainder);

  return words.trim() + ' Rupees only';
};

/**
 * Formats a date into "21st Sep 2026"
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = d.getDate();
    const ord = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}${ord(day)} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Generates the Official Sri Mayyia Caterers Tax Invoice PDF.
 * Matches uploaded official tax invoice template (media_1790875990736.pdf):
 * - Centered brand logo at top
 * - "TAX INVOICE" header
 * - Left: Company corporate details (Govardhanagiri, Kalyani Gardens, BSK 1st Stage, Telefax, GSTIN)
 * - Right: TAX Invoice No. & TAX Invoice Date
 * - Left: TO: Customer name, organization, address, GSTIN
 * - Right: Event Date & Venue
 * - Black-bordered tabular grid: DATE | ITEM DESCRIPTION | QUANTITY | UOM | AMOUNT | TOTAL
 * - Line items for sub-functions / catering meals
 * - Totals: SUB TOTAL, CGST @ 2.5 %, SGST @ 2.5 %, TOTAL
 * - "Amount in words: ... Rupees only" in Indian currency wording
 * - Payment Instructions: Karur Vysya Bank Halasuru branch account details
 * - Right: FOR SRI MAYYIA CATERERS / Authorized Signature
 * - Bottom corporate footer card with marketing & corporate office details
 * 
 * Returns { blobUrl, blob, filename, doc }
 */
export const generateOfficialTaxInvoicePdf = (event, companyProfile, options = {}) => {
  const ev = event || {};
  const cp = companyProfile || {};
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Centered Official Brand Logo
  if (menuTemplateAssets.invoiceLogo) {
    doc.addImage(menuTemplateAssets.invoiceLogo, 'PNG', 93, 10, 24, 24);
  }

  // 2. Document Title
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('TAX INVOICE', 105, 40, { align: 'center' });

  // 3. Company & Invoice Metadata
  const cpGstin = cp.gstin || '29ACUPA7565Q1ZI';
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('SRI MAYYIA CATERERS', 14, 49);

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text('#39/2, C2 GOVARDHANAGIRI,', 14, 53.5);
  doc.text('KALYANI GARDENS, BSK 1ST STAGE,', 14, 58);

  doc.setFont('times', 'normal');
  doc.text('Bangalore - 560 050. India', 14, 62.5);
  doc.text('Telefax - +91 90191 64761', 14, 67);

  doc.setFont('times', 'bold');
  doc.text(`GSTIN: ${cpGstin}`, 14, 71.5);

  // Right side: Invoice Number & Date
  const invNo = ev.billing?.invoiceNumber || ev.invoiceNumber || (ev.id ? `016/${ev.id.slice(-5)}` : '016/26-27');
  const invDate = ev.billing?.invoiceDate || (ev.billing?.date ? formatMenuDateDDMMYYYY(ev.billing.date) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.'));

  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text(`TAX Invoice No.  : ${invNo}`, 135, 49);
  doc.text(`TAX Invoice Date : ${invDate}`, 135, 54);

  // 4. Client Section (TO:) & Event Details
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text('TO:', 14, 80);

  const custName = (typeof ev.customer === 'object' ? ev.customer?.name : ev.customer) || 'VALUED CLIENT';
  const custCompany = ev.customer?.company || ev.clientCompany || '';
  const custAddress = ev.customer?.address || '';
  const custGstin = ev.customer?.gstin || '';

  let curY = 85;
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.text(custName.toUpperCase(), 14, curY);
  curY += 4.5;

  if (custCompany) {
    doc.text(custCompany.toUpperCase(), 14, curY);
    curY += 4.5;
  }
  if (custAddress) {
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    const addrLines = doc.splitTextToSize(custAddress, 85);
    addrLines.forEach(l => {
      doc.text(l, 14, curY);
      curY += 4;
    });
  }
  if (custGstin) {
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text(`GSTIN: ${custGstin}`, 14, curY);
    curY += 4;
  }

  // Right side: Event Date & Venue
  const rawEvDate = ev.date || (ev.dates && ev.dates[0]) || new Date().toISOString().split('T')[0];
  const evDateFormatted = formatDisplayDate(rawEvDate);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text(`Event Date : ${evDateFormatted}`, 135, 85);
  const resolvedVenue = resolveEventVenue(ev, options.venues || []);
  if (resolvedVenue) {
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    const venueLines = doc.splitTextToSize(`Venue: ${resolvedVenue}`, 62);
    venueLines.forEach((vl, idx) => {
      doc.text(vl, 135, 90 + (idx * 4));
    });
  }

  // 5. Table of Line Items
  const tableRows = [];
  const safeSubFunctions = (Array.isArray(ev.subFunctions) ? ev.subFunctions : []).filter(Boolean);

  let calculatedSubtotal = 0;
  const rawEventDate = ev.date ? formatMenuDateDDMMYYYY(ev.date) : formatMenuDateDDMMYYYY(new Date().toISOString().split('T')[0]);

  if (safeSubFunctions.length > 0) {
    safeSubFunctions.forEach((sub, sIdx) => {
      const subDate = sub.date ? formatMenuDateDDMMYYYY(sub.date) : rawEventDate;
      const subName = sub.name || sub.occasion || `Session ${sIdx + 1}`;
      const pax = Number(sub.guestCount || ev.guestCount || 100);
      const rate = Number(sub.pricePerPlate || ev.billing?.pricePerPlate || 0);
      const rowTotal = (pax * rate) || (sIdx === 0 ? Number(ev.billing?.totalAmount || ev.billing?.subtotal || 0) : 0);
      calculatedSubtotal += rowTotal;

      tableRows.push([
        sIdx === 0 || subDate !== tableRows[sIdx - 1]?.[0] ? subDate : '',
        subName,
        pax ? String(pax) : '-',
        'Pax',
        rate ? rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
        rowTotal ? rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
      ]);
    });
  } else {
    const pax = Number(ev.guestCount || 100);
    const rate = Number(ev.billing?.pricePerPlate || 0);
    const rowTotal = Number(ev.billing?.totalAmount || ev.billing?.subtotal || (pax * rate) || 0);
    calculatedSubtotal = rowTotal;

    tableRows.push([
      rawEventDate,
      ev.eventType ? `Catering Services - ${ev.eventType}` : 'Pure Vegetarian Catering Services',
      String(pax),
      'Pax',
      rate ? rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
      rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ]);
  }

  if (ev.billing?.additionalServices && Array.isArray(ev.billing.additionalServices)) {
    ev.billing.additionalServices.forEach(srv => {
      const srvTotal = Number(srv.amount || 0);
      calculatedSubtotal += srvTotal;
      tableRows.push([
        '',
        srv.name || 'Additional Service',
        String(srv.quantity || 1),
        srv.unit || 'Nos',
        Number(srv.rate || srvTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        srvTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]);
    });
  }

  const explicitSubtotal = Number(ev.billing?.subtotal || ev.billing?.totalAmount || 0);
  const subtotal = explicitSubtotal > 0 ? explicitSubtotal : calculatedSubtotal;

  const isGst = ev.billing?.taxType !== 'NON_GST';
  const taxRate = isGst ? (ev.billing?.taxRate !== undefined && !isNaN(Number(ev.billing.taxRate)) ? Math.max(0, Number(ev.billing.taxRate)) : 0) : 0;
  const isInterState = Boolean(ev.billing?.isInterState);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let totalTax = 0;

  if (isGst && taxRate > 0) {
    if (isInterState) {
      igstAmount = Math.round((subtotal * taxRate / 100) * 100) / 100;
      totalTax = igstAmount;
    } else {
      const halfRate = taxRate / 2;
      cgstAmount = Math.round((subtotal * halfRate / 100) * 100) / 100;
      sgstAmount = Math.round((subtotal * halfRate / 100) * 100) / 100;
      totalTax = cgstAmount + sgstAmount;
    }
  }
  const grandTotal = subtotal + totalTax;

  // Add Summary Rows
  tableRows.push([
    '', '', '', '',
    { content: 'SUB TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
    { content: subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold', halign: 'right' } }
  ]);

  if (isGst && taxRate > 0) {
    if (isInterState) {
      tableRows.push([
        '', '', '', '',
        { content: `IGST @ ${taxRate} %`, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold', halign: 'right' } }
      ]);
    } else {
      const halfRateStr = (taxRate / 2).toString();
      tableRows.push([
        '', '', '', '',
        { content: `CGST @ ${halfRateStr} %`, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold', halign: 'right' } }
      ]);
      tableRows.push([
        '', '', '', '',
        { content: `SGST @ ${halfRateStr} %`, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold', halign: 'right' } }
      ]);
    }
  } else if (!isGst) {
    tableRows.push([
      '', '', '', '',
      { content: 'TAXATION (Non-GST / Commercial Quote)', styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '0.00', styles: { fontStyle: 'bold', halign: 'right' } }
    ]);
  } else {
    tableRows.push([
      '', '', '', '',
      { content: 'GST @ 0 % (Exempted)', styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '0.00', styles: { fontStyle: 'bold', halign: 'right' } }
    ]);
  }

  tableRows.push([
    '', '', '', '',
    { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
    { content: grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold', halign: 'right' } }
  ]);

  const startTableY = Math.max(105, curY + 6);

  renderTable(doc, {
    startY: startTableY,
    head: [['DATE', 'ITEM DESCRIPTION', 'QUANTITY', 'UOM', 'AMOUNT', 'TOTAL']],
    body: tableRows,
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: 8.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      cellPadding: 2
    },
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.25
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 68, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalTableY = doc.lastAutoTable?.finalY || (startTableY + 50);

  // 6. Amount in words
  const wordsY = finalTableY + 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Amount in words: ${numberToWordsIndian(grandTotal)}`, 14, wordsY);

  // 7. Instructions & Payment Details (Left) + Authorized Signature (Right)
  const allInstructions = collectEventInstructions(ev);
  let curLeftY = wordsY + 7;

  // Check if we need space or if page break is needed
  const instLines = [];
  allInstructions.forEach(inst => {
    if (allInstructions.length > 1) {
      instLines.push({ type: 'header', text: `${inst.title}:` });
    }
    const rawLines = inst.text.split('\n');
    rawLines.forEach(rl => {
      const wrapped = doc.splitTextToSize(rl, 110);
      wrapped.forEach(wl => instLines.push({ type: 'line', text: wl }));
    });
  });

  const instHeight = instLines.length > 0 ? (instLines.length * 3.8) + 8 : 0;
  const totalLeftHeight = instHeight + 35; // inst + bank details

  if (curLeftY + totalLeftHeight > 255) {
    // If overflowing, add page
    doc.addPage();
    curLeftY = 25;
  }

  if (instLines.length > 0) {
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Instructions:', 14, curLeftY);
    curLeftY += 4.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    instLines.forEach(l => {
      if (l.type === 'header') {
        doc.setFont('times', 'bold');
        doc.text(l.text, 14, curLeftY);
        doc.setFont('times', 'normal');
      } else {
        doc.text(l.text, 14, curLeftY);
      }
      curLeftY += 3.8;
    });
    curLeftY += 3;
  }

  // Bank & Payment Details
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Bank & Payment Details:', 14, curLeftY);
  curLeftY += 4.5;

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('Account Name :- SRI MAYYIA CATERERS', 14, curLeftY); curLeftY += 4;
  doc.text('Account Number: 1304013000000051', 14, curLeftY); curLeftY += 4;
  doc.text('IFSC CODE :- KVBL0001304', 14, curLeftY); curLeftY += 4;
  doc.text('BANK :- KARUR VYSYA BANK', 14, curLeftY); curLeftY += 4;
  doc.text('BRANCH :- HALASURU', 14, curLeftY); curLeftY += 4;
  doc.text('BRANCH CODE :- 1304', 14, curLeftY); curLeftY += 4;

  // Authorized Signatory
  const sigY = wordsY + 7;
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('FOR SRI MAYYIA CATERERS', 135, sigY);
  doc.setFont('times', 'normal');
  doc.text('Authorized Signature', 140, sigY + 20);

  // 8. Corporate Footer Image at bottom right
  if (menuTemplateAssets.invoiceFooter) {
    doc.addImage(menuTemplateAssets.invoiceFooter, 'PNG', 122, 258, 74, 24);
  }

  const safeEventId = (ev.id || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Tax_Invoice_${safeEventId}.pdf`;

  const blob = doc.output('blob');
  let blobUrl = '';
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(blob);
    }
  } catch (e) {
    blobUrl = '';
  }

  return { blobUrl, blob, filename, doc };
};

export const calculatePdfReport = async (event, dataList, companyProfile, lang = 'EN', type = 'invoice', returnBlob = false, template = 'official_tax_invoice') => {
  // If invoice type requested with official tax invoice template (default), route directly
  if (type === 'invoice' && template !== 'commercial' && template !== 'commercial_quotation') {
    const res = generateOfficialTaxInvoicePdf(event, companyProfile, { rawMaterials: dataList });
    if (returnBlob) {
      return res;
    }
    const file = new File([res.blob], res.filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Tax Invoice - ${event?.id || 'Doc'}`,
          text: `Official Tax Invoice for ${event?.id || 'event'}.`
        });
        return true;
      } catch (err) {
        console.error('Web Share failed, falling back to download', err);
      }
    }
    downloadPdfBlob(res.blob, res.filename);
    return true;
  }

  const ev = event || {};
  const cp = companyProfile || {};
  const t = (translations && translations[lang]) || translations.EN;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette - Royal Sri Mayyia Brand Palette
  const maroonColor = [156, 21, 25];  // Royal Crimson Maroon #9C1519
  const navyColor = [23, 55, 94];    // Deep Royal Navy #17375E
  const goldColor = [210, 172, 103];  // Champagne Gold #D2AC67
  const charcoalColor = [50, 50, 50];

  const cpName = cp.name || 'Sri Mayyia Caterers';
  const cpTagline = cp.tagline || 'Pioneers in authentic, pure vegetarian catering since 1953';
  const cpGstin = cp.gstin || '24AAAAA1111A1Z1';
  const cpPhone = cp.phone || '+91 99988 77766';
  const cpAddress = cp.address || 'No 43, 2nd Cross, Malleshwaram, Bangalore - 560003';
  const curr = (cp.currency === '₹' || !cp.currency || cp.currency === 'INR') ? 'Rs.' : cp.currency;

  // PAGE 1: OFFICIAL PARCHMENT COVER BACKGROUND
  const page1Bg = menuTemplateAssets.invoiceCleanBg || menuTemplateAssets.invoicePage1CleanBg || menuTemplateAssets.invoicePage1Bg;
  if (page1Bg) {
    doc.addImage(page1Bg, 'JPEG', 0, 0, 210, 297);
  }

  // Header Contact Line & Top-Right Banner (Positioned below pre-printed logo artwork at Y=50+ to avoid overlap)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...charcoalColor);
  doc.text(`GSTIN: ${cpGstin}  |  Phone: ${cpPhone}`, 15, 50);
  doc.text(`Address: ${cpAddress}`, 15, 54);

  // Document Type Top-Right Banner
  doc.setFillColor(...maroonColor);
  doc.roundedRect(132, 36, 63, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const titleText = type === 'invoice' ? 'COMMERCIAL QUOTATION' : 'MATERIALS ESTIMATE';
  doc.text(titleText, 163.5, 42.5, { align: 'center' });

  // Event Details Registry metadata
  const clientName = (ev.customer && typeof ev.customer === 'object' ? ev.customer.name : ev.customer) || '';
  const evId = ev.id || ev._id || '';
  const evDate = ev.date || (ev.dates && ev.dates[0]) || new Date().toISOString().split('T')[0];
  const evType = ev.eventType || '';
  const resolvedVenue = resolveEventVenue(ev);
  const hasVenue = Boolean(resolvedVenue);
  const cardHeight = hasVenue ? 28 : 22;

  // Soft Glassmorphic Card Container for Client Info
  doc.setFillColor(253, 248, 237);
  doc.roundedRect(15, 58, 180, cardHeight, 2, 2, 'F');
  doc.setDrawColor(210, 180, 130);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 58, 180, cardHeight, 2, 2, 'D');

  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${t.clientName || 'Client Name'}:`, 19, 65);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(clientName, 45, 65);

  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.eventId || 'Quotation ID'}:`, 19, 73);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(evId, 45, 73);

  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.eventDate || 'Event Date'}:`, 122, 65);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(evDate, 148, 65);

  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Type:', 122, 73);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(evType, 148, 73);

  if (hasVenue) {
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Execution Venue:', 19, 81);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(resolvedVenue, 52, 81);
  }

  // Table Generation based on report type
  if (type === 'invoice') {
    // Invoice details table
    const safeSubFunctions = (Array.isArray(ev.subFunctions) ? ev.subFunctions : []).filter(Boolean);
    const subFunctions = safeSubFunctions.length > 0
      ? safeSubFunctions
      : [{ id: 'sf-1', name: 'Lunch / Wedding Feast', guestCount: 225 }];

    const tableHeaders = [['Function / Session Description', 'Guest Count', 'Price / Plate', 'Subtotal Amount']];
    const tableBody = subFunctions.map(sf => {
      const itm = (sf && typeof sf === 'object') ? sf : { name: String(sf || 'Function') };
      const gCount = parseInt(itm.guestCount, 10) || 0;
      const pRate = parseFloat(ev.billing?.pricePerPlate) || 975;
      const subTotal = gCount * pRate;
      return [
        itm.name || 'Catering Function',
        `${gCount} Pax`,
        formatCurrencyValue(pRate, curr),
        formatCurrencyValue(subTotal, curr)
      ];
    });

    renderTable(doc, {
      head: tableHeaders,
      body: tableBody,
      startY: hasVenue ? 91 : 85,
      theme: 'grid',
      headStyles: { fillColor: maroonColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9.5, halign: 'left' },
      styles: { fontSize: 9, cellPadding: 3.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [253, 248, 237] },
      margin: { left: 15, right: 15 },
      tableBorderColor: [210, 180, 130],
      tableLineWidth: 0.3,
      columnStyles: {
        0: { cellWidth: 80, halign: 'left' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 38, halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 100;

    // Financial Aggregates Summary Box Right-Aligned
    const boxStartY = finalY + 4;
    let currentY = boxStartY + 6.5;

    const isGst = ev.billing?.taxType !== 'NON_GST';
    const isInter = Boolean(ev.billing?.isInterState);
    const taxRate = isGst ? (ev.billing?.taxRate !== undefined && !isNaN(Number(ev.billing.taxRate)) ? Math.max(0, Number(ev.billing.taxRate)) : 0) : 0;
    const totalPax = subFunctions.reduce((s, sf) => s + (parseInt(sf.guestCount, 10) || 0), 0) || 225;
    const subtotalAmt = ev.billing?.subtotal || (totalPax * (ev.billing?.pricePerPlate || 975));
    const taxAmt = isGst ? Math.round((subtotalAmt * (taxRate / 100)) * 100) / 100 : 0;
    const grandAmt = subtotalAmt + taxAmt;
    const balAmt = grandAmt - (parseFloat(ev.billing?.advancePaid) || 0);

    const rows = [
      { label: t.subtotal || 'Subtotal Amount:', val: subtotalAmt }
    ];

    if (isGst && taxRate > 0) {
      if (!isInter) {
        const halfRateStr = (taxRate / 2).toString();
        rows.push({ label: `CGST (${halfRateStr}%):`, val: taxAmt / 2 });
        rows.push({ label: `SGST (${halfRateStr}%):`, val: taxAmt / 2 });
      } else {
        rows.push({ label: `IGST (${taxRate}%):`, val: taxAmt });
      }
    } else if (!isGst) {
      rows.push({ label: 'Taxation Mode:', val: 'Non-GST Commercial (0%)', isRawText: true });
    } else {
      rows.push({ label: 'GST Mode:', val: '0% (Exempted)', isRawText: true });
    }
    rows.push({ label: t.grandTotal || 'Grand Invoice Total:', val: grandAmt, highlight: true });
    rows.push({ label: t.advance || 'Advance Deposited:', val: ev.billing?.advancePaid || 0 });

    const totalRowsCount = rows.length + 1;
    const boxHeight = (totalRowsCount * 6.5) + 5;

    // Card background for finance summary with proper padding
    doc.setFillColor(253, 248, 237);
    doc.roundedRect(102, boxStartY, 93, boxHeight, 2, 2, 'F');
    doc.setDrawColor(210, 180, 130);
    doc.setLineWidth(0.3);
    doc.roundedRect(102, boxStartY, 93, boxHeight, 2, 2, 'D');

    rows.forEach(r => {
      doc.setFont('helvetica', r.highlight ? 'bold' : 'normal');
      doc.setFontSize(r.highlight ? 9 : 8.5);
      doc.setTextColor(r.highlight ? maroonColor[0] : 40, r.highlight ? maroonColor[1] : 40, r.highlight ? maroonColor[2] : 40);
      doc.text(r.label, 107, currentY);
      const textVal = r.isRawText ? String(r.val) : formatCurrencyValue(r.val, curr);
      doc.text(textVal, 190, currentY, { align: 'right' });
      currentY += 6.5;
    });

    // Boundary line before Outstanding Balance Due
    doc.setDrawColor(156, 21, 25);
    doc.setLineWidth(0.4);
    doc.line(105, currentY - 2.5, 190, currentY - 2.5);
    currentY += 1.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...maroonColor);
    doc.text(t.balance || 'Outstanding Balance Due:', 107, currentY);
    doc.text(formatCurrencyValue(balAmt, curr), 190, currentY, { align: 'right' });
    currentY += 6.5;

    // Instructions Card (Dynamic, wrapping, multiple instructions, preserving line breaks)
    const allInstructions = collectEventInstructions(ev);
    let nextY = Math.max(currentY + 4, boxStartY + boxHeight + 4);

    if (allInstructions.length > 0) {
      const instLines = [];
      allInstructions.forEach(inst => {
        if (allInstructions.length > 1) {
          instLines.push({ type: 'header', text: `${inst.title}:` });
        }
        const rawLines = inst.text.split('\n');
        rawLines.forEach(rl => {
          const wrapped = doc.splitTextToSize(rl, 170);
          wrapped.forEach(wl => instLines.push({ type: 'line', text: wl }));
        });
      });

      const instBoxHeight = (instLines.length * 4.2) + 10;
      if (nextY + instBoxHeight > 270) {
        doc.addPage();
        nextY = 25;
      }

      doc.setFillColor(253, 248, 237);
      doc.roundedRect(15, nextY, 180, instBoxHeight, 2, 2, 'F');
      doc.setDrawColor(210, 180, 130);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, nextY, 180, instBoxHeight, 2, 2, 'D');

      let instCursorY = nextY + 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...maroonColor);
      doc.text('SPECIAL INSTRUCTIONS & EVENT REQUIREMENTS:', 19, instCursorY);
      instCursorY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);

      instLines.forEach(l => {
        if (l.type === 'header') {
          doc.setFont('helvetica', 'bold');
          doc.text(l.text, 19, instCursorY);
          doc.setFont('helvetica', 'normal');
        } else {
          doc.text(l.text, 19, instCursorY);
        }
        instCursorY += 4.2;
      });

      nextY += instBoxHeight + 4;
    }

    // Highlighted Yellow Note Box (Matching Estimation Reference)
    if (nextY + 12 > 280) {
      doc.addPage();
      nextY = 25;
    }
    doc.setFillColor(255, 253, 200);
    doc.roundedRect(15, nextY, 180, 8.5, 1.5, 1.5, 'F');
    doc.setDrawColor(210, 180, 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, nextY, 180, 8.5, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 0, 0);
    doc.text('NOTE : GAS, VESSELS & CLEANERS ARE NOT INCLUDED IN THE ABOVE QUOTE', 105, nextY + 5.5, { align: 'center' });

  } else {
    // Materials requirements table
    const tableHeaders = [[t.ingName || 'Ingredient', t.category || 'Category', t.qty || 'Qty', t.unitCost || 'Unit Cost', t.totalCost || 'Total Cost', t.supplier || 'Supplier']];
    const safeDataList = Array.isArray(dataList) ? dataList : [];
    const tableBody = safeDataList.map(mat => [
      mat.name || 'Ingredient',
      mat.category || 'General',
      `${mat.requiredQty || 0} ${mat.unit || 'kg'}`,
      formatCurrencyValue(mat.costPerUnit || 0, curr),
      formatCurrencyValue(mat.totalCost || 0, curr),
      mat.supplier?.name || 'Local Supplier'
    ]);

    renderTable(doc, {
      head: tableHeaders,
      body: tableBody.length ? tableBody : [['General Provisions', 'Provisions', '1 batch', formatCurrencyValue(0, curr), formatCurrencyValue(0, curr), 'Local Supplier']],
      startY: 85,
      theme: 'grid',
      headStyles: { fillColor: maroonColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'left' },
      styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [253, 248, 237] },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 22 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 50 }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 95;
    const totalMaterialsCost = safeDataList.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    doc.setFillColor(253, 248, 237);
    doc.roundedRect(95, finalY + 4, 100, 14, 2, 2, 'F');
    doc.setDrawColor(210, 180, 130);
    doc.roundedRect(95, finalY + 4, 100, 14, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...maroonColor);
    doc.text('TOTAL ESTIMATED MATERIALS BUDGET:', 99, finalY + 12);
    doc.text(formatCurrencyValue(totalMaterialsCost, curr), 190, finalY + 12, { align: 'right' });
  }

  // Footer line on Page 1
  const pageHeight = 297;
  doc.setPage(1);
  doc.setDrawColor(210, 180, 130);
  doc.setLineWidth(0.4);
  doc.line(15, pageHeight - 16, 195, pageHeight - 16);

  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('Thank you for choosing Sri Mayyia Caterers.', 15, pageHeight - 11);
  doc.text('Page 1 of 2  |  Generated securely by Sri Mayyia ERP', 195, pageHeight - 11, { align: 'right' });

  // PAGE 2: OFFICIAL SERVICE TERMS & BRASS THALI ARTWORK TEMPLATE (page4Terms)
  doc.addPage();
  const page2Bg = menuTemplateAssets.page4Terms || menuTemplateAssets.page2MenuBg;
  if (page2Bg) {
    doc.addImage(page2Bg, 'JPEG', 0, 0, 210, 297);
  }

  // Footer text on Page 2 (No horizontal line to preserve artwork)
  doc.setPage(2);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('Thank you for choosing Sri Mayyia Caterers.', 15, pageHeight - 11);
  doc.text('Page 2 of 2  |  Generated securely by Sri Mayyia ERP', 195, pageHeight - 11, { align: 'right' });

  // Standardized filename
  const safeEvId = String(evId).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const filename = `${type === 'invoice' ? 'Quotation' : 'Materials'}_${safeEvId || 'Document'}.pdf`;
  
  let pdfBlob;
  try {
    pdfBlob = doc.output('blob');
  } catch (e) {
    try {
      pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    } catch (e2) {
      pdfBlob = new Blob([doc.output()], { type: 'application/pdf' });
    }
  }
  let blobUrl = '';
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(pdfBlob);
    }
  } catch (e) {
    blobUrl = '';
  }
  
  // IF requested to just return the blob (for preview modal)
  if (returnBlob) {
    return { blob: pdfBlob, blobUrl, filename, doc };
  }

  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Web Share API
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${type === 'invoice' ? 'Commercial Quotation' : 'Materials List'} - ${evId}`,
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
export const generateInvoicePdf = (event, rawMaterials, companyProfile, template = 'official_tax_invoice') => {
  if (template === 'commercial' || template === 'commercial_quotation') {
    return calculatePdfReport(event, rawMaterials, companyProfile, 'EN', 'invoice', true, 'commercial');
  }
  return generateOfficialTaxInvoicePdf(event, companyProfile, { rawMaterials });
};

/**
 * Generates a supplier-specific Purchase Order PDF.
 * Returns { blobUrl, blob, filename } — caller handles preview / download / share.
 */
export const generateSupplierPO = (supplier, items, event, companyProfile) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = 210;
  const ph = 297;

  // Royal Sri Mayyia Brand Colors
  const maroonColor = [156, 21, 25];  // Royal Crimson #9C1519
  const navyColor = [23, 55, 94];     // Royal Navy #17375E
  const goldColor = [210, 172, 103];  // Champagne Gold #D2AC67
  const charcoalColor = [50, 50, 50];

  const cp = companyProfile || {};
  const cpName = cp.name || 'Sri Mayyia Caterers';
  const cpTagline = cp.tagline || 'Pioneers in authentic, pure vegetarian catering since 1953';
  const cpPhone = cp.phone || '+91 99988 77766';
  const cpAddress = cp.address || 'No 43, 2nd Cross, Malleshwaram, Bangalore - 560003';
  const cpGstin = cp.gstin || '29ACUPA7565Q1ZI';
  const curr = (cp.currency === '₹' || !cp.currency || cp.currency === 'INR') ? 'Rs.' : cp.currency;

  const sup = supplier || {};
  const supName = sup.name || 'Vendor / Supplier';
  const supContact = sup.contact || sup.phone || 'N/A';
  const supCategory = sup.category || 'General Provisions';
  const supGst = sup.gstin || sup.gstNumber || '';

  const ev = event || {};
  const evId = ev.id || ev._id || 'PO-REQ';
  const clientName = (ev.customer && typeof ev.customer === 'object' ? ev.customer.name : ev.customer) || 'Valued Client';
  const evDate = ev.date || (ev.dates && ev.dates[0]) || new Date().toISOString().split('T')[0];
  const evVenue = resolveEventVenue(ev) || 'Central Production Kitchen';
  const poDateFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  const safeSupFilename = supName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const poNumber = `PO-${String(evId).replace(/[^a-zA-Z0-9]/g, '')}-${String(sup.id || sup._id || 'V').slice(-4).toUpperCase()}`;

  // 1. BRAND HEADER & EMBLEM
  // Top thin ceremonial gold bar
  doc.setFillColor(...goldColor);
  doc.rect(0, 0, pw, 3.5, 'F');

  // Official Logo if available
  if (menuTemplateAssets.invoiceLogo) {
    doc.addImage(menuTemplateAssets.invoiceLogo, 'PNG', 14, 8, 20, 20);
  }

  // Document Type Badge (Top Right)
  const badgeW = 54;
  const badgeH = 17.5;
  const badgeX = pw - 14 - badgeW; // 210 - 14 - 54 = 142 mm
  const badgeY = 8.5;
  const badgeCenterX = badgeX + (badgeW / 2); // 169 mm

  doc.setFillColor(...maroonColor);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PURCHASE ORDER', badgeCenterX, badgeY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`PO Ref: ${poNumber}`, badgeCenterX, badgeY + 12.5, { align: 'center' });

  // Company Name & Credential Details (Left-aligned next to logo)
  const headerTextX = menuTemplateAssets.invoiceLogo ? 38 : 14;
  const maxCompanyWidth = Math.min(92, badgeX - headerTextX - 6); // Up to 92 mm, cleanly wraps address and guarantees 16mm+ space before badge

  doc.setFont('times', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(...maroonColor);
  doc.text(cpName.toUpperCase(), headerTextX, 14);

  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...goldColor);
  doc.text(cpTagline, headerTextX, 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...charcoalColor);

  // Address lines wrapped dynamically to prevent collision with right badge
  const addressLines = doc.splitTextToSize(cpAddress, maxCompanyWidth);
  let compY = 22.5;
  addressLines.forEach(line => {
    doc.text(line, headerTextX, compY);
    compY += 3.5;
  });

  doc.text(`Phone: ${cpPhone}  |  GSTIN: ${cpGstin}`, headerTextX, compY);

  // Divider Line cleanly spaced below header details
  const dividerY = Math.max(32.5, compY + 3.8);
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(0.5);
  doc.line(14, dividerY, pw - 14, dividerY);

  // 2. TWO-COLUMN STRUCTURED METADATA CARDS (Y = 35 to 64)
  const cardW = 88;
  const cardH = 29;

  // Left Card: Supplier / Vendor Details
  doc.setFillColor(253, 249, 242); // Warm ivory tint
  doc.roundedRect(14, 35, cardW, cardH, 2, 2, 'F');
  doc.setDrawColor(220, 200, 165);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 35, cardW, cardH, 2, 2, 'D');

  // Supplier Card Header Tag
  doc.setFillColor(...navyColor);
  doc.roundedRect(18, 38, 44, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SUPPLIER / VENDOR DETAILS', 40, 41.2, { align: 'center' });

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  let dispSupName = supName;
  if (doc.getTextWidth(dispSupName) > 78) {
    dispSupName = doc.splitTextToSize(dispSupName, 78)[0];
  }
  doc.text(dispSupName, 18, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...charcoalColor);
  doc.text(`Category: ${supCategory}`, 18, 53);
  doc.text(`Contact: ${supContact}`, 18, 57.5);
  if (supGst) {
    doc.text(`GSTIN: ${supGst}`, 18, 61.5);
  }

  // Right Card: PO Reference & Event Execution Details
  const rightCardX = pw - 14 - cardW;
  doc.setFillColor(253, 249, 242);
  doc.roundedRect(rightCardX, 35, cardW, cardH, 2, 2, 'F');
  doc.setDrawColor(220, 200, 165);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightCardX, 35, cardW, cardH, 2, 2, 'D');

  doc.setFillColor(...maroonColor);
  doc.roundedRect(rightCardX + 4, 38, 48, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('EVENT & PROCUREMENT REF', rightCardX + 28, 41.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...charcoalColor);
  doc.text(`PO Issue Date: ${poDateFormatted}`, rightCardX + 4, 48);
  doc.text(`Target Event: ${evId} (${clientName})`, rightCardX + 4, 53);
  doc.text(`Required By Date: ${formatDisplayDate(evDate) || evDate}`, rightCardX + 4, 57.5);
  let dispVenue = evVenue;
  if (doc.getTextWidth(`Venue: ${dispVenue}`) > 78) {
    dispVenue = doc.splitTextToSize(dispVenue, 65)[0] + '...';
  }
  doc.text(`Delivery Venue: ${dispVenue}`, rightCardX + 4, 61.5);

  // 3. ITEMS TABLE
  const safeItems = (Array.isArray(items) ? items : []).filter(Boolean);
  let grandTotal = 0;
  const tableRows = (safeItems.length ? safeItems : [{ name: 'General Provisions', category: 'Grocery', requiredQty: 1, unit: 'batch', costPerUnit: 0 }]).map((m, i) => {
    const itm = (m && typeof m === 'object') ? m : { name: String(m || 'Item') };
    const unitCost = Number(itm.costPerUnit || itm.price || 0);
    const qty = Number(itm.requiredQty || itm.quantity || 0);
    const totalCost = Number(itm.totalCost !== undefined && itm.totalCost !== null ? itm.totalCost : unitCost * qty);
    grandTotal += (isNaN(totalCost) ? 0 : totalCost);

    return [
      String(i + 1),
      itm.name || 'Raw Material Item',
      itm.category || 'General',
      `${qty} ${itm.unit || 'kg'}`,
      formatCurrencyValue(unitCost, curr),
      formatCurrencyValue(totalCost, curr)
    ];
  });

  // Summary Row inside table
  tableRows.push([
    { content: 'TOTAL ESTIMATED PROCUREMENT VALUE', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 240, 228], textColor: maroonColor } },
    { content: formatCurrencyValue(grandTotal, curr), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 240, 228], textColor: maroonColor } }
  ]);

  renderTable(doc, {
    head: [[
      { content: '#', styles: { halign: 'center' } },
      { content: 'Item / Raw Material', styles: { halign: 'left' } },
      { content: 'Category', styles: { halign: 'center' } },
      { content: 'Required Qty', styles: { halign: 'right' } },
      { content: 'Unit Rate', styles: { halign: 'right' } },
      { content: 'Total Amount', styles: { halign: 'right' } }
    ]],
    body: tableRows,
    startY: 68,
    showHead: 'everyPage',
    theme: 'grid',
    headStyles: {
      fillColor: maroonColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.2,
      lineColor: [225, 225, 225],
      lineWidth: 0.25,
      textColor: [30, 30, 30],
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [253, 250, 246]
    },
    margin: { left: 14, right: 14, top: 22, bottom: 25 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 64, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    }
  });

  const lastTableY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 100);
  let afterTableY = lastTableY + 4;

  // Check if we need space for terms and signatures (needs ~46mm, leave 24mm at bottom for footer/margins)
  if (afterTableY + 46 > ph - 24) {
    doc.addPage();
    afterTableY = 22;
  }

  // Amount in words
  const wordsText = numberToWordsIndian(grandTotal);
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...maroonColor);
  doc.text(`Amount in Words: `, 14, afterTableY);
  doc.setFont('times', 'italic');
  doc.setTextColor(...charcoalColor);
  doc.text(`${wordsText}.`, 42, afterTableY);
  afterTableY += 4.5;

  // Delivery & Quality Instructions Container
  doc.setFillColor(253, 249, 242);
  doc.roundedRect(14, afterTableY, pw - 28, 13, 1.5, 1.5, 'F');
  doc.setDrawColor(220, 200, 165);
  doc.setLineWidth(0.25);
  doc.roundedRect(14, afterTableY, pw - 28, 13, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...navyColor);
  doc.text('SUPPLIER PROCUREMENT INSTRUCTIONS:', 18, afterTableY + 3.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...charcoalColor);
  doc.text('1. Delivery must reach the venue at least 4 hours before service.  2. All food ingredients must be fresh and inspected upon arrival.', 18, afterTableY + 7.5);
  doc.text('3. Weighing verification will be conducted by our storekeeper before unloading. Defective or expired items will be returned.', 18, afterTableY + 10.8);

  afterTableY += 17;

  // Three-column Signatures Block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...charcoalColor);

  // Column 1
  doc.line(16, afterTableY + 8, 60, afterTableY + 8);
  doc.text('Prepared By (Store / Ops)', 38, afterTableY + 12, { align: 'center' });

  // Column 2
  doc.line(85, afterTableY + 8, 125, afterTableY + 8);
  doc.text('Authorized Signatory', 105, afterTableY + 12, { align: 'center' });

  // Column 3
  doc.line(150, afterTableY + 8, 194, afterTableY + 8);
  doc.text('Supplier Acceptance / Stamp', 172, afterTableY + 12, { align: 'center' });

  // Multi-page running footer pass (guarantees accurate "Page X of Y" across all pages)
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Page ${p} of ${totalPages}  |  Purchase Order: ${poNumber}`, pw - 14, ph - 10, { align: 'right' });
    doc.text(`${cpName}  |  Confidential Procurement Document`, 14, ph - 10);
  }

  const filename = `PO_${evId}_${safeSupFilename || 'Supplier'}.pdf`;

  let blob;
  try {
    blob = doc.output('blob');
  } catch (e) {
    blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  }
  let blobUrl = '';
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(blob);
    }
  } catch (e) {
    blobUrl = '';
  }
  return { blobUrl, blob, filename, doc };
};

/**
 * Generates an Indian Style Occasion Menu Card PDF.
 * Templates:
 *  - 'baleyele': Royal South Indian Baleyele Banquet (Plantain Leaf Seated Feast)
 *  - 'wedding': Grand Wedding & Sangeet Ceremonial Gala
 *  - 'pooja': Sacred Pooja & Sattvic Grihapravesham
 *  - 'gala': Corporate & Festive Grand Banquet
 */
/**
 * Formats date into British / Indian ceremonial style e.g. "18th November 2026"
 */
const formatCeremonialDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
                   (day === 2 || day === 22) ? 'nd' :
                   (day === 3 || day === 23) ? 'rd' : 'th';
    return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Intelligent dish service instruction resolver
 */
const getDishInstruction = (dish) => {
  if (dish.instructions) return dish.instructions;
  if (dish.specialInstructions) return dish.specialInstructions;
  if (dish.notes) return dish.notes;

  const cat = (dish.category || '').toLowerCase();
  const name = (dish.name || '').toLowerCase();

  if (cat.includes('beverage') || cat.includes('drink') || name.includes('juice') || name.includes('sharbat') || name.includes('payasam')) {
    return 'Served Chilled in Clay Cups';
  }
  if (cat.includes('dessert') || cat.includes('sweet') || name.includes('halwa') || name.includes('mysore pak') || name.includes('jamun') || name.includes('jalebi')) {
    return 'Warm Pure Desi Ghee Service';
  }
  if (cat.includes('live') || cat.includes('chaat') || name.includes('dosa') || name.includes('roti') || name.includes('naan')) {
    return 'Live Counter Sizzling Hot';
  }
  if (cat.includes('rice') || cat.includes('biryani') || cat.includes('bath') || cat.includes('pulao')) {
    return 'Steaming Hot Traditional Service';
  }
  if (cat.includes('sambar') || cat.includes('rasam') || cat.includes('dal') || cat.includes('soup')) {
    return 'Piping Hot with Ghee Tempering';
  }
  if (cat.includes('side') || cat.includes('curry') || cat.includes('poriyal') || cat.includes('palya') || cat.includes('avial')) {
    return 'Fresh Batch Traditional Tempering';
  }
  if (name.includes('curd') || name.includes('raita') || name.includes('salad')) {
    return 'Chilled Temple Style Finishing';
  }
  if (cat.includes('appetizer') || cat.includes('starter') || name.includes('vada') || name.includes('bonda') || name.includes('tikka')) {
    return 'Crisp Golden Service with Chutneys';
  }
  if (name.includes('coffee') || name.includes('tea') || name.includes('kaapi')) {
    return 'Fresh Brass Davara Tumbler Roast';
  }
  return 'Traditional Table Service';
};

/**
 * Royal Baleyele & Vector-drawn Indian occasion menu PDF generator
 * Supports:
 * - 'baleyele': Royal South Indian Baleyele Banquet (Plantain Leaf Seated Feast)
 * - 'wedding': Grand Wedding & Sangeet Banquet
 * - 'pooja': Sattvic Prasadam & Udupam Banquet
 * - 'gala': Grand Corporate Gala Menu
 * 
 * Returns { blobUrl, blob, filename, doc }
 */
export const generateVectorOccasionMenuPdf = (event, subFunction, companyProfile, templateId = 'baleyele', dishesList = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width;
  const ph = doc.internal.pageSize.height;

  const maroon = [156, 21, 25];
  const gold = [210, 172, 103];
  const darkCharcoal = [43, 10, 12];

  // Resolve sub-functions to render
  let subList = [];
  const isAllSessions = subFunction === 'all' || subFunction?.all === true;
  if (isAllSessions) {
    subList = Array.isArray(event?.subFunctions) && event.subFunctions.length > 0
      ? event.subFunctions
      : (subFunction && typeof subFunction === 'object' ? [subFunction] : [{}]);
  } else if (subFunction && typeof subFunction === 'object') {
    subList = [subFunction];
  } else if (Array.isArray(event?.subFunctions) && event.subFunctions.length > 0) {
    subList = event.subFunctions;
  } else {
    subList = [{}];
  }

  // Sort sessions chronologically
  subList = sortSubFunctionsChronologically(subList, event?.date);

  const resolvedVenue = resolveEventVenue(event);

  // Helper to draw ornate double border and corner accents
  const drawOrnateBorder = () => {
    doc.setLineWidth(1.2);
    doc.setDrawColor(...maroon);
    doc.rect(8, 8, pw - 16, ph - 16);

    doc.setLineWidth(0.5);
    doc.setDrawColor(...gold);
    doc.rect(10.5, 10.5, pw - 21, ph - 21);

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
  };

  // Traditional Dining Order Course Sequence
  const DINING_ORDER = [
    'SHELL BASED FRESH JUICE',
    'Welcome Drinks',
    'Mocktails',
    'Lassi',
    'Beverages',
    'Soups',
    'Starters',
    'Appetizers',
    'Chaats',
    'South Indian',
    'North Indian',
    'Main Course',
    'Breads & Rotis',
    'Breads',
    'Rice & Biryani',
    'Rice Dishes',
    'Sambar & Rasam',
    'Curries & Gravies',
    'Sides & Poriyal',
    'Accompaniments',
    'Salads & Raitha',
    'Sweets & Desserts',
    'Desserts',
    'Ice Creams',
    'Pan & Beeda',
    'Others'
  ];

  const getDiningOrderIdx = (catName) => {
    if (!catName) return 999;
    const lower = catName.toLowerCase().trim();
    for (let i = 0; i < DINING_ORDER.length; i++) {
      const match = DINING_ORDER[i].toLowerCase();
      if (lower === match || lower.includes(match)) {
        return i;
      }
    }
    return 500;
  };

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

  // Iterate through sessions
  subList.forEach((sub, subIdx) => {
    if (subIdx > 0) {
      doc.addPage();
    }

    drawOrnateBorder();

    // 1. Header Banner
    doc.setFillColor(...maroon);
    doc.rect(11, 11, pw - 22, 36, 'F');

    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.rect(13, 13, pw - 26, 32);

    doc.setTextColor(...gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(auspiciousText, pw / 2, 19, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(companyProfile?.name ? companyProfile.name.toUpperCase() : 'SRI MAYYIA CATERERS', pw / 2, 27, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...gold);
    doc.text(templateTitle, pw / 2, 34, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(235, 235, 235);
    doc.text(`Phone: ${companyProfile?.phone || '+91 98450 38235'} | GSTIN: ${companyProfile?.gstin || '29AABCS1429B1Z8'}`, pw / 2, 40, { align: 'center' });

    // 2. Metadata Box
    const metaHeight = resolvedVenue ? 24 : 18;
    const metaStartY = 51;
    doc.setFillColor(247, 242, 232);
    doc.rect(15, metaStartY, pw - 30, metaHeight, 'F');
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.4);
    doc.rect(15, metaStartY, pw - 30, metaHeight);

    doc.setTextColor(...darkCharcoal);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const subCleanName = sub.name ? sub.name.toUpperCase().replace(/^MENU\s+FOR\s+/i, '') : (event?.eventType || 'BANQUET');
    const displayDate = sub.date || event?.date || '';
    const displayPax = sub.guestCount || event?.guestCount || 100;

    doc.text(`Customer: ${event?.customer?.name || 'Valued Guest'}`, 20, metaStartY + 6);
    doc.text(`Occasion: ${subCleanName}`, 20, metaStartY + 12);
    if (resolvedVenue) {
      doc.text(`Venue: ${resolvedVenue}`, 20, metaStartY + 18);
    }

    doc.text(`Date: ${displayDate}`, 130, metaStartY + 6);
    doc.text(`Pax Headcount: ${displayPax} Guests`, 130, metaStartY + 12);

    let y = metaStartY + metaHeight + 7;
    doc.setDrawColor(...maroon);
    doc.setLineWidth(0.8);
    doc.line(20, y, pw - 20, y);
    doc.setFillColor(...maroon);
    doc.circle(pw / 2, y, 2.5, 'F');
    y += 7;

    // 3. Resolve and group dishes
    const rawItemIds = Array.isArray(sub?.menuItems) ? sub.menuItems : [];
    const menuDishIds = rawItemIds.map(item => (typeof item === 'object' && item !== null ? (item.dishId || item.id) : item));

    let selectedDishes = dishesList.filter(d => menuDishIds.includes(d.id));
    if (selectedDishes.length === 0 && rawItemIds.length > 0) {
      selectedDishes = rawItemIds.filter(item => typeof item === 'object' && item !== null && item.name);
    }

    const rawCategories = Array.from(new Set(selectedDishes.map(d => d.category).filter(Boolean)));
    const uniqueCategories = rawCategories.sort((a, b) => {
      const idxA = getDiningOrderIdx(a);
      const idxB = getDiningOrderIdx(b);
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b);
    });

    const grouped = {};
    uniqueCategories.forEach(cat => {
      const matches = selectedDishes
        .filter(d => (d.category || '').toLowerCase() === cat.toLowerCase())
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      if (matches.length > 0) {
        grouped[cat] = matches;
      }
    });

    // 4. Render categories and items in 2 columns
    uniqueCategories.forEach(cat => {
      const items = grouped[cat];
      if (!items || items.length === 0) return;

      if (y > ph - 35) {
        doc.addPage();
        drawOrnateBorder();
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
          drawOrnateBorder();
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

    // 5. Special Instructions & Dietary Directives (strictly scoped to this session & event)
    const sessionInstructions = [];
    if (sub.clientNotes && typeof sub.clientNotes === 'string' && sub.clientNotes.trim()) {
      sessionInstructions.push({ title: `${subCleanName} Directives`, text: sub.clientNotes.trim() });
    }
    if (event?.menuNotes && typeof event.menuNotes === 'string' && event.menuNotes.trim()) {
      if (!sessionInstructions.some(i => i.text === event.menuNotes.trim())) {
        sessionInstructions.push({ title: 'Kitchen Directives', text: event.menuNotes.trim() });
      }
    }
    if (event?.instructions && typeof event.instructions === 'string' && event.instructions.trim()) {
      if (!sessionInstructions.some(i => i.text === event.instructions.trim())) {
        sessionInstructions.push({ title: 'Special Service Instructions', text: event.instructions.trim() });
      }
    }

    if (sessionInstructions.length > 0) {
      const flattenedLines = [];
      sessionInstructions.forEach(inst => {
        if (sessionInstructions.length > 1) {
          flattenedLines.push({ type: 'header', text: `${inst.title}:` });
        }
        const rawLines = inst.text.split('\n');
        rawLines.forEach(rl => {
          const wrapped = doc.splitTextToSize(rl, pw - 46);
          wrapped.forEach(wl => flattenedLines.push({ type: 'line', text: wl }));
        });
      });

      const instBoxHeight = (flattenedLines.length * 4.4) + 14;

      if (y + instBoxHeight > ph - 25) {
        doc.addPage();
        drawOrnateBorder();
        y = 20;
      }

      doc.setFillColor(254, 250, 240); // Warm ivory gold card
      doc.roundedRect(15, y, pw - 30, instBoxHeight, 2, 2, 'F');
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.4);
      doc.roundedRect(15, y, pw - 30, instBoxHeight, 2, 2, 'D');

      let textCursorY = y + 5.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...maroon);
      doc.text('— SPECIAL INSTRUCTIONS & DIETARY DIRECTIVES —', pw / 2, textCursorY, { align: 'center' });
      textCursorY += 4.5;

      flattenedLines.forEach(l => {
        if (l.type === 'header') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...maroon);
          doc.text(l.text, 20, textCursorY);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(40, 40, 40);
          doc.text(l.text, 20, textCursorY);
        }
        textCursorY += 4.2;
      });

      y += instBoxHeight + 6;
    }
  });

  // 6. Running Footer across all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(15, ph - 16, pw - 15, ph - 16);

    doc.setTextColor(...maroon);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('SHREE MAYYIA CATERERS — SWASTIK TRADITIONAL GASTRONOMY', pw / 2, ph - 11, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    const pageStr = totalPages > 1 ? ` | Page ${p} of ${totalPages}` : '';
    doc.text(`Authentic Udupi & Mysuru Ceremonial Feast Specialists | Contact: ${companyProfile?.phone || '+91 98450 38235'}${pageStr}`, pw / 2, ph - 6.5, { align: 'center' });
  }

  const safeEventId = (event?.id || 'EVT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSubName = isAllSessions
    ? 'Full_Event_Baleyele_Menu'
    : (subList[0]?.name || 'Menu').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Sri_Mayyia_Baleyele_Menu_${safeEventId}_${safeSubName}.pdf`;
  const blob = doc.output('blob');
  let blobUrl = '';
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(blob);
    }
  } catch (e) {
    blobUrl = '';
  }

  return { blobUrl, blob, filename, doc };
};

/**
 * Formats date for cover page e.g. "MAY 2 & 3 4 2026" or "AUGUST 28 2026"
 */
const formatCoverDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).toUpperCase();
    const day = d.getDate();
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    return `${months[d.getMonth()]} ${day} ${d.getFullYear()}`;
  } catch (e) {
    return String(dateStr).toUpperCase();
  }
};

/**
 * Formats date into DD.MM.YYYY e.g. "02.05.2026"
 */
const formatMenuDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Generates the Executive Function Menu Sheet (Minimalist Clean Style).
 * Replicates the exact style of the uploaded function prospectus / event menu sheet:
 * - Page 1: Official Sri Mayyia Caterers Logo + Tagline ("Pioneers in authentic, pure vegetarian catering since 1953") + Gold Accent Bar
 * - Centered Underlined Event Date & Venue/Client (e.g. "JUNE 16 & 17 2026", "SHRISTI VILLAGE")
 * - Sequential Numbered Menu Sessions (e.g. "WELCOME DRINKS @ 9 AM  100 PAX", "BREAKFAST :- 50 PAX", "LUNCH :- 250 PAX")
 * - Section headers in bold red [192, 0, 0] with red underline
 * - Sub-categories (e.g. FINGER FOOD, CONTINENTAL, CHATS) in bold uppercase
 * - Numbered dishes list in crisp Times Bold typography
 * - Notes & Parcel distribution requirements at the end
 * - Dynamic page breaking when items overflow
 */
/**
 * Sorts an array of catering sub-functions / sessions in strict chronological order:
 * 1. By session date (e.g., 2026-10-02, 2026-10-03)
 * 2. By session start time (e.g., 07:30 AM, 12:30 PM, 19:30)
 * 3. By authentic South Indian meal progression rank (Early Morning -> Breakfast -> Lunch -> High Tea -> Dinner)
 */
export const sortSubFunctionsChronologically = (subList, defaultDate = '') => {
  if (!Array.isArray(subList) || subList.length <= 1) return subList || [];

  const mealProgression = [
    { key: 'early', rank: 10 },
    { key: 'welcome', rank: 15 },
    { key: 'coffee', rank: 18 },
    { key: 'tiffin', rank: 20 },
    { key: 'breakfast', rank: 25 },
    { key: 'muhurtham', rank: 30 },
    { key: 'brunch', rank: 35 },
    { key: 'lunch', rank: 40 },
    { key: 'oota', rank: 40 },
    { key: 'feast', rank: 45 },
    { key: 'afternoon', rank: 50 },
    { key: 'tea', rank: 60 },
    { key: 'snack', rank: 65 },
    { key: 'high tea', rank: 65 },
    { key: 'evening', rank: 70 },
    { key: 'reception', rank: 80 },
    { key: 'dinner', rank: 85 },
    { key: 'night', rank: 90 },
    { key: 'supper', rank: 95 }
  ];

  const getMealRank = (sub) => {
    const combined = `${sub.name || ''} ${sub.mealType || ''} ${sub.servingType || ''} ${sub.occasion || ''}`.toLowerCase();
    for (const item of mealProgression) {
      if (combined.includes(item.key)) return item.rank;
    }
    return 55;
  };

  const parseTimeMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 99999;
    const match = timeStr.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return 99999;
    let h = parseInt(match[1], 10);
    const m = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = (match[3] || '').toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return h * 60 + m;
  };

  return [...subList].sort((a, b) => {
    // 1. Sort by Date
    const dateA = a.date || defaultDate || '';
    const dateB = b.date || defaultDate || '';
    if (dateA && dateB && dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    // 2. Sort by Time if present
    const tA = parseTimeMinutes(a.time);
    const tB = parseTimeMinutes(b.time);
    if (tA !== 99999 || tB !== 99999) {
      if (tA !== tB) return tA - tB;
    }

    // 3. Sort by Meal Progression
    const rankA = getMealRank(a);
    const rankB = getMealRank(b);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return 0;
  });
};

export const generateExecutiveMenuPdf = (event, subFunction, companyProfile, dishesList = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width; // 210 mm
  const ph = doc.internal.pageSize.height; // 297 mm

  const redColor = [192, 0, 0];    // Ceremonial red #C00000
  const navyColor = [23, 55, 94];  // Deep royal navy #17375E
  const blackColor = [20, 20, 20]; // High contrast black
  const goldColor = [197, 160, 89]; // Sri Mayyia Gold #C5A059

  // Resolve Sub-Functions to render
  let subList = [];
  const isAllSessions = subFunction === 'all' || subFunction?.all === true;
  if (isAllSessions) {
    subList = Array.isArray(event?.subFunctions) && event.subFunctions.length > 0
      ? event.subFunctions
      : (subFunction && typeof subFunction === 'object' ? [subFunction] : [{}]);
  } else if (subFunction && typeof subFunction === 'object') {
    subList = [subFunction];
  } else if (Array.isArray(event?.subFunctions) && event.subFunctions.length > 0) {
    subList = event.subFunctions;
  } else {
    subList = [{}];
  }

  // Sort all sessions in strict chronological order
  subList = sortSubFunctionsChronologically(subList, event?.date);

  // Helper to build dishes for a sub-function
  const resolveSubDishes = (sub) => {
    const rawItemIds = Array.isArray(sub?.menuItems) ? sub.menuItems : [];
    const menuDishIds = rawItemIds.map(item => (typeof item === 'object' && item !== null ? (item.dishId || item.id) : item));

    let resolved = [];
    menuDishIds.forEach(id => {
      const found = dishesList.find(d => String(d.id) === String(id));
      if (found) resolved.push(found);
    });

    if (resolved.length === 0 && rawItemIds.length > 0) {
      rawItemIds.forEach(item => {
        if (typeof item === 'object' && item !== null && item.name) {
          resolved.push(item);
        }
      });
    }

    return resolved.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  };

  // PAGE 1 HEADER
  let currentY = 16;

  // 1. Logo
  if (menuTemplateAssets.companyLogo) {
    try {
      doc.addImage(menuTemplateAssets.companyLogo, 'PNG', 24, currentY, 20, 24);
    } catch (e) {
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...redColor);
      doc.text('SRI MAYYIA CATERERS', 24, currentY + 12);
    }
  }

  // 2. Tagline + Gold Bar
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...redColor);
  doc.text('Pioneers in authentic, pure vegetarian catering since 1953', 49, currentY + 14);

  doc.setFillColor(...goldColor);
  doc.rect(149, currentY + 12, 38, 2.5, 'F');

  currentY += 32;

  // 3. Centered Event Date & Venue/Client (underlined)
  const rawCoverDate = event?.date || subList[0]?.date || new Date().toISOString().split('T')[0];
  const dateHeading = formatCoverDate(rawCoverDate).toUpperCase();
  const resolvedVenue = resolveEventVenue(event);

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navyColor);

  // Date heading with underline
  doc.text(dateHeading, pw / 2, currentY, { align: 'center' });
  const dateWidth = doc.getTextWidth(dateHeading);
  doc.setDrawColor(...navyColor);
  doc.setLineWidth(0.3);
  doc.line(pw / 2 - dateWidth / 2, currentY + 1, pw / 2 + dateWidth / 2, currentY + 1);

  if (resolvedVenue) {
    currentY += 6;
    const venueHeading = resolvedVenue.toUpperCase();
    doc.text(venueHeading, pw / 2, currentY, { align: 'center' });
    const venueWidth = doc.getTextWidth(venueHeading);
    doc.line(pw / 2 - venueWidth / 2, currentY + 1, pw / 2 + venueWidth / 2, currentY + 1);
    currentY += 12;
  } else {
    currentY += 10;
  }

  // Helper for pagination
  const checkPageBreak = (neededHeight = 12) => {
    if (currentY + neededHeight > 280) {
      doc.addPage();
      currentY = 22;
      return true;
    }
    return false;
  };

  // Render Sub-Functions
  subList.forEach((sub, subIdx) => {
    checkPageBreak(25);

    // Build session header text (e.g. "WELCOME DRINKS @ 9 AM  100 PAX" or "LUNCH :- 250 PAX")
    const subName = (sub.name || `SESSION ${subIdx + 1}`).toUpperCase().replace(/^MENU\s+FOR\s+/i, '');
    const timeStr = sub.time ? ` @ ${sub.time}` : '';
    const paxCount = sub.guestCount || event?.guestCount || '';
    const paxStr = paxCount ? `  ${paxCount} PAX` : '';
    const headerTitle = `${subName}${timeStr} :-${paxStr}`;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...redColor);
    doc.text(headerTitle, 24, currentY);

    const titleWidth = doc.getTextWidth(headerTitle);
    doc.setDrawColor(...redColor);
    doc.setLineWidth(0.35);
    doc.line(24, currentY + 1.2, 24 + titleWidth, currentY + 1.2);

    currentY += 6.5;

    if (Array.isArray(sub.liveStations) && sub.liveStations.length > 0) {
      checkPageBreak(8);
      doc.setFont('times', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...navyColor);
      const lsText = `LIVE COUNTERS: ${sub.liveStations.join(' • ')}`;
      doc.text(lsText, 24, currentY);
      currentY += 5;
    }

    const dishes = resolveSubDishes(sub);

    let sessionCounter = 1;
    let currentCategory = '';

    dishes.forEach((d) => {
      checkPageBreak(8);

      const dCat = (d.category || '').toUpperCase();
      const isSpecialCat = dCat.includes('CONTINENTAL') || dCat.includes('FINGER') || dCat.includes('CHAAT') || dCat.includes('CHAT') || dCat.includes('STARTER');

      if (isSpecialCat && dCat !== currentCategory) {
        currentCategory = dCat;
        checkPageBreak(12);
        currentY += 2;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...navyColor);
        doc.text(currentCategory, 24, currentY);
        currentY += 5.5;
      }

      // Dish number
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...blackColor);
      doc.text(`${sessionCounter}.`, 32, currentY, { align: 'right' });

      // Dish Name
      let dName = (d.name || '').toUpperCase();
      if (doc.getTextWidth(dName) > 150) {
        doc.setFontSize(8.5);
        if (doc.getTextWidth(dName) > 150) {
          dName = doc.splitTextToSize(dName, 148)[0] + '...';
        }
      }
      doc.text(dName, 36, currentY);

      sessionCounter++;
      currentY += 5.5;
    });

    currentY += 5; // Spacing after session
  });

  // Check for NOTE section
  const notesList = [];
  if (event?.notes) {
    if (Array.isArray(event.notes)) {
      notesList.push(...event.notes);
    } else if (typeof event.notes === 'string') {
      notesList.push(...event.notes.split('\n').filter(n => n.trim().length > 0));
    }
  }
  if (event?.serviceInstructions) {
    notesList.push(event.serviceInstructions);
  }
  const collectedInst = collectEventInstructions(event);
  collectedInst.forEach(ci => {
    if (ci.text && !notesList.some(n => String(n).includes(ci.text))) {
      notesList.push(`${ci.title}: ${ci.text}`);
    }
  });

  if (notesList.length > 0) {
    checkPageBreak(20);
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...navyColor);
    doc.text('NOTE :', 24, currentY);
    currentY += 5.5;

    notesList.forEach((n, idx) => {
      const splitLines = doc.splitTextToSize(String(n).toUpperCase(), 148);
      checkPageBreak(splitLines.length * 5 + 3);
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...blackColor);
      doc.text(`${idx + 1}.`, 32, currentY, { align: 'right' });
      doc.text(splitLines, 36, currentY);
      currentY += (splitLines.length * 5) + 1;
    });
    currentY += 4;
  }

  // Check for PARCEL section
  const parcelList = [];
  if (event?.parcelNotes) {
    if (Array.isArray(event.parcelNotes)) {
      parcelList.push(...event.parcelNotes);
    } else if (typeof event.parcelNotes === 'string') {
      parcelList.push(...event.parcelNotes.split('\n').filter(p => p.trim().length > 0));
    }
  }

  if (parcelList.length > 0) {
    checkPageBreak(20);
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...navyColor);
    doc.text('PARCEL :', 24, currentY);
    currentY += 5.5;

    parcelList.forEach((p, idx) => {
      const splitLines = doc.splitTextToSize(String(p).toUpperCase(), 148);
      checkPageBreak(splitLines.length * 5 + 3);
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...blackColor);
      doc.text(`${idx + 1}.`, 32, currentY, { align: 'right' });
      doc.text(splitLines, 36, currentY);
      currentY += (splitLines.length * 5) + 1;
    });
  }

  const safeEventId = (event?.id || 'EVT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSubName = isAllSessions
    ? 'Event_Function_Sheet'
    : (subList[0]?.name || 'Menu_Sheet').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Sri_Mayyia_FunctionSheet_${safeEventId}_${safeSubName}.pdf`;

  const blob = doc.output('blob');
  let blobUrl = '';
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(blob);
    }
  } catch (e) {
    blobUrl = '';
  }

  return { blobUrl, blob, filename, doc };
};

/**
 * Generates the Traditional Festive Gold Food Menu PDF.
 * Matches uploaded gold festive menu template (media_1790875990683.pdf):
 * - Page 1: Traditional South Indian Kalasha, coconut & banana plant cover
 *   - Event Title & Client dedication
 *   - Date & Venue placed at exact coordinate geometry
 * - Page 2..N: Inner Food Menu with gold rounded border & floral accents
 *   - Sub-function session title and serving details
 *   - Course categories in royal crimson maroon #9C1519
 *   - Traditional dish list centered in deep royal navy #17375E
 * - Page N+1: Static Back Cover with 25000+ events stats, services, & contact info
 * 
 * Returns { blobUrl, blob, filename, doc }
 */
export const generateGoldMenuPdf = (event, subFunction, companyProfile, dishesList = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width; // 210
  const ph = doc.internal.pageSize.height; // 297

  const maroonColor = [156, 21, 25];  // Deep Ceremonial Maroon #9C1519
  const navyColor = [23, 55, 94];     // Royal Navy #17375E
  const goldColor = [184, 134, 11];   // Dark Goldenrod #B8860B

  // Resolve sub-functions
  let subList = [];
  const isAllSessions = subFunction === 'all' || subFunction?.all === true;
  if (isAllSessions) {
    subList = Array.isArray(event?.subFunctions) && event.subFunctions.length > 0
      ? event.subFunctions
      : (subFunction && typeof subFunction === 'object' ? [subFunction] : [{}]);
  } else if (subFunction && typeof subFunction === 'object') {
    subList = [subFunction];
  } else if (Array.isArray(event?.subFunctions) && event.subFunctions.length > 0) {
    subList = event.subFunctions;
  } else {
    subList = [{}];
  }

  // Sort all sessions in strict chronological order
  subList = sortSubFunctionsChronologically(subList, event?.date);

  const rawCoverDate = event?.date || subList[0]?.date || new Date().toISOString().split('T')[0];
  const coverDateText = formatDisplayDate(rawCoverDate) || formatCoverDate(rawCoverDate);
  const coverEventText = (event?.eventType || event?.title || 'GRAND WEDDING SEATED FEAST').toUpperCase();
  const clientName = (event?.customer && typeof event.customer === 'object' ? event.customer.name : event?.customer) || '';
  const venueText = resolveEventVenue(event);

  // PAGE 1: FESTIVE GOLD COVER
  if (menuTemplateAssets.goldPage1Cover) {
    doc.addImage(menuTemplateAssets.goldPage1Cover, 'JPEG', 0, 0, pw, ph);
  }

  // Event Occasion Title (Y = 126 mm, centered)
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...maroonColor);
  let dispTitle = coverEventText;
  if (doc.getTextWidth(dispTitle) > 130) {
    doc.setFontSize(12);
    if (doc.getTextWidth(dispTitle) > 130) {
      dispTitle = doc.splitTextToSize(dispTitle, 128)[0] + '...';
    }
  }
  doc.text(dispTitle, 105, 126, { align: 'center' });

  // Dedicated Client sub-line if available
  if (clientName) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...goldColor);
    doc.text(`Specially Curated for ${clientName}`, 105, 133, { align: 'center' });
  }

  // Clear pre-printed centered "Date:" and "VENUE:" labels to ensure unified, centered typography
  doc.setFillColor(254, 254, 253);
  doc.rect(75, 154, 60, 24, 'F');

  // Centered Date & Venue
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...maroonColor);

  if (venueText) {
    doc.text(`Date:  ${coverDateText}`, 105, 161.5, { align: 'center' });
    let dispVenue = venueText;
    if (doc.getTextWidth(`VENUE:  ${dispVenue}`) > 140) {
      doc.setFontSize(10);
      if (doc.getTextWidth(`VENUE:  ${dispVenue}`) > 140) {
        dispVenue = doc.splitTextToSize(dispVenue, 130)[0] + '...';
      }
    } else {
      doc.setFontSize(11);
    }
    doc.setTextColor(...navyColor);
    doc.text(`VENUE:  ${dispVenue}`, 105, 172.5, { align: 'center' });
  } else {
    // No venue selected in software -> DO NOT invent or display any venue!
    doc.text(`Date:  ${coverDateText}`, 105, 166, { align: 'center' });
  }

  // Helper to map catalog category to clean uppercase header
  const getSectionHeader = (category) => {
    if (!category) return 'SPECIALITIES';
    const cat = String(category).toLowerCase();
    if (cat.includes('sweet') || cat.includes('dessert') || cat.includes('payasam') || cat.includes('holige')) return 'SWEETS & DESSERTS';
    if (cat.includes('starter') || cat.includes('palya') || cat.includes('kosambari') || cat.includes('appetizer')) return 'STARTERS & SAVORIES';
    if (cat.includes('welcome') || cat.includes('beverage') || cat.includes('juice') || cat.includes('soup')) return 'WELCOME DRINKS';
    if (cat.includes('rice') || cat.includes('bath') || cat.includes('biryani') || cat.includes('sambar') || cat.includes('saaru') || cat.includes('curd')) return 'MAIN COURSE & RICE';
    if (cat.includes('after-meal') || cat.includes('finisher') || cat.includes('pan') || cat.includes('tambula') || cat.includes('coffee')) return 'AFTER-MEAL & TAMBULA';
    return String(category).toUpperCase();
  };

  // Helper to build sections with rich dish items
  const buildMenuSections = (sub) => {
    const rawItemIds = Array.isArray(sub?.menuItems) ? sub.menuItems : [];
    const menuDishIds = rawItemIds.map(item => (typeof item === 'object' && item !== null ? (item.dishId || item.id) : item));

    let resolved = [];
    menuDishIds.forEach(id => {
      const found = dishesList.find(d => String(d.id) === String(id));
      if (found) resolved.push(found);
    });

    if (resolved.length === 0 && rawItemIds.length > 0) {
      rawItemIds.forEach(item => {
        if (typeof item === 'object' && item !== null && item.name) {
          resolved.push(item);
        }
      });
    }

    const allDishes = [...resolved].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const sectionMap = new Map();
    allDishes.forEach(d => {
      const header = getSectionHeader(d.category);
      if (!sectionMap.has(header)) sectionMap.set(header, []);
      sectionMap.get(header).push({
        name: (d.name || '').toUpperCase(),
        description: d.description || d.desc || '',
        instructions: d.instructions || d.specialInstructions || '',
        price: d.price || null
      });
    });

    const sections = [];
    sectionMap.forEach((items, header) => {
      sections.push({ category: header, items });
    });
    return sections;
  };

  // PAGES 2..N: INNER FESTIVE MENU WITH LARGER FONTS & DYNAMIC PAGINATION
  subList.forEach(sub => {
    const rawSubDate = sub.date || event?.date || new Date().toISOString().split('T')[0];
    const dateText = formatMenuDateDDMMYYYY(rawSubDate);
    const subCleanName = sub.name ? sub.name.toUpperCase().replace(/^MENU\s+FOR\s+/i, '') : (event?.eventType || 'BALEYELE FEAST').toUpperCase();
    const servingText = sub.servingType || sub.mealType || event?.serviceStyle || 'Seated Plantain Leaf Feast';
    const paxCount = sub.guestCount || event?.guestCount || 200;

    const sections = buildMenuSections(sub);
    const totalItemsCount = sections.reduce((acc, s) => acc + s.items.length, 0);
    const isSmallMenu = totalItemsCount > 0 && totalItemsCount <= 8;

    let pageIdx = 1;
    const startMenuY = 53;
    const maxPageY = 268; // Safe margin above bottom decorative frame
    let curY = startMenuY;

    // Helper to start a fresh menu page with background and headers
    const addNewMenuPage = (isContinuation = false) => {
      doc.addPage();
      if (menuTemplateAssets.goldPage2Menu) {
        doc.addImage(menuTemplateAssets.goldPage2Menu, 'JPEG', 0, 0, pw, ph);
      }

      // Session Header under FOOD MENU pill badge (Y = 36 to 43 mm)
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...maroonColor);
      const headerSuffix = isContinuation ? ' (CONTD.)' : '';
      doc.text(`${subCleanName}${headerSuffix}`, 105, 36, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const pageInfo = isContinuation ? `   •   PAGE ${pageIdx}` : '';
      doc.text(`${dateText}   •   ${servingText.toUpperCase()}   •   ${paxCount} PAX${pageInfo}`, 105, 42.5, { align: 'center' });

      // Ornamental gold separator
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(70, 45.5, 140, 45.5);

      curY = startMenuY;
    };

    // Initialize first menu page for this subfunction
    addNewMenuPage(false);

    // Spacing factors
    const itemSpacing = isSmallMenu ? 5.5 : 3.8;
    const catSpacingBefore = isSmallMenu ? 7.5 : 5.5;
    const catSpacingAfter = isSmallMenu ? 5.0 : 4.0;

    // Helper to check page break
    const ensureSpace = (neededHeight) => {
      if (curY + neededHeight > maxPageY) {
        pageIdx++;
        addNewMenuPage(true);
      }
    };

    // Render sections and items
    sections.forEach((sec, secIdx) => {
      if (sec.items.length === 0) return;

      // Estimate category heading height + first item height to prevent orphan headings
      const sampleItemHeight = 8;
      const catNeededHeight = catSpacingBefore + 7 + catSpacingAfter + sampleItemHeight;
      ensureSpace(catNeededHeight);

      if (secIdx > 0 && curY > startMenuY) {
        curY += catSpacingBefore;
      }

      // Render Category Heading: bold, readable 13pt maroon
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...maroonColor);
      doc.text(`—  ${sec.category}  —`, 105, curY, { align: 'center' });
      curY += catSpacingAfter;

      // Render Items in Category
      sec.items.forEach(dish => {
        // Measure item name lines (wrapped within 145mm, larger readable 11.5pt font)
        doc.setFont('times', 'bold');
        doc.setFontSize(11.5);
        const nameLines = doc.splitTextToSize(dish.name, 145);
        const nameHeight = nameLines.length * 5.2;

        // Measure description lines if present
        let descLines = [];
        if (dish.description) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9.5);
          descLines = doc.splitTextToSize(dish.description, 135);
        }
        const descHeight = descLines.length * 4.2;

        // Measure dish instruction lines if present
        let instLines = [];
        if (dish.instructions) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9.0);
          instLines = doc.splitTextToSize(`Chef Note: ${dish.instructions}`, 135);
        }
        const instHeight = instLines.length * 4.0;

        const totalItemBlockHeight = nameHeight + descHeight + instHeight + itemSpacing;
        ensureSpace(totalItemBlockHeight);

        // Draw dish name (bold, navy, properly wrapped and centered)
        doc.setFont('times', 'bold');
        doc.setFontSize(11.5);
        doc.setTextColor(...navyColor);
        nameLines.forEach(nl => {
          doc.text(nl, 105, curY, { align: 'center' });
          curY += 5.2;
        });

        // Draw dish description (italic, charcoal, centered)
        if (descLines.length > 0) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(75, 75, 75);
          descLines.forEach(dl => {
            doc.text(dl, 105, curY, { align: 'center' });
            curY += 4.2;
          });
        }

        // Draw dish instruction (italic, maroon accent, centered)
        if (instLines.length > 0) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9.0);
          doc.setTextColor(...maroonColor);
          instLines.forEach(il => {
            doc.text(il, 105, curY, { align: 'center' });
            curY += 4.0;
          });
        }

        curY += itemSpacing;
      });
    });

    // Check for Instructions entered for this session or event
    const sessionInstructions = [];
    if (sub.clientNotes && typeof sub.clientNotes === 'string' && sub.clientNotes.trim()) {
      sessionInstructions.push({ title: `${sub.name || 'Session'} Directives`, text: sub.clientNotes.trim() });
    }
    if (event?.menuNotes && typeof event.menuNotes === 'string' && event.menuNotes.trim()) {
      if (!sessionInstructions.some(i => i.text === event.menuNotes.trim())) {
        sessionInstructions.push({ title: 'Kitchen Directives', text: event.menuNotes.trim() });
      }
    }
    if (event?.instructions && typeof event.instructions === 'string' && event.instructions.trim()) {
      if (!sessionInstructions.some(i => i.text === event.instructions.trim())) {
        sessionInstructions.push({ title: 'Special Service Instructions', text: event.instructions.trim() });
      }
    }

    if (sessionInstructions.length > 0) {
      const flattenedLines = [];
      sessionInstructions.forEach(inst => {
        if (sessionInstructions.length > 1) {
          flattenedLines.push({ type: 'header', text: `${inst.title}:` });
        }
        const rawLines = inst.text.split('\n');
        rawLines.forEach(rl => {
          const wrapped = doc.splitTextToSize(rl, 140);
          wrapped.forEach(wl => flattenedLines.push({ type: 'line', text: wl }));
        });
      });

      const boxHeight = (flattenedLines.length * 4.4) + 12;
      ensureSpace(boxHeight + 6);

      curY += 4;
      const boxStartY = curY;
      doc.setFillColor(254, 250, 240); // Warm ivory gold card
      doc.roundedRect(30, boxStartY, 150, boxHeight, 2, 2, 'F');
      doc.setDrawColor(212, 175, 55); // Gold line
      doc.setLineWidth(0.35);
      doc.roundedRect(30, boxStartY, 150, boxHeight, 2, 2, 'D');

      let textCursorY = boxStartY + 5.5;
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...maroonColor);
      doc.text('— SPECIAL INSTRUCTIONS & DIETARY DIRECTIVES —', 105, textCursorY, { align: 'center' });
      textCursorY += 4.8;

      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);

      flattenedLines.forEach(l => {
        if (l.type === 'header') {
          doc.setFont('times', 'bold');
          doc.text(l.text, 36, textCursorY);
          doc.setFont('times', 'normal');
        } else {
          doc.text(l.text, 36, textCursorY);
        }
        textCursorY += 4.4;
      });

      curY = boxStartY + boxHeight + 6;
    }
  });

  // LAST PAGE: FESTIVE GOLD BACK COVER
  doc.addPage();
  if (menuTemplateAssets.goldPage3Back) {
    doc.addImage(menuTemplateAssets.goldPage3Back, 'JPEG', 0, 0, pw, ph);
  }

  const safeEventId = (event?.id || 'EVT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSubName = isAllSessions
    ? 'Traditional_Festive_Gold_Full_Menu'
    : (subList[0]?.name || 'Menu').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Sri_Mayyia_Festive_Gold_Menu_${safeEventId}_${safeSubName}.pdf`;

  const blob = doc.output('blob');
  let blobUrl = '';
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(blob);
    }
  } catch (e) {
    blobUrl = '';
  }

  return { blobUrl, blob, filename, doc };
};

/**
 * Generates the Official Sri Mayyia Caterers Proposal & Menu PDF booklet.
 * Supports:
 * - 'olive': 5-page Olive Green Proposal & Menu Booklet (Biryani Cover)
 * - 'crimson' / 'official': 5-page Royal Crimson Proposal & Menu Booklet (Thali Cover)
 * - 'gold': 3-page Traditional Festive Gold Food Menu (Kalasha Cover)
 * - 'executive': 1-2 page Executive Function Menu Sheet
 * 
 * Returns { blobUrl, blob, filename, doc }
 */
export const generateOccasionMenuPdf = (event, subFunction, companyProfile, templateId = 'olive', dishesList = []) => {
  // If executive function sheet requested, route to generateExecutiveMenuPdf
  if (templateId === 'executive' || templateId === 'compact' || templateId === 'function_sheet') {
    return generateExecutiveMenuPdf(event, subFunction, companyProfile, dishesList);
  }

  // If traditional festive gold menu requested, route to generateGoldMenuPdf
  if (templateId === 'gold' || templateId === 'festive_gold' || templateId === 'traditional') {
    return generateGoldMenuPdf(event, subFunction, companyProfile, dishesList);
  }

  // If traditional vector / baleyele grand feast menu requested, route to generateVectorOccasionMenuPdf
  if (templateId === 'baleyele' || templateId === 'vector' || templateId === 'wedding' || templateId === 'pooja' || templateId === 'gala') {
    return generateVectorOccasionMenuPdf(event, subFunction, companyProfile, templateId, dishesList);
  }

  // Choose Theme Assets based on templateId
  const isCrimson = templateId === 'crimson' || templateId === 'official';
  const coverAsset = isCrimson
    ? (menuTemplateAssets.crimsonPage1Cover || menuTemplateAssets.page1Cover)
    : (menuTemplateAssets.olivePage1Cover || menuTemplateAssets.page1Cover);
  const aboutAsset = isCrimson
    ? (menuTemplateAssets.crimsonPage2About || menuTemplateAssets.page3About)
    : (menuTemplateAssets.olivePage2About || menuTemplateAssets.page3About);
  const menuAsset = isCrimson
    ? (menuTemplateAssets.crimsonPage3Menu || menuTemplateAssets.page2MenuBg)
    : (menuTemplateAssets.olivePage3Menu || menuTemplateAssets.page2MenuBg);
  const termsAsset = isCrimson
    ? (menuTemplateAssets.crimsonPage4Terms || menuTemplateAssets.page4Terms)
    : (menuTemplateAssets.olivePage4Terms || menuTemplateAssets.page4Terms);
  const backAsset = isCrimson
    ? (menuTemplateAssets.crimsonPage5Back || menuTemplateAssets.page5Back)
    : (menuTemplateAssets.olivePage5Back || menuTemplateAssets.page5Back);

  const primaryColor = isCrimson ? [192, 0, 0] : [74, 93, 35]; // Crimson Red #C00000 vs Deep Olive #4A5D23
  const navyColor = [23, 55, 94];     // Deep royal navy #17375E

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.width; // 210
  const ph = doc.internal.pageSize.height; // 297

  // Resolve Sub-Functions to render
  let subList = [];
  const isAllSessions = subFunction === 'all' || subFunction?.all === true;
  if (isAllSessions) {
    subList = Array.isArray(event?.subFunctions) && event.subFunctions.length > 0
      ? event.subFunctions
      : (subFunction && typeof subFunction === 'object' ? [subFunction] : [{}]);
  } else if (subFunction && typeof subFunction === 'object') {
    subList = [subFunction];
  } else if (Array.isArray(event?.subFunctions) && event.subFunctions.length > 0) {
    subList = event.subFunctions;
  } else {
    subList = [{}];
  }

  // Sort all sessions in strict chronological order
  subList = sortSubFunctionsChronologically(subList, event?.date);

  const rawCoverDate = event?.date || subList[0]?.date || new Date().toISOString().split('T')[0];
  const coverDateText = formatCoverDate(rawCoverDate);
  const coverEventText = (event?.eventType || event?.title || 'GRAND WEDDING RECEPTION') +
    (event?.customer?.name ? ` - ${event.customer.name}` : '');

  // PAGE 1: COVER PAGE
  if (coverAsset) {
    doc.addImage(coverAsset, 'JPEG', 0, 0, pw, ph);
  }
  doc.setFont('times', 'bold');
  doc.setFontSize(12.5);
  // Pure crisp white font for Page 1 cover ONLY to ensure contrast against dark artwork
  doc.setTextColor(255, 255, 255);

  const coverDateX = isCrimson ? 51.5 : 53.5;
  const coverDateY = isCrimson ? 143.2 : 150.5;
  doc.text(coverDateText, coverDateX, coverDateY);

  let displayEventTitle = coverEventText.toUpperCase();
  if (doc.getTextWidth(displayEventTitle) > 138) {
    doc.setFontSize(11);
    if (doc.getTextWidth(displayEventTitle) > 138) {
      displayEventTitle = doc.splitTextToSize(displayEventTitle, 136)[0] + '...';
    }
  }
  const coverEventX = isCrimson ? 53.5 : 56.5;
  const coverEventY = isCrimson ? 159.2 : 166.4;
  doc.text(displayEventTitle, coverEventX, coverEventY);

  // PAGE 2: COMPANY CREDENTIALS & ACHIEVEMENTS
  doc.addPage();
  if (aboutAsset) {
    doc.addImage(aboutAsset, 'JPEG', 0, 0, pw, ph);
  }

  // Helper to map catalog category to clean uppercase header
  const getSectionHeader = (category) => {
    if (!category) return '';
    const cat = String(category).toLowerCase();
    if (cat.includes('shell')) return 'SHELL BASED FRESH JUICE';
    if (cat.includes('mocktail')) return 'MOCKTAILS';
    if (cat.includes('lassi')) return 'LASSI';
    if (cat.includes('starter')) return 'STARTERS';
    if (cat.includes('soup')) return 'SOUPS';
    if (cat.includes('chaat')) return 'CHAATS';
    if (cat.includes('welcome') || cat.includes('beverage')) return 'SHELL BASED FRESH JUICE';
    if (cat.includes('appetizer') || cat.includes('street')) return 'CHATS & APPETIZERS';
    if (cat.includes('global') || cat.includes('fusion') || cat.includes('continental') || cat.includes('pasta')) return 'CONTINENTAL';
    if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('ice cream')) return 'SWEETS & DESSERTS';
    if (cat.includes('after-meal') || cat.includes('finisher') || cat.includes('pan')) return 'AFTER-MEAL';
    return String(category).toUpperCase();
  };

  // Helper to group dishes into display sections
  const buildMenuSections = (sub) => {
    const rawItemIds = Array.isArray(sub?.menuItems) ? sub.menuItems : [];
    const menuDishIds = rawItemIds.map(item => (typeof item === 'object' && item !== null ? (item.dishId || item.id) : item));

    let resolved = [];
    menuDishIds.forEach(id => {
      const found = dishesList.find(d => String(d.id) === String(id));
      if (found) resolved.push(found);
    });

    if (resolved.length === 0 && rawItemIds.length > 0) {
      rawItemIds.forEach(item => {
        if (typeof item === 'object' && item !== null && item.name) {
          resolved.push(item);
        }
      });
    }

    const allDishes = [...resolved].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Group into sections by mapped category
    const sectionMap = new Map();
    allDishes.forEach(d => {
      const header = getSectionHeader(d.category);
      if (!sectionMap.has(header)) {
        sectionMap.set(header, []);
      }
      sectionMap.get(header).push((d.name || '').toUpperCase());
    });

    const sections = [];
    sectionMap.forEach((items, header) => {
      sections.push({ category: header, items });
    });

    return sections;
  };

  const centerX = 94.0; // Exact center of table item section

  // PAGES 3..N: SUB-FUNCTION MENU PAGES
  subList.forEach(sub => {
    const rawSubDate = sub.date || event?.date || new Date().toISOString().split('T')[0];
    const dateText = formatMenuDateDDMMYYYY(rawSubDate);
    const occasionText = sub.occasion || sub.name || event?.eventType || 'Banquet';
    const servingText = sub.servingType || sub.mealType || event?.serviceStyle || 'Buffet';
    const subCleanName = sub.name ? sub.name.toUpperCase().replace(/^MENU\s+FOR\s+/i, '') : 'BANQUET';

    // Centered Dishes in Item Column
    const sections = buildMenuSections(sub);

    const renderLines = [];
    sections.forEach(s => {
      if (s.category) {
        renderLines.push({ type: 'category', text: s.category });
      }
      s.items.forEach(item => {
        renderLines.push({ type: 'item', text: item });
      });
    });

    const MAX_LINES_PER_PAGE = 18;
    const pageChunks = [];
    for (let i = 0; i < renderLines.length; i += MAX_LINES_PER_PAGE) {
      pageChunks.push(renderLines.slice(i, i + MAX_LINES_PER_PAGE));
    }
    if (pageChunks.length === 0) pageChunks.push([]);

    // Collect session instructions strictly belonging to this session or event
    const sessionInstructions = [];
    if (sub.clientNotes && typeof sub.clientNotes === 'string' && sub.clientNotes.trim()) {
      sessionInstructions.push({ title: `${subCleanName} Directives`, text: sub.clientNotes.trim() });
    }
    if (event?.menuNotes && typeof event.menuNotes === 'string' && event.menuNotes.trim()) {
      const trimmedNotes = event.menuNotes.trim();
      if (!sessionInstructions.some(i => i.text === trimmedNotes)) {
        sessionInstructions.push({ title: 'Kitchen Directives', text: trimmedNotes });
      }
    }
    if (event?.instructions && typeof event.instructions === 'string' && event.instructions.trim()) {
      const trimmedInst = event.instructions.trim();
      if (!sessionInstructions.some(i => i.text === trimmedInst)) {
        sessionInstructions.push({ title: 'Special Service Instructions', text: trimmedInst });
      }
    }

    // Format & pre-wrap instruction lines for the pre-printed "Instructions" Table Column
    // Table Instructions column spans X = 160.3 to 195.5 mm (width = 35.2 mm)
    const instColX = 163.0; // Left padding inside Instructions column
    const instColWidth = 29.5;
    const formattedInstLines = [];

    sessionInstructions.forEach((inst, sIdx) => {
      if (sessionInstructions.length > 1 || inst.title) {
        formattedInstLines.push({ type: 'header', text: `${inst.title}:` });
      }
      const rawLines = inst.text.split('\n');
      rawLines.forEach(rl => {
        const trimmed = rl.trim();
        if (!trimmed) return;
        const wrapped = doc.splitTextToSize(trimmed, instColWidth);
        wrapped.forEach((wl, wIdx) => {
          // If first line of a bullet item, prefix bullet if not already present
          const lineText = (wIdx === 0 && !trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('[') && !trimmed.startsWith('*'))
            ? `• ${wl}`
            : wl;
          formattedInstLines.push({ type: 'text', text: lineText });
        });
      });
      if (sIdx < sessionInstructions.length - 1) {
        formattedInstLines.push({ type: 'spacer', text: '' });
      }
    });

    let instLineIdx = 0;
    let sessionItemNum = 0;

    pageChunks.forEach((chunk, chunkIdx) => {
      doc.addPage();
      if (menuAsset) {
        doc.addImage(menuAsset, 'JPEG', 0, 0, pw, ph);
      }

      // 1. Dynamic Session Details (Occasion, Date, Serving)
      const occasionVal = (sub.occasion || (sub.name && sub.name.toUpperCase() !== occasionText.toUpperCase() ? occasionText : '') || event?.eventType || '').toUpperCase();
      let servingVal = servingText.toUpperCase();

      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...primaryColor);

      // Above the table (Y = 48 mm)
      doc.text(`Occasion: ${occasionVal || 'BANQUET'}`, 15, 48);
      doc.text(`Date: ${dateText}`, 94, 48, { align: 'center' });
      doc.text(`Serving: ${servingVal}`, 195, 48, { align: 'right' });

      // 2. Table Merged Bar: "MENU for <NAME>"
      const headerSuffix = chunkIdx > 0 ? ' (CONTD.)' : '';
      doc.setFont('times', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...primaryColor);
      doc.text(`MENU for ${subCleanName}${headerSuffix}`, 94.0, 60.5, { align: 'center' });

      // 3. Pax in Column 3 header: exact number right after "Pax:"
      const paxCount = sub.guestCount || event?.guestCount || 200;
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...primaryColor);
      doc.text(String(paxCount), 126.0, 70.3);

      const availableHeight = 270 - 77; // 193 mm
      const stepY = Math.min(8.0, Math.max(5.8, availableHeight / (chunk.length + 1)));

      let curY = 77 + stepY;

      chunk.forEach(entry => {
        if (entry.type === 'category') {
          curY += stepY * 0.3;
          doc.setFont('times', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...primaryColor);
          doc.text(entry.text, centerX, curY, { align: 'center' });
          curY += stepY;
        } else {
          sessionItemNum++;
          // Column 1: SL NO (center X = 21.05 mm)
          doc.setFont('times', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...primaryColor);
          doc.text(String(sessionItemNum), 21.05, curY, { align: 'center' });

          // Column 2: Item Name (center X = 94.0 mm)
          doc.setFont('times', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(...navyColor);

          let displayName = entry.text;
          if (doc.getTextWidth(displayName) > 124) {
            doc.setFontSize(8.5);
            if (doc.getTextWidth(displayName) > 124) {
              displayName = doc.splitTextToSize(displayName, 122)[0] + '...';
            }
          } else {
            doc.setFontSize(9.5);
          }

          doc.text(displayName, centerX, curY, { align: 'center' });
          curY += stepY;
        }
      });

      // Render Instructions directly inside the pre-printed "Instructions" Table Column (Column 3)
      let instY = 78.0;
      while (instLineIdx < formattedInstLines.length && instY <= 272) {
        const lineObj = formattedInstLines[instLineIdx];
        if (lineObj.type === 'header') {
          doc.setFont('times', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...primaryColor);
          doc.text(lineObj.text, instColX, instY);
          instY += 3.8;
        } else if (lineObj.type === 'spacer') {
          instY += 2.0;
        } else {
          doc.setFont('times', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(40, 40, 40);
          doc.text(lineObj.text, instColX, instY);
          instY += 3.4;
        }
        instLineIdx++;
      }
    });

    // If there are still instructions remaining after all dish page chunks, add continuation page
    while (instLineIdx < formattedInstLines.length) {
      doc.addPage();
      if (menuAsset) {
        doc.addImage(menuAsset, 'JPEG', 0, 0, pw, ph);
      }
      const occasionVal = (sub.occasion || (sub.name && sub.name.toUpperCase() !== occasionText.toUpperCase() ? occasionText : '') || event?.eventType || '').toUpperCase();
      let servingVal = servingText.toUpperCase();

      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...primaryColor);
      doc.text(`Occasion: ${occasionVal || 'BANQUET'}`, 15, 48);
      doc.text(`Date: ${dateText}`, 94, 48, { align: 'center' });
      doc.text(`Serving: ${servingVal}`, 195, 48, { align: 'right' });

      doc.setFontSize(11.5);
      doc.text(`MENU for ${subCleanName} (CONTD.)`, 94.0, 60.5, { align: 'center' });

      const paxCount = sub.guestCount || event?.guestCount || 200;
      doc.setFontSize(10.5);
      doc.text(String(paxCount), 126.0, 70.3);

      let contInstY = 78.0;
      while (instLineIdx < formattedInstLines.length && contInstY <= 272) {
        const lineObj = formattedInstLines[instLineIdx];
        if (lineObj.type === 'header') {
          doc.setFont('times', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...primaryColor);
          doc.text(lineObj.text, instColX, contInstY);
          contInstY += 3.8;
        } else if (lineObj.type === 'spacer') {
          contInstY += 2.0;
        } else {
          doc.setFont('times', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(40, 40, 40);
          doc.text(lineObj.text, instColX, contInstY);
          contInstY += 3.4;
        }
        instLineIdx++;
      }
    }
  });

  // SECOND-TO-LAST PAGE: SERVICE TERMS
  doc.addPage();
  if (termsAsset) {
    doc.addImage(termsAsset, 'JPEG', 0, 0, pw, ph);
  }

  // LAST PAGE: BACK COVER & HERITAGE
  doc.addPage();
  if (backAsset) {
    doc.addImage(backAsset, 'JPEG', 0, 0, pw, ph);
  }

  const safeEventId = (event?.id || 'EVT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSubName = isAllSessions
    ? 'Full_Event_Proposal'
    : (subList[0]?.name || 'Menu').replace(/[^a-zA-Z0-9_-]/g, '_');
  const themePrefix = isCrimson ? 'Crimson_Proposal' : 'Olive_Proposal';
  const filename = `Sri_Mayyia_${themePrefix}_${safeEventId}_${safeSubName}.pdf`;

  const blob = doc.output('blob');
  let blobUrl = '';
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(blob);
    }
  } catch (e) {
    blobUrl = '';
  }

  return { blobUrl, blob, filename, doc };
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

  renderTable(doc, {
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

  renderTable(doc, {
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


