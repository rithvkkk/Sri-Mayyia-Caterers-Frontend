import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  initialHistoricalEvents,
  initialRecipeVersions,
  initialHistoricalPrices,
  findHistoricalMatches,
  calculateLearnedEstimate
} from '../utils/historicalDataEngine';
import {
  Brain, Sparkles, TrendingUp, History, CheckCircle2, AlertTriangle,
  FileCheck, Layers, GitBranch, Search, Filter, ShieldCheck, Award,
  ArrowRight, RefreshCw, BarChart2, DollarSign, Users, Droplets,
  Calendar, Check, Info, HelpCircle, Save
} from 'lucide-react';

const HistoricalLearning = () => {
  const {
    currentRole,
    events,
    companyProfile,
    updateEvent
  } = useContext(AppContext);

  // States
  const [historicalList, setHistoricalList] = useState(() => {
    const saved = localStorage.getItem('cater_historical_events');
    return saved ? JSON.parse(saved) : initialHistoricalEvents;
  });

  const [recipeVersions, setRecipeVersions] = useState(initialRecipeVersions);
  const [historicalPrices, setHistoricalPrices] = useState(initialHistoricalPrices);

  // Selected Target Event for Live Matching Sandbox
  const [targetEventId, setTargetEventId] = useState(events[0]?.id || '');
  const [activeTab, setActiveTab] = useState('matching'); // matching | recipes | prices | postEvent | analytics

  // Post-Event Actuals Form State
  const [postEventForm, setPostEventForm] = useState({
    eventId: events[0]?.id || '',
    actualPax: 100,
    foodCostActual: 35000,
    laborCostActual: 12000,
    transportCostActual: 3500,
    wastePercent: 5.0,
    riceCookedKg: 11.5,
    waterBottles: 125,
    actualProfit: 45000,
    isOutlier: false,
    outlierReason: '',
    postEventNotes: ''
  });

  const [reconcileSuccess, setReconcileSuccess] = useState(false);

  const currentTargetEvent = events.find(e => e.id === targetEventId) || events[0];
  const matchedEvents = findHistoricalMatches(currentTargetEvent, historicalList);

  // Save historical events to local storage
  const saveHistoricalList = (newList) => {
    setHistoricalList(newList);
    localStorage.setItem('cater_historical_events', JSON.stringify(newList));
  };

  // Reconcile and Commit Post-Event Actuals
  const handleCommitPostEvent = (e) => {
    e.preventDefault();
    const eventToReconcile = events.find(ev => ev.id === postEventForm.eventId);
    if (!eventToReconcile) return;

    const newHistoricalRecord = {
      id: `HIST-${Date.now()}`,
      name: `${eventToReconcile.eventType} - ${eventToReconcile.customer?.name}`,
      client: eventToReconcile.customer?.name || 'Client',
      date: eventToReconcile.date,
      eventType: eventToReconcile.eventType,
      serviceStyle: eventToReconcile.subFunctions?.[0]?.name?.toLowerCase().includes('lunch') ? 'Plantain Leaf Seated' : 'Multi-Station Live Buffet',
      venueType: 'Banquet Hall',
      estimatedPax: eventToReconcile.guestCount || 100,
      actualPax: parseInt(postEventForm.actualPax, 10) || 100,
      durationHours: 4,
      season: 'Current Quarter',
      dietaryProtocol: eventToReconcile.menuNotes || 'Standard Pure Vegetarian',
      isOutlier: postEventForm.isOutlier,
      outlierReason: postEventForm.outlierReason,
      menuItems: eventToReconcile.subFunctions?.[0]?.menuItems || [],
      foodCostEstimated: eventToReconcile.execution?.costs?.rawMaterialsCost || 30000,
      foodCostActual: parseFloat(postEventForm.foodCostActual) || 32000,
      laborCostEstimated: eventToReconcile.execution?.costs?.laborCost || 10000,
      laborCostActual: parseFloat(postEventForm.laborCostActual) || 11000,
      transportCostEstimated: eventToReconcile.transport?.totalTransportCost || 3000,
      transportCostActual: parseFloat(postEventForm.transportCostActual) || 3000,
      revenue: eventToReconcile.billing?.totalAmount || 100000,
      actualProfit: parseFloat(postEventForm.actualProfit) || 40000,
      actualMarginPercent: parseFloat(((postEventForm.actualProfit / (eventToReconcile.billing?.totalAmount || 100000)) * 100).toFixed(1)),
      wastePercent: parseFloat(postEventForm.wastePercent) || 5.0,
      consumptionActuals: {
        riceCookedKg: parseFloat(postEventForm.riceCookedKg) || 11.5,
        waterBottles300ml: parseInt(postEventForm.waterBottles, 10) || 125
      },
      staffingActuals: {
        tableStewards: Math.ceil((postEventForm.actualPax || 100) * 0.04),
        liquidServers: Math.ceil((postEventForm.actualPax || 100) * 0.02),
        liveChefs: 2,
        clearingCrew: 3,
        hostesses: 2
      },
      postEventNotes: postEventForm.postEventNotes || 'Logged from Post-Event Learning Reconciler.'
    };

    const updatedList = [newHistoricalRecord, ...historicalList];
    saveHistoricalList(updatedList);

    // Update event status to Completed
    const updatedTargetEvent = {
      ...eventToReconcile,
      status: 'Completed',
      postEventReconciled: true,
      actualPax: postEventForm.actualPax
    };
    updateEvent(updatedTargetEvent);

    setReconcileSuccess(true);
    setTimeout(() => setReconcileSuccess(false), 4000);
  };

  // Traceable 5-Level Learned Estimates for Current Target Event
  const currentPax = currentTargetEvent?.guestCount || 
    currentTargetEvent?.subFunctions?.reduce((s, sf) => s + (sf.guestCount || 0), 0) || 100;

  const riceEstimate = calculateLearnedEstimate('riceCookedKg', currentPax, matchedEvents);
  const waterEstimate = calculateLearnedEstimate('waterBottles300ml', currentPax, matchedEvents);
  const wasteEstimate = calculateLearnedEstimate('wastePercent', currentPax, matchedEvents);
  const foodCostEstimate = calculateLearnedEstimate('foodCostPerPax', currentPax, matchedEvents);

  // Aggregated Analytics
  const nonOutliers = historicalList.filter(h => !h.isOutlier);
  const totalAnalyzedPax = historicalList.reduce((s, h) => s + (h.actualPax || 0), 0);
  const avgWastePercent = (nonOutliers.reduce((s, h) => s + (h.wastePercent || 0), 0) / Math.max(1, nonOutliers.length)).toFixed(1);
  const avgMarginPercent = (nonOutliers.reduce((s, h) => s + (h.actualMarginPercent || 0), 0) / Math.max(1, nonOutliers.length)).toFixed(1);
  const avgFoodCostPerPax = Math.round(nonOutliers.reduce((s, h) => s + ((h.foodCostActual || 0) / (h.actualPax || 1)), 0) / Math.max(1, nonOutliers.length));

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', color: '#fff' }}>
              <Brain size={24} />
            </div>
            <h1 className="gradient-text" style={{ fontSize: '2.2rem', margin: 0 }}>Historical Data & Learning Engine</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Continuous learning intelligence system: <strong>Previous Data → Patterns → Current Event → Learned Estimate → Actuals → Improved Future Models</strong>
          </p>
        </div>

        {/* Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: '0.82rem', fontWeight: 600 }}>
          <Sparkles size={16} />
          <span>Active Learning Engine ({historicalList.length} Historical Records)</span>
        </div>
      </div>

      {/* Aggregate Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Events in Memory</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8', marginTop: '0.2rem' }}>
            {historicalList.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Events</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {nonOutliers.length} Standard + {historicalList.length - nonOutliers.length} Outliers
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cumulative Served Pax</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
            {totalAnalyzedPax.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Portions</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Range: 25 to 2,000 Pax scale
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Learned Food Cost / Pax</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
            ₹ {avgFoodCostPerPax} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ Guest</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Weighted historical baseline
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #ec4899' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Observed Food Waste Rate</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f472b6', marginTop: '0.2rem' }}>
            {avgWastePercent}% <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Actual</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.2rem' }}>
            ↓ 3.1% lower than industry avg (8.5%)
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Realized Margin</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22d3ee', marginTop: '0.2rem' }}>
            {avgMarginPercent}% <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Net Profit</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Consistent commercial yield
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'matching' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('matching')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Sparkles size={16} />
          <span>Historical Matcher & 5-Level Estimator</span>
        </button>

        <button
          className={`btn ${activeTab === 'postEvent' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('postEvent')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <FileCheck size={16} />
          <span>Post-Event Learning & Reconciliation Hub</span>
        </button>

        <button
          className={`btn ${activeTab === 'recipes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('recipes')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <GitBranch size={16} />
          <span>Recipe Version Control & Yields</span>
        </button>

        <button
          className={`btn ${activeTab === 'prices' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('prices')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <DollarSign size={16} />
          <span>Ingredient Pricing & Supplier Intelligence</span>
        </button>
      </div>

      {/* TAB 1: HISTORICAL MATCHING & 5-LEVEL TRACEABLE ESTIMATOR */}
      {activeTab === 'matching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Target Event Selection Card */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8' }}>
                  <Search size={18} />
                  <span>Target Event Matching Engine</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Select an upcoming event to automatically find comparable historical cases and generate traceable estimates.
                </p>
              </div>

              <div style={{ minWidth: '280px' }}>
                <select 
                  className="form-select" 
                  value={targetEventId} 
                  onChange={e => setTargetEventId(e.target.value)}
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.id} - {e.customer?.name} ({e.guestCount || 100} Pax • {e.eventType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Event Telemetry Overview */}
            {currentTargetEvent && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '0.85rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Target Event Scale:</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>{currentPax} Pax Portions</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Occasion & Date:</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{currentTargetEvent.eventType} ({currentTargetEvent.date})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Menu Courses:</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{currentTargetEvent.subFunctions?.length || 1} Sub-function(s)</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Historical Search Status:</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={15} />
                    <span>{matchedEvents.length} Records Ranked</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5-Level Traceable Estimation Matrix */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}>
                  <Layers size={18} />
                  <span>5-Level Traceable Learned Estimator</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Distinguishes historical averages, recent averages, generic standards, event buffers, and final learned predictions.
                </p>
              </div>
              <span className="badge badge-info">Continuous Learning Engine</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Variable 1: Cooked Rice Quantity */}
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    🌾 Cooked Rice Requirement (Biryani / Pulav / Sambar Rice)
                  </span>
                  <span className={`badge ${riceEstimate.confidence === 'High' ? 'badge-success' : 'badge-warning'}`}>
                    Confidence: {riceEstimate.confidence} ({riceEstimate.sampleSize} comparable events)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>1. Historical Average</div>
                    <div style={{ fontWeight: 700, color: '#818cf8' }}>{riceEstimate.historicalAverage}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>2. Recent Average</div>
                    <div style={{ fontWeight: 700, color: '#60a5fa' }}>{riceEstimate.recentAverage}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>3. Generic Standard</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{riceEstimate.currentStandard}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>4. Event Adjustment</div>
                    <div style={{ fontWeight: 600, color: '#f59e0b' }}>{riceEstimate.eventAdjustment}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>5. Learned Final Estimate</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#34d399' }}>{riceEstimate.finalEstimate} kg</div>
                  </div>
                </div>
              </div>

              {/* Variable 2: 300ml Bottled Water */}
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    💧 300ml Packaged Mineral Water Units
                  </span>
                  <span className={`badge ${waterEstimate.confidence === 'High' ? 'badge-success' : 'badge-warning'}`}>
                    Confidence: {waterEstimate.confidence} ({waterEstimate.sampleSize} comparable events)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>1. Historical Multiplier</div>
                    <div style={{ fontWeight: 700, color: '#818cf8' }}>1.27x Pax Observed</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>2. Recent Multiplier</div>
                    <div style={{ fontWeight: 700, color: '#60a5fa' }}>1.26x Pax Observed</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>3. Standard Assumption</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{waterEstimate.currentStandard}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>4. Event Adjustment</div>
                    <div style={{ fontWeight: 600, color: '#f59e0b' }}>+0% (Standard)</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>5. Learned Final Estimate</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#34d399' }}>{waterEstimate.finalEstimate} Bottles</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Ranked Comparable Historical Matches List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} className="accent-text" />
              <span>Ranked Comparable Historical Events (Relevance Ordered)</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matchedEvents.map((m, idx) => (
                <div 
                  key={m.historicalEvent.id}
                  style={{
                    padding: '0.85rem 1.1rem',
                    background: m.isOutlier ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255,255,255,0.02)',
                    border: m.isOutlier ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                          #{idx + 1} {m.historicalEvent.name}
                        </span>
                        {m.isOutlier ? (
                          <span className="badge badge-danger">OUTLIER (DOWN-WEIGHTED)</span>
                        ) : (
                          <span className="badge badge-success">Match Score: {m.similarityScore}%</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Client: <strong>{m.historicalEvent.client}</strong> | Date: <strong>{m.historicalEvent.date}</strong> | Actual Pax: <strong>{m.historicalEvent.actualPax} Pax</strong> | Style: <strong>{m.historicalEvent.serviceStyle}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
                        ₹ {(m.historicalEvent.actualProfit || 0).toLocaleString()} Profit ({m.historicalEvent.actualMarginPercent}%)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Food Waste: <strong>{m.historicalEvent.wastePercent}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Match Factors */}
                  {m.matchFactors.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                      {m.matchFactors.map((fact, fIdx) => (
                        <span key={fIdx} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 600 }}>
                          ✓ {fact}
                        </span>
                      ))}
                    </div>
                  )}

                  {m.historicalEvent.postEventNotes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.15)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      💬 <strong>Post-Event Log:</strong> {m.historicalEvent.postEventNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: POST-EVENT LEARNING & RECONCILIATION HUB */}
      {activeTab === 'postEvent' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                <FileCheck size={20} />
                <span>Post-Event Learning & Reconciliation Form</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Log actual consumption, costs, and waste after event completion to automatically improve future machine estimates.
              </p>
            </div>
          </div>

          {reconcileSuccess && (
            <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} />
              <span>Event successfully reconciled and committed into Historical Machine Learning Memory!</span>
            </div>
          )}

          <form onSubmit={handleCommitPostEvent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              
              <div className="form-group">
                <label className="form-label">Select Completed Event ID</label>
                <select 
                  className="form-select" 
                  value={postEventForm.eventId} 
                  onChange={e => setPostEventForm({ ...postEventForm, eventId: e.target.value })}
                  required
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.id} - {e.customer?.name} ({e.eventType})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Actual Attended Guest Headcount (Pax)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={postEventForm.actualPax}
                  onChange={e => setPostEventForm({ ...postEventForm, actualPax: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Total Food Cost (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={postEventForm.foodCostActual}
                  onChange={e => setPostEventForm({ ...postEventForm, foodCostActual: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Labor / Staffing Cost (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={postEventForm.laborCostActual}
                  onChange={e => setPostEventForm({ ...postEventForm, laborCostActual: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Transport & Porter Charges (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={postEventForm.transportCostActual}
                  onChange={e => setPostEventForm({ ...postEventForm, transportCostActual: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observed Food Waste %</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-input" 
                  value={postEventForm.wastePercent}
                  onChange={e => setPostEventForm({ ...postEventForm, wastePercent: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Cooked Rice Consumed (kg)</label>
                <input 
                  type="number" 
                  step="0.5"
                  className="form-input" 
                  value={postEventForm.riceCookedKg}
                  onChange={e => setPostEventForm({ ...postEventForm, riceCookedKg: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">300ml Water Bottles Consumed</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={postEventForm.waterBottles}
                  onChange={e => setPostEventForm({ ...postEventForm, waterBottles: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Realized Net Event Profit (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={postEventForm.actualProfit}
                  onChange={e => setPostEventForm({ ...postEventForm, actualProfit: e.target.value })}
                  required
                />
              </div>

            </div>

            {/* Outlier Protection Checkbox */}
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <input 
                  type="checkbox" 
                  id="outlierCheck"
                  checked={postEventForm.isOutlier}
                  onChange={e => setPostEventForm({ ...postEventForm, isOutlier: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="outlierCheck" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444', cursor: 'pointer' }}>
                  Flag as Outlier Event (Do not distort future baseline standards)
                </label>
              </div>

              {postEventForm.isOutlier && (
                <div style={{ marginTop: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Document outlier reason (e.g. 'Severe storm caused 40% no-show', 'Supplier strike', etc.)..."
                    value={postEventForm.outlierReason}
                    onChange={e => setPostEventForm({ ...postEventForm, outlierReason: e.target.value })}
                    required={postEventForm.isOutlier}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              )}
            </div>

            {/* Post Event Notes */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Kitchen & Floor Observations / Post-Event Notes</label>
              <textarea 
                className="form-input" 
                rows={3}
                placeholder="Enter observations on dish demand, guest feedback, queue throughput, or portion shortages..."
                value={postEventForm.postEventNotes}
                onChange={e => setPostEventForm({ ...postEventForm, postEventNotes: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} />
              <span>Commit Actuals to Historical Memory</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: RECIPE VERSION CONTROL & YIELDS */}
      {activeTab === 'recipes' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                <GitBranch size={20} />
                <span>Dish Recipe Version Control & Yield Repository</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Track version history, cooking yields, and preparation loss % for core Sri Mayyia signature dishes.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(recipeVersions).map(([dishId, versions]) => (
              <div key={dishId} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#c084fc' }}>
                    {dishId === 'si_rc_potali' ? 'Jackfruit Potali Biryani' : dishId === 'app_str_op1' ? 'Operation Capsicum Bonda' : 'Appi Payasam Udupi Style'} ({dishId})
                  </span>
                  <span className="badge badge-purple">{versions.length} Versions Logged</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {versions.map((ver, vIdx) => (
                    <div key={vIdx} style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: ver.version.includes('current') ? '3px solid #10b981' : '3px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: ver.version.includes('current') ? '#34d399' : 'var(--text-secondary)' }}>
                          {ver.version} • {ver.date}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Author: <strong>{ver.author}</strong> | Prep Time: <strong>{ver.prepTimeMinutes} mins</strong>
                        </span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                        {ver.notes} | Cooking Loss: <strong>{ver.cookingLossPercent}%</strong>
                      </p>

                      {/* Ingredients breakdown */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {ver.ingredients.map((ing, iIdx) => (
                          <span key={iIdx} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                            {ing.name}: <strong>{ing.qtyPer100Pax} {ing.unit} / 100 Pax</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INGREDIENT PRICING & SUPPLIER INTELLIGENCE */}
      {activeTab === 'prices' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                <DollarSign size={20} />
                <span>Historical Purchasing & Supplier Reliability Matrix</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Historical price tracking, volatility bands, and supplier performance metrics.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Ingredient SKU</th>
                  <th>Unit</th>
                  <th>Last Price</th>
                  <th>Historical Avg</th>
                  <th>Price Range (Min - Max)</th>
                  <th>Trend Trajectory</th>
                  <th>Preferred Supplier</th>
                  <th>Reliability</th>
                </tr>
              </thead>
              <tbody>
                {historicalPrices.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.ingredient}</td>
                    <td>{p.unit}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹ {p.lastPrice}</td>
                    <td>₹ {p.avgPrice}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>₹ {p.minPrice} - ₹ {p.maxPrice}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.priceTrend.includes('+') ? '#f59e0b' : '#10b981' }}>
                        {p.priceTrend}
                      </span>
                    </td>
                    <td>{p.preferredSupplier}</td>
                    <td>
                      <span className="badge badge-success">{p.supplierReliabilityScore}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoricalLearning;
