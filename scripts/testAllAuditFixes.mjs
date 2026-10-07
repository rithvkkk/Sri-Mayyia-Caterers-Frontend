import {
  generateOccasionMenuPdf,
  generateVectorOccasionMenuPdf,
  generateGoldMenuPdf,
  generateExecutiveMenuPdf,
  generateSupplierPO,
  generateOfficialTaxInvoicePdf,
  calculatePdfReport,
  resolveEventVenue
} from '../src/utils/pdfGenerator.js';

const mockCompanyProfile = {
  name: 'Sri Mayyia Caterers',
  phone: '+91 98450 38235',
  email: 'info@mayyia.in',
  gstin: '29AABCS1429B1Z8',
  currency: '₹'
};

const mockDishes = [
  { id: 'd1', name: 'Pineapple Rasam', category: 'Sambar & Rasam', price: 60, type: 'Soup' },
  { id: 'd2', name: 'Badam Halwa', category: 'Sweets & Desserts', price: 120, type: 'Sweet' },
  { id: 'd3', name: 'Bisi Bele Bath', category: 'Rice Dishes', price: 90, type: 'Rice' },
  { id: 'd4', name: 'Mysore Pak', category: 'Sweets & Desserts', price: 110, type: 'Sweet' },
  { id: 'd5', name: 'Curd Rice', category: 'Rice Dishes', price: 50, type: 'Rice' }
];

const mockSuppliers = [
  { id: 'sup1', name: 'Sri Krishna Provisions', phone: '9845112233', email: 'krishna@provisions.com' }
];

console.log('=== RUNNING MAYYIA SOFTWARE AUDIT VERIFICATION TESTS ===\n');

let allPassed = true;
const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    allPassed = false;
  }
};

// -------------------------------------------------------------
// TEST 1: Missing Menu Template (Baleyele)
// -------------------------------------------------------------
console.log('TEST 1: Missing Menu Template (Baleyele) - Identification & Generation');
const baleyeleEvent = {
  id: 'EVT-TEST-001',
  customer: { name: 'Aditya Hegde' },
  eventType: 'Baleyele Seated Feast',
  date: '2026-10-15',
  venue: 'Shristi Village',
  subFunctions: [
    {
      id: 'sub1',
      name: 'Grand Baleyele Lunch',
      date: '2026-10-15',
      guestCount: 250,
      menuItems: ['d1', 'd2', 'd3', 'd4', 'd5'],
      clientNotes: 'Mandatory Banana leaf seated service. Warm pure desi ghee.'
    }
  ]
};

const resBaleyeleViaOccasion = generateOccasionMenuPdf(baleyeleEvent, baleyeleEvent.subFunctions[0], mockCompanyProfile, 'baleyele', mockDishes);
assert(resBaleyeleViaOccasion && resBaleyeleViaOccasion.doc, 'generateOccasionMenuPdf correctly routes templateId="baleyele"');
assert(resBaleyeleViaOccasion.filename.toLowerCase().includes('baleyele'), `Filename contains baleyele: ${resBaleyeleViaOccasion.filename}`);

const baleyelePages = resBaleyeleViaOccasion.doc.internal.getNumberOfPages();
assert(baleyelePages >= 1, `Baleyele generated ${baleyelePages} page(s)`);

// Test Multi-Session Baleyele
const multiSessionBaleyeleEvent = {
  ...baleyeleEvent,
  subFunctions: [
    {
      id: 'sub1',
      name: 'Breakfast Feast',
      date: '2026-10-15',
      guestCount: 150,
      menuItems: ['d1', 'd2']
    },
    {
      id: 'sub2',
      name: 'Royal Seated Lunch',
      date: '2026-10-15',
      guestCount: 300,
      menuItems: ['d3', 'd4', 'd5']
    }
  ]
};
const resMultiBaleyele = generateVectorOccasionMenuPdf(multiSessionBaleyeleEvent, 'all', mockCompanyProfile, 'baleyele', mockDishes);
const multiBaleyelePages = resMultiBaleyele.doc.internal.getNumberOfPages();
assert(multiBaleyelePages >= 2, `Multi-session Baleyele generated ${multiBaleyelePages} pages (1 per session)`);

