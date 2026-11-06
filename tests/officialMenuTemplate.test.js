import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOccasionMenuPdf } from '../src/utils/pdfGenerator.js';

test('Official Sri Mayyia Proposal & Menu PDF Template Suite', async (t) => {
  const mockCompany = {
    name: 'Sri Mayyia Caterers',
    phone: '+91 98450 38235',
    email: 'info@srimayyiacaterers.com',
    gstin: '29AABCS1429B1Z8',
    address: 'Swastik Traditional Gastronomy, Bengaluru'
  };

  const mockDishes = [
    { id: 'D1', name: 'Traditional Welcome Elaneer Payasam', category: 'Beverages & Welcome Drinks', type: 'veg' },
    { id: 'D2', name: 'Royal Mysore Pak (Pure Ghee)', category: 'Desserts, Sweets & Ice Creams', type: 'veg' },
    { id: 'D3', name: 'Crisp Live Masala Dosa with Chutneys', category: 'Appetizers, Chaats & Street Food', type: 'veg' },
    { id: 'D4', name: 'Authentic Karnataka Bisi Bele Bath', category: 'South Indian Specialties', type: 'veg' },
    { id: 'D5', name: 'Udupi Traditional Mixed Veg Sambar', category: 'South Indian Specialties', type: 'veg' },
    { id: 'D6', name: 'Mysuru Pepper Rasam', category: 'South Indian Specialties', type: 'veg' },
    { id: 'D7', name: 'Beans & Carrot Poriyal / Palya', category: 'Sides, Accompaniments & Salads', type: 'veg' },
    { id: 'D8', name: 'Malabar Avial with Coconut Oil', category: 'Sides, Accompaniments & Salads', type: 'veg' },
    { id: 'D9', name: 'Steamed Sona Masoori Rice', category: 'South Indian Specialties', type: 'veg' },
    { id: 'D10', name: 'Temple Curd Rice with Pomegranate Tadka', category: 'After-Meal / Traditional Finishers', type: 'veg' },
    { id: 'D11', name: 'Crispy Appalam & Mango Pickle', category: 'Sides, Accompaniments & Salads', type: 'veg' },
    { id: 'D12', name: 'Filter Kaapi in Brass Davara', category: 'Beverages & Welcome Drinks', type: 'veg' }
  ];

  await t.test('1. Generates 5-page official proposal booklet with default template', () => {
    const mockEvent = {
      id: 'EVT-1001',
      eventType: 'Grand Wedding Reception',
      date: '2026-11-18',
      customer: { name: 'Karna & Family' }
    };
    const mockSub = {
      id: 'SUB-1',
      name: 'Muhurtham Grand Feast',
      date: '2026-11-18',
      guestCount: 500,
      menuItems: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12']
    };

    const res = generateOccasionMenuPdf(mockEvent, mockSub, mockCompany, 'official', mockDishes);
    assert.ok(res, 'Result should be defined');
    assert.ok(res.blob, 'Blob should be generated');
    assert.ok(res.blob.size > 100000, `Expected large multi-page PDF, got ${res.blob.size} bytes`);
    assert.ok(res.filename.includes('Sri_Mayyia_Proposal_EVT-1001'), `Filename mismatch: ${res.filename}`);
    assert.equal(res.doc.getNumberOfPages(), 5, `Expected 5 pages in official proposal booklet, got ${res.doc.getNumberOfPages()}`);
  });

  await t.test('2. Multi-page pagination when menu has more than 18 items', () => {
    const mockEvent = {
      id: 'EVT-2002',
      eventType: 'Royal 3-Day Wedding Extravaganza',
      date: '2026-12-05',
      customer: { name: 'Venkatesh Rao' }
    };

    // Create 24 items to trigger page 2 continuation (18 items on page 1, 6 on page 2)
    const largeMenuList = [];
    const largeDishCatalog = [];
    for (let i = 1; i <= 24; i++) {
      const id = `LARGE_DISH_${i}`;
      largeMenuList.push(id);
      largeDishCatalog.push({
        id,
        name: `Special Banquet Item ${i} Deluxe`,
        category: 'South Indian Specialties',
        type: 'veg'
      });
    }

    const mockSub = {
      id: 'SUB-2',
      name: 'Grand Gala Banquet',
      date: '2026-12-05',
      guestCount: 850,
      menuItems: largeMenuList
    };

    const res = generateOccasionMenuPdf(mockEvent, mockSub, mockCompany, 'official', largeDishCatalog);
    assert.ok(res);
    // 1 cover + 2 menu pages + 3 credentials/terms/back cover = 6 pages
    assert.equal(res.doc.getNumberOfPages(), 6, `Expected 6 pages with 24 items, got ${res.doc.getNumberOfPages()}`);
  });

  await t.test('3. Gracefully handles empty menu with authentic default items', () => {
    const mockEvent = {
      id: 'EVT-3003',
      eventType: 'Upanayana Samskara',
      date: '2026-10-10',
      customer: { name: 'Shastri Ji' }
    };
    const mockSub = {
      id: 'SUB-3',
      name: 'Brahmodaya Feast',
      guestCount: 250,
      menuItems: []
    };

    const res = generateOccasionMenuPdf(mockEvent, mockSub, mockCompany, 'official', []);
    assert.ok(res);
    assert.equal(res.doc.getNumberOfPages(), 5);
    assert.ok(res.filename.includes('Sri_Mayyia_Proposal_EVT-3003'));
  });

  await t.test('4. Sole standard template: All requests generate the official presentation proposal booklet', () => {
    const mockEvent = {
      id: 'EVT-4004',
      eventType: 'Corporate Dinner',
      date: '2026-09-25',
      customer: { name: 'Infosys Banquet' }
    };
    const mockSub = {
      id: 'SUB-4',
      name: 'Executive Dinner',
      guestCount: 150,
      menuItems: ['D1', 'D2', 'D4']
    };

    ['official', 'default', 'custom', 'any'].forEach(tpl => {
      const res = generateOccasionMenuPdf(mockEvent, mockSub, mockCompany, tpl, mockDishes);
      assert.ok(res, `Template ${tpl} failed to render`);
      assert.ok(res.blob, `Template ${tpl} has no blob`);
      assert.ok(res.filename.includes('Sri_Mayyia_Proposal_EVT-4004'), `Template ${tpl} filename mismatch`);
      assert.equal(res.doc.getNumberOfPages(), 5, `Expected 5 pages for single session, got ${res.doc.getNumberOfPages()}`);
    });
  });

  await t.test('5. Generates 11-page multi-session proposal booklet matching ready client document', () => {
    const mockMultiEvent = {
      id: 'EVT-SWARGA',
      eventType: 'Swarga Heritage Wedding Gala',
      date: '2026-05-02',
      customer: { name: 'Swarga Heritage' },
      subFunctions: [
        { id: 'S1', name: 'Evening Snacks', date: '2026-05-02', guestCount: 200, menuItems: ['D1', 'D2'] },
        { id: 'S2', name: 'Dinner', occasion: 'SANGEETH', date: '2026-05-02', guestCount: 300, menuItems: ['D3', 'D4'] },
        { id: 'S3', name: 'Breakfast', date: '2026-05-03', guestCount: 200, menuItems: ['D5', 'D6'] },
        { id: 'S4', name: 'Lunch', date: '2026-05-03', guestCount: 200, menuItems: ['D7', 'D8'] },
        { id: 'S5', name: 'Dinner', date: '2026-05-03', guestCount: 700, menuItems: ['D9', 'D10'] },
        { id: 'S6', name: 'Breakfast', date: '2026-05-04', guestCount: 200, menuItems: ['D11', 'D12'] },
        { id: 'S7', name: 'Lunch', date: '2026-05-04', guestCount: 250, menuItems: ['D1', 'D3', 'D5'] }
      ]
    };

    // 'all' tells the generator to render all sub-functions across the event
    const res = generateOccasionMenuPdf(mockMultiEvent, 'all', mockCompany, 'official', mockDishes);
    assert.ok(res);
    // Page 1 Cover + Page 2 About + 7 Sub-Function Pages (3..9) + Page 10 Terms + Page 11 Back Cover = 11 Pages
    assert.equal(res.doc.getNumberOfPages(), 11, `Expected 11 pages for 7 sessions, got ${res.doc.getNumberOfPages()}`);
    assert.ok(res.filename.includes('Full_Event_Proposal'));
  });

  await t.test('6. Generates Executive Function Menu Sheet matching minimalist event order format', () => {
    const mockOrderEvent = {
      id: 'EVT-SHRISTI',
      eventType: 'Traditional Wedding Feast',
      date: '2026-06-16',
      venue: 'Shristi Village',
      customer: { name: 'Shristi Family' },
      guestCount: 250,
      notes: ['JEERA RICE TO BE USED FOR ALL THE TIME', '300 ML ALL TIME'],
      parcelNotes: ['EXTRA 100 PENI + LADU (BRIDE SIDE)', 'EXTRA 100 PENI + LADU (GROOM SIDE)'],
      subFunctions: [
        { id: 'S1', name: 'Welcome Drinks', time: '9 AM', guestCount: 100, menuItems: ['D1', 'D12'] },
        { id: 'S2', name: 'Breakfast', guestCount: 50, menuItems: ['D3', 'D4', 'D5'] },
        { id: 'S3', name: 'Lunch', guestCount: 250, menuItems: ['D2', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11'] }
      ]
    };

    const res = generateOccasionMenuPdf(mockOrderEvent, 'all', mockCompany, 'executive', mockDishes);
    assert.ok(res, 'Result should be defined');
    assert.ok(res.blob, 'Blob should be generated');
    assert.ok(res.filename.includes('Sri_Mayyia_FunctionSheet_EVT-SHRISTI'), `Filename mismatch: ${res.filename}`);
    assert.ok(res.doc.getNumberOfPages() >= 1, 'Should have at least 1 page');
  });

  await t.test('7. Multi-page pagination on Executive Function Menu Sheet with large session menus', () => {
    const largeMenuItems = [];
    const largeCatalog = [];
    for (let i = 1; i <= 60; i++) {
      const id = `EXEC_DISH_${i}`;
      largeMenuItems.push(id);
      largeCatalog.push({ id, name: `Traditional Ceremonial Feast Item ${i}`, category: 'South Indian' });
    }

    const mockBigEvent = {
      id: 'EVT-BIG',
      eventType: 'Mega Catering Extravaganza',
      date: '2026-06-16',
      venue: 'Palace Grounds Bengaluru',
      customer: { name: 'Royal Family' },
      subFunctions: [
        { id: 'SB1', name: 'Gala Lunch', guestCount: 1400, menuItems: largeMenuItems }
      ]
    };

    const res = generateOccasionMenuPdf(mockBigEvent, 'all', mockCompany, 'executive', largeCatalog);
    assert.ok(res);
    assert.ok(res.doc.getNumberOfPages() > 1, `Expected multi-page function sheet for 60 items, got ${res.doc.getNumberOfPages()}`);
    assert.ok(res.filename.includes('EVT-BIG'));
  });
});

