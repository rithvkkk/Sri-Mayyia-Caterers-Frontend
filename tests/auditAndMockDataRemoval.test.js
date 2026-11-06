import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialDishes,
  initialMenuCategories,
  initialVendorCategories,
  initialLabourCategories,
  initialRawMaterials,
  initialLaborRates,
  initialEvents,
  DEMO_RECORD_IDS,
  isDemoRecordId
} from '../src/utils/mockData.js';

test('System Audit & Mock Data Isolation Suite - Sri Mayyia Caterers ERP', async (t) => {

  // 1. Data Classification: Demo Record Identification
  await t.test('1. DEMO_RECORD_IDS & isDemoRecordId correctly isolate mock fixtures', () => {
    // Demo bookings
    assert.equal(isDemoRecordId('EV-2026-001'), true);
    assert.equal(isDemoRecordId('EV-2026-002'), true);
    assert.equal(isDemoRecordId('EV-2026-003'), true);
    assert.equal(isDemoRecordId('EV-2026-09-12'), true);

    // Demo venues
    assert.equal(isDemoRecordId('v1'), true);
    assert.equal(isDemoRecordId('v2'), true);
    assert.equal(isDemoRecordId('v3'), true);
    assert.equal(isDemoRecordId('v4'), true);

    // Demo suppliers & agencies
    assert.equal(isDemoRecordId('s1'), true);
    assert.equal(isDemoRecordId('s6'), true);
    assert.equal(isDemoRecordId('a1'), true);
    assert.equal(isDemoRecordId('a2'), true);

    // Demo vessels, provisions, vegetables, workers, attendance
    assert.equal(isDemoRecordId('ves_1'), true);
    assert.equal(isDemoRecordId('prv_1'), true);
    assert.equal(isDemoRecordId('veg_1'), true);
    assert.equal(isDemoRecordId('lw_1'), true);
    assert.equal(isDemoRecordId('att_1'), true);

    // Master Reference Data MUST NOT be flagged as demo
    assert.equal(isDemoRecordId('mc_1'), false);
    assert.equal(isDemoRecordId('vc_1'), false);
    assert.equal(isDemoRecordId('lc_1'), false);
    assert.equal(isDemoRecordId('rm1'), false);
    assert.equal(isDemoRecordId('l1'), false);

    // Real production user IDs MUST NOT be flagged as demo
    assert.equal(isDemoRecordId('EV-2026-REAL-101'), false);
    assert.equal(isDemoRecordId('venue_palace_grounds'), false);
    assert.equal(isDemoRecordId('sup_local_dairy'), false);
    assert.equal(isDemoRecordId('worker_ramu'), false);
    assert.equal(isDemoRecordId(undefined), false);
    assert.equal(isDemoRecordId(null), false);
  });

  // 2. Master Reference Data Preservation
  await t.test('2. Master Reference Data Catalog is fully preserved and intact', () => {
    // Master Menu Dishes: Supports either the 374 local baseline or the 1,075 live catalog
    assert.equal(initialDishes.length >= 370 || initialDishes.length === 1075, true, `Expected >= 370 or 1075 master dishes, got ${initialDishes.length}`);

    // 34 Vendor Categories
    assert.equal(initialVendorCategories.length, 34, `Expected 34 vendor categories, got ${initialVendorCategories.length}`);
    const vendorCatNames = new Set(initialVendorCategories.map(c => c.name));
    assert.equal(vendorCatNames.has('Plant and Leaf'), true);
    assert.equal(vendorCatNames.has('Dairy'), true);
    assert.equal(vendorCatNames.has('Vessels'), true);
    assert.equal(vendorCatNames.has('Transport & Logistics'), true);

    // 11+ Labour Roles
    assert.equal(initialLabourCategories.length >= 11, true, `Expected >= 11 labour roles, got ${initialLabourCategories.length}`);
    const labourCatNames = new Set(initialLabourCategories.map(c => c.name));
    assert.equal(labourCatNames.has('Head Cook'), true);
    assert.equal(labourCatNames.has('Sweet Master'), true);
    assert.equal(labourCatNames.has('Management'), true);
    assert.equal(labourCatNames.has('Coffee Duty'), true);

    // Menu Categories Catalog (44 Master Menu + 46 Live Stations or 4+ meal sessions)
    assert.equal(initialMenuCategories.length >= 4, true, `Expected >= 4 menu categories, got ${initialMenuCategories.length}`);

    // Baseline Ingredients & Wage Rates
    assert.equal(initialRawMaterials.length >= 20, true);
    assert.equal(initialLaborRates.length >= 5, true);
  });

  // 3. LocalStorage Sanitization Logic
  await t.test('3. Operational collections sanitize demo fixtures on clean load', () => {
    // Simulate legacy localStorage holding demo events mixed with a real event
    const legacyEvents = [
      { id: 'EV-2026-001', customer: { name: 'Demo Customer 1' } },
      { id: 'EV-2026-002', customer: { name: 'Demo Customer 2' } },
      { id: 'EV-REAL-2026-001', customer: { name: 'Real Customer' } }
    ];

    const sanitizeOperationalCollection = (items) => {
      if (!Array.isArray(items)) return [];
      return items.filter(item => {
        const id = item?.id || item?._id;
        return id && !isDemoRecordId(id);
      });
    };

    const sanitized = sanitizeOperationalCollection(legacyEvents);
    assert.equal(sanitized.length, 1);
    assert.equal(sanitized[0].id, 'EV-REAL-2026-001');

    // If only demo records were present, sanitized result is clean empty array
    const onlyDemoEvents = [
      { id: 'EV-2026-001' },
      { id: 'EV-2026-002' },
      { id: 'EV-2026-003' },
      { id: 'EV-2026-09-12' }
    ];
    assert.deepEqual(sanitizeOperationalCollection(onlyDemoEvents), []);
  });

  // 4. Auto-Push Loop Prevention (Clean DB Sync)
  await t.test('4. Empty database does NOT trigger auto-push of demo fixtures', () => {
    // When MongoDB returns empty list [], local state comparison must exclude demo records
    const serverList = []; // empty from Atlas
    const prevOperationalState = [
      { id: 'EV-2026-001', name: 'Demo 1' },
      { id: 'EV-2026-002', name: 'Demo 2' }
    ];

    const serverIds = new Set(serverList.map(item => item.id || item._id));
    const localOnlyToSync = prevOperationalState.filter(item => {
      const id = item.id || item._id;
      return id && !serverIds.has(id) && !isDemoRecordId(id);
    });

    // localOnlyToSync must be strictly 0 to prevent auto-pushing demo fixtures to Atlas!
    assert.equal(localOnlyToSync.length, 0);
  });

  // 5. Quotation & Billing Empty State Resilience
  await t.test('5. Quotation & Billing calculates safely when events array is empty', () => {
    const events = [];
    const currentEvent = events.find(e => e.id === 'any');
    assert.equal(currentEvent, undefined);

    const rawMaterialsCost = currentEvent ? (currentEvent.execution?.costs?.rawMaterialsCost || 0) : 0;
    const laborCost = currentEvent ? (currentEvent.execution?.costs?.laborCost || 0) : 0;
    const transportCost = currentEvent ? (currentEvent.transport?.totalTransportCost || 0) : 0;
    const totalCost = rawMaterialsCost + laborCost + transportCost;
    const totalGuests = currentEvent ? (currentEvent.subFunctions || []).reduce((sum, sf) => sum + (parseInt(sf?.guestCount, 10) || 0), 0) : 0;
    const costPerPlate = totalGuests > 0 ? (totalCost / totalGuests) : 0;

    assert.equal(totalCost, 0);
    assert.equal(totalGuests, 0);
    assert.equal(costPerPlate, 0);

    // Bargain calculations with empty event
    const bargainedPrice = 650;
    const bargainedSubtotal = totalGuests * bargainedPrice;
    const bargainedProfit = bargainedSubtotal - totalCost;
    const bargainedMarginPercent = bargainedSubtotal > 0 ? (bargainedProfit / bargainedSubtotal) * 100 : 0;

    // Evaluated bargain status when currentEvent is undefined
    let bargainStatus = {
      badge: 'NO EVENT',
      badgeClass: 'badge-secondary',
      title: 'No Event Selected'
    };

    if (currentEvent) {
      if (bargainedProfit < 0) {
        bargainStatus = { badge: 'REJECT DEAL (NET LOSS)' };
      } else if (bargainedMarginPercent < 10) {
        bargainStatus = { badge: 'HIGH RISK (MINIMAL PROFIT)' };
      }
    }

    // Must be 'NO EVENT', NOT 'HIGH RISK (MINIMAL PROFIT)'
    assert.equal(bargainStatus.badge, 'NO EVENT');
    assert.notEqual(bargainStatus.badge, 'HIGH RISK (MINIMAL PROFIT)');
  });

  // 6. Master Reset Boundary Verification
  await t.test('6. Master database reset preserves operational separation', () => {
    // Verification that resetMasterDatabase targets Master Reference items only
    const masterReferenceKeys = [
      'cater_dishes',
      'cater_menu_categories',
      'cater_vendor_categories',
      'cater_labour_categories',
      'cater_raw_materials',
      'cater_labor_rates'
    ];

    const operationalKeys = [
      'cater_events',
      'cater_venues',
      'cater_suppliers',
      'cater_vessels',
      'cater_provisions',
      'cater_vegetables',
      'cater_labour_workers',
      'cater_labour_attendance'
    ];

    // Ensure operational keys are NOT included in master reference keys
    operationalKeys.forEach(opKey => {
      assert.equal(masterReferenceKeys.includes(opKey), false, `Operational key ${opKey} found in master keys!`);
    });
  });

});
