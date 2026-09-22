import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

const Venues = () => {
  const {
    venues,
    addVenue,
    updateVenue,
    deleteVenue,
    currentRole,
    currentUser,
    users,
    formatCurrency
  } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCapacity, setFilterCapacity] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    venueCode: '',
    capacity: 300,
    price: 100000,
    address: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    type: 'Banquet Hall',
    notes: '',
    active: true,
    assignedSalesPerson: ''
  });

  const [validationError, setValidationError] = useState('');

  // Determine Sales Person isolation:
  // Admin sees all venues.
  // Sales Executive sees venues assigned to their username, OR unassigned venues ('').
  // They cannot see venues assigned to other sales executives.
  const isSalesPerson = currentRole === 'Sales Executive';
  const isAdmin = currentRole === 'Admin';

  const visibleVenues = useMemo(() => {
    return venues.filter(venue => {
      if (isAdmin) return true;
      if (isSalesPerson) {
        const assigned = (venue.assignedSalesPerson || '').trim().toLowerCase();
        const current = (currentUser || '').trim().toLowerCase();
        return !assigned || assigned === current || assigned === 'all' || assigned === 'open';
      }
      return true;
    });
  }, [venues, isAdmin, isSalesPerson, currentUser]);

  const filteredVenues = useMemo(() => {
    return visibleVenues.filter(venue => {
      const matchesSearch =
        (venue.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (venue.venueCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (venue.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (venue.address || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'ALL' || venue.type === filterType;

      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && venue.active !== false) ||
        (filterStatus === 'INACTIVE' && venue.active === false);

      let matchesCapacity = true;
      const cap = Number(venue.capacity) || 0;
      if (filterCapacity === 'SMALL') matchesCapacity = cap < 200;
      else if (filterCapacity === 'MEDIUM') matchesCapacity = cap >= 200 && cap <= 500;
      else if (filterCapacity === 'LARGE') matchesCapacity = cap > 500;

      return matchesSearch && matchesType && matchesStatus && matchesCapacity;
    });
  }, [visibleVenues, searchTerm, filterType, filterStatus, filterCapacity]);

  const salesStaff = useMemo(() => {
    return users.filter(u => u.role === 'Sales Executive' || u.role === 'Admin');
  }, [users]);

  const handleOpenAdd = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      venueCode: 'VN-' + Date.now().toString().slice(-4),
      capacity: 300,
      price: 100000,
      address: '',
      contactPerson: '',
      contactNumber: '',
      email: '',
      type: 'Banquet Hall',
      notes: '',
      active: true,
      assignedSalesPerson: isSalesPerson ? currentUser : ''
    });
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name || '',
      venueCode: venue.venueCode || venue.id || '',
      capacity: venue.capacity || 0,
      price: venue.price || 0,
      address: venue.address || '',
      contactPerson: venue.contactPerson || '',
      contactNumber: venue.contactNumber || '',
      email: venue.email || '',
      type: venue.type || 'Banquet Hall',
      notes: venue.notes || '',
      active: venue.active !== false,
      assignedSalesPerson: venue.assignedSalesPerson || ''
    });
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('Venue Name is required.');
      return;
    }
    if (!formData.address.trim()) {
      setValidationError('Venue Address is required.');
      return;
    }
    if (Number(formData.capacity) <= 0) {
      setValidationError('Valid guest capacity is required.');
      return;
    }

    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      price: Number(formData.price) || 0,
      assignedSalesPerson: isSalesPerson ? (editingVenue ? formData.assignedSalesPerson : currentUser) : formData.assignedSalesPerson
    };

    if (editingVenue) {
      await updateVenue({ ...editingVenue, ...payload });
    } else {
      await addVenue(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm('Are you sure you want to delete venue "' + name + '"?')) {
      await deleteVenue(id);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 style={{ color: 'var(--brand-primary, #9C1519)' }} />
            Venues & Banquet Halls
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isSalesPerson
              ? 'Showing venues assigned to ' + (currentUser || 'you') + ' and open banquet halls.'
              : 'Complete directory of banquets, lawns, and convention halls.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--brand-primary, #9C1519)',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(156, 21, 25, 0.2)'
          }}
        >
          <Plus size={18} />
          Add Venue
        </button>
      </div>

      {/* Control Bar: Search & Filters */}
      <div style={{
        background: 'var(--bg-surface, #fff)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #E5E7EB)',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by venue name, code, contact or address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #D1D5DB)',
              background: 'var(--bg-input, #F9FAFB)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #D1D5DB)',
              background: 'var(--bg-input, #fff)',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="Banquet Hall">Banquet Hall</option>
            <option value="Grand Ballroom">Grand Ballroom</option>
            <option value="Open Air Pavilion">Open Air Pavilion</option>
            <option value="Lawn & Terrace">Lawn & Terrace</option>
            <option value="Compact Hall">Compact Hall</option>
            <option value="Convention Center">Convention Center</option>
          </select>

          <select
            value={filterCapacity}
            onChange={e => setFilterCapacity(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #D1D5DB)',
              background: 'var(--bg-input, #fff)',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          >
            <option value="ALL">All Capacities</option>
            <option value="SMALL">&lt; 200 Pax</option>
            <option value="MEDIUM">200 - 500 Pax</option>
            <option value="LARGE">&gt; 500 Pax</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #D1D5DB)',
              background: 'var(--bg-input, #fff)',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Venues Grid / Cards */}
      {filteredVenues.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 16px',
          background: 'var(--bg-surface, #fff)',
          borderRadius: '12px',
          border: '1px dashed var(--border-color, #D1D5DB)'
        }}>
          <Building2 size={48} style={{ color: '#9CA3AF', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Venues Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 16px' }}>
            {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL' || filterCapacity !== 'ALL'
              ? 'Try adjusting your search criteria or filters.'
              : isSalesPerson
                ? 'No venues are currently assigned to you or open for booking.'
                : 'Click "Add Venue" above to register your first banquet hall.'}
          </p>
          <button
            onClick={handleOpenAdd}
            style={{
              background: 'var(--brand-primary, #9C1519)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Add New Venue
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {filteredVenues.map(venue => {
            const isAssignedToMe = isSalesPerson && venue.assignedSalesPerson?.toLowerCase() === currentUser?.toLowerCase();

            return (
              <div
                key={venue.id || venue._id}
                style={{
                  background: 'var(--bg-surface, #fff)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #E5E7EB)',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {/* Card Top */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {venue.name}
                        </h2>
                        {venue.active === false ? (
                          <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                            Inactive
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                            Active
                          </span>
                        )}
                      </div>
                      {venue.venueCode && (
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', fontWeight: '500' }}>
                          Code: {venue.venueCode}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEdit(venue)}
                        title="Edit Venue"
                        style={{
                          background: 'none',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          color: '#4B5563'
                        }}
                      >
                        <Edit2 size={15} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(venue.id || venue._id, venue.name)}
                          title="Delete Venue"
                          style={{
                            background: 'none',
                            border: '1px solid #FEE2E2',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#DC2626'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Badge Row */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '12px',
                      background: 'rgba(156, 21, 25, 0.08)',
                      color: 'var(--brand-primary, #9C1519)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      {venue.type || 'Banquet Hall'}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Users size={12} /> {venue.capacity} Pax
                    </span>
                    <span style={{
                      fontSize: '12px',
                      background: '#FEF3C7',
                      color: '#92400E',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      Rent: {formatCurrency(venue.price || 0)}
                    </span>
                  </div>

                  {/* Details List */}
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#9CA3AF' }} />
                      <span style={{ color: 'var(--text-primary)' }}>{venue.address || 'Address not provided'}</span>
                    </div>

                    {venue.contactPerson && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={15} style={{ flexShrink: 0, color: '#9CA3AF' }} />
                        <span>Contact: <strong>{venue.contactPerson}</strong></span>
                      </div>
                    )}

                    {venue.contactNumber && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={15} style={{ flexShrink: 0, color: '#9CA3AF' }} />
                        <a href={'tel:' + venue.contactNumber} style={{ color: 'var(--brand-primary, #9C1519)', textDecoration: 'none' }}>
                          {venue.contactNumber}
                        </a>
                      </div>
                    )}

                    {venue.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={15} style={{ flexShrink: 0, color: '#9CA3AF' }} />
                        <a href={'mailto:' + venue.email} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                          {venue.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {venue.notes && (
                    <div style={{
                      background: 'var(--bg-input, #F9FAFB)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#4B5563',
                      fontStyle: 'italic',
                      marginBottom: '12px'
                    }}>
                      &ldquo;{venue.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Card Footer: Salesperson badge */}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color, #F3F4F6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#6B7280' }}>
                    Assigned: {venue.assignedSalesPerson ? (
                      <span style={{
                        fontWeight: '600',
                        color: isAssignedToMe ? '#059669' : '#374151'
                      }}>
                        {venue.assignedSalesPerson} {isAssignedToMe && '(You)'}
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Open / Unassigned</span>
                    )}
                  </div>

                  {isSalesPerson && (
                    <span style={{
                      fontSize: '11px',
                      color: isAssignedToMe ? '#059669' : '#6B7280',
                      background: isAssignedToMe ? '#ECFDF5' : '#F3F4F6',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {isAssignedToMe ? 'My Venue' : 'Open Venue'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-surface, #fff)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color, #E5E7EB)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color, #E5E7EB)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-surface, #fff)',
              zIndex: 10
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {editingVenue ? 'Edit Venue / Banquet' : 'Add New Venue / Banquet'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {validationError && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #F87171',
                  color: '#991B1B',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldAlert size={16} />
                  {validationError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Grand Ballroom"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Venue Code / ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VN-RGB-01"
                    value={formData.venueCode}
                    onChange={e => setFormData({ ...formData, venueCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Venue Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Banquet Hall">Banquet Hall</option>
                    <option value="Grand Ballroom">Grand Ballroom</option>
                    <option value="Open Air Pavilion">Open Air Pavilion</option>
                    <option value="Lawn & Terrace">Lawn & Terrace</option>
                    <option value="Compact Hall">Compact Hall</option>
                    <option value="Convention Center">Convention Center</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Capacity (Pax) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Rental Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Full Address *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Street, Landmark, City, Pincode"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #D1D5DB)',
                    background: 'var(--bg-input, #fff)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Arvind Saxena"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98XXX XXXXX"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="banquet@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #D1D5DB)',
                      background: 'var(--bg-input, #fff)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Assigned Sales Person
                  </label>
                  {isAdmin ? (
                    <select
                      value={formData.assignedSalesPerson}
                      onChange={e => setFormData({ ...formData, assignedSalesPerson: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #D1D5DB)',
                        background: 'var(--bg-input, #fff)',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Open / All Salespersons</option>
                      {salesStaff.map(s => (
                        <option key={s.id} value={s.id}>{s.id} ({s.role})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={formData.assignedSalesPerson || currentUser || 'Open'}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #D1D5DB)',
                        background: '#F3F4F6',
                        color: '#6B7280',
                        fontSize: '14px'
                      }}
                    />
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Venue Notes / Special Features
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Lawn area available, generator backup included, valet parking"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #D1D5DB)',
                    background: 'var(--bg-input, #fff)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="venueActive"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary, #9C1519)' }}
                />
                <label htmlFor="venueActive" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', cursor: 'pointer' }}>
                  Venue is Active and available for bookings
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--brand-primary, #9C1519)',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingVenue ? 'Save Changes' : 'Create Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Venues;
