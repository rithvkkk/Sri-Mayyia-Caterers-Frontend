import React from 'react';

const CustomChart = ({ sales = 100, expense = 0, currency = '₹' }) => {
  const profit = Math.max(0, sales - expense);
  const total = sales; // sales is the denominator for shares
  
  const expensePercentage = total > 0 ? (expense / total) * 100 : 0;
  const profitPercentage = total > 0 ? (profit / total) * 100 : 0;

  // SVG calculations for a circle with radius 50 (circumference = 2 * PI * r = 314.159)
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  
  // Dash offset for Expense (starts at 0)
  const expenseStroke = circ * (expensePercentage / 100);
  const expenseOffset = circ; // starts at the top
  
  // Dash offset for Profit (starts after Expense)
  const profitStroke = circ * (profitPercentage / 100);
  const profitOffset = circ - expenseStroke;

  // Format currency values nicely
  const formatVal = (val) => {
    return currency + ' ' + val.toLocaleString('en-IN');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      <div className="chart-container" style={{ width: '220px', height: '220px' }}>
        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {/* Base empty ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(45, 29, 38, 0.05)"
            strokeWidth="10"
          />
          {/* Expense Segment */}
          {expensePercentage > 0 && (
            <circle
              className="donut-segment"
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="var(--color-danger)"
              strokeWidth="11"
              strokeDasharray={`${expenseStroke} ${circ}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.15))' }}
            />
          )}
          {/* Profit Segment */}
          {profitPercentage > 0 && (
            <circle
              className="donut-segment"
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="var(--color-success)"
              strokeWidth="11"
              strokeDasharray={`${profitStroke} ${circ}`}
              strokeDashoffset={-expenseStroke}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.15))' }}
            />
          )}
        </svg>
        
        {/* Central Overlay for percentage */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Profit Margin</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {total > 0 ? Math.round(profitPercentage) : 0}%
          </span>
        </div>
      </div>
 
      {/* Legend & Details */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(45, 41, 38, 0.03)', borderRadius: '8px', borderLeft: '3px solid var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net Profit</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatVal(profit)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{profitPercentage.toFixed(1)}% share</div>
          </div>
        </div>
 
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(45, 41, 38, 0.03)', borderRadius: '8px', borderLeft: '3px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Expenses</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatVal(expense)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{expensePercentage.toFixed(1)}% share</div>
          </div>
        </div>
 
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Gross Volume (Sales):</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatVal(sales)}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomChart;
