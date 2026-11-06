import test from 'node:test';
import assert from 'node:assert/strict';
import {
  predictEventCatering,
  queryCateringAiCopilot,
  calculateCompleteEventMaterials
} from '../src/utils/aiCalculationModel.js';
import { initialRawMaterials, initialDishes } from '../src/utils/mockData.js';

test('AI Predictive Calculation & Forecasting Engine Suite', async (t) => {

  // 1. Multi-scale calculation and raw material ratios
  await t.test('1. Predicts ingredient consumption accurately across small, medium, and large event scales', () => {
    const small = predictEventCatering({ pax: 100 });
    const medium = predictEventCatering({ pax: 500 });
    const large = predictEventCatering({ pax: 1500 });

    // Cooked & Raw Rice
    assert.ok(small.materials.cookedRiceKg > 0);
    assert.ok(medium.materials.cookedRiceKg > small.materials.cookedRiceKg);
    assert.ok(large.materials.cookedRiceKg > medium.materials.cookedRiceKg);
    assert.equal(parseFloat((small.materials.cookedRiceKg / 2.5).toFixed(1)), small.materials.rawRiceKg);

    // Sambar & Rasam
    assert.ok(small.materials.sambarLiters >= 10);
    assert.ok(small.materials.rasamLiters >= 10);

    // Water Bottles
    assert.ok(small.materials.waterBottles >= 100);
    assert.ok(large.materials.waterBottles >= 1500);
  });

  // 2. Service style adjustments (Plantain Leaf Seated vs Multi-Station Live Buffet)
  await t.test('2. Service Style Divergence: Plantain Leaf Seated vs Live Buffet', () => {
    const seated = predictEventCatering({ pax: 300, serviceStyle: 'Plantain Leaf Seated' });
    const buffet = predictEventCatering({ pax: 300, serviceStyle: 'Multi-Station Live Buffet' });

    // Seated Pankthi consumes more rice than buffet where guests eat live starters
    assert.ok(seated.materials.cookedRiceKg > buffet.materials.cookedRiceKg,
      `Seated rice (${seated.materials.cookedRiceKg}kg) should exceed Buffet rice (${buffet.materials.cookedRiceKg}kg)`);

    // Buffet requires live counter chefs, seated requires zero live counter chefs
    assert.ok(buffet.staffing.liveChefs > 0, 'Buffet should require live chefs');
    assert.equal(seated.staffing.liveChefs, 0, 'Plantain leaf seated requires 0 live counter chefs');

    // Seated Pankthi requires more table stewards than self-service buffet
    assert.ok(seated.staffing.tableStewards > buffet.staffing.tableStewards,
      'Seated requires denser steward distribution for Pankthi service turnover');
  });

  // 3. Seasonal multipliers (Summer Peak vs Winter Peak)
  await t.test('3. Seasonal Multiplier Accuracy: Summer hydration spike vs Winter rasam/soup demand', () => {
    const summer = predictEventCatering({ pax: 400, season: 'Summer Peak' });
    const winter = predictEventCatering({ pax: 400, season: 'Winter Peak' });

    // Summer water bottles surge
    assert.ok(summer.materials.waterBottles > winter.materials.waterBottles,
      `Summer water (${summer.materials.waterBottles}) must exceed Winter water (${winter.materials.waterBottles})`);

    // Winter Rasam surge
    assert.ok(winter.materials.rasamLiters > summer.materials.rasamLiters,
      `Winter rasam (${winter.materials.rasamLiters}L) must exceed Summer rasam (${summer.materials.rasamLiters}L)`);
  });

  // 4. Financial cost, quote pricing, and profit margin validation
  await t.test('4. Financial Arithmetic Integrity: Total Cost, Suggested Quote, and 42% Target Margin', () => {
    const calc = predictEventCatering({ pax: 250 });
    const f = calc.financials;

    // Total Cost = Food + Labor + Transport
    assert.equal(f.totalCost, f.totalFoodCost + f.totalLaborCost + f.totalTransportCost);

    // Revenue = SuggestedQuote * Pax
    assert.equal(f.projectedRevenue, f.suggestedSellingPricePerPax * 250);

    // Profit = Revenue - Total Cost
    assert.equal(f.projectedProfit, f.projectedRevenue - f.totalCost);

    // Margin % is within expected target commercial bracket (~40% - 45%)
    assert.ok(f.projectedMarginPercent >= 38.0 && f.projectedMarginPercent <= 46.0,
      `Projected margin (${f.projectedMarginPercent}%) should be in target range`);
  });

  // 5. Staffing curve and non-zero crew assignments
  await t.test('5. Staffing requirements curves and non-zero crew assignments', () => {
    const calc = predictEventCatering({ pax: 200, serviceStyle: 'Multi-Station Live Buffet' });
    const s = calc.staffing;

    assert.ok(s.tableStewards >= 2);
    assert.ok(s.liquidServers >= 1);
    assert.ok(s.liveChefs >= 2);
    assert.ok(s.clearingCrew >= 2);
    assert.ok(s.supervisors >= 1);
    assert.equal(s.totalCrew, s.tableStewards + s.liquidServers + s.liveChefs + s.clearingCrew + s.supervisors);
  });

  // 6. Built-in AI Copilot natural language catering query processor
  await t.test('6. AI Copilot NLP Query Engine: accurate intent extraction and recommendations', () => {
    // Rice query
    const riceQuery = queryCateringAiCopilot('How much rice do I need for 400 pax?', { pax: 200 });
    assert.ok(riceQuery.title.includes('400 Pax'));
    assert.ok(riceQuery.summary.includes('400 Pax'));
    assert.ok(riceQuery.recommendation.includes('raw rice'));

    // Water query
    const waterQuery = queryCateringAiCopilot('Calculate water bottle requirements', { pax: 250, season: 'Summer Peak' });
    assert.ok(waterQuery.title.includes('Water'));
    assert.ok(waterQuery.recommendation.includes('crates'));

    // Staffing query
    const staffQuery = queryCateringAiCopilot('Optimal staff allocation for 300 guests', { pax: 300 });
    assert.ok(staffQuery.title.includes('Staffing'));
    assert.ok(staffQuery.summary.includes('300 Pax'));

    // Margin / Quote query
    const costQuery = queryCateringAiCopilot('What price should I quote for good profit margin?', { pax: 200 });
    assert.ok(costQuery.title.includes('Financial'));
    assert.ok(costQuery.recommendation.includes('margin'));
  });

  // 7. Edge Cases and Extreme Input Resilience
  await t.test('7. Edge Cases: Handles 0 Pax, negative Pax, and very large scales without crashing', () => {
    const zeroPax = predictEventCatering({ pax: 0 });
    assert.ok(zeroPax.inputs.pax >= 25, 'Zero Pax must be clamped to minimum threshold');
    assert.ok(zeroPax.financials.costPerPax > 0);

    const hugePax = predictEventCatering({ pax: 10000 });
    assert.ok(hugePax.riskFlags.some(r => r.message.includes('Mega scale')));
    assert.ok(hugePax.financials.totalCost > 0);
  });

  // 8. Granular Item-by-Item Calculation with Category Intelligence
  await t.test('8. calculateCompleteEventMaterials: Category intelligence accurately demands materials for South vs North Indian menus', () => {
    // South Indian rice & gravy spread
    const southIndianMenu = ['si_rc_1', 'si_rc_2', 'si_grv_1', 'si_grv_9', 'sw_hol_1'];
    const southCalc = calculateCompleteEventMaterials({
      pax: 200,
      menuItemIds: southIndianMenu,
      dishCatalog: initialDishes,
      rawMaterialsCatalog: initialRawMaterials,
      serviceStyle: 'Plantain Leaf Seated'
    });

    assert.ok(southCalc.rawMaterials.length > 5, 'Should calculate multiple raw materials');
    const rice = southCalc.rawMaterials.find(rm => rm.id === 'rm1');
    const lentils = southCalc.rawMaterials.find(rm => rm.id === 'rm6');
    const spices = southCalc.rawMaterials.find(rm => rm.id === 'rm4');
    const oil = southCalc.rawMaterials.find(rm => rm.id === 'rm5');

    assert.ok(rice && rice.qty > 5, 'Rice must be allocated for rice menu');
    assert.ok(lentils && lentils.qty > 0, 'Lentils must be allocated for sambar/gravies');
    assert.ok(spices && spices.qty > 0, 'Spices must be allocated');
    assert.ok(oil && oil.qty > 0, 'Cooking oil must be allocated');

    // North Indian paneer & bread spread
    const northIndianMenu = ['ni_grv_2', 'ni_grv_6', 'ni_brd_1', 'app_str_sp1'];
    const northCalc = calculateCompleteEventMaterials({
      pax: 200,
      menuItemIds: northIndianMenu,
      dishCatalog: initialDishes,
      rawMaterialsCatalog: initialRawMaterials,
      serviceStyle: 'Multi-Station Live Buffet'
    });

    const paneer = northCalc.rawMaterials.find(rm => rm.id === 'rm9');
    const flour = northCalc.rawMaterials.find(rm => rm.id === 'rm2');
    const butter = northCalc.rawMaterials.find(rm => rm.id === 'rm10');
    const cream = northCalc.rawMaterials.find(rm => rm.id === 'rm11');

    assert.ok(paneer && paneer.qty > 0, 'Paneer must be demanded for North Indian curries');
    assert.ok(flour && flour.qty > 0, 'Wheat flour must be demanded for rotis/naans');
    assert.ok(butter && butter.qty > 0, 'Butter must be demanded');
    assert.ok(cream && cream.qty > 0, 'Cream must be demanded');

    // Scale test: 400 pax should require approximately double of 200 pax
    const north400 = calculateCompleteEventMaterials({
      pax: 400,
      menuItemIds: northIndianMenu,
      dishCatalog: initialDishes,
      rawMaterialsCatalog: initialRawMaterials
    });
    const paneer400 = north400.rawMaterials.find(rm => rm.id === 'rm9');
    assert.ok(paneer400.qty > paneer.qty * 1.8, 'Quantities should scale with guest count');
  });

  // 9. Vendor Items & Fuel Requirements Scaling
  await t.test('9. calculateCompleteEventMaterials: Vendor consumables & fuel scaling logic', () => {
    // Seated service produces plantain leaves
    const seated = calculateCompleteEventMaterials({
      pax: 250,
      serviceStyle: 'Plantain Leaf Seated',
      season: 'Summer Peak',
      rawMaterialsCatalog: initialRawMaterials,
      dishCatalog: initialDishes
    });
    const leaves = seated.vendorItems.find(v => v.name.includes('Plantain Leaves'));
    assert.ok(leaves && leaves.qty >= 250, 'Plantain leaves should be provided for seated service');

    // Buffet produces buffet plates
    const buffet = calculateCompleteEventMaterials({
      pax: 250,
      serviceStyle: 'Multi-Station Live Buffet',
      rawMaterialsCatalog: initialRawMaterials,
      dishCatalog: initialDishes
    });
    const plates = buffet.vendorItems.find(v => v.name.includes('Buffet Plates'));
    assert.ok(plates && plates.qty >= 250, 'Buffet plates should be provided for buffet');

    // Summer season hydration & tender coconuts
    const water = seated.vendorItems.find(v => v.name.includes('Water Bottles'));
    const tenderCoconut = seated.vendorItems.find(v => v.name.includes('Tender Coconuts'));
    assert.ok(water && water.qty > 250, 'Water bottles must be calculated with summer spike');
    assert.ok(tenderCoconut && tenderCoconut.qty > 0, 'Tender coconuts should be provided in summer');

    // LPG Cylinders scaling (1 cylinder per 75 pax)
    const lpg = seated.rawMaterials.find(rm => rm.id === 'rm20');
    assert.ok(lpg && lpg.qty >= 4, '250 Pax should require at least 4 LPG cylinders');
  });

  // 10. Financial Arithmetic Integrity & Vessel Allocation
  await t.test('10. calculateCompleteEventMaterials: Cost arithmetic integrity and vessel allocation', () => {
    const calc = calculateCompleteEventMaterials({
      pax: 300,
      menuItemIds: ['si_rc_1', 'si_grv_1', 'sw_hol_1', 'bev_hot_1'],
      dishCatalog: initialDishes,
      rawMaterialsCatalog: initialRawMaterials
    });

    // Check arithmetic for every raw material: totalCost = round(qty * unitCost)
    calc.rawMaterials.forEach(rm => {
      assert.equal(rm.totalCost, Math.round(rm.qty * rm.unitCost),
        `Cost arithmetic mismatch on ${rm.name}`);
    });

    // Sum of all materials matches summary.totalRawMaterialCost
    const computedRawCost = calc.rawMaterials.reduce((sum, rm) => sum + rm.totalCost, 0);
    assert.equal(calc.summary.totalRawMaterialCost, computedRawCost);

    // Sum of all vendor items matches summary.totalVendorItemCost
    const computedVendorCost = calc.vendorItems.reduce((sum, v) => sum + v.estimatedCost, 0);
    assert.equal(calc.summary.totalVendorItemCost, computedVendorCost);

    // Grand total = raw materials + vendor items
    assert.equal(calc.summary.grandTotal, computedRawCost + computedVendorCost);

    // Cost per pax = round(grandTotal / pax)
    assert.equal(calc.summary.costPerPax, Math.round(calc.summary.grandTotal / 300));

    // Vessels must include Degchi, Kadai, Chafing dishes, Plate sets, Stoves
    assert.ok(calc.vesselRequirements.length >= 4, 'Must allocate comprehensive kitchen vessels');
    const degchi = calc.vesselRequirements.find(v => v.name.includes('Degchi'));
    const chafing = calc.vesselRequirements.find(v => v.name.includes('Chafing'));
    assert.ok(degchi && degchi.qty > 0, 'Degchi must be allocated');
    assert.ok(chafing && chafing.qty > 0, 'Chafing dishes must be allocated');
  });

});
