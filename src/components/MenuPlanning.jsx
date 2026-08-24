import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ClipboardCopy, Package, ArrowRight, ShieldAlert, CheckCircle, 
  HelpCircle, Save, MessageSquare, Tag, Sparkles, AlertCircle, 
  Search, Utensils, Award, ShieldCheck, Flame, BookOpen, Layers, Brain, Download, Printer, FileText, X, Check
} from 'lucide-react';
import { generateOccasionMenuPdf, downloadPdfBlob, printPdfBlob } from '../utils/pdfGenerator';

const FOOD_CATEGORIES = [
  'Beverages & Welcome Drinks',
  'Appetizers, Chaats & Street Food',
  'Global & Fusion Cuisines',
  'South Indian Specialties',
  'North Indian Specialties',
  'Sides, Accompaniments & Salads',
  'Desserts, Sweets & Ice Creams',
  'After-Meal / Traditional Finishers'
];

// Enterprise Event Archetype Blueprints from Sri Mayyia Master Intelligence
const EVENT_ARCHETYPES = [
  {
    id: 'tier1_home',
    title: 'Tier 1: Micro Home Event',
    paxRange: '25–75 Pax',
    desc: 'Intimate family gathering, Pooja, or Gruhapravesha breakfast/high-tea.',
    badge: 'Micro-Scale Intimate',
    badgeColor: '#10b981',
    items: [
      'bev_hot_1', 'bev_ffj_1', 'app_str_md1', 'si_dsa_1', 'si_idl_5',
      'sw_hol_1', 'sw_hol_8', 'si_rc_1', 'si_grv_16', 'fin_tam_1'
    ]
  },
  {
    id: 'tier2_milestone',
    title: 'Tier 2: Mid-Scale Milestone / Baleyele Grand Lunch',
    paxRange: '100–350 Pax',
    desc: 'Traditional plantain-leaf ceremonial seated feast with authentic Udupi/Mysore courses.',
    badge: 'Plantain Leaf Seated',
    badgeColor: '#3b82f6',
    items: [
      'bev_hot_12', 'sw_hol_4', 'sw_hol_appi', 'sd_ply_1', 'sd_sld_1',
      'si_grv_1', 'si_grv_9', 'si_grv_8', 'si_grv_7', 'si_grv_16',
      'si_rc_2', 'si_grv_24', 'fin_tam_2'
    ]
  },
  {
    id: 'tier3_wedding',
    title: 'Tier 3: Grand Wedding & Sangeeth',
    paxRange: '400–900 Pax',
    desc: 'Multi-station live counters, Chaat street, Tandoor lounge, and artisanal ice cream parlor.',
    badge: 'Multi-Station Live',
    badgeColor: '#8b5cf6',
    items: [
      'bev_ffj_12', 'bev_mkl_1', 'app_str_sp1', 'app_str_op1', 'app_cht_1',
      'app_cht_13', 'glb_ita_1', 'ni_grv_2', 'ni_brd_chur', 'si_rc_potali',
      'sw_hol_cova', 'sw_nor_seeth', 'sw_ice_triv', 'fin_pan_4'
    ]
  },
  {
    id: 'tier4_mega',
    title: 'Tier 4: Mega Royal Reception',
    paxRange: '1,000–2,000 Pax',
    desc: 'High-throughput dual parallel buffets, royal live grilling, and bridal return gift parcels.',
    badge: 'High Throughput Mega',
    badgeColor: '#f59e0b',
    items: [
      'bev_mkl_3', 'bev_ffj_11', 'app_str_2', 'app_str_op3', 'app_str_8',
      'app_str_20', 'app_cht_9', 'ni_grv_6', 'ni_rc_makh', 'si_rc_flw',
      'sw_nor_1', 'sw_nor_chan', 'sw_ice_fig', 'fin_pan_1', 'fin_tam_3'
    ]
  }
];

