import test from 'node:test';
import assert from 'node:assert/strict';

function calculateFinances({ subtotal, taxType, taxRateInput, isInterState, advancePaid, totalExpense }) {
  const isNonGst = taxType === 'NON_GST' || Number(taxRateInput) === 0;
  const taxRate = isNonGst ? 0 : (taxRateInput !== undefined && !isNaN(taxRateInput) ? parseFloat(taxRateInput) : 5);
  const taxAmount = isNonGst ? 0 : parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
  const advance = parseFloat(advancePaid) || 0;
  const balanceDue = Math.max(0, parseFloat((totalAmount - advance).toFixed(2)));
  const creditBalance = advance > totalAmount ? parseFloat((advance - totalAmount).toFixed(2)) : 0;

  const cgstAmount = (!isNonGst && !isInterState) ? parseFloat((taxAmount / 2).toFixed(2)) : 0;
  const sgstAmount = (!isNonGst && !isInterState) ? parseFloat((taxAmount / 2).toFixed(2)) : 0;
  const igstAmount = (!isNonGst && isInterState) ? taxAmount : 0;

  const netProfit = totalAmount - totalExpense;
  const profitMarginPercent = totalAmount > 0 ? parseFloat(((netProfit / totalAmount) * 100).toFixed(2)) : 0;

  let paymentStatus = 'Unpaid';
  if (advance >= totalAmount && totalAmount > 0) {
    paymentStatus = 'Fully Paid';
  } else if (advance > 0) {
    paymentStatus = 'Partially Paid';
  }

  return {
    subtotal,
    isNonGst,
    taxRate,
    taxAmount,
    totalAmount,
    balanceDue,
    creditBalance,
    cgstAmount,
    sgstAmount,
    igstAmount,
    netProfit,
    profitMarginPercent,
    paymentStatus
  };
}

function calculateRecipeMaterialQty(guestCount, qtyPerPlate) {
  const baseQty = guestCount * qtyPerPlate;
  const wastageBufferQty = baseQty * 0.05;
  const requiredQty = baseQty + wastageBufferQty;
  return {
    baseQty: parseFloat(baseQty.toFixed(2)),
    wastageBufferQty: parseFloat(wastageBufferQty.toFixed(2)),
    requiredQty: parseFloat(requiredQty.toFixed(2))
  };
}

test('Financial Calculations Suite', async (t) => {
  await t.test('1. Non-GST Calculation: 0% tax rate, total equals subtotal', () => {
    const result = calculateFinances({
      subtotal: 100000,
      taxType: 'NON_GST',
      taxRateInput: 18,
      isInterState: false,
      advancePaid: 20000,
      totalExpense: 60000
    });

    assert.equal(result.isNonGst, true);
    assert.equal(result.taxRate, 0);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.totalAmount, 100000);
    assert.equal(result.balanceDue, 80000);
    assert.equal(result.creditBalance, 0);
    assert.equal(result.cgstAmount, 0);
    assert.equal(result.sgstAmount, 0);
    assert.equal(result.igstAmount, 0);
    assert.equal(result.paymentStatus, 'Partially Paid');
  });

  await t.test('2. Intra-State GST 5%: 2.5% CGST and 2.5% SGST', () => {
    const result = calculateFinances({
      subtotal: 200000,
      taxType: 'GST',
      taxRateInput: 5,
      isInterState: false,
      advancePaid: 50000,
      totalExpense: 120000
    });

    assert.equal(result.taxRate, 5);
    assert.equal(result.taxAmount, 10000);
    assert.equal(result.totalAmount, 210000);
    assert.equal(result.cgstAmount, 5000);
    assert.equal(result.sgstAmount, 5000);
    assert.equal(result.igstAmount, 0);
    assert.equal(result.balanceDue, 160000);
  });

  await t.test('3. Inter-State GST 18%: 18% IGST, 0% CGST/SGST', () => {
    const result = calculateFinances({
      subtotal: 100000,
      taxType: 'GST',
      taxRateInput: 18,
      isInterState: true,
      advancePaid: 0,
      totalExpense: 70000
    });

    assert.equal(result.taxRate, 18);
    assert.equal(result.taxAmount, 18000);
    assert.equal(result.totalAmount, 118000);
    assert.equal(result.cgstAmount, 0);
    assert.equal(result.sgstAmount, 0);
    assert.equal(result.igstAmount, 18000);
    assert.equal(result.balanceDue, 118000);
    assert.equal(result.paymentStatus, 'Unpaid');
  });

  await t.test('4. Advance Overpayment: balanceDue is 0, creditBalance accurately tracked', () => {
    const result = calculateFinances({
      subtotal: 100000,
      taxType: 'GST',
      taxRateInput: 5,
      isInterState: false,
      advancePaid: 150000,
      totalExpense: 80000
    });

    assert.equal(result.totalAmount, 105000);
    assert.equal(result.balanceDue, 0);
    assert.equal(result.creditBalance, 45000);
    assert.equal(result.paymentStatus, 'Fully Paid');
  });

  await t.test('5. Exact Payment: balanceDue is 0, creditBalance is 0, status is Fully Paid', () => {
    const result = calculateFinances({
      subtotal: 100000,
      taxType: 'NON_GST',
      taxRateInput: 0,
      isInterState: false,
      advancePaid: 100000,
      totalExpense: 70000
    });

    assert.equal(result.totalAmount, 100000);
    assert.equal(result.balanceDue, 0);
    assert.equal(result.creditBalance, 0);
    assert.equal(result.paymentStatus, 'Fully Paid');
  });

  await t.test('6. Net Profit & Margin: Correctly calculates profit and negative loss without clamp', () => {
    const profitResult = calculateFinances({
      subtotal: 100000,
      taxType: 'NON_GST',
      taxRateInput: 0,
      isInterState: false,
      advancePaid: 100000,
      totalExpense: 65000
    });
    assert.equal(profitResult.netProfit, 35000);
    assert.equal(profitResult.profitMarginPercent, 35);

    const lossResult = calculateFinances({
      subtotal: 100000,
      taxType: 'NON_GST',
      taxRateInput: 0,
      isInterState: false,
      advancePaid: 100000,
      totalExpense: 125000
    });
    assert.equal(lossResult.netProfit, -25000);
    assert.equal(lossResult.profitMarginPercent, -25);
  });

  await t.test('7. Kitchen Raw Material Wastage Buffer: Exact 5% standard buffer', () => {
    const guestCount = 500;
    const qtyPerPlate = 0.15;
    const wastage = calculateRecipeMaterialQty(guestCount, qtyPerPlate);

    assert.equal(wastage.baseQty, 75.0);
    assert.equal(wastage.wastageBufferQty, 3.75);
    assert.equal(wastage.requiredQty, 78.75);
  });
});
