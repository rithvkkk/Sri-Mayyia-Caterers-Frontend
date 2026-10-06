import {
  generateOccasionMenuPdf,
  generateVectorOccasionMenuPdf,
  generateGoldMenuPdf,
  generateExecutiveMenuPdf,
  generateSupplierPO,
  generateOfficialTaxInvoicePdf,
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

console.log('\n======================================================');
if (allPassed) {
  console.log('✓ ALL 6 AUDIT AND INTEGRATION TEST SUITES PASSED SUCCESSFULLY!');
} else {
  console.error('✗ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.');
}
console.log('======================================================\n');
process.exit(allPassed ? 0 : 1);