// Constraint-Driven Rule Engine Directives
const OPERATIONAL_DIRECTIVES = [
  {
    id: 'jeera_rice',
    title: 'Jeera Rice Mandatory',
    shortLabel: 'Jeera Rice Rule',
    tag: '[DIRECTIVE: Mandatory Jeera Rice (Shristi Village Protocol) - All Biryani & Rice dishes must use premium Jeera Sambha Rice]',
    desc: 'Shristi Village Protocol: Substitutes all Basmati with short-grain fragrant Jeera Rice',
    color: '#000000'
  },
  {
    id: 'sattvic_brahmin',
    title: 'Sattvic Brahmin (No Onion / Garlic)',
    shortLabel: 'Sattvic Brahmin',
    tag: '[DIRECTIVE: Sattvic Brahmin Style - Pure No Onion & No Garlic + 1.5kg/100 Pax Satyanarayan Vratha Prasadam]',
    desc: 'Pure Udupi Brahmin standard. Excludes all alliums and includes sacred prasadam',
    color: '#000000',
    conflictKeywords: ['garlic', 'onion', 'pyaza', 'shawarma', 'burnt garlic', 'chilli garlic']
  },
  {
    id: 'no_soppu',
    title: 'No Soppu Rule (Zero Greens)',
    shortLabel: 'No Soppu (Greens)',
    tag: '[DIRECTIVE: Zero Leafy Greens (No Soppu) - Strictly strip Palak, Methi, Fenugreek, Spinach from all preparations]',
    desc: 'Swarga Heritage directive: Zero leafy vegetables across all gravies & fries',
    color: '#000000',
    conflictKeywords: ['palak', 'spinach', 'methi', 'menthya', 'soppu', 'gongura']
  },
  {
    id: 'foil_free',
    title: 'Silver-Foil Free Confections',
    shortLabel: 'Silver-Foil Free',
    tag: '[DIRECTIVE: Silver-Foil Free Sweets - 100% Ahimsa Pure Vegetarian standard on Kaju Katli & Barfis]',
    desc: 'Zero non-vegetarian silver vark/foil on all traditional sweets',
    color: '#000000'
  },
  {
    id: 'pomegranate_curd',
    title: 'Pomegranate Curd Rice',
    shortLabel: 'Pomegranate Curd Rice',
    tag: '[DIRECTIVE: Pure Pomegranate Curd Rice - No grapes or raisins; garnish exclusively with fresh ruby pomegranate pearls]',
    desc: 'Digestive Curd Rice standard without sweet/sour grapes',
    color: '#000000'
  },
  {
    id: 'return_parcels',
    title: 'Bride & Groom Return Parcels',
    shortLabel: 'Return Gift Parcels',
    tag: '[DIRECTIVE: Return Gift Parcels - 100-200 Packaged Boxes per side containing Peni + Ladoo + 1/4kg Mysorepak + 200g Kara Boondi]',
    desc: 'Pre-packaged bridal confectionery takeaway packages for guest departure',
    color: '#000000'
  }
];

