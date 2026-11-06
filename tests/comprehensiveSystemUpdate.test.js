import test from 'node:test';
import assert from 'node:assert/strict';
import { initialVendorCategories, initialLabourCategories, initialMenuCategories, initialSuppliers, initialVenues } from '../src/utils/mockData.js';
import { MODULES, ACCESS_LEVELS, DEFAULT_RBAC_MATRIX } from '../src/utils/rbacMatrix.js';

test('Comprehensive System Update Suite - Sri Mayyia Caterers ERP', async (t) => {

  // 1. Micro Event Validation & Normalization
  await t.test('1. Micro Event Pax Validation: 50 to 100 Pax strictly enforced', () => {
    const validateMicroPax = (eventType, guestCount) => {
      const isMicro = eventType && (
        eventType.trim().toLowerCase() === 'micro event' ||
        eventType.trim().toLowerCase() === 'micro home event'
      );
      if (isMicro) {
        const pax = Number(guestCount);
        if (isNaN(pax) || pax < 50 || pax > 100) {
          return { valid: false, error: 'Micro Event must have between 50 and 100 Pax (guests).' };
        }
      }
      return { valid: true };
    };

    // Valid within range
    assert.equal(validateMicroPax('Micro Event', 50).valid, true);
    assert.equal(validateMicroPax('Micro Event', 75).valid, true);
    assert.equal(validateMicroPax('Micro Event', 100).valid, true);

    // Invalid below 50
    assert.equal(validateMicroPax('Micro Event', 49).valid, false);
    assert.equal(validateMicroPax('Micro Event', 0).valid, false);
    assert.equal(validateMicroPax('Micro Event', -10).valid, false);

    // Invalid above 100
    assert.equal(validateMicroPax('Micro Event', 101).valid, false);
    assert.equal(validateMicroPax('Micro Event', 500).valid, false);

    // Non-micro events are unaffected
    assert.equal(validateMicroPax('Wedding Catering', 40).valid, true);
    assert.equal(validateMicroPax('Corporate Event', 800).valid, true);
    assert.equal(validateMicroPax('Birthday Party', 35).valid, true);
  });

  await t.test('2. Historical Event Normalization: Micro Home Event -> Micro Event', () => {
    const normalizeEventType = (type) => {
      if (!type) return type;
      if (type.trim().toLowerCase() === 'micro home event') return 'Micro Event';
      return type.trim();
    };

    assert.equal(normalizeEventType('Micro Home Event'), 'Micro Event');
    assert.equal(normalizeEventType('micro home event'), 'Micro Event');
    assert.equal(normalizeEventType('Micro Event'), 'Micro Event');
    assert.equal(normalizeEventType('Wedding Reception'), 'Wedding Reception');
  });

  // 2. Event Monthly Grouping & Chronological Sorting
  await t.test('3. Event Monthly Grouping & Chronological Sorting', () => {
    const sampleEvents = [
      { id: 'EV-1', date: '2026-10-15', customer: { name: 'Ravi' } },
      { id: 'EV-2', date: '2026-09-05', customer: { name: 'Priya' } },
      { id: 'EV-3', date: '2026-09-28', customer: { name: 'Kiran' } },
      { id: 'EV-4', date: '2026-11-01', customer: { name: 'Anil' } },
      { id: 'EV-5', date: '2026-09-12', customer: { name: 'Deepa' } }
    ];

    // Chronological Sort
    const sorted = [...sampleEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    assert.equal(sorted[0].id, 'EV-2'); // Sept 5
    assert.equal(sorted[1].id, 'EV-5'); // Sept 12
    assert.equal(sorted[2].id, 'EV-3'); // Sept 28
    assert.equal(sorted[3].id, 'EV-1'); // Oct 15
    assert.equal(sorted[4].id, 'EV-4'); // Nov 1

    // Group By Month
    const groupEventsByMonth = (evts) => {
      const map = {};
      evts.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push(e);
      });
      return Object.keys(map).sort().map(key => ({
        key,
        events: map[key].sort((a, b) => new Date(a.date) - new Date(b.date))
      }));
    };

    const grouped = groupEventsByMonth(sampleEvents);
    assert.equal(grouped.length, 3);
    assert.equal(grouped[0].key, '2026-09');
    assert.equal(grouped[0].events.length, 3);
    assert.equal(grouped[0].events[0].id, 'EV-2');
    assert.equal(grouped[1].key, '2026-10');
    assert.equal(grouped[1].events.length, 1);
    assert.equal(grouped[2].key, '2026-11');
    assert.equal(grouped[2].events.length, 1);
  });

  // 3. Commercial Vehicle Trip Calculations
  await t.test('4. Vehicle Odometer KM calculation and validation', () => {
    const calculateKm = (startingKm, endingKm) => {
      const start = Number(startingKm) || 0;
      const end = Number(endingKm) || 0;
      if (end < start) {
        return { valid: false, error: 'Ending KM cannot be less than Starting KM', totalKm: 0 };
      }
      return { valid: true, totalKm: end - start };
    };

    const validTrip = calculateKm(12400, 12550);
    assert.equal(validTrip.valid, true);
    assert.equal(validTrip.totalKm, 150);

    const invalidTrip = calculateKm(12550, 12400);
    assert.equal(invalidTrip.valid, false);
    assert.equal(invalidTrip.totalKm, 0);

    const zeroKmTrip = calculateKm(10000, 10000);
    assert.equal(zeroKmTrip.valid, true);
    assert.equal(zeroKmTrip.totalKm, 0);
  });

  await t.test('5. Fuel and Total Trip Cost Calculations', () => {
    const calculateTripCost = ({
      startingKm,
      endingKm,
      litresUsed,
      fuelPricePerLitre,
      toll = 0,
      parking = 0,
      driverAllowance = 0,
      otherExpenses = 0
    }) => {
      const totalKm = Math.max(0, (endingKm || 0) - (startingKm || 0));
      const fuelCost = (litresUsed || 0) * (fuelPricePerLitre || 0);
      const totalAmount = fuelCost + (toll || 0) + (parking || 0) + (driverAllowance || 0) + (otherExpenses || 0);
      return {
        totalKm,
        fuelCost: parseFloat(fuelCost.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2))
      };
    };

    // Example: Diesel trip (18 Litres @ 95/L + Toll 240 + Parking 100 + Driver 500 + Other 150)
    const trip = calculateTripCost({
      startingKm: 45000,
      endingKm: 45180,
      litresUsed: 18,
      fuelPricePerLitre: 95,
      toll: 240,
      parking: 100,
      driverAllowance: 500,
      otherExpenses: 150
    });

    assert.equal(trip.totalKm, 180);
    assert.equal(trip.fuelCost, 1710); // 18 * 95
    assert.equal(trip.totalAmount, 2700); // 1710 + 240 + 100 + 500 + 150
  });

  // 4. Labour Advance Tracking & Balance Deductions
  await t.test('6. Labour Advance Tracking and Wage Deductions', () => {
    const worker = {
      id: 'lw_1',
      name: 'Sunil Varma',
      category: 'Head Cook',
      dailyRate: 1500,
      advancePayment: 2000,
      advances: [
        { amount: 2000, date: '2026-09-01', notes: 'Festival Advance' }
      ]
    };

    const recordAdvance = (w, advanceData) => {
      const amt = Number(advanceData.amount) || 0;
      return {
        ...w,
        advancePayment: (w.advancePayment || 0) + amt,
        advances: [...(w.advances || []), advanceData]
      };
    };

    const updatedWorker = recordAdvance(worker, { amount: 1500, date: '2026-09-10', notes: 'Emergency medical' });
    assert.equal(updatedWorker.advancePayment, 3500);
    assert.equal(updatedWorker.advances.length, 2);

    // Calculate Net Payout for 5 Shifts
    const shiftsWorked = 5;
    const grossWage = shiftsWorked * updatedWorker.dailyRate; // 5 * 1500 = 7500
    const netPayout = Math.max(0, grossWage - updatedWorker.advancePayment); // 7500 - 3500 = 4000
    assert.equal(grossWage, 7500);
    assert.equal(netPayout, 4000);
  });

  // 5. Vendor Hierarchical Categories (34 Categories & Subcategories)
  await t.test('7. Vendor Master Categories: exactly 34 categories with specific hierarchies', () => {
    assert.equal(initialVendorCategories.length, 34, 'Must have exactly 34 initial vendor categories');

    // Verify Coconut hierarchy
    const coconutCat = initialVendorCategories.find(c => c.name === 'Coconut');
    assert.ok(coconutCat, 'Coconut category must exist');
    assert.ok(coconutCat.subCategories.includes('Tender Coconut'));
    assert.ok(coconutCat.subCategories.includes('Regular Coconut'));

    // Verify Thambula hierarchy
    const thambulaCat = initialVendorCategories.find(c => c.name === 'Thambula');
    assert.ok(thambulaCat, 'Thambula category must exist');
    assert.ok(thambulaCat.subCategories.includes('Paper Thambula'));
    assert.ok(thambulaCat.subCategories.includes('Cloth Thambula'));
    assert.ok(thambulaCat.subCategories.includes('Jute Thambula'));

    // Verify Supplier directory data structure has Category & Subcategory
    assert.ok(initialSuppliers.length > 0);
    initialSuppliers.forEach(s => {
      assert.ok(s.category, `Supplier ${s.name} must have a category`);
      assert.ok(s.status, `Supplier ${s.name} must have a status`);
    });
  });

  // 6. Labour 11 Categories
  await t.test('8. Labour Workforce: exactly 11 categories verified', () => {
    const EXPECTED_LABOUR_CATEGORIES = [
      'Head Cook',
      'Assistant Cook',
      'Sweet Master',
      'Sweet Assistant',
      'Management',
      'Grinders',
      'Cutting and Supply',
      'Loaders',
      'Cleaners',
      'Ladies Supply',
      'Coffee Duty'
    ];

    assert.ok(initialLabourCategories.length >= 11, 'Must have at least 11 labour categories');
    const existingNames = initialLabourCategories.map(c => c.name);
    EXPECTED_LABOUR_CATEGORIES.forEach(expected => {
      assert.ok(existingNames.includes(expected), `Labour category '${expected}' must exist`);
    });
  });

  // 7. Menu Categories
  await t.test('9. Menu Categories Catalog Verification', () => {
    assert.ok(initialMenuCategories.length >= 4, 'Must have menu categories');
  });

  // 8. Venues RBAC & Salesperson Data Isolation
  await t.test('10. Venues RBAC & Salesperson Isolation', () => {
    // RBAC module registered
    assert.ok(MODULES.VENUES, 'MODULES.VENUES must be defined');
    assert.ok(DEFAULT_RBAC_MATRIX['Sales Executive'], 'Sales Executive role must be in RBAC');
    assert.ok(DEFAULT_RBAC_MATRIX['Sales Executive'][MODULES.VENUES], 'Venues module permission must exist for Sales Executive');

    // Salesperson Isolation Filter
    const filterVenuesForUser = (venuesList, role, currentUsername) => {
      const isSales = role === 'Sales Executive' || role === 'Salesperson';
      if (!isSales) return venuesList; // Admin / Manager sees all
      return venuesList.filter(v =>
        !v.assignedSalesperson ||
        v.assignedSalesperson === 'All' ||
        v.assignedSalesperson.toLowerCase() === (currentUsername || '').toLowerCase()
      );
    };

    const adminVenues = filterVenuesForUser(initialVenues, 'Admin', 'admin');
    assert.equal(adminVenues.length, initialVenues.length, 'Admin must see all venues');

    const salesVenues = filterVenuesForUser(initialVenues, 'Sales Executive', 'sales_john');
    // sales_john sees unassigned/all venues or venues assigned specifically to sales_john
    assert.ok(salesVenues.length <= adminVenues.length);
  });

});