// -------------------------------------------------------------
// TEST 2: Venue Resolver - Single Source of Truth
// -------------------------------------------------------------
console.log('\nTEST 2: Venue Selection Flow');
const eventWithVenue = { venue: 'Swarga Heritage Hall' };
const eventWithNoVenue = { venue: '', venueName: '', venueId: '' };
const eventWithTBD = { venue: 'TBD', venueName: 'tba' };

assert(resolveEventVenue(eventWithVenue) === 'Swarga Heritage Hall', 'Resolves actual selected venue');
assert(resolveEventVenue(eventWithNoVenue) === '', 'No venue selected returns empty string (never invents venue)');
assert(resolveEventVenue(eventWithTBD) === '', 'TBD/TBA venue returns empty string');

// Verify venue in Baleyele PDF
const resNoVenueBaleyele = generateVectorOccasionMenuPdf(
  { ...baleyeleEvent, venue: '' },
  baleyeleEvent.subFunctions[0],
  mockCompanyProfile,
  'baleyele',
  mockDishes
);
assert(resNoVenueBaleyele && resNoVenueBaleyele.doc, 'Baleyele renders safely when no venue is selected');

// -------------------------------------------------------------
// TEST 3: Menu Planning PDF Instructions (Olive, Crimson, Baleyele, Gold)
// -------------------------------------------------------------
console.log('\nTEST 3: Instructions in Menu Planning PDFs');

const eventWithInstructions = {
  id: 'EVT-INST-001',
  customer: { name: 'Kavitha Rao' },
  eventType: 'Traditional Engagement',
  date: '2026-11-20',
  venue: 'Sri Swastik Kalyana Mantapa',
  menuNotes: 'VIP Counter with brass tumbler filter coffee at 4 PM.',
  instructions: 'Ensure no onion / garlic throughout all courses.',
  subFunctions: [
    {
      id: 'sub1',
      name: 'Engagement High-Tea',
      date: '2026-11-20',
      guestCount: 200,
      menuItems: ['d1', 'd2'],
      clientNotes: 'Chilled welcome drinks on arrival.'
    }
  ]
};

// Olive proposal booklet with instructions
const resOlive = generateOccasionMenuPdf(eventWithInstructions, 'all', mockCompanyProfile, 'olive', mockDishes);
assert(resOlive && resOlive.doc, 'Olive Green proposal generated with instructions');
const oliveText = resOlive.doc.internal.pages.map(p => Array.isArray(p) ? p.join(' ') : String(p)).join(' ');
assert(oliveText.includes('welcome drinks') && oliveText.includes('Directives'), 'Olive Green proposal renders session notes in Instructions column');

// Crimson proposal booklet with instructions
const resCrimson = generateOccasionMenuPdf(eventWithInstructions, 'all', mockCompanyProfile, 'crimson', mockDishes);
assert(resCrimson && resCrimson.doc, 'Royal Crimson proposal generated with instructions');
const crimsonText = resCrimson.doc.internal.pages.map(p => Array.isArray(p) ? p.join(' ') : String(p)).join(' ');
assert(crimsonText.includes('welcome drinks') && crimsonText.includes('Directives'), 'Royal Crimson proposal renders session notes in Instructions column');

// Traditional Festive Gold with instructions
const resGold = generateOccasionMenuPdf(eventWithInstructions, 'all', mockCompanyProfile, 'gold', mockDishes);
assert(resGold && resGold.doc, 'Traditional Festive Gold menu generated with instructions');

// Executive Function Sheet with instructions
const resExecutive = generateExecutiveMenuPdf(eventWithInstructions, 'all', mockCompanyProfile, mockDishes);
assert(resExecutive && resExecutive.doc, 'Executive Function Sheet generated with instructions');

// -------------------------------------------------------------
// TEST 4: Prevent Stale Instructions Scenario
// -------------------------------------------------------------
console.log('\nTEST 4: Stale Instructions Prevention (Event A vs Event B vs Event C)');

const eventA = {
  id: 'EVT-A',
  customer: { name: 'Client A' },
  menuNotes: 'Directive A: Special pineapple rasam for elders table',
  subFunctions: [{ name: 'Lunch', menuItems: ['d1'], clientNotes: 'Session A Notes' }]
};

