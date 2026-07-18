import React, { useState, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import logoImg from './assets/logo.png';
import Dashboard from './components/Dashboard';
import AuthSetup from './components/AuthSetup';
import EventBooking from './components/EventBooking';
import MenuPlanning from './components/MenuPlanning';
import RawMaterials from './components/RawMaterials';
import AgencyLabor from './components/AgencyLabor';
import QuotationBilling from './components/QuotationBilling';
import Reports from './components/Reports';
import Login from './components/Login';

import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Wheat,
  Users,
  Receipt,
  Settings,
  Menu,
  X,
  Lock,
  Unlock,
  ChefHat,
  BarChart3
} from 'lucide-react';

const AppContent = () => {
  const { currentRole, companyProfile, logout } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab permissions configuration
  const tabPermissions = {
    dashboard: ['Admin', 'Manager', 'Accountant', 'Agency'],
    bookings: ['Admin', 'Manager', 'Accountant'],
    menu: ['Admin', 'Manager'],
    materials: ['Admin', 'Manager', 'Accountant'],
    labor: ['Admin', 'Manager', 'Accountant', 'Agency'],
    billing: ['Admin', 'Manager', 'Accountant'],
    reports: ['Admin', 'Manager', 'Accountant'],
    setup: ['Admin']
  };

  const checkPermission = (tab) => {
    return tabPermissions[tab]?.includes(currentRole);
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', name: 'Event Booking', icon: CalendarDays },
    { id: 'menu', name: 'Menu Planning', icon: UtensilsCrossed },
    { id: 'materials', name: 'Raw Materials', icon: Wheat },
    { id: 'labor', name: 'Agency & Labour', icon: Users },
    { id: 'billing', name: 'Quotation & Billing', icon: Receipt },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3 },
    { id: 'setup', name: 'Setup & Masters', icon: Settings }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'bookings': return <EventBooking />;
      case 'menu': return <MenuPlanning />;
      case 'materials': return <RawMaterials />;
      case 'labor': return <AgencyLabor />;
      case 'billing': return <QuotationBilling />;
      case 'reports': return <Reports />;
      case 'setup': return <AuthSetup />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  if (!currentRole) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Mobile top navigation bar */}
      <div className="mobile-header">
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Menu size={24} />
        </button>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={logoImg} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span>{companyProfile.name}</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          {currentRole}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={logoImg} alt="Sri Mayyia Caterers Logo" style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '4px', background: '#FFFDD0', padding: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', lineHeight: '1.2', color: 'var(--color-primary)' }}>{companyProfile.name}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Catering Management System</span>
          </div>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginLeft: 'auto', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <ul className="sidebar-menu">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const hasAccess = checkPermission(item.id);
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <a
                  className={`menu-item-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: hasAccess ? 1 : 0.45
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </div>
                  {hasAccess ? (
                    isActive && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                  ) : (
                    <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Sidebar Footer with Logout Button */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <ChefHat size={16} className="accent-text" />
              <span style={{ color: 'var(--text-secondary)' }}>Logged as: <strong style={{ color: 'var(--text-primary)' }}>{currentRole}</strong></span>
            </div>
            <button
              className="btn btn-secondary btn-small"
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                width: '100%',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                fontWeight: 600,
                background: 'rgba(128, 0, 32, 0.05)'
              }}
            >
              Logout / Close Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {renderActiveComponent()}
      </div>

      {/* Bottom Tab Bar (Mobile) */}
      <div className="bottom-tab-bar">
        {navigationItems.filter(i => checkPermission(i.id)).slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.4rem',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                minWidth: '48px',
                minHeight: '48px',
                cursor: 'pointer'
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 500, letterSpacing: '-0.02em' }}>
                {item.name.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