const MenuPlanning = () => {
  const {
    currentRole,
    currentUser,
    events,
    updateEvent,
    dishes,
    companyProfile,
    refreshEventTotals
  } = useContext(AppContext);

  const isSalesExec = currentRole === 'Sales Executive' || currentRole === 'Sales';
  const visibleEvents = isSalesExec
    ? events.filter(e => e.createdBy === currentUser || e.createdByName === currentUser || e.salesExecutive === currentUser)
    : events;

  // States
  const [selectedEventId, setSelectedEventId] = useState(visibleEvents[0]?.id || '');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [cloneSourceId, setCloneSourceId] = useState('');

  const [draftSubFunctions, setDraftSubFunctions] = useState(null);
  const [eventMenuNotes, setEventMenuNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [parentEventSearch, setParentEventSearch] = useState('');

  // Category and Dish Search Filters
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');
  const [dishSearchTerm, setDishSearchTerm] = useState('');

  // Indian Occasion Menu PDF Modal State
  const [isMenuPdfModalOpen, setIsMenuPdfModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('baleyele');

  const isEditable = currentRole === 'Admin' || currentRole === 'HR' || currentRole === 'HR Manager' || currentRole === 'Manager' || isSalesExec;
  const currentEvent = visibleEvents.find(e => e.id === selectedEventId) || visibleEvents[0];

  const filteredParentEvents = visibleEvents.filter(e => {
    if (!parentEventSearch) return true;
    const query = parentEventSearch.toLowerCase();
    return (
      e.id.toLowerCase().includes(query) ||
      (e.customer?.name || '').toLowerCase().includes(query) ||
      (e.eventType || '').toLowerCase().includes(query) ||
      (e.date || '').includes(query)
    );
  });

  const handleDownloadMenuPdf = (templateId = selectedTemplate) => {
    if (!currentEvent || !selectedSub) return;
    const res = generateOccasionMenuPdf(currentEvent, selectedSub, companyProfile, templateId, dishes);
    downloadPdfBlob(res.blob, res.filename);
  };

  const handlePrintMenuPdf = (templateId = selectedTemplate) => {
    if (!currentEvent || !selectedSub) return;
    const res = generateOccasionMenuPdf(currentEvent, selectedSub, companyProfile, templateId, dishes);
    printPdfBlob(res.blob);
  };

  // Quick Dietary & Client Request Tags
  const quickTags = [
    { label: 'Pure Jain', text: '[Pure Jain - No Onion/Garlic]' },
    { label: 'Mild Spice', text: '[Mild Spice / Less Oil]' },
    { label: 'Extra Spicy', text: '[Authentic Spicy & Tangy]' },
    { label: 'Dairy/Nut Free', text: '[Dairy & Nut Allergy Warning]' },
    { label: 'VIP Service', text: '[VIP Table Dedicated Service]' },
    { label: 'Fast Refill', text: '[High Demand - Continuous Refill]' },
    { label: 'Live Counter Hot', text: '[Serve Sizzling Hot from Live Counter]' },
    { label: 'Organic Banana Leaf', text: '[Traditional Banana Leaf Dining]' }
  ];

  // Sync draft ONLY when event ID changes (decoupled from background polling)
  React.useEffect(() => {
    const targetEvent = visibleEvents.find(e => e.id === selectedEventId) || visibleEvents[0];
    if (targetEvent) {
      setDraftSubFunctions(JSON.parse(JSON.stringify(targetEvent.subFunctions || [])));
      setEventMenuNotes(targetEvent.menuNotes || '');
      setIsDirty(false);
    } else {
      setDraftSubFunctions(null);
      setEventMenuNotes('');
      setIsDirty(false);
    }
  }, [selectedEventId]);

  // Initialize selected sub-function
  React.useEffect(() => {
    if (draftSubFunctions && draftSubFunctions.length > 0) {
      if (!draftSubFunctions.find(sf => sf.id === selectedSubId)) {
        setSelectedSubId(draftSubFunctions[0].id);
      }
    } else {
      setSelectedSubId('');
    }
  }, [draftSubFunctions]);

  const selectedSub = draftSubFunctions?.find(sf => sf.id === selectedSubId);

  // Apply Event Archetype
  const applyArchetype = (archetype) => {
    if (!isEditable || !selectedSub) return;
    
    // Resolve matching dish IDs (some archetypes use new IDs or fallback)
    const validIds = archetype.items.filter(id => dishes.some(d => d.id === id));
    
    setDraftSubFunctions(prev => {
      return prev.map(sf => {
        if (sf.id === selectedSub.id) {
          return { ...sf, menuItems: [...validIds] };
        }
        return sf;
      });
    });

    alert(`Applied ${archetype.title} (${validIds.length} authentic dishes) to ${selectedSub.name}`);
  };

  // Toggle Operational Constraint Directive
  const toggleDirective = (directive) => {
    if (!isEditable || !selectedSub) return;
    const currentNotes = selectedSub.clientNotes || '';
    const hasDirective = currentNotes.includes(directive.tag);

    let updatedNotes = '';
    if (hasDirective) {
      updatedNotes = currentNotes.replace(directive.tag, '').replace(/\s{2,}/g, ' ').trim();
    } else {
      updatedNotes = currentNotes ? `${currentNotes}\n${directive.tag}` : directive.tag;
    }

    handleUpdateSubNotes(updatedNotes);
  };

  const toggleDish = (dishId) => {
    if (!isEditable || !selectedSub) return;
    
    setDraftSubFunctions(prev => {
      return prev.map(sf => {
        if (sf.id === selectedSub.id) {
          const exists = sf.menuItems.includes(dishId);
          return {
            ...sf,
            menuItems: exists ? sf.menuItems.filter(id => id !== dishId) : [...sf.menuItems, dishId]
          };
        }
        return sf;
      });
    });
  };

  const handleUpdateSubNotes = (notes) => {
    if (!isEditable || !selectedSub) return;
    setDraftSubFunctions(prev => {
      return prev.map(sf => {
        if (sf.id === selectedSub.id) {
          return { ...sf, clientNotes: notes };
        }
        return sf;
      });
    });
  };

  const handleAddQuickTag = (tagText) => {
    if (!isEditable || !selectedSub) return;
    const currentNotes = selectedSub.clientNotes || '';
    if (currentNotes.includes(tagText)) return;
    const updated = currentNotes ? `${currentNotes} ${tagText}` : tagText;
    handleUpdateSubNotes(updated);
  };

  const handleSaveMenu = async () => {
    if (!isEditable || !currentEvent || !draftSubFunctions) return;
    setSaving(true);
    const updatedEvent = {
      ...currentEvent,
      menuNotes: eventMenuNotes,
      subFunctions: draftSubFunctions
    };
    await updateEvent(updatedEvent);
    setTimeout(() => refreshEventTotals(selectedEventId), 50);
    setSaving(false);
    alert('Menu selections and client instructions saved successfully!');
  };

  const handleCloneConfig = () => {
    if (!isEditable || !selectedEventId || !cloneSourceId) return;
    const sourceEvent = events.find(e => e.id === cloneSourceId);
    if (!sourceEvent) return;

    setDraftSubFunctions(prev => {
      return prev.map((sf, idx) => {
        const sourceSub = sourceEvent.subFunctions[idx] || sourceEvent.subFunctions[0];
        return {
          ...sf,
          menuItems: sourceSub ? [...sourceSub.menuItems] : [],
          clientNotes: sourceSub?.clientNotes || sf.clientNotes || ''
        };
      });
    });

    setCloneSourceId('');
    alert(`Menu configurations cloned successfully from ${sourceEvent.id}! Click "Save Menu" to commit.`);
  };

  // Check if dish has conflicts with active directives
  const getDishConflict = (dish) => {
    if (!selectedSub?.clientNotes) return null;
    const notes = selectedSub.clientNotes;
    const dishNameLower = dish.name.toLowerCase();

    for (const directive of OPERATIONAL_DIRECTIVES) {
      if (directive.conflictKeywords && notes.includes(directive.tag)) {
        const hasConflict = directive.conflictKeywords.some(kw => dishNameLower.includes(kw));
        if (hasConflict) {
          return `Violates ${directive.shortLabel}`;
        }
      }
    }
    return null;
  };

  // Historical Learned Portion Insights
  const getHistoricalPortionHint = (dish) => {
    const name = dish.name.toLowerCase();
    const cat = (dish.category || '').toLowerCase();
    if (name.includes('biryani') || name.includes('rice') || name.includes('pulav') || name.includes('bath')) {
      return '~115g/Pax';
    }
    if (name.includes('naan') || name.includes('roti') || name.includes('kulcha') || name.includes('poori')) {
      return '~1.6 pcs/Pax';
    }
    if (cat.includes('dessert') || name.includes('payasa') || name.includes('holige') || name.includes('sweet')) {
      return '~95g/Pax';
    }
    if (cat.includes('appetizer') || name.includes('bonda') || name.includes('bajji') || name.includes('tikki') || name.includes('paneer')) {
      return '~1.4 pcs/Pax';
    }
    if (cat.includes('beverage') || name.includes('juice') || name.includes('shake') || name.includes('mocktail')) {
      return '~180ml/Pax';
    }
    return null;
  };

  // Available unique categories
  const dynamicCategories = Array.from(new Set([
    ...FOOD_CATEGORIES,
    ...dishes.map(d => d.category).filter(Boolean)
  ]));

  const displayedCategories = selectedCategoryTab === 'All'
    ? dynamicCategories
    : dynamicCategories.filter(cat => cat === selectedCategoryTab);

  if (currentRole === 'Accountant' || currentRole.includes('Store') || currentRole.includes('Storage')) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Operational menu planning details are restricted for this role. Please log in as an Admin, HR, or Sales Executive.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Menu Planning & Client Instructions</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Map dishes to sub-functions, apply 4 core event archetypes, and enforce strict dietary directives.</p>
        </div>
        {isEditable && currentEvent && (
          <button 
            className="btn btn-primary" 
            onClick={handleSaveMenu} 
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontWeight: 600 }}
          >
            <Save size={18} />
            {saving ? 'Saving Changes...' : 'Save Menu & Instructions'}
          </button>
        )}
      </div>

      <div className="responsive-grid two-cols-right-heavy">
        
        {/* Left Column: Event & Archetype Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Active Event Selector */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Active Parent Event</h3>
              {isDirty && (
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Unsaved Changes</span>
              )}
            </div>

            {/* Parent Event Search Box */}
            <div className="form-group" style={{ marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.65)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem 0.6rem' }}>
                <Search size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Filter parent events (ID, Client, Type, Date)..."
                  value={parentEventSearch}
                  onChange={e => setParentEventSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    width: '100%'
                  }}
                />
                {parentEventSearch && (
                  <button
                    type="button"
                    onClick={() => setParentEventSearch('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Event ID File ({filteredParentEvents.length})</label>
              <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                {filteredParentEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.id} - {e.customer?.name} ({e.eventType} · {e.date})</option>
                ))}
              </select>
            </div>
            
            {currentEvent && (
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Select Sub-Function Course Instance</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {draftSubFunctions?.map(sf => (
                    <button
                      key={sf.id}
                      onClick={() => setSelectedSubId(sf.id)}
                      className={`btn btn-secondary ${selectedSubId === sf.id ? 'active' : ''}`}
                      style={{
                        justifyContent: 'space-between',
                        background: selectedSubId === sf.id ? 'rgba(156, 21, 25, 0.08)' : 'rgba(255,255,255,0.02)',
                        borderColor: selectedSubId === sf.id ? 'var(--color-primary)' : 'var(--border-color)',
                        color: selectedSubId === sf.id ? 'var(--color-primary)' : 'var(--text-primary)',
                        padding: '0.6rem 0.85rem'
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{sf.name}</div>
                        {sf.clientNotes && (
                          <div style={{ fontSize: '0.72rem', color: '#000000', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <MessageSquare size={10} /> Has Directives / Notes
                          </div>
                        )}
                      </div>
                      <span className="badge badge-info">{sf.guestCount} Pax</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4 Core Event Archetypes (Master Intelligence Presets) */}
          {isEditable && selectedSub && (
            <div className="glass-card" style={{ background: 'rgba(156, 21, 25, 0.06)', border: '1px solid rgba(255, 255, 255, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={16} className="accent-text" />
                  <span>4 Event Archetypes (Presets)</span>
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sri Mayyia Since 1953</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {EVENT_ARCHETYPES.map(arc => (
                  <div 
                    key={arc.id}
                    style={{
                      padding: '0.6rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: arc.badgeColor }}>
                        {arc.title}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '6px', background: `${arc.badgeColor}22`, color: arc.badgeColor, fontWeight: 600 }}>
                        {arc.paxRange}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                      {arc.desc}
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      style={{ marginTop: '0.2rem', fontSize: '0.72rem', padding: '0.25rem 0.5rem', justifyContent: 'center' }}
                      onClick={() => applyArchetype(arc)}
                    >
                      <span>Load Archetype ({arc.items.length} Items)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Duplication Widget */}
          {isEditable && currentEvent && (
            <div className="glass-card" style={{ background: 'rgba(156, 21, 25, 0.04)', border: '1px solid rgba(156, 21, 25, 0.08)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ClipboardCopy size={16} className="accent-text" />
                <span>Clone Event Menu Template</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Copy the entire menu allocation config from a past completed or active Event ID.
              </p>
              
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <select className="form-select" value={cloneSourceId} onChange={e => setCloneSourceId(e.target.value)} style={{ fontSize: '0.82rem' }}>
                  <option value="">Choose past event to clone...</option>
                  {events.filter(e => e.id !== selectedEventId).map(e => (
                    <option key={e.id} value={e.id}>{e.id} - {e.customer?.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-small"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!cloneSourceId}
                onClick={handleCloneConfig}
              >
                <span>Duplicate Menu Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Menu Builder & Constraint Directives */}
        <div className="glass-card">
          {selectedSub ? (
            <div>
              {/* Header with Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Utensils size={20} className="accent-text" />
                    <span>Menu Board: {selectedSub.name}</span>
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    Selected dishes: <strong>{selectedSub.menuItems.length}</strong> | Headcount: <strong>{selectedSub.guestCount} Pax</strong>
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search dishes..."
                      value={dishSearchTerm}
                      onChange={e => setDishSearchTerm(e.target.value)}
                      style={{ paddingLeft: '2rem', fontSize: '0.8rem', padding: '0.35rem 0.6rem 0.35rem 2rem' }}
                    />
                  </div>
                  <span className="badge badge-info">{selectedSub.date || currentEvent.date}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => setIsMenuPdfModalOpen(true)}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} /> Export Menu PDF
                  </button>
                </div>
              </div>

              {/* Sri Mayyia Operational Directives & Rule Engine Box */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1.5px solid rgba(156, 21, 25, 0.18)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.68rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#000000', fontSize: '0.95rem' }}>
                    <ShieldCheck size={19} style={{ color: '#9C1519' }} />
                    <span>Operational Rules & Dietary Directives Engine</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 600 }}>
                    1-Click Sri Mayyia Quality Directives & Kitchen Safeguards
                  </span>
                </div>

                {/* 6 Rapid Constraint Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.55rem', marginBottom: '0.85rem' }}>
                  {OPERATIONAL_DIRECTIVES.map(dir => {
                    const isActive = (selectedSub.clientNotes || '').includes(dir.tag);
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => toggleDirective(dir)}
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.7rem',
                          borderRadius: '8px',
                          border: isActive ? '1.5px solid #9C1519' : '1px solid rgba(0,0,0,0.12)',
                          background: isActive ? 'rgba(210, 172, 103, 0.2)' : '#FFFFFF',
                          color: '#000000',
                          cursor: isEditable ? 'pointer' : 'default',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 2px 6px rgba(156,21,25,0.1)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#000000' }}>
                            {dir.title}
                          </span>
                          {isActive && (
                            <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: '#9C1519', color: '#FFFFFF', fontWeight: 700 }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#000000', lineHeight: 1.25, fontWeight: 500 }}>
                          {dir.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Freeform Client Notes & Quick Tags */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000000' }}>
                      Quick Tags & Kitchen Custom Instructions:
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {quickTags.map((tag, idx) => {
                        const isTagActive = (selectedSub.clientNotes || '').includes(tag.text);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddQuickTag(tag.text)}
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              background: isTagActive ? 'rgba(156, 21, 25, 0.15)' : '#FFFFFF',
                              border: isTagActive ? '1.5px solid #9C1519' : '1px solid rgba(0,0,0,0.18)',
                              color: '#000000',
                              cursor: 'pointer'
                            }}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Type client custom instructions (e.g. 'Less spicy rasam for elders counter', '50 Pax separate Jain counter', 'Serve welcome mocktails chilled on arrival')..."
                    value={selectedSub.clientNotes || ''}
                    onChange={e => handleUpdateSubNotes(e.target.value)}
                    disabled={!isEditable}
                    style={{
                      width: '100%',
                      fontSize: '0.85rem',
                      lineHeight: '1.45',
                      background: 'rgba(255, 255, 255, 0.65)',
                      color: '#000000',
                      fontWeight: 600,
                      border: '1px solid rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem'
                    }}
                  />
                </div>
              </div>

              {/* 8 Food Category Filter Pills */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryTab('All')}
                    className={`btn btn-small ${selectedCategoryTab === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '16px' }}
                  >
                    All Categories ({dishes.length})
                  </button>
                  {dynamicCategories.map(cat => {
                    const catDishes = dishes.filter(d => d.category === cat);
                    const catCount = catDishes.length;
                    const catSelectedCount = selectedSub.menuItems.filter(id => catDishes.some(d => d.id === id)).length;
                    if (catCount === 0) return null;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryTab(cat)}
                        className={`btn btn-small ${selectedCategoryTab === cat ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <span>{cat}</span>
                        {catSelectedCount > 0 && (
                          <span style={{ background: '#22c55e', color: '#fff', fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '8px', fontWeight: 700 }}>
                            {catSelectedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categorized Dishes Rendering */}
              {displayedCategories.map(cat => {
                const catDishes = dishes.filter(d => {
                  const matchesCat = d.category === cat;
                  const matchesSearch = !dishSearchTerm || d.name.toLowerCase().includes(dishSearchTerm.toLowerCase()) || (d.subCategory && d.subCategory.toLowerCase().includes(dishSearchTerm.toLowerCase()));
                  return matchesCat && matchesSearch;
                });

                if (catDishes.length === 0) return null;

                const selectedInCat = selectedSub.menuItems.filter(id => catDishes.some(d => d.id === id)).length;

                // Group by subCategory
                const subCategories = Array.from(new Set(catDishes.map(d => d.subCategory || 'General Items')));

                return (
                  <div key={cat} style={{ marginBottom: '1.75rem' }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#000000',
                      marginBottom: '0.85rem',
                      borderBottom: '1px solid rgba(147, 197, 253, 0.15)',
                      paddingBottom: '0.4rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{cat}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: selectedInCat > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                        {selectedInCat} / {catDishes.length} selected
                      </span>
                    </h3>

                    {/* Subcategories */}
                    {subCategories.map(subCat => {
                      const subDishes = catDishes.filter(d => (d.subCategory || 'General Items') === subCat);
                      return (
                        <div key={subCat} style={{ marginBottom: '1rem' }}>
                          {subCat !== 'General Items' && (
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                              <span>{subCat}</span>
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                            {subDishes.map(dish => {
                              const isSelected = selectedSub.menuItems.includes(dish.id);
                              const conflictWarning = getDishConflict(dish);

                              return (
                                <div
                                  key={dish.id}
                                  style={{
                                    padding: '0.65rem 0.85rem',
                                    border: isSelected 
                                      ? '1.5px solid var(--color-primary)' 
                                      : conflictWarning 
                                        ? '1px solid rgba(0,0,0,0.1)' 
                                        : '1px solid var(--border-color)',
                                    background: isSelected 
                                      ? 'rgba(156, 21, 25, 0.08)' 
                                      : conflictWarning
                                        ? 'rgba(0,0,0,0.1)'
                                        : 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px',
                                    cursor: isEditable ? 'pointer' : 'default',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onClick={() => toggleDish(dish.id)}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? '#fff' : 'var(--text-primary)', lineHeight: '1.25' }}>
                                      {dish.name}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <span>{companyProfile.currency} {dish.price}</span>
                                      {dish.dietary && dish.dietary[0] && (
                                        <span style={{ opacity: 0.7 }}>• {dish.dietary[0]}</span>
                                      )}
                                      {getHistoricalPortionHint(dish) && (
                                        <span style={{ color: '#000000', fontWeight: 600, background: 'rgba(156, 21, 25, 0.08)', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>
                                          {getHistoricalPortionHint(dish)}
                                        </span>
                                      )}
                                      {conflictWarning && (
                                        <span style={{ color: '#000000', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                          {conflictWarning}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                      <CheckCircle size={16} />
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* No dishes match search */}
              {displayedCategories.every(cat => !dishes.some(d => d.category === cat && (!dishSearchTerm || d.name.toLowerCase().includes(dishSearchTerm.toLowerCase())))) && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No dishes found matching "{dishSearchTerm}".
                </div>
              )}

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <HelpCircle size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>Please select an Event sub-function instance from the sidebar to plan menu courses and apply Sri Mayyia event archetypes & dietary directives.</p>
            </div>
          )}
        </div>

      {/* Indian Style Occasion Menu PDF Selector Modal */}
      {isMenuPdfModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '620px', width: '92%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Download Indian Occasion Menu PDF</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Select a traditional Sri Mayyia occasion design template</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsMenuPdfModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {[
                {
                  id: 'baleyele',
                  title: 'Royal Baleyele Seated Banquet',
                  subtitle: 'Traditional Udupi/Mysuru Plantain Leaf Feast',
                  auspicious: '|| Shree Ganeshaya Namah ||',
                  badge: 'Plantain Leaf Classic',
                  color: '#9C1519'
                },
                {
                  id: 'wedding',
                  title: 'Grand Wedding & Sangeet Gala',
                  subtitle: 'Regal Golden Ornate Ceremonial Banquet',
                  auspicious: '|| Shree Lakshmi Venkateshwara ||',
                  badge: 'Royal Wedding',
                  color: '#D2AC67'
                },
                {
                  id: 'pooja',
                  title: 'Sacred Pooja & Grihapravesham',
                  subtitle: 'Sattvic Udupi Prasadam & Pure Feast',
                  auspicious: '|| Sattvic Prasadam & Udupam ||',
                  badge: 'Sattvic Pure',
                  color: '#10b981'
                },
                {
                  id: 'gala',
                  title: 'Corporate Festive Grand Gala',
                  subtitle: 'Modern Fusion & Pan-Indian Gastronomy',
                  auspicious: '|| Festive Gastronomy ||',
                  badge: 'Modern Gala',
                  color: '#3b82f6'
                }
              ].map(tpl => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    style={{
                      padding: '0.9rem',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${tpl.color}` : '1px solid rgba(0,0,0,0.12)',
                      background: isSelected ? 'rgba(156, 21, 25, 0.08)' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(156,21,25,0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: tpl.color }}>{tpl.badge}</span>
                      {isSelected && <Check size={16} style={{ color: tpl.color }} />}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#000000', marginBottom: '0.2rem' }}>{tpl.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{tpl.subtitle}</div>
                    <div style={{ fontSize: '0.65rem', fontStyle: 'italic', color: '#666666' }}>{tpl.auspicious}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handlePrintMenuPdf(selectedTemplate)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Printer size={16} /> Print Menu
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleDownloadMenuPdf(selectedTemplate);
                  setIsMenuPdfModalOpen(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                <Download size={16} /> Download Menu PDF ({selectedSub?.name})
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default MenuPlanning;