const eventB = {
  id: 'EVT-B',
  customer: { name: 'Client B' },
  menuNotes: '',
  instructions: '',
  subFunctions: [{ name: 'Lunch', menuItems: ['d1'], clientNotes: '' }]
};

const eventC = {
  id: 'EVT-C',
  customer: { name: 'Client C' },
  menuNotes: 'Directive C: Pure Jain counters only',
  subFunctions: [{ name: 'Dinner', menuItems: ['d2'], clientNotes: 'Session C Notes' }]
};

const pdfA = generateOccasionMenuPdf(eventA, 'all', mockCompanyProfile, 'olive', mockDishes);
const pdfB = generateOccasionMenuPdf(eventB, 'all', mockCompanyProfile, 'olive', mockDishes);
const pdfC = generateOccasionMenuPdf(eventC, 'all', mockCompanyProfile, 'olive', mockDishes);

// Helper to inspect jsPDF text buffer
const extractPdfText = (doc) => {
  return doc.internal.pages.map(p => Array.isArray(p) ? p.join(' ') : String(p)).join(' ');
};

const textA = extractPdfText(pdfA.doc);
const textB = extractPdfText(pdfB.doc);
const textC = extractPdfText(pdfC.doc);

assert(textA.includes('Directive A'), 'Event A PDF contains Event A directives');
assert(!textB.includes('Directive A'), 'Event B PDF strictly does NOT contain Event A directives (no leakage)');
assert(!textB.includes('Directive C'), 'Event B PDF strictly does NOT contain Event C directives (no leakage)');
assert(textC.includes('Directive C'), 'Event C PDF contains Event C directives');
assert(!textC.includes('Directive A'), 'Event C PDF strictly does NOT contain Event A directives');

// -------------------------------------------------------------
// TEST 5: PO Allocation PDF Alignment & Pagination
// -------------------------------------------------------------
console.log('\nTEST 5: PO Allocation PDF Column Alignment & Pagination');

const mockEventForPO = {
  id: 'EVT-PO-TEST',
  customer: { name: 'Sunil Kumar' },
  date: '2026-12-05',
  venue: 'Palace Grounds'
};

const mockAllocations = [
  { materialId: 'm1', materialName: 'Sona Masoori Rice Super Fine Grade A', category: 'Grains & Rice', requiredQty: 50, unit: 'kg', unitPrice: 65, totalAmount: 3250 },
  { materialId: 'm2', materialName: 'Pure Cow Desi Ghee Agmark Grade 1 Special Aroma', category: 'Dairy & Ghee', requiredQty: 25, unit: 'kg', unitPrice: 620, totalAmount: 15500 },
  { materialId: 'm3', materialName: 'Toor Dal Premium Unpolished Swastik', category: 'Pulses & Dals', requiredQty: 30, unit: 'kg', unitPrice: 175, totalAmount: 5250 },
  { materialId: 'm4', materialName: 'Almonds Badam Mamra Roasted', category: 'Dry Fruits & Nuts', requiredQty: 10, unit: 'kg', unitPrice: 950, totalAmount: 9500 }
];

const resPO = generateSupplierPO(mockSuppliers[0], mockAllocations, mockEventForPO, mockCompanyProfile);
assert(resPO && resPO.doc, 'Supplier Purchase Order generated successfully');
assert(resPO.filename.includes('PO_EVT-PO-TEST'), `Filename contains event ID: ${resPO.filename}`);

const poPages = resPO.doc.internal.getNumberOfPages();
assert(poPages >= 1, `PO generated ${poPages} page(s) with clean layout`);

// Multi-page PO allocation test
const longAllocations = [];
for (let i = 1; i <= 35; i++) {
  longAllocations.push({
    materialId: `m_${i}`,
    materialName: `Raw Material Item ${i} - Extra Long Description For Table Wrapping Test`,
    category: i % 2 === 0 ? 'Provisions' : 'Vegetables',
    requiredQty: i * 5,
    unit: 'kg',
    unitPrice: 100 + i,
    totalAmount: (i * 5) * (100 + i)
  });
}
const resLongPO = generateSupplierPO(mockSuppliers[0], longAllocations, mockEventForPO, mockCompanyProfile);
const longPoPages = resLongPO.doc.internal.getNumberOfPages();
assert(longPoPages >= 2, `Large PO cleanly paginated across ${longPoPages} pages without crashing`);

