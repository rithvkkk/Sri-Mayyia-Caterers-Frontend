import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import {
  initialHistoricalEvents,
  initialRecipeVersions,
  initialHistoricalPrices,
  findHistoricalMatches,
  calculateLearnedEstimate
} from '../utils/historicalDataEngine';
import {
  predictEventCatering,
  queryCateringAiCopilot,
  calculateCompleteEventMaterials
} from '../utils/aiCalculationModel';
import {
  Brain, Sparkles, TrendingUp, History, CheckCircle2, AlertTriangle,
  FileCheck, Layers, GitBranch, Search, Filter, ShieldCheck, Award,
  ArrowRight, RefreshCw, BarChart2, IndianRupee, Users, Droplets,
  Calendar, Check, Info, HelpCircle, Save, Upload, FileUp, Database, Download,
  Sliders, MessageSquare, Send, Cpu, Zap, ShoppingCart, Truck, Utensils,
  Package, List, Box, Flame, Plus, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

const HistoricalLearning = () => {
  const {
    currentRole,
    events,
    dishes,
    rawMaterials,
    companyProfile,
    updateEvent,
    apiCall,
    historicalEvents,
    loadHistoricalEvents,
    addHistoricalEvent
  } = useContext(AppContext);

  // States
  const [historicalList, setHistoricalList] = useState(() => {
    if (historicalEvents && historicalEvents.length > 0) return historicalEvents;
    const saved = localStorage.getItem('cater_historical_events');
    return saved ? JSON.parse(saved) : initialHistoricalEvents;
  });

  useEffect(() => {
    if (historicalEvents && historicalEvents.length > 0) {
      setHistoricalList(historicalEvents);
    } else if (loadHistoricalEvents) {
      loadHistoricalEvents();
    }
  }, [historicalEvents]);

  const [recipeVersions, setRecipeVersions] = useState(initialRecipeVersions);
  const [historicalPrices, setHistoricalPrices] = useState(initialHistoricalPrices);

  // Selected Target Event for Live Matching Sandbox
  const [targetEventId, setTargetEventId] = useState(events[0]?.id || '');
  const [activeTab, setActiveTab] = useState('aiCalculator'); // aiCalculator | matching | recipes | prices | postEvent | ingest

  // AI Scenario Simulator & Calculation Model State
  const [aiPax, setAiPax] = useState(250);
  const [aiServiceStyle, setAiServiceStyle] = useState('Multi-Station Live Buffet');
  const [aiSeason, setAiSeason] = useState('Summer Peak');
  const [aiEventType, setAiEventType] = useState('Wedding Reception');
  const [aiDietaryProtocol, setAiDietaryProtocol] = useState('Standard Pure Vegetarian');
  const [aiApplySuccess, setAiApplySuccess] = useState(false);

  // Selected Menu Items for Complete Granular Calculation
  const [aiSelectedMenuEventId, setAiSelectedMenuEventId] = useState(events[0]?.id || '');
  const [aiSelectedMenuItems, setAiSelectedMenuItems] = useState(() => {
    const firstEv = events[0];
    if (firstEv?.subFunctions?.[0]?.menuItems?.length) {
      return [...firstEv.subFunctions[0].menuItems];
    }
    return ['si_rc_1', 'si_rc_2', 'si_grv_1', 'si_grv_9', 'sw_hol_1', 'sw_hol_8', 'sd_ply_1'];
  });
  const [aiMaterialCategoryFilter, setAiMaterialCategoryFilter] = useState('ALL'); // ALL, Grocery, Dairy, Veg/Fruit, Fuel
  const [aiActiveBreakdownTab, setAiActiveBreakdownTab] = useState('rawMaterials'); // rawMaterials, vendorItems, vessels, summary
  const [aiDishSearch, setAiDishSearch] = useState('');
  const [isDishSelectorOpen, setIsDishSelectorOpen] = useState(false);
  const [aiMaterialsApplySuccess, setAiMaterialsApplySuccess] = useState(false);

  // AI Copilot Interactive Query State
  const [aiUserQuery, setAiUserQuery] = useState('');
  const [aiCopilotResponse, setAiCopilotResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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
  const [legacyJsonInput, setLegacyJsonInput] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionResult, setIngestionResult] = useState(null);

  const sampleLegacyEvents = [
    {
      id: 'HIST-LEGACY-001',
      name: 'Grand Wedding & Sangeet - Aditi Rao & Karthik Iyer',
      client: 'Aditi Rao & Karthik Iyer',
      date: '2025-11-18',
      eventType: 'Traditional Brahmin Wedding & Sangeet',
      serviceStyle: 'Traditional Banana Leaf Dining',
      venueType: 'Gayathri Vihar Palace Grounds',
      estimatedPax: 850,
      actualPax: 820,
      season: 'Winter Peak',
      dietaryProtocol: 'Authentic Pure Vegetarian (No Onion/Garlic Seated)',
      isOutlier: false,
      menuSummary: ['Mysore Pak', 'Bisi Bele Bath', 'Avial', 'Poori & Saagu', 'Elaneer Payasam'],
      foodCostEstimated: 245000,
      foodCostActual: 238000,
      laborCostActual: 42000,
      transportCostActual: 14000,
      revenue: 720000,
      actualProfit: 326000,
      actualMarginPercent: 45.3,
      wastePercent: 3.8,
      consumptionActuals: { riceCookedKg: 95.0, waterBottles300ml: 1200 },
      postEventNotes: 'High appreciation for warm Elaneer Payasam and crisp live counter Masala Dosas.'
    },
    {
      id: 'HIST-LEGACY-002',
      name: 'Annual Tech Corporate Gala - Infosys Leadership',
      client: 'Infosys Global Services',
      date: '2025-12-14',
      eventType: 'Corporate Annual Banquet',
      serviceStyle: 'Multi-Station Live Buffet',
      venueType: 'ITC Gardenia Grand Ballroom',
      estimatedPax: 600,
      actualPax: 585,
      season: 'Winter Corporate',
      dietaryProtocol: 'Pan-Indian Gourmet Vegetarian',
      isOutlier: false,
      menuSummary: ['Paneer Tikka Live', 'Dal Bukhara', 'Shahi Jeera Rice', 'Gulab Jamun Flambé'],
      foodCostEstimated: 198000,
      foodCostActual: 189000,
      laborCostActual: 38000,
      transportCostActual: 9500,
      revenue: 540000,
      actualProfit: 243500,
      actualMarginPercent: 45.1,
      wastePercent: 4.2,
      consumptionActuals: { riceCookedKg: 68.0, waterBottles300ml: 850 },
      postEventNotes: 'Quick dual-station live service kept queue times under 4 minutes.'
    },
    {
      id: 'HIST-LEGACY-003',
      name: 'Engagement Ceremony - Dr. Rohini & Siddharth',
      client: 'Dr. Rohini Kulkarni',
      date: '2026-01-22',
      eventType: 'Engagement & High Tea Lunch',
      serviceStyle: 'Dual Parallel Buffet',
      venueType: 'Sheesh Mahal, Palace Grounds',
      estimatedPax: 400,
      actualPax: 415,
      season: 'Q1 Wedding Season',
      dietaryProtocol: 'Karnataka Traditional & Chaat Street',
      isOutlier: false,
      menuSummary: ['Holige with Ghee', 'Vangi Bath', 'Dahi Puri Live', 'Kaju Katli'],
      foodCostEstimated: 120000,
      foodCostActual: 124000,
      laborCostActual: 22000,
      transportCostActual: 6000,
      revenue: 360000,
      actualProfit: 168000,
      actualMarginPercent: 46.7,
      wastePercent: 3.5,
      consumptionActuals: { riceCookedKg: 48.0, waterBottles300ml: 600 },
      postEventNotes: 'Live Chaat counter was the primary highlight; Holige consumption exceeded estimate by 15%.'
    }
  ];

  // Save historical events to local storage and sync
  const saveHistoricalList = (newList) => {
    setHistoricalList(newList);
    localStorage.setItem('cater_historical_events', JSON.stringify(newList));
  };

  const handleBatchIngest = async () => {
    let records = [];
    try {
      if (!legacyJsonInput.trim()) {
        alert('Please paste or load sample JSON legacy event records first.');
        return;
      }
      records = JSON.parse(legacyJsonInput);
      if (!Array.isArray(records)) {
        if (records.events && Array.isArray(records.events)) records = records.events;
        else records = [records];
      }
    } catch (e) {
      alert('Invalid JSON format. Please verify valid JSON syntax.');
      return;
    }

    setIsIngesting(true);
    try {
      // 1. Post batch to backend API using centralized apiCall
      if (apiCall) {
        await apiCall('/historical-events/ingest-batch', {
          method: 'POST',
          body: JSON.stringify(records)
        }).catch(() => null);
      } else {
        await fetch('/api/historical-events/ingest-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(records)
        }).catch(() => null);
      }

      // 2. Update local state
      const existingIds = new Set(historicalList.map(h => h.id));
      const newItems = records.filter(r => !existingIds.has(r.id));
      const updatedHistorical = [...newItems, ...historicalList];
      saveHistoricalList(updatedHistorical);

      setIngestionResult({
        success: true,
        count: records.length,
        message: `Successfully ingested ${records.length} legacy events into the Historical Intelligence Engine!`
      });
      setLegacyJsonInput('');
    } catch (err) {
      setIngestionResult({
        success: false,
        message: err.message
      });
    } finally {
      setIsIngesting(false);
    }
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

  // Live Dynamic AI Calculation from Machine Learning Model
  const aiCalculation = predictEventCatering({
    pax: aiPax,
    serviceStyle: aiServiceStyle,
    season: aiSeason,
    eventType: aiEventType,
    dietaryProtocol: aiDietaryProtocol
  }, historicalList);

  // Complete Per-Item Material Breakdown Calculation
  const aiItemBreakdown = calculateCompleteEventMaterials({
    pax: aiPax,
    menuItemIds: aiSelectedMenuItems,
    dishCatalog: dishes || [],
    rawMaterialsCatalog: rawMaterials || [],
    serviceStyle: aiServiceStyle,
    season: aiSeason,
    dietaryProtocol: aiDietaryProtocol
  });

  const handleLoadMenuFromEvent = (eventId) => {
    setAiSelectedMenuEventId(eventId);
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    const items = [];
    if (Array.isArray(ev.subFunctions)) {
      ev.subFunctions.forEach(sf => {
        if (Array.isArray(sf.menuItems)) {
          sf.menuItems.forEach(id => {
            if (!items.includes(id)) items.push(id);
          });
        }
      });
    }
    if (items.length > 0) {
      setAiSelectedMenuItems(items);
    }
    if (ev.guestCount) {
      setAiPax(ev.guestCount);
    }
  };

  const handleToggleMenuItem = (dishId) => {
    setAiSelectedMenuItems(prev =>
      prev.includes(dishId) ? prev.filter(x => x !== dishId) : [...prev, dishId]
    );
  };

  const handleApplyMaterialsToEvent = () => {
    const targetEv = events.find(e => e.id === (aiSelectedMenuEventId || targetEventId));
    if (!targetEv) {
      alert('Please select a valid event to apply materials to.');
      return;
    }

    const manualMaterials = aiItemBreakdown.rawMaterials.map(rm => ({
      materialId: rm.id,
      name: rm.name,
      category: rm.category,
      unit: rm.unit,
      costPerUnit: rm.unitCost,
      requiredQty: rm.qty,
      totalCost: rm.totalCost,
      notes: rm.reason
    }));

    const updated = {
      ...targetEv,
      guestCount: aiPax,
      manualMaterials: manualMaterials,
      execution: {
        ...(targetEv.execution || {}),
        costs: {
          ...(targetEv.execution?.costs || {}),
          rawMaterialsCost: aiItemBreakdown.summary.totalRawMaterialCost,
          totalExecutionCost: (targetEv.execution?.costs?.laborCost || 0) + 
                              (targetEv.execution?.costs?.transportCost || 0) + 
                              aiItemBreakdown.summary.totalRawMaterialCost
        }
      },
      aiProvisioningApplied: {
        timestamp: new Date().toISOString(),
        totalRawMaterials: aiItemBreakdown.rawMaterials.length,
        totalRawMaterialCost: aiItemBreakdown.summary.totalRawMaterialCost,
        totalVendorItemsCost: aiItemBreakdown.summary.totalVendorItemCost,
        grandTotalCost: aiItemBreakdown.summary.grandTotal,
        costPerPax: aiItemBreakdown.summary.costPerPax
      }
    };

    updateEvent(updated);
    setAiMaterialsApplySuccess(true);
    setTimeout(() => setAiMaterialsApplySuccess(false), 4000);
  };

  const filteredCatalogDishes = (dishes || []).filter(d => {
    if (!aiDishSearch.trim()) return true;
    const term = aiDishSearch.toLowerCase();
    return (d.name || '').toLowerCase().includes(term) ||
           (d.category || '').toLowerCase().includes(term) ||
           (d.subCategory || '').toLowerCase().includes(term);
  });

  // Apply AI Predictions to Target Event in ERP
  const handleApplyAiToEvent = () => {
    const targetEv = events.find(e => e.id === targetEventId);
    if (!targetEv) {
      alert('Please select an active target event first.');
      return;
    }

    const updated = {
      ...targetEv,
      guestCount: aiPax,
      execution: {
        ...(targetEv.execution || {}),
        costs: {
          ...(targetEv.execution?.costs || {}),
          rawMaterialsCost: aiCalculation.financials.totalFoodCost,
          laborCost: aiCalculation.financials.totalLaborCost,
          totalExecutionCost: aiCalculation.financials.totalCost
        }
      },
      transport: {
        ...(targetEv.transport || {}),
        totalTransportCost: aiCalculation.financials.totalTransportCost
      },
      billing: {
        ...(targetEv.billing || {}),
        aiEstimatedRevenue: aiCalculation.financials.projectedRevenue,
        suggestedQuotePerPax: aiCalculation.financials.suggestedSellingPricePerPax
      },
      aiModelApplied: {
        timestamp: new Date().toISOString(),
        pax: aiPax,
        serviceStyle: aiServiceStyle,
        suggestedQuote: aiCalculation.financials.suggestedSellingPricePerPax,
        predictedMargin: aiCalculation.financials.projectedMarginPercent
      }
    };

    updateEvent(updated);
    setAiApplySuccess(true);
    setTimeout(() => setAiApplySuccess(false), 4000);
  };

  // AI Copilot Query Handler (Hybrid: Backend API with Gemini + Local Engine)
  const handleCopilotQuery = async (queryText) => {
    const q = (queryText !== undefined ? queryText : aiUserQuery).trim();
    if (!q) return;

    setIsAiLoading(true);
    try {
      let data = null;
      if (apiCall) {
        data = await apiCall('/ai/query', {
          method: 'POST',
          body: JSON.stringify({
            query: q,
            context: {
              pax: aiPax,
              serviceStyle: aiServiceStyle,
              season: aiSeason,
              eventType: aiEventType,
              dietaryProtocol: aiDietaryProtocol
            }
          })
        });
      } else {
        const res = await fetch('/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            context: {
              pax: aiPax,
              serviceStyle: aiServiceStyle,
              season: aiSeason,
              eventType: aiEventType,
              dietaryProtocol: aiDietaryProtocol
            }
          })
        });
        if (res.ok) data = await res.json();
      }

      if (data && data.success && data.summary) {
        setAiCopilotResponse({
          title: data.title || 'AI Catering Intelligence',
          summary: data.summary,
          source: data.source || 'AI Model'
        });
        setIsAiLoading(false);
        return;
      }
    } catch (e) {
      // Offline fallback
    }

    const localAnswer = queryCateringAiCopilot(q, {
      pax: aiPax,
      serviceStyle: aiServiceStyle,
      season: aiSeason,
      eventType: aiEventType,
      dietaryProtocol: aiDietaryProtocol
    });
    setAiCopilotResponse(localAnswer);
    setIsAiLoading(false);
  };

  const currentTargetEvent = events.find(e => e.id === targetEventId) || events[0];
  const matchedEvents = findHistoricalMatches(currentTargetEvent, historicalList);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: '20px', background: 'rgba(156, 21, 25, 0.08)', border: '1px solid rgba(156, 21, 25, 0.12)', color: '#000000', fontSize: '0.82rem', fontWeight: 600 }}>
          <Sparkles size={16} />
          <span>Active Learning Engine ({historicalList.length} Historical Records)</span>
        </div>
      </div>

      {/* Aggregate Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Events in Memory</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
            {historicalList.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Events</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {nonOutliers.length} Standard + {historicalList.length - nonOutliers.length} Outliers
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cumulative Served Pax</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
            {totalAnalyzedPax.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Portions</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Range: 25 to 2,000 Pax scale
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Learned Food Cost / Pax</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
            ₹ {avgFoodCostPerPax} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ Guest</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Weighted historical baseline
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #ec4899' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Observed Food Waste Rate</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
            {avgWastePercent}% <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Actual</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#000000', marginTop: '0.2rem' }}>
            ↓ 3.1% lower than industry avg (8.5%)
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Realized Margin</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem' }}>
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
          className={`btn ${activeTab === 'aiCalculator' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('aiCalculator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.85rem',
            background: activeTab === 'aiCalculator' ? 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' : undefined,
            color: activeTab === 'aiCalculator' ? '#ffffff' : undefined,
            fontWeight: 700,
            boxShadow: activeTab === 'aiCalculator' ? '0 4px 12px rgba(99, 102, 241, 0.35)' : undefined
          }}
        >
          <Cpu size={16} />
          <span>AI Predictive Calculator</span>
          <span style={{ fontSize: '0.62rem', background: activeTab === 'aiCalculator' ? 'rgba(255,255,255,0.25)' : 'rgba(99, 102, 241, 0.15)', color: activeTab === 'aiCalculator' ? '#fff' : '#6366f1', padding: '0.1rem 0.45rem', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 800 }}>
            Model
          </span>
        </button>

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
          <IndianRupee size={16} />
          <span>Ingredient Pricing & Supplier Intelligence</span>
        </button>

        <button
          className={`btn ${activeTab === 'ingest' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ingest')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Upload size={16} />
          <span>Legacy Data Ingestion & Seeder</span>
        </button>
      </div>

      {/* TAB 0: AI PREDICTIVE CALCULATOR & SCENARIO SIMULATOR */}
      {activeTab === 'aiCalculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* AI Banner Card */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', color: '#fff' }}>
                    <Cpu size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: '#000000' }}>
                    AI Predictive Catering Calculation Engine (v2.0)
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '780px' }}>
                  Trained on historical event actuals and commercial catering economics. Adjust parameters below to simulate any event and receive instant, machine-learned predictions for ingredient quantities, costs, staffing curves, and profit margins.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.12)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5' }}>
                <Zap size={14} />
                <span>Live ML Engine Active • 0ms Latency</span>
              </div>
            </div>
          </div>

          {/* AI Scenario Simulator Parameters Card */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} style={{ color: 'var(--color-primary)' }} />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Event Scenario Parameters</h4>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Target Guest Scale: <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem' }}>{aiPax} Pax</strong>
              </div>
            </div>

            {/* Slider & Presets */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Guest Count (Pax):
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[50, 100, 250, 500, 800, 1500].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAiPax(preset)}
                      className={`btn btn-small ${aiPax === preset ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                    >
                      {preset} Pax
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="range"
                  min="25"
                  max="2500"
                  step="25"
                  value={aiPax}
                  onChange={e => setAiPax(parseInt(e.target.value, 10) || 100)}
                  style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                />
                <input
                  type="number"
                  min="25"
                  max="2500"
                  value={aiPax}
                  onChange={e => setAiPax(Math.max(25, parseInt(e.target.value, 10) || 25))}
                  className="form-control"
                  style={{ width: '90px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* Selectors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Service Style:
                </label>
                <select
                  className="form-select"
                  value={aiServiceStyle}
                  onChange={e => setAiServiceStyle(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Plantain Leaf Seated">Plantain Leaf Seated (Traditional Pankthi)</option>
                  <option value="Multi-Station Live Buffet">Multi-Station Live Buffet</option>
                  <option value="Dual Parallel Buffet Track">Dual Parallel Buffet Track</option>
                  <option value="High Tea / Refreshments">High Tea / Refreshments</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Operating Season:
                </label>
                <select
                  className="form-select"
                  value={aiSeason}
                  onChange={e => setAiSeason(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Summer Peak">Summer Peak (+35% Hydration Spike)</option>
                  <option value="Winter Peak">Winter Peak (+20% Hot Beverages & Rasam)</option>
                  <option value="Monsoon">Monsoon (Moisture Buffer Required)</option>
                  <option value="Q1 Wedding Season">Q1 Wedding Season (Standard)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Dietary Protocol:
                </label>
                <select
                  className="form-select"
                  value={aiDietaryProtocol}
                  onChange={e => setAiDietaryProtocol(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Sattvic Brahmin (No Onion No Garlic)">Sattvic Brahmin (No Onion No Garlic)</option>
                  <option value="Standard Pure Vegetarian">Standard Pure Vegetarian</option>
                  <option value="Karnataka Traditional">Karnataka Traditional Feast</option>
                  <option value="North-South Gourmet Fusion">North-South Gourmet Fusion</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Event Occasion:
                </label>
                <select
                  className="form-select"
                  value={aiEventType}
                  onChange={e => setAiEventType(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Wedding Reception">Wedding Reception</option>
                  <option value="Traditional Brahmin Wedding">Traditional Brahmin Wedding</option>
                  <option value="House Warming / Gruhapravesha">House Warming / Gruhapravesha</option>
                  <option value="Wedding Sangeeth">Wedding Sangeeth</option>
                  <option value="Corporate Banquet">Corporate Banquet</option>
                  <option value="Engagement">Engagement Ceremony</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Calculated Results Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* Panel 1: Raw Material & Provisioning Forecast */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <ShoppingCart size={17} style={{ color: '#6366f1' }} />
                  <span>Raw Material & Provisioning Forecast</span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>AI Estimated</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cooked Rice Required</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{aiCalculation.materials.cookedRiceKg} kg</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Raw: {aiCalculation.materials.rawRiceKg} kg (1:2.5 yield)</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sambar & Rasam</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000' }}>{aiCalculation.materials.sambarLiters}L / {aiCalculation.materials.rasamLiters}L</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Sambar / Rasam liquid output</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sweets & Payasam</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000' }}>{aiCalculation.materials.sweetsUnits} pcs</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Payasam: {aiCalculation.materials.payasamLiters} Liters</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Paneer & Dairy</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000' }}>{aiCalculation.materials.paneerKg} kg</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Pure Ghee/Oil: {aiCalculation.materials.oilGheeLiters}L</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Water Bottles (300ml)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>{aiCalculation.materials.waterBottles} units</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>~{Math.ceil(aiCalculation.materials.waterBottles / 24)} crates (24/crate)</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Plates / Plantain Leaves</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000' }}>{aiCalculation.materials.plantainLeavesOrPlates} units</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Includes 12% multi-round buffer</div>
                </div>
              </div>
            </div>

            {/* Panel 2: Commercial & Financial Forecast */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <IndianRupee size={17} style={{ color: '#10b981' }} />
                  <span>Commercial & Financial Projections</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Target 42% Margin</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Predicted Food Cost</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000' }}>₹ {aiCalculation.financials.totalFoodCost.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>₹ {aiCalculation.financials.learnedFoodCostPerPax} / Pax</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Labor & Staffing Cost</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000' }}>₹ {aiCalculation.financials.totalLaborCost.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>₹ {aiCalculation.financials.laborCostPerPax} / Pax</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Production Cost</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-danger)' }}>₹ {aiCalculation.financials.totalCost.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Cost: ₹ {aiCalculation.financials.costPerPax} / Pax</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>Suggested Client Quote</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>₹ {aiCalculation.financials.suggestedSellingPricePerPax} <span style={{ fontSize: '0.75rem' }}>/ Pax</span></div>
                  <div style={{ fontSize: '0.68rem', color: '#047857' }}>Revenue: ₹ {aiCalculation.financials.projectedRevenue.toLocaleString('en-IN')}</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Projected Net Profit</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857' }}>₹ {aiCalculation.financials.projectedProfit.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 600 }}>Yield: {aiCalculation.financials.projectedMarginPercent}% Margin</div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Predicted Kitchen Wastage</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000' }}>{aiCalculation.financials.predictedWastagePercent}%</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Industry baseline: 8.5%</div>
                </div>
              </div>
            </div>

            {/* Panel 3: Staffing Workforce Distribution */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <Users size={17} style={{ color: '#f59e0b' }} />
                  <span>Staffing & Workforce Allocation</span>
                </div>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Total: {aiCalculation.staffing.totalCrew} Staff</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Table Stewards / Dining Crew</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)' }}>{aiCalculation.staffing.tableStewards} crew</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Liquid Servers (Water/Rasam/Coffee)</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{aiCalculation.staffing.liquidServers} servers</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Live Counter Chefs / Dosa Masters</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{aiCalculation.staffing.liveChefs} chefs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Clearing, Scullery & Utility Crew</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{aiCalculation.staffing.clearingCrew} crew</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Floor Supervisors & Head Captain</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{aiCalculation.staffing.supervisors} lead</span>
                </div>
              </div>
            </div>

            {/* Panel 4: AI Analytical Observations & Risk Flags */}
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #ec4899' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <Sparkles size={17} style={{ color: '#ec4899' }} />
                  <span>AI Analytical Observations & Risk Flags</span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Confidence: {aiCalculation.confidence}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {aiCalculation.insights.map((insight, idx) => (
                  <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', padding: '0.45rem 0.65rem', background: 'rgba(255,255,255,0.6)', borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span>{insight}</span>
                  </div>
                ))}

                {aiCalculation.riskFlags.map((risk, idx) => (
                  <div key={idx} style={{ fontSize: '0.78rem', color: '#92400e', padding: '0.45rem 0.65rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>{risk.level}:</strong> {risk.message}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                Fleet Allocation: <strong>{aiCalculation.financials.vehicleCount} vehicle trip(s)</strong> budgeted at ₹ {aiCalculation.financials.totalTransportCost.toLocaleString('en-IN')}.
              </div>
            </div>

          </div>

          {/* COMPLETE ITEM-BY-ITEM EVENT PROVISIONING & VESSEL ENGINE */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(156, 21, 25, 0.22)', background: 'linear-gradient(135deg, rgba(156, 21, 25, 0.02) 0%, rgba(255, 255, 255, 0.95) 100%)' }}>
            
            {/* Header with Title & Live KPI Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'linear-gradient(135deg, #9c1519 0%, #b91c1c 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Complete Item-by-Item Event Material Provisioning Engine
                    </h3>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      AI category intelligence calculates every raw grocery, dairy, vegetable, fuel, vendor item, and vessel needed for {aiPax} Pax.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Summary Pill Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(156, 21, 25, 0.08)', border: '1px solid rgba(156, 21, 25, 0.2)', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  📦 {aiItemBreakdown.summary.totalUniqueItems} Unique Items Required
                </div>
                <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#047857' }}>
                  ₹ {aiItemBreakdown.summary.grandTotal.toLocaleString('en-IN')} Total Cost
                </div>
                <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8' }}>
                  ₹ {aiItemBreakdown.summary.costPerPax} / Pax
                </div>
              </div>
            </div>

            {/* Menu Connection & Event Link Bar */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Utensils size={15} style={{ color: 'var(--primary-color)' }} />
                    <span>Event Menu Source:</span>
                  </span>
                  <select
                    className="form-select"
                    value={aiSelectedMenuEventId}
                    onChange={e => handleLoadMenuFromEvent(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', minWidth: '220px' }}
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.id} - {ev.customer?.name} ({ev.eventType})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => handleLoadMenuFromEvent(aiSelectedMenuEventId)}
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    title="Reload dishes and guest count from this event"
                  >
                    <RefreshCw size={13} /> Sync from Event
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}>
                    {aiSelectedMenuItems.length} Dishes on Active Menu
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setIsDishSelectorOpen(!isDishSelectorOpen)}
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <List size={13} /> {isDishSelectorOpen ? 'Close Menu Drawer' : 'Manage Dishes & Add Items'}
                    {isDishSelectorOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

              </div>

              {/* Active Menu Category Distribution Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.65rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '0.3rem' }}>
                  Menu Classification:
                </span>
                {Object.entries(aiItemBreakdown.summary.menuCategoryBreakdown || {}).map(([cat, count]) => (
                  <span key={cat} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '12px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    <strong>{cat}</strong>: {count}
                  </span>
                ))}
                {Object.keys(aiItemBreakdown.summary.menuCategoryBreakdown || {}).length === 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No specific dishes selected — applying standard baseline catering spread.
                  </span>
                )}
              </div>

              {/* Expandable Dish Selector Drawer */}
              {isDishSelectorOpen && (
                <div style={{ marginTop: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                      <Search size={14} style={{ color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        placeholder="Search 374 master catalog dishes (e.g. Biryani, Paneer, Dosa, Payasam)..."
                        className="form-control"
                        value={aiDishSearch}
                        onChange={e => setAiDishSearch(e.target.value)}
                        style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => {
                          const idsToAdd = filteredCatalogDishes.slice(0, 30).map(d => d.id || d._id);
                          setAiSelectedMenuItems(prev => Array.from(new Set([...prev, ...idsToAdd])));
                        }}
                        style={{ fontSize: '0.74rem' }}
                      >
                        + Add All Shown
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setAiSelectedMenuItems([])}
                        style={{ fontSize: '0.74rem', color: '#dc2626' }}
                      >
                        Clear Menu
                      </button>
                    </div>
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.45rem', padding: '0.25rem' }}>
                    {filteredCatalogDishes.slice(0, 80).map(dish => {
                      const dishId = dish.id || dish._id;
                      const isSelected = aiSelectedMenuItems.includes(dishId);
                      return (
                        <div
                          key={dishId}
                          onClick={() => handleToggleMenuItem(dishId)}
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(156, 21, 25, 0.07)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ minWidth: 0, paddingRight: '0.4rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {dish.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                              {dish.category} • {dish.subCategory || 'Special'}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by div onClick
                            style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {filteredCatalogDishes.length > 80 && (
                    <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                      Showing 80 of {filteredCatalogDishes.length} dishes. Use the search box to refine dishes.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Breakdown Sub-Tabs (Raw Materials, Vendor Items, Vessels, Cost Summary) */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn btn-small ${aiActiveBreakdownTab === 'rawMaterials' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAiActiveBreakdownTab('rawMaterials')}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Package size={14} />
                <span>Raw Materials & Ingredients ({aiItemBreakdown.rawMaterials.length})</span>
              </button>
              
              <button
                type="button"
                className={`btn btn-small ${aiActiveBreakdownTab === 'vendorItems' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAiActiveBreakdownTab('vendorItems')}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Truck size={14} />
                <span>Vendor Consumables & Logistics ({aiItemBreakdown.vendorItems.length})</span>
              </button>

              <button
                type="button"
                className={`btn btn-small ${aiActiveBreakdownTab === 'vessels' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAiActiveBreakdownTab('vessels')}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Box size={14} />
                <span>Cooking Vessels & Equipment ({aiItemBreakdown.vesselRequirements.length})</span>
              </button>

              <button
                type="button"
                className={`btn btn-small ${aiActiveBreakdownTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAiActiveBreakdownTab('summary')}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <BarChart2 size={14} />
                <span>Cost & Margin Analytics</span>
              </button>
            </div>

            {/* TAB 1: RAW MATERIALS TABLE */}
            {aiActiveBreakdownTab === 'rawMaterials' && (
              <div>
                {/* Category Filter Chips */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.3rem' }}>
                    <Filter size={12} /> Category Filter:
                  </span>
                  {['ALL', 'Grocery', 'Dairy', 'Veg/Fruit', 'Fuel'].map(cat => {
                    const count = cat === 'ALL' 
                      ? aiItemBreakdown.rawMaterials.length 
                      : aiItemBreakdown.rawMaterials.filter(rm => rm.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setAiMaterialCategoryFilter(cat)}
                        style={{
                          fontSize: '0.74rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '15px',
                          border: aiMaterialCategoryFilter === cat ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                          background: aiMaterialCategoryFilter === cat ? 'var(--primary-color)' : 'var(--bg-card)',
                          color: aiMaterialCategoryFilter === cat ? '#fff' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontWeight: aiMaterialCategoryFilter === cat ? 700 : 500
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Table */}
                <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table className="table table-hover" style={{ margin: 0, fontSize: '0.82rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, borderBottom: '2px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '0.65rem 0.8rem' }}>#</th>
                        <th style={{ padding: '0.65rem 0.8rem' }}>Raw Material / Item</th>
                        <th style={{ padding: '0.65rem 0.8rem' }}>Category</th>
                        <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>Calculated Qty</th>
                        <th style={{ padding: '0.65rem 0.8rem' }}>Unit</th>
                        <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>Unit Cost</th>
                        <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>Total Cost (₹)</th>
                        <th style={{ padding: '0.65rem 0.8rem' }}>AI Allocation Rationale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiItemBreakdown.rawMaterials
                        .filter(rm => aiMaterialCategoryFilter === 'ALL' || rm.category === aiMaterialCategoryFilter)
                        .map((rm, idx) => {
                          const categoryColorMap = {
                            Grocery: { bg: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: 'rgba(16, 185, 129, 0.25)' },
                            Dairy: { bg: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', border: 'rgba(59, 130, 246, 0.25)' },
                            'Veg/Fruit': { bg: 'rgba(245, 158, 11, 0.1)', color: '#b45309', border: 'rgba(245, 158, 11, 0.25)' },
                            Fuel: { bg: 'rgba(168, 85, 247, 0.1)', color: '#7e22ce', border: 'rgba(168, 85, 247, 0.25)' }
                          };
                          const col = categoryColorMap[rm.category] || { bg: 'rgba(0,0,0,0.05)', color: 'inherit', border: 'var(--border-color)' };
                          return (
                            <tr key={rm.id}>
                              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{idx + 1}</td>
                              <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>
                                <div>{rm.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Code: {rm.id.toUpperCase()}</div>
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem' }}>
                                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: col.bg, color: col.color, border: `1px solid ${col.border}`, fontWeight: 600 }}>
                                  {rm.category}
                                </span>
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                {rm.qty.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>{rm.unit}</td>
                              <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                ₹ {rm.unitCost}
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary-color)' }}>
                                ₹ {rm.totalCost.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Sparkles size={11} style={{ color: '#6366f1', flexShrink: 0 }} />
                                  <span>{rm.reason}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot style={{ background: 'var(--bg-card)', borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                      <tr>
                        <td colSpan={3} style={{ padding: '0.7rem 0.8rem' }}>Total Raw Materials Estimated Cost:</td>
                        <td colSpan={3} style={{ padding: '0.7rem 0.8rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                          Includes ~5% Kitchen Prep & Moisture Buffer
                        </td>
                        <td style={{ padding: '0.7rem 0.8rem', textAlign: 'right', color: 'var(--primary-color)', fontSize: '1rem', fontWeight: 800 }}>
                          ₹ {aiItemBreakdown.summary.totalRawMaterialCost.toLocaleString('en-IN')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: VENDOR CONSUMABLES & LOGISTICS TABLE */}
            {aiActiveBreakdownTab === 'vendorItems' && (
              <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="table table-hover" style={{ margin: 0, fontSize: '0.82rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, borderBottom: '2px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.8rem' }}>#</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>Vendor Item</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>Category</th>
                      <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>Calculated Qty</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>Unit</th>
                      <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>Estimated Cost (₹)</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>Operational Scaling Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiItemBreakdown.vendorItems.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>{item.name}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.25)', fontWeight: 600 }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem' }}>
                          {item.qty.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>{item.unit}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary-color)' }}>
                          ₹ {item.estimatedCost.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Truck size={11} style={{ color: '#3b82f6', flexShrink: 0 }} />
                            <span>{item.reason}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: 'var(--bg-card)', borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                    <tr>
                      <td colSpan={5} style={{ padding: '0.7rem 0.8rem' }}>Total Vendor Consumables Estimate:</td>
                      <td style={{ padding: '0.7rem 0.8rem', textAlign: 'right', color: 'var(--primary-color)', fontSize: '1rem', fontWeight: 800 }}>
                        ₹ {aiItemBreakdown.summary.totalVendorItemCost.toLocaleString('en-IN')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* TAB 3: COOKING VESSELS & EQUIPMENT REQUIREMENTS */}
            {aiActiveBreakdownTab === 'vessels' && (
              <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="table table-hover" style={{ margin: 0, fontSize: '0.82rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, borderBottom: '2px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.8rem' }}>#</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>Vessel / Equipment Name</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>Gear Category</th>
                      <th style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>Required Units</th>
                      <th style={{ padding: '0.65rem 0.8rem' }}>Kitchen Allocation Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiItemBreakdown.vesselRequirements.map((vessel, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>{vessel.name}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#7e22ce', border: '1px solid rgba(168, 85, 247, 0.25)', fontWeight: 600 }}>
                            {vessel.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                          {vessel.qty} Units
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Box size={11} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                            <span>{vessel.reason}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: COST & MARGIN ANALYTICS */}
            {aiActiveBreakdownTab === 'summary' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Raw Grocery & Dairy</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857', margin: '0.2rem 0' }}>
                      ₹ {aiItemBreakdown.summary.totalRawMaterialCost.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Across {aiItemBreakdown.rawMaterials.length} unique raw materials
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    <div style={{ fontSize: '0.76rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>Vendor Consumables</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', margin: '0.2rem 0' }}>
                      ₹ {aiItemBreakdown.summary.totalVendorItemCost.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Water, plantain leaves, disposables, gas
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(156, 21, 25, 0.08)', border: '1px solid rgba(156, 21, 25, 0.25)' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--primary-color)', fontWeight: 700, textTransform: 'uppercase' }}>Combined Provisioning</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)', margin: '0.2rem 0' }}>
                      ₹ {aiItemBreakdown.summary.grandTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Total procurement outlay needed
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                    <div style={{ fontSize: '0.76rem', color: '#7e22ce', fontWeight: 700, textTransform: 'uppercase' }}>Material Cost / Pax</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7e22ce', margin: '0.2rem 0' }}>
                      ₹ {aiItemBreakdown.summary.costPerPax}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Normalized per guest cost
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong>How Sri Mayyia Caterers AI Category Intelligence calculates:</strong>
                  <p style={{ margin: '0.3rem 0 0 0' }}>
                    Because catering dish recipes vary by kitchen chef, the engine uses multi-variable category heuristics trained on historical banquets. For example, selecting 4 rice dishes applies 46g of raw Basmati per pax (1:2.5 cooked yield) with oil and spices. Each South Indian gravy adds lentils, tomatoes, and vegetables; while North Indian gravies add cottage cheese (paneer), fresh butter, and heavy cream.
                  </p>
                </div>
              </div>
            )}

            {/* Action Bar: Commit Item-by-Item Materials to Event */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Commit these <strong>{aiItemBreakdown.rawMaterials.length} calculated raw materials</strong> directly into the selected ERP event's material requirements list.
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApplyMaterialsToEvent}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 700, padding: '0.45rem 1.25rem' }}
              >
                <Save size={15} /> Commit All Materials to Event ({aiSelectedMenuEventId || targetEventId})
              </button>
            </div>

            {aiMaterialsApplySuccess && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#047857', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} />
                <span>Successfully committed all {aiItemBreakdown.rawMaterials.length} raw materials (Total: ₹ {aiItemBreakdown.summary.totalRawMaterialCost.toLocaleString('en-IN')}) to event {aiSelectedMenuEventId || targetEventId}!</span>
              </div>
            )}

          </div>

          {/* Apply AI Estimates to Target Event Bar */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={18} style={{ color: '#10b981' }} />
                  <span>Apply AI Predictive Calculations to Active Event</span>
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Commit these machine-learned food costs, labor estimates, and suggested quote into your selected event booking.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  value={targetEventId}
                  onChange={e => setTargetEventId(e.target.value)}
                  style={{ minWidth: '240px', fontSize: '0.85rem' }}
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.id} - {ev.customer?.name} ({ev.guestCount || 100} Pax)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyAiToEvent}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, padding: '0.45rem 1.1rem' }}
                >
                  <Save size={15} /> Apply AI Estimates to Event
                </button>
              </div>
            </div>

            {aiApplySuccess && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#047857', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} />
                <span>AI predictive estimates (₹ {aiCalculation.financials.totalFoodCost.toLocaleString('en-IN')} Food Cost, {aiCalculation.staffing.totalCrew} Staff) successfully committed to event {targetEventId}!</span>
              </div>
            )}
          </div>

          {/* Interactive AI Catering Copilot Chat */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', color: '#fff' }}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Interactive Catering AI Copilot</h4>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Ask any question about catering calculations, ingredient ratios, staffing, or profit margins.
                  </p>
                </div>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>Hybrid AI (Local ML + Gemini Ready)</span>
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              {[
                `How much rice and paneer for ${aiPax} Pax?`,
                `Calculate water bottle requirements in ${aiSeason}`,
                `Optimal staff allocation for ${aiPax} Pax`,
                `What price should I quote for 42% margin?`
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setAiUserQuery(chip); handleCopilotQuery(chip); }}
                  className="btn btn-secondary btn-small"
                  style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', borderRadius: '15px' }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Query Input Bar */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. How much raw rice and sambar do I need for 350 guests?"
                value={aiUserQuery}
                onChange={e => setAiUserQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCopilotQuery(); }}
                style={{ fontSize: '0.85rem' }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={isAiLoading || !aiUserQuery.trim()}
                onClick={() => handleCopilotQuery()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, padding: '0.45rem 1.25rem', whiteSpace: 'nowrap' }}
              >
                {isAiLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                <span>{isAiLoading ? 'Analyzing...' : 'Ask AI'}</span>
              </button>
            </div>

            {/* AI Copilot Answer Display */}
            {aiCopilotResponse && (
              <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={15} />
                    <span>{aiCopilotResponse.title || 'AI Catering Intelligence'}</span>
                  </div>
                  {aiCopilotResponse.source && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Source: {aiCopilotResponse.source}</span>
                  )}
                </div>

                <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                  {aiCopilotResponse.summary}
                </div>

                {Array.isArray(aiCopilotResponse.details) && (
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {aiCopilotResponse.details.map((det, i) => (
                      <li key={i} style={{ marginBottom: '0.2rem' }}>{det}</li>
                    ))}
                  </ul>
                )}

                {aiCopilotResponse.recommendation && (
                  <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', fontSize: '0.8rem', color: '#047857' }}>
                    <strong>AI Recommendation:</strong> {aiCopilotResponse.recommendation}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 1: HISTORICAL MATCHING & 5-LEVEL TRACEABLE ESTIMATOR */}
      {activeTab === 'matching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Target Event Selection Card */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(156, 21, 25, 0.04) 0%, rgba(156, 21, 25, 0.04) 100%)', border: '1px solid rgba(156, 21, 25, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '0.85rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '10px' }}>
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
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
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
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#000000' }}>
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
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    Cooked Rice Requirement (Biryani / Pulav / Sambar Rice)
                  </span>
                  <span className={`badge ${riceEstimate.confidence === 'High' ? 'badge-success' : 'badge-warning'}`}>
                    Confidence: {riceEstimate.confidence} ({riceEstimate.sampleSize} comparable events)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>1. Historical Average</div>
                    <div style={{ fontWeight: 700, color: '#000000' }}>{riceEstimate.historicalAverage}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>2. Recent Average</div>
                    <div style={{ fontWeight: 700, color: '#000000' }}>{riceEstimate.recentAverage}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>3. Generic Standard</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{riceEstimate.currentStandard}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>4. Event Adjustment</div>
                    <div style={{ fontWeight: 600, color: '#000000' }}>{riceEstimate.eventAdjustment}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(156, 21, 25, 0.06)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                    <div style={{ color: '#000000', fontSize: '0.7rem', fontWeight: 700 }}>5. Learned Final Estimate</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#000000' }}>{riceEstimate.finalEstimate} kg</div>
                  </div>
                </div>
              </div>

              {/* Variable 2: 300ml Bottled Water */}
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    300ml Packaged Mineral Water Units
                  </span>
                  <span className={`badge ${waterEstimate.confidence === 'High' ? 'badge-success' : 'badge-warning'}`}>
                    Confidence: {waterEstimate.confidence} ({waterEstimate.sampleSize} comparable events)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>1. Historical Multiplier</div>
                    <div style={{ fontWeight: 700, color: '#000000' }}>1.27x Pax Observed</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>2. Recent Multiplier</div>
                    <div style={{ fontWeight: 700, color: '#000000' }}>1.26x Pax Observed</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>3. Standard Assumption</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{waterEstimate.currentStandard}</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>4. Event Adjustment</div>
                    <div style={{ fontWeight: 600, color: '#000000' }}>+0% (Standard)</div>
                  </div>
                  <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(156, 21, 25, 0.06)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
                    <div style={{ color: '#000000', fontSize: '0.7rem', fontWeight: 700 }}>5. Learned Final Estimate</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#000000' }}>{waterEstimate.finalEstimate} Bottles</div>
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
                    background: m.isOutlier ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.02)',
                    border: m.isOutlier ? '1px solid rgba(0,0,0,0.1)' : '1px solid var(--border-color)',
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
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000000' }}>
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
                        <span key={fIdx} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(156, 21, 25, 0.06)', color: '#000000', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Check size={11} />
                          <span>{fact}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {m.historicalEvent.postEventNotes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.5)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <strong>Post-Event Log:</strong> {m.historicalEvent.postEventNotes}
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
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
                <FileCheck size={20} />
                <span>Post-Event Learning & Reconciliation Form</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Log actual consumption, costs, and waste after event completion to automatically improve future machine estimates.
              </p>
            </div>
          </div>

          {reconcileSuccess && (
            <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(156, 21, 25, 0.06)', border: '1px solid #10b981', color: '#000000', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
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
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.4)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <input 
                  type="checkbox" 
                  id="outlierCheck"
                  checked={postEventForm.isOutlier}
                  onChange={e => setPostEventForm({ ...postEventForm, isOutlier: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="outlierCheck" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#000000', cursor: 'pointer' }}>
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
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
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
              <div key={dishId} style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.65)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#000000' }}>
                    {dishId === 'si_rc_potali' ? 'Jackfruit Potali Biryani' : dishId === 'app_str_op1' ? 'Operation Capsicum Bonda' : 'Appi Payasam Udupi Style'} ({dishId})
                  </span>
                  <span className="badge badge-purple">{versions.length} Versions Logged</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {versions.map((ver, vIdx) => (
                    <div key={vIdx} style={{ padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', borderLeft: ver.version.includes('current') ? '3px solid #10b981' : '3px solid var(--border-color)' }}>
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
                          <span key={iIdx} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.65)', border: '1px solid var(--border-color)' }}>
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
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
                <IndianRupee size={20} />
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

      {/* TAB 5: LEGACY DATA INGESTION & TRAINING SEEDER */}
      {activeTab === 'ingest' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
                  <Upload size={18} />
                  <span>Legacy Event Ingestion Pipeline</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Ingest past catering records (1953–2025 archives) into the system's memory to calibrate AI plate pricing and raw material requirements.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setLegacyJsonInput(JSON.stringify(sampleLegacyEvents, null, 2))}
                style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FileUp size={14} />
                <span>Load Sample Dataset (3 Past Weddings)</span>
              </button>
            </div>

            {ingestionResult && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  background: ingestionResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: ingestionResult.success ? '1px solid #10b981' : '1px solid #ef4444',
                  color: ingestionResult.success ? '#065f46' : '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {ingestionResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{ingestionResult.message}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Paste Legacy Event JSON Array</label>
              <textarea
                className="form-textarea"
                rows={9}
                placeholder="[ { id: 'HIST-001', eventType: 'Traditional Wedding', actualPax: 800, foodCostActual: 240000, wastePercent: 3.5, ... } ]"
                value={legacyJsonInput}
                onChange={e => setLegacyJsonInput(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBatchIngest}
                disabled={isIngesting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
              >
                <Database size={16} />
                <span>{isIngesting ? 'Ingesting Records...' : 'Ingest Batch into Learning Memory'}</span>
              </button>
            </div>
          </div>

          {/* Table of Ingested Historical Events */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Historical Memory Records ({historicalList.length} Events)</h3>
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Event Ref / Name</th>
                    <th>Date</th>
                    <th>Occasion Type</th>
                    <th>Served Pax</th>
                    <th>Actual Food Cost</th>
                    <th>Waste %</th>
                    <th>Net Margin</th>
                    <th>Memory Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalList.map(h => (
                    <tr key={h.id}>
                      <td>
                        <strong>{h.name || h.id}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{h.client}</div>
                      </td>
                      <td>{h.date || 'Legacy Archive'}</td>
                      <td>{h.eventType}</td>
                      <td><span className="badge badge-info">{h.actualPax || h.estimatedPax} Pax</span></td>
                      <td>₹ {(h.foodCostActual || h.foodCostEstimated || 0).toLocaleString('en-IN')}</td>
                      <td>{h.wastePercent || 4.0}%</td>
                      <td><span className="badge badge-success">{h.actualMarginPercent || 45}%</span></td>
                      <td>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={12} /> Active Training Node
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoricalLearning;
