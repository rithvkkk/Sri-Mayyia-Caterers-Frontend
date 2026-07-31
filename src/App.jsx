import React, { useState, useEffect, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import logoImg from './assets/logo.png';
import Dashboard from './components/Dashboard';
import AuthSetup from './components/AuthSetup';
import EventBooking from './components/EventBooking';
import MenuPlanning from './components/MenuPlanning';
import VendorManagement from './components/VendorManagement';
import ProvisionInventory from './components/ProvisionInventory';
import StorageInventory from './components/StorageInventory';
import AgencyLabor from './components/AgencyLabor';
import QuotationBilling from './components/QuotationBilling';
import Reports from './components/Reports';
import Login from './components/Login';

import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Store,
  Boxes,
  Package,
  Users,
  Receipt,
  Settings,
  Menu,
  X,
  Lock,
  Unlock,
  ChefHat,
  BarChart3,
  RefreshCw,
  Database
} from 'lucide-react';

const AppContent = () => {
  const { currentRole, companyProfile, logout, syncStatus, lastSyncedAt, triggerManualSync } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Splash screen fade-out state
  const [showSplash, setShowSplash] = useState(syncStatus !== 'connected');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (syncStatus === 'connected') {
      if (showSplash && !isFadingOut) {
        setIsFadingOut(true);
        const timer = setTimeout(() => {
          setShowSplash(false);
          setIsFadingOut(false);
        }, 700);
        return () => clearTimeout(timer);
      }
    } else {
      setShowSplash(true);
      setIsFadingOut(false);
    }
  }, [syncStatus]);

  // Tab permissions configuration
  const tabPermissions = {
    dashboard: ['Admin', 'Manager', 'Accountant', 'Agency'],
    bookings: ['Admin', 'Manager', 'Accountant'],
    menu: ['Admin', 'Manager'],
    vendors: ['Admin', 'Manager', 'Accountant'],
    provisions: ['Admin', 'Manager', 'Accountant', 'Chef'],
    storage: ['Admin', 'Manager', 'Accountant', 'Chef'],
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
    { id: 'vendors', name: 'Vendor Management', icon: Store },
    { id: 'provisions', name: 'Provision Inventory', icon: Boxes },
    { id: 'storage', name: 'Storage Inventory', icon: Package },
    { id: 'labor', name: 'Labour Management', icon: Users },
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
      case 'vendors': return <VendorManagement />;
      case 'provisions': return <ProvisionInventory />;
      case 'storage': return <StorageInventory />;
      case 'labor': return <AgencyLabor />;
      case 'billing': return <QuotationBilling />;
      case 'reports': return <Reports />;
      case 'setup': return <AuthSetup />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  // 1. Render "Server Connecting to Cloud" screen immediately when website opens, until MongoDB connects
  if (showSplash) {
    return (
      <div className={isFadingOut ? 'fade-out-screen' : ''} style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFFDF9 0%, #F5E6D3 100%)',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div className="glass-card" style={{
          maxWidth: '520px',
          width: '100%',
          padding: '3rem 2rem',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(128, 0, 32, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          border: '1px solid rgba(128, 0, 32, 0.15)'
        }}>
          <img
            src={logoImg}
            alt="Logo"
            className={isFadingOut ? 'logo-success-anim' : ''}
            style={{
              width: '85px',
              height: '85px',
              objectFit: 'contain',
              borderRadius: '16px',
              background: '#FFFDD0',
              padding: '6px',
              boxShadow: '0 8px 20px rgba(128, 0, 32, 0.15)',
              transition: 'all 0.4s ease'
            }}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <h2 style={{ color: 'var(--color-primary)', fontSize: '1.65rem', fontWeight: 800 }}>{companyProfile.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Catering Management System</p>
          </div>

          {/* Animated Database Cloud Ring */}
          <div style={{
            position: 'relative',
            width: '90px',
            height: '90px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0.5rem 0'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: isFadingOut ? '4px solid #10b981' : '4px solid rgba(128, 0, 32, 0.12)',
              borderTopColor: isFadingOut ? '#10b981' : 'var(--color-primary)',
              animation: isFadingOut ? 'none' : 'spin 1.2s linear infinite',
              boxShadow: isFadingOut ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none'
            }} />
            <Database size={42} style={{ color: isFadingOut ? '#10b981' : 'var(--color-primary)', transition: 'color 0.3s ease' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isFadingOut ? '🎉 MongoDB Connected! Entering App...' : 'Server Connecting to Cloud...'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '420px' }}>
              {isFadingOut ? 'Database sync complete. Launching Sri Mayyia Caterers Workspace...' : 'Establishing secure live connection. Please wait while database initializes...'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={triggerManualSync}
              disabled={isFadingOut}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
            >
              <RefreshCw size={18} className={syncStatus === 'syncing' ? 'spin' : ''} />
              Retry Connection Now
            </button>
            <button
              className="btn btn-secondary"
              onClick={logout}
              disabled={isFadingOut}
              style={{ padding: '0.85rem 1.25rem', color: 'var(--color-primary)' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Once MongoDB is connected, render Login (if unauthenticated) or App Workspace (if authenticated)
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

        {/* Sidebar Footer with Logout & Live MongoDB Sync */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* MongoDB Live Sync Indicator */}
            <div style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              background: syncStatus === 'connected' ? 'rgba(16, 185, 129, 0.08)' : (syncStatus === 'syncing' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)'),
              border: `1px solid ${syncStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : (syncStatus === 'syncing' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: syncStatus === 'connected' ? '#10b981' : (syncStatus === 'syncing' ? '#f59e0b' : '#ef4444'),
                    boxShadow: syncStatus === 'connected' ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none'
                  }} />
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: syncStatus === 'connected' ? '#10b981' : (syncStatus === 'syncing' ? '#d97706' : '#ef4444') }}>
                    {syncStatus === 'connected' ? 'MongoDB Atlas Sync' : (syncStatus === 'syncing' ? 'Connecting DB...' : 'Offline Cache Mode')}
                  </span>
                </div>
                <button
                  onClick={triggerManualSync}
                  title="Click to check backend connection & sync MongoDB now"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: syncStatus === 'connected' ? '#10b981' : 'var(--color-primary)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin' : ''} />
                </button>
              </div>

              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                {syncStatus === 'connected' ? (
                  <span>Synced at: {lastSyncedAt || 'Just now'}</span>
                ) : (
                  <span>Local Storage Active</span>
                )}
                <span style={{ cursor: 'help' }} title="If backend server is running on port 5000 or Vercel, click refresh icon to establish live connection.">
                  {syncStatus === 'connected' ? '🟢 Live 2-Way' : '⚡ Offline'}
                </span>
              </div>
            </div>

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