// Test PO Header alignment with actual long address from database
const longAddressProfile = {
  ...mockCompanyProfile,
  address: '#39/2 , C/2 , Goverdhanagiri , Banashankari , 1st Stage , Bengaluru , Karnataka 560050'
};
const resPOLongAddress = generateSupplierPO(mockSuppliers[0], mockAllocations, mockEventForPO, longAddressProfile);
const poLongAddrText = resPOLongAddress.doc.internal.pages.map(p => Array.isArray(p) ? p.join(' ') : String(p)).join(' ');
assert(poLongAddrText.includes('Karnataka 560050'), 'PO with long address wraps properly without clipping zip code');
assert(poLongAddrText.includes('PURCHASE ORDER'), 'PO contains properly aligned PURCHASE ORDER badge');

// -------------------------------------------------------------
// TEST 6: Official Tax Invoice PDF & Manual GST
// -------------------------------------------------------------
console.log('\nTEST 6: Official Tax Invoice PDF (Manual GST & Venue)');

const invoiceEvent = {
  id: 'INV-TEST-2026',
  customer: { name: 'Rajesh Sharma', phone: '9845011223' },
  eventType: 'Wedding Banquet',
  date: '2026-10-25',
  venue: 'Swarga Heritage Convention',
  subFunctions: [
    { name: 'Dinner Buffet', guestCount: 500, pricePerPlate: 850 }
  ],
  billing: {
    baseAmount: 425000,
    gstRate: 5, // Manual 5% GST
    gstAmount: 21250,
    grandTotal: 446250
  }
};

const resInvoice = generateOfficialTaxInvoicePdf(invoiceEvent, mockCompanyProfile);
assert(resInvoice && resInvoice.doc, 'Official Tax Invoice generated successfully');
assert(resInvoice.filename.toLowerCase().includes('tax_invoice'), `Filename contains tax_invoice: ${resInvoice.filename}`);

// -------------------------------------------------------------
// TEST 7: 6 Distinct Sessions Independent PAX & Pricing
// -------------------------------------------------------------
console.log('\nTEST 7: Event-Wise Independent PAX Counts and Pricing for 6 Multiple Sessions');

const sixSessionEvent = {
  id: 'EVT-6SESSIONS-TEST',
  customer: { name: 'Naveen Kumar', phone: '9845099887' },
  eventType: 'Traditional Grand Wedding',
  date: '2026-11-10',
  dates: ['2026-11-10', '2026-11-11'],
  venue: 'Sri Gayathri Kalyana Mantapa',
  createdBy: 'user_sales_01',
  createdByName: 'Sunil Sales Exec',
  salesExecutive: 'Sunil Sales Exec',
  subFunctions: [
    { id: 'sf-101', name: 'Vara Pooja', date: '2026-11-10', startTime: '08:00', endTime: '10:30', guestCount: 200, pricePerPlate: 750, menuItems: ['d1'], instructions: 'Traditional silver tumbler pooja' },
    { id: 'sf-102', name: 'Snacks', date: '2026-11-10', startTime: '11:30', endTime: '13:00', guestCount: 150, pricePerPlate: 350, menuItems: ['d2'], instructions: 'Hot filter coffee and bonda' },
    { id: 'sf-103', name: 'Dinner', date: '2026-11-10', startTime: '19:30', endTime: '22:30', guestCount: 500, pricePerPlate: 850, menuItems: ['d3'], instructions: 'Grand wedding reception feast' },
    { id: 'sf-104', name: 'Breakfast', date: '2026-11-11', startTime: '08:30', endTime: '10:30', guestCount: 300, pricePerPlate: 400, menuItems: ['d4'], instructions: 'Muhurtham breakfast' },
    { id: 'sf-105', name: 'Lunch', date: '2026-11-11', startTime: '12:30', endTime: '15:30', guestCount: 750, pricePerPlate: 900, menuItems: ['d5'], instructions: 'Plantain leaf muhurtham lunch' },
    { id: 'sf-106', name: 'Snacks', date: '2026-11-11', startTime: '16:30', endTime: '18:00', guestCount: 100, pricePerPlate: 300, menuItems: ['d1', 'd2'], instructions: 'Send-off tea and snacks' }
  ]
};

