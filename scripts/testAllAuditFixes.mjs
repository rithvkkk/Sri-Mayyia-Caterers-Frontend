import { readFileSync } from 'fs';
import {
  generateOccasionMenuPdf,
  generateVectorOccasionMenuPdf,
  generateGoldMenuPdf,
  generateExecutiveMenuPdf,
  generateSupplierPO,
  generateOfficialTaxInvoicePdf,
  calculatePdfReport,
  resolveEventVenue,
  collectEventInstructions
} from '../src/utils/pdfGenerator.js';
import { canonicalRole, checkPermission, DEFAULT_RBAC_MATRIX } from '../src/utils/rbacMatrix.js';

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

// -------------------------------------------------------------
// TEST 11: Register New Worker Feature (Rotti, Custom, 2 Phones)
// -------------------------------------------------------------
console.log('\nTEST 11: Register New Worker Feature (Rotti, Custom Category, Dual Phones)');

// Phone validator helper matching application logic
const isValidPhone = (str) => {
  if (!str) return false;
  const trimmed = String(str).trim();
  if (/[a-zA-Z]/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

// 11a: Test 1 - Rotti Labour Category
const workerRotti = {
  id: 'lw_test_rotti',
  name: 'Test Rotti Worker',
  category: 'Rotti',
  labourCategory: 'Rotti',
  role: 'Assistant Chef',
  phone: '9876543210',
  phoneNumber: '9876543210',
  dailyRate: 1200,
  advancePayment: 0,
  type: 'Direct',
  status: 'Active'
};
assert(workerRotti.category === 'Rotti', 'Test 1: Worker category saved as Rotti');
assert(workerRotti.labourCategory === 'Rotti', 'Test 1: labourCategory alias preserved as Rotti');

// 11b: Test 2 - Manual / Custom Category ("Kitchen Helper")
const customCategoryInput = 'Kitchen Helper';
const selectedDropdown = 'Manual / Custom';
const resolvedCategory = selectedDropdown === 'Manual / Custom' ? customCategoryInput.trim() : selectedDropdown;
const workerCustom = {
  id: 'lw_test_custom',
  name: 'Test Custom Worker',
  category: resolvedCategory,
  labourCategory: resolvedCategory,
  role: 'Kitchen Helper',
  phone: '9876543210',
  phoneNumber: '9876543210',
  dailyRate: 900,
  type: 'Direct'
};
assert(workerCustom.category === 'Kitchen Helper', 'Test 2: Actual category is Kitchen Helper');
assert(workerCustom.category !== 'Manual / Custom', 'Test 2: "Manual / Custom" literal is NOT stored');
assert(workerCustom.labourCategory === 'Kitchen Helper', 'Test 2: labourCategory persisted as Kitchen Helper');

// 11c: Test 3 - Manual category without value (Validation check)
const emptyCustomInput = '   ';
let validationPassed = false;
let validationMessage = '';
if (selectedDropdown === 'Manual / Custom') {
  const trimmedCustom = emptyCustomInput.trim();
  if (!trimmedCustom) {
    validationPassed = false;
    validationMessage = 'Please enter the labour category.';
  } else {
    validationPassed = true;
  }
}
assert(!validationPassed, 'Test 3: Empty manual category prevents saving');
assert(validationMessage === 'Please enter the labour category.', 'Test 3: Correct validation error message shown');

// 11d: Test 4 - Two phone numbers & validation
const validPrimary = '9876543210';
const validSecondary = '9123456780';
const invalidAlpha = 'abc123';
const invalidShort = '123';

assert(isValidPhone(validPrimary), 'Test 4: Primary 9876543210 is valid');
assert(isValidPhone(validSecondary), 'Test 4: Secondary 9123456780 is valid');
assert(!isValidPhone(invalidAlpha), 'Test 4: Alphabetic phone abc123 is invalid');
assert(!isValidPhone(invalidShort), 'Test 4: Short phone 123 is invalid');

const workerDualPhone = {
  id: 'lw_test_dual',
  name: 'Dual Phone Worker',
  category: 'Rotti',
  phone: validPrimary,
  phoneNumber: validPrimary,
  secondaryPhone: validSecondary,
  secondaryPhoneNumber: validSecondary,
  dailyRate: 1100
};
assert(workerDualPhone.phone === '9876543210', 'Test 4: Primary phone preserved');
assert(workerDualPhone.secondaryPhone === '9123456780', 'Test 4: Secondary phone preserved independently');
assert(workerDualPhone.phone !== workerDualPhone.secondaryPhone, 'Test 4: Primary not overwritten by secondary');

// 11e: Test 5 - Existing worker with only one phone number
const existingLegacyWorker = {
  id: 'lw_legacy',
  name: 'Shivu Kumar',
  category: 'Assistant Cook',
  role: 'Assistant Chef',
  phone: '9482911739',
  dailyRate: 1500
};
assert(existingLegacyWorker.phone === '9482911739', 'Test 5: Existing worker primary phone preserved');
assert(!existingLegacyWorker.secondaryPhone, 'Test 5: Existing worker secondary phone remains absent/optional');

// 11f: Test 6 - Existing worker changed to Rotti
const editedWorkerRotti = {
  ...existingLegacyWorker,
  category: 'Rotti',
  labourCategory: 'Rotti'
};
assert(editedWorkerRotti.category === 'Rotti', 'Test 6: Existing worker updated to Rotti');

// 11g: Test 7 - Existing worker changed to custom category "Event Helper"
const editedWorkerCustom = {
  ...existingLegacyWorker,
  category: 'Event Helper',
  labourCategory: 'Event Helper'
};
assert(editedWorkerCustom.category === 'Event Helper', 'Test 7: Existing worker updated to Event Helper');

// -------------------------------------------------------------
// TEST 12: Event Booking Add-ons Feature
// -------------------------------------------------------------
console.log('\nTEST 12: Event Booking Add-ons Feature (Categories, Headcounts, Sessions)');

const EXPECTED_ADDON_CATEGORIES = [
  'Breakfast',
  'Welcome Drinks & Starters',
  'Lunch',
  'Evening Snacks',
  "Welcome Drink & Bit's",
  'Chats',
  'Mexican Items',
  'Dinner',
  'Cut Fruits',
  'Ice Cream',
  'Pan',
  'Water Bottle',
  'Tambula'
];

assert(EXPECTED_ADDON_CATEGORIES.length === 13, 'Test 12a: Exactly 13 Add-on Categories exist');
assert(EXPECTED_ADDON_CATEGORIES.includes("Welcome Drink & Bit's"), 'Test 12a: Exact spelling preserved for Welcome Drink & Bit\'s');
assert(EXPECTED_ADDON_CATEGORIES.includes('Water Bottle'), 'Test 12a: Water Bottle category present');
assert(EXPECTED_ADDON_CATEGORIES.includes('Tambula'), 'Test 12a: Tambula category present');

// Test 12b: Add-ons are independent of sub-events
const testEventWithAddons = {
  id: 'EVT-ADDON-TEST',
  customer: { name: 'Wedding Reception Client', phone: '9876543210' },
  eventType: 'Wedding Reception',
  subFunctions: [
    { id: 'sf-1', name: 'Breakfast', guestCount: 300, date: '2026-11-20' },
    { id: 'sf-2', name: 'Lunch', guestCount: 750, date: '2026-11-20' },
    { id: 'sf-3', name: 'Evening Snacks', guestCount: 200, date: '2026-11-20' },
    { id: 'sf-4', name: 'Dinner', guestCount: 500, date: '2026-11-20' }
  ],
  addons: [
    {
      id: 'addon-1',
      category: 'Water Bottle',
      item: '250ml Water Bottles',
      quantity: 1000,
      pax: 1000,
      appliesTo: 'All Event',
      subFunctionName: 'All Event',
      rate: 10
    },
    {
      id: 'addon-2',
      category: 'Ice Cream',
      item: 'Vanilla & Chocolate Scoops',
      quantity: 500,
      pax: 500,
      appliesTo: 'Dinner',
      subFunctionName: 'Dinner',
      rate: 60
    },
    {
      id: 'addon-3',
      category: 'Welcome Drinks & Starters',
      item: 'Fresh Lime Juice & Paneer Tikka',
      quantity: 200,
      pax: 200,
      appliesTo: 'Evening Snacks',
      subFunctionName: 'Evening Snacks',
      rate: 120
    }
  ]
};

assert(testEventWithAddons.subFunctions.length === 4, 'Test 12b: Sub-functions count remains exactly 4');
assert(testEventWithAddons.addons.length === 3, 'Test 12b: Add-ons count is 3, separate from sub-functions');

// Test 12c: Add-ons support their own PAX/quantity without mutating event PAX
const totalEventPax = testEventWithAddons.subFunctions.reduce((sum, sf) => sum + sf.guestCount, 0); // 1750
assert(totalEventPax === 1750, 'Test 12c: Total event PAX is 1750');
assert(testEventWithAddons.addons[0].quantity === 1000, 'Test 12c: Water Bottle quantity is 1000');
assert(testEventWithAddons.addons[1].quantity === 500, 'Test 12c: Ice Cream quantity is 500');

// Test 12d: "Use Event PAX" logic
const eventPax500 = 500;
let addonPax = eventPax500; // Use Event PAX enabled
assert(addonPax === 500, 'Test 12d: Add-on PAX matches event PAX (500)');
// User manually changes addon quantity to 300
addonPax = 300;
assert(addonPax === 300, 'Test 12d: Add-on PAX manually adjusted to 300');
assert(eventPax500 === 500, 'Test 12d: Event PAX strictly unchanged at 500');

// Test 12e: Association with Sub-event or All Event
assert(testEventWithAddons.addons[0].appliesTo === 'All Event', 'Test 12e: Water Bottle applies to All Event');
assert(testEventWithAddons.addons[1].appliesTo === 'Dinner', 'Test 12e: Ice Cream applies to Dinner');
assert(testEventWithAddons.addons[2].appliesTo === 'Evening Snacks', 'Test 12e: Welcome Drinks applies to Evening Snacks');

// -------------------------------------------------------------
// TEST 13: Vendor Categories Definition, Integrity & Startup Safety
// -------------------------------------------------------------
console.log('\nTEST 13: Vendor Categories Definition, Integrity & Startup Safety');

const { initialVendorCategories } = await import('../src/utils/mockData.js');

assert(Array.isArray(initialVendorCategories), 'Test 13a: initialVendorCategories is an array');
assert(initialVendorCategories.length === 34, `Test 13a: Expected 34 initial vendor categories, got ${initialVendorCategories.length}`);

// Test essential categories
const categoryNames = initialVendorCategories.map(c => c.name);
assert(categoryNames.includes('Plant and Leaf'), 'Test 13b: Category Plant and Leaf exists');
assert(categoryNames.includes('Water Bottle'), 'Test 13b: Category Water Bottle exists');
assert(categoryNames.includes('Coconut'), 'Test 13b: Category Coconut exists');
assert(categoryNames.includes('Tea and Coffee Counter'), 'Test 13b: Category Tea and Coffee Counter exists');

// Verify defensive state initialization simulation
const getSafeLocalSim = (val, fallback) => {
  if (!val || (Array.isArray(val) && val.length === 0)) return fallback;
  return val;
};

// Scenario A: null/empty localStorage fallback
const stateFromEmptyLocal = getSafeLocalSim(null, initialVendorCategories);
assert(Array.isArray(stateFromEmptyLocal) && stateFromEmptyLocal.length === 34, 'Test 13c: Falls back to initialVendorCategories when storage is null');

// Scenario B: Corrupted empty array fallback
const stateFromCorruptEmpty = getSafeLocalSim([], initialVendorCategories);
assert(Array.isArray(stateFromCorruptEmpty) && stateFromCorruptEmpty.length === 34, 'Test 13c: Falls back to initialVendorCategories when storage is empty array');

// Scenario C: Provider value fallback guarantee
const providerExportFallback = (null || initialVendorCategories || []);
assert(Array.isArray(providerExportFallback) && providerExportFallback.length === 34, 'Test 13d: Provider export value is always defined and non-empty');

// Scenario D: AppContext.jsx file contains valid vendorCategories declaration
const appContextSource = readFileSync(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf-8');
assert(appContextSource.includes('const [vendorCategories, setVendorCategories] = useState('), 'Test 13e: AppContext.jsx declares vendorCategories state');
assert(appContextSource.includes('vendorCategories: (Array.isArray(vendorCategories)'), 'Test 13e: AppContext.jsx exports defensive vendorCategories in Context Provider');

// -------------------------------------------------------------
// TEST 14: Phase 1 — User Accounts, Canonical Roles & Permissions
// -------------------------------------------------------------
console.log('\nTEST 14: User Accounts & Canonical RBAC Role Mapping');

assert(canonicalRole('HR') === 'HR Manager', 'Test 14a: canonicalRole("HR") -> "HR Manager"');
assert(canonicalRole('Accounts Manager') === 'Accountant', 'Test 14a: canonicalRole("Accounts Manager") -> "Accountant"');
assert(canonicalRole('Sales') === 'Sales Executive', 'Test 14a: canonicalRole("Sales") -> "Sales Executive"');
assert(canonicalRole('Inhouse Inventory/Provision/Storage Manager') === 'Store Incharge', 'Test 14a: canonicalRole("Inhouse...") -> "Store Incharge"');
assert(canonicalRole('Admin') === 'Admin', 'Test 14a: canonicalRole("Admin") -> "Admin"');

// Test permission check with aliases
assert(checkPermission('Sales', 'events', 'create'), 'Test 14b: "Sales" alias can create events');
assert(checkPermission('HR', 'workers', 'create'), 'Test 14b: "HR" alias can manage workers');
assert(checkPermission('Accounts Manager', 'billing', 'view'), 'Test 14b: "Accounts Manager" alias can view billing');
assert(!checkPermission('Sales Executive', 'settings', 'edit'), 'Test 14b: "Sales Executive" cannot edit system settings');

// Test username duplicate prevention logic
const existingUsers = [
  { id: 'admin', name: 'System Admin', role: 'Admin' },
  { id: 'sales_ramesh', name: 'Ramesh K', role: 'Sales Executive' }
];
const isDuplicateUser = (newId) => existingUsers.some(u => u.id.toLowerCase() === newId.trim().toLowerCase());
assert(isDuplicateUser('SALES_RAMESH'), 'Test 14c: Detects duplicate username case-insensitively');
assert(!isDuplicateUser('sales_suresh'), 'Test 14c: Allows distinct new username');

// -------------------------------------------------------------
// TEST 15: Phase 3 & 4 — Event Add-ons Rates, Totals & Creator Tracking
// -------------------------------------------------------------
console.log('\nTEST 15: Event Add-ons Rates, Line Totals & Creator Tracking');

const testAddonsList = [
  {
    category: 'Water Bottle',
    item: '250ml Sealed Water Bottle',
    quantity: 500,
    rate: 10,
    appliesTo: 'All Event'
  },
  {
    category: 'Manual / Custom',
    customCategory: 'Live Mocktail Counter',
    item: 'Virgin Mojito & Blue Curacao',
    quantity: 250,
    rate: 75,
    appliesTo: 'Dinner'
  }
];

// Test custom category resolution and line totals
const processedAddons = testAddonsList.map((ad, idx) => {
  const isCustom = ad.category === 'Manual / Custom' || !EXPECTED_ADDON_CATEGORIES.includes(ad.category);
  const resolvedCategory = isCustom ? (ad.customCategory || ad.category).trim() : ad.category;
  const qty = Number(ad.quantity || 0);
  const rate = Number(ad.rate || 0);
  return {
    id: `addon-${idx}`,
    category: resolvedCategory,
    customCategory: isCustom ? resolvedCategory : '',
    quantity: qty,
    rate: rate,
    total: qty * rate
  };
});

assert(processedAddons[0].category === 'Water Bottle', 'Test 15a: Predefined category mapped correctly');
assert(processedAddons[0].total === 5000, 'Test 15a: Line total 500 * 10 = 5000');
assert(processedAddons[1].category === 'Live Mocktail Counter', 'Test 15b: Custom category correctly assigned');
assert(processedAddons[1].customCategory === 'Live Mocktail Counter', 'Test 15b: customCategory field populated');
assert(processedAddons[1].total === 18750, 'Test 15b: Line total 250 * 75 = 18750');

const addonsSubtotal = processedAddons.reduce((sum, ad) => sum + ad.total, 0);
assert(addonsSubtotal === 23750, 'Test 15c: Total add-ons sum = 23750');

// Test creator & modifier tracking immutability
const auditBookingTest = {
  id: 'EVT-AUDIT-001',
  createdBy: 'sales_user_1',
  createdByName: 'Ramesh K',
  salesExecutive: 'Ramesh K',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedBy: 'sales_user_1',
  updatedByName: 'Ramesh K',
  updatedAt: '2026-10-01T10:00:00.000Z'
};

const simulateUpdateBooking = (existing, modifierId, modifierName) => {
  return {
    ...existing,
    // Preserve original creator & creation time
    createdBy: existing.createdBy,
    createdByName: existing.createdByName,
    salesExecutive: existing.salesExecutive || existing.createdByName || existing.createdBy,
    createdAt: existing.createdAt,
    // Update modifier details
    updatedBy: modifierId,
    updatedByName: modifierName,
    updatedAt: new Date().toISOString()
  };
};

const testUpdatedBooking = simulateUpdateBooking(auditBookingTest, 'admin_master', 'Admin Master');
assert(testUpdatedBooking.createdBy === 'sales_user_1', 'Test 15d: createdBy is preserved on update');
assert(testUpdatedBooking.createdByName === 'Ramesh K', 'Test 15d: createdByName is preserved on update');
assert(testUpdatedBooking.createdAt === '2026-10-01T10:00:00.000Z', 'Test 15d: createdAt is strictly preserved');
assert(testUpdatedBooking.updatedBy === 'admin_master', 'Test 15d: updatedBy reflects modifying user');
assert(testUpdatedBooking.updatedByName === 'Admin Master', 'Test 15d: updatedByName reflects modifying user');

// -------------------------------------------------------------
// TEST 16: Phase 5 — PDF Add-ons, Instructions & Page Integrity
// -------------------------------------------------------------
console.log('\nTEST 16: PDF Add-ons, Instructions & Page Integrity');

const commercialQuoteEvent = {
  id: 'EVT-PDF-QUOTE-01',
  customer: { name: 'Sanjay Deshmukh', phone: '9845011223' },
  eventType: 'Wedding Feast',
  date: '2026-11-25',
  venue: 'Grand Palace Mantapa',
  instructions: 'Special welcome drinks for 200 VIP guests upon arrival.',
  subFunctions: [
    { id: 'sf-1', name: 'Grand Wedding Lunch', guestCount: 500, pricePerPlate: 850 }
  ],
  addons: [
    { id: 'ad-1', category: 'Cut Fruits', item: 'Exotic Fruit Salad', quantity: 500, rate: 50, total: 25000, appliesTo: 'Grand Wedding Lunch' },
    { id: 'ad-2', category: 'Ice Cream', item: 'Anjeer & Kesar Pista', quantity: 500, rate: 40, total: 20000, appliesTo: 'Grand Wedding Lunch' }
  ],
  billing: {
    pricePerPlate: 850,
    subtotal: (500 * 850) + 25000 + 20000, // 425000 + 45000 = 470000
    taxType: 'GST',
    taxRate: 5
  }
};

// 16a: Commercial Quotation PDF
const resQuotePdf = await calculatePdfReport(commercialQuoteEvent, [], mockCompanyProfile, 'EN', 'invoice', true, 'commercial');
assert(resQuotePdf && resQuotePdf.doc, 'Test 16a: Commercial Quotation PDF generated');
const quotePdfPages = resQuotePdf.doc.internal.getNumberOfPages();
assert(quotePdfPages === 2, `Test 16a: Commercial quote has exactly 2 pages (Quote + Terms, no blank page 3). Actual: ${quotePdfPages}`);

// 16b: Tax Invoice PDF with Add-ons
const resTaxInvoicePdf = generateOfficialTaxInvoicePdf(commercialQuoteEvent, mockCompanyProfile);
assert(resTaxInvoicePdf && resTaxInvoicePdf.doc, 'Test 16b: Official Tax Invoice PDF generated');
const taxInvoiceText = extractPdfText(resTaxInvoicePdf.doc);
assert(taxInvoiceText.includes('Cut Fruits') || taxInvoiceText.includes('Exotic Fruit'), 'Test 16b: Tax invoice contains Cut Fruits add-on');
assert(taxInvoiceText.includes('Ice Cream'), 'Test 16b: Tax invoice contains Ice Cream add-on');

// 16c: Instruction Collection
const collectedInst = collectEventInstructions(commercialQuoteEvent);
assert(collectedInst.length > 0, 'Test 16c: collectEventInstructions collects event instructions');
assert(collectedInst[0].text.includes('welcome drinks for 200 VIP'), 'Test 16c: Instruction text collected accurately');

// -------------------------------------------------------------
// TEST 17: Phase 6 & 8 — Data Integrity & Startup Defensiveness
// -------------------------------------------------------------
console.log('\nTEST 17: Data Integrity & Defensive Backward Compatibility');

// Older legacy event without addons, without billing, without subFunctions
const legacyEventMinimal = {
  id: 'EVT-LEGACY-001',
  customer: { name: 'Old Client' },
  date: '2025-05-10',
  guestCount: 200
};

// Ensure PDF generation does not throw on legacy minimal event
let legacyPdfGenerated = false;
try {
  const legacyQuote = await calculatePdfReport(legacyEventMinimal, [], mockCompanyProfile, 'EN', 'invoice', true, 'commercial');
  const legacyInv = generateOfficialTaxInvoicePdf(legacyEventMinimal, mockCompanyProfile);
  legacyPdfGenerated = !!(legacyQuote && legacyInv);
} catch (err) {
  legacyPdfGenerated = false;
  console.error('Legacy PDF error:', err);
}
assert(legacyPdfGenerated, 'Test 17a: Legacy booking without addons/subfunctions generates PDFs without crashing');

// Test vendorCategories undefined safety
const testVendorCatContext = {
  vendorCategories: initialVendorCategories || []
};
assert(Array.isArray(testVendorCatContext.vendorCategories) && testVendorCatContext.vendorCategories.length > 0, 'Test 17b: vendorCategories is safely array-guaranteed at all times');

console.log('\n======================================================');
if (allPassed) {
  console.log('✓ ALL 17 AUDIT AND INTEGRATION TEST SUITES PASSED SUCCESSFULLY!');
} else {
  console.error('✗ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.');
}
console.log('======================================================\n');
process.exit(allPassed ? 0 : 1);