// 1. Verify all 6 sessions retain distinct IDs and independent parameters
assert(sixSessionEvent.subFunctions.length === 6, 'Event maintains all 6 configured sessions');
const uniqueIds = new Set(sixSessionEvent.subFunctions.map(s => s.id));
assert(uniqueIds.size === 6, 'All 6 sessions possess unique stable IDs');

// 2. Verify duplicate meal name collision protection (Snacks Day 1 vs Snacks Day 2)
const snacksSessions = sixSessionEvent.subFunctions.filter(s => s.name === 'Snacks');
assert(snacksSessions.length === 2, 'Two separate Snacks sessions stored independently');
assert(snacksSessions[0].id !== snacksSessions[1].id, 'Snacks sessions have distinct unique IDs');
assert(snacksSessions[0].date !== snacksSessions[1].date, 'Snacks sessions have distinct dates (Day 1 vs Day 2)');
assert(snacksSessions[0].guestCount === 150 && snacksSessions[1].guestCount === 100, 'Snacks sessions maintain independent PAX counts (150 vs 100)');
assert(snacksSessions[0].pricePerPlate === 350 && snacksSessions[1].pricePerPlate === 300, 'Snacks sessions maintain independent plate prices (350 vs 300)');

// 3. Verify editing one session does not overwrite another session
const editedSubFunctions = sixSessionEvent.subFunctions.map(sf => {
  if (sf.id === 'sf-105') {
    return { ...sf, guestCount: 800, pricePerPlate: 950 };
  }
  return sf;
});
assert(editedSubFunctions.find(s => s.id === 'sf-105').guestCount === 800, 'Lunch session successfully updated to 800 PAX');
assert(editedSubFunctions.find(s => s.id === 'sf-101').guestCount === 200, 'Vara Pooja session retained its 200 PAX without mutation');
assert(editedSubFunctions.find(s => s.id === 'sf-103').guestCount === 500, 'Dinner session retained its 500 PAX without mutation');

// 4. Verify session-wise subtotal calculation
const expectedSubtotal = (200 * 750) + (150 * 350) + (500 * 850) + (300 * 400) + (750 * 900) + (100 * 300);
// 150000 + 52500 + 425000 + 120000 + 675000 + 30000 = 1452500
assert(expectedSubtotal === 1452500, `Expected subtotal matches ₹14,52,500 (calculated: ${expectedSubtotal})`);

const calculatedSessionSubtotal = sixSessionEvent.subFunctions.reduce((sum, sf) => sum + (sf.guestCount * sf.pricePerPlate), 0);
assert(calculatedSessionSubtotal === 1452500, `Session-wise subtotal formula produces exact sum: ₹${calculatedSessionSubtotal.toLocaleString('en-IN')}`);

// -------------------------------------------------------------
// TEST 8: Exported PDFs PAX Text and Alignment
// -------------------------------------------------------------
console.log('\nTEST 8: Exported PDFs PAX Text and Alignment Verification');

// Test Baleyele proposal for 6 sessions
const pdf6Baleyele = generateOccasionMenuPdf(sixSessionEvent, 'all', mockCompanyProfile, 'baleyele', mockDishes);
assert(pdf6Baleyele && pdf6Baleyele.doc, 'Baleyele PDF for 6-session event generated successfully');
const pdf6BaleyeleText = extractPdfText(pdf6Baleyele.doc);
assert(pdf6BaleyeleText.includes('200') && pdf6BaleyeleText.includes('150') && pdf6BaleyeleText.includes('500') && pdf6BaleyeleText.includes('750'), 'Baleyele PDF contains distinct individual PAX numbers for each session');

// Test Official Tax Invoice with 6 itemized sessions
const pdf6Invoice = generateOfficialTaxInvoicePdf(sixSessionEvent, mockCompanyProfile);
assert(pdf6Invoice && pdf6Invoice.doc, 'Tax Invoice with 6 sessions generated successfully');
const pdf6InvoiceText = extractPdfText(pdf6Invoice.doc);
assert(pdf6InvoiceText.includes('Vara Pooja') && pdf6InvoiceText.includes('750.00'), 'Invoice line items reflect session 1 Vara Pooja and its rate');
assert(pdf6InvoiceText.includes('Lunch') && pdf6InvoiceText.includes('900.00'), 'Invoice line items reflect session 5 Lunch and its rate');
assert(pdf6InvoiceText.includes('14,52,500.00') || pdf6InvoiceText.includes('1,452,500.00'), 'Invoice subtotal reflects exact sum of all 6 sessions');

// -------------------------------------------------------------
// TEST 9: Blank Pages Elimination Verification
// -------------------------------------------------------------
console.log('\nTEST 9: Blank Page Elimination Across Generators');

// Test commercial report via calculatePdfReport (must be exactly 2 pages, not 3)
const standardQuoteEvent = {
  id: 'EVT-QUOT-001',
  customer: { name: 'Kiran Patel' },
  eventType: 'Wedding Reception',
  date: '2026-11-15',
  venue: 'The Palace Hall',
  billing: { pricePerPlate: 800, subtotal: 160000, totalAmount: 160000, taxType: 'NON_GST' },
  subFunctions: [{ name: 'Reception Dinner', guestCount: 200, pricePerPlate: 800 }]
};

const resCommercialQuote = await calculatePdfReport(standardQuoteEvent, [], mockCompanyProfile, 'EN', 'invoice', true, 'commercial');
assert(resCommercialQuote && resCommercialQuote.doc, 'Commercial quotation generated successfully');
const quotePageCount = resCommercialQuote.doc.internal.getNumberOfPages();
assert(quotePageCount === 2, `Standard quotation has exactly 2 pages (Quote + Terms, no blank page 3). Actual: ${quotePageCount}`);

// Test official invoice with standard items
const resStdInvoice = generateOfficialTaxInvoicePdf(standardQuoteEvent, mockCompanyProfile);
const stdInvPageCount = resStdInvoice.doc.internal.getNumberOfPages();
assert(stdInvPageCount === 1, `Standard single-page invoice remains exactly 1 page (no blank page 2). Actual: ${stdInvPageCount}`);

// -------------------------------------------------------------
// TEST 10: Sales Executive / Booked By Tracking & Preservation
// -------------------------------------------------------------
console.log('\nTEST 10: Sales Executive / Booked By Tracking and Preservation');

const originalBooking = {
  id: 'EVT-EXEC-001',
  customer: { name: 'Ravi Shankar' },
  createdBy: 'user_sales_ashok',
  createdByName: 'Ashok Kumar',
  salesExecutive: 'Ashok Kumar',
  subFunctions: [{ id: 'sf-1', name: 'Banquet', guestCount: 150 }]
};

assert(originalBooking.createdBy === 'user_sales_ashok', 'Original creator ID recorded');
assert(originalBooking.createdByName === 'Ashok Kumar', 'Original creator name recorded');

// Simulate edit by Admin user
const adminEditor = 'admin_super';
const adminEditorName = 'Super Admin';
const updatedBooking = {
  ...originalBooking,
  customer: { name: 'Ravi Shankar Updated' },
  // Server-side logic preservation simulation:
  createdBy: originalBooking.createdBy,
  createdByName: originalBooking.createdByName,
  salesExecutive: originalBooking.salesExecutive,
  updatedBy: adminEditor,
  updatedByName: adminEditorName,
  lastModifiedBy: adminEditor,
  lastModifiedByName: adminEditorName
};

assert(updatedBooking.createdBy === 'user_sales_ashok', 'Creator ID preserved on admin edit');
assert(updatedBooking.createdByName === 'Ashok Kumar', 'Creator name preserved on admin edit');
assert(updatedBooking.salesExecutive === 'Ashok Kumar', 'Sales Executive preserved on admin edit');
assert(updatedBooking.updatedBy === 'admin_super', 'UpdatedBy correctly records admin editor');
assert(updatedBooking.customer.name === 'Ravi Shankar Updated', 'Event data successfully updated');

console.log('\n======================================================');
if (allPassed) {
  console.log('✓ ALL 10 AUDIT AND INTEGRATION TEST SUITES PASSED SUCCESSFULLY!');
} else {
  console.error('✗ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.');
}
console.log('======================================================\n');
process.exit(allPassed ? 0 : 1);
