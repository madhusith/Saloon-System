import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { initiateSocketConnection, disconnectSocket, subscribeToEvent, unsubscribeFromEvent } from '../../services/socket.js';

export const QueueBoard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Walk-In states
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInTab, setWalkInTab] = useState('EXISTING'); // EXISTING or REGISTER
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Registration Form
  const [regForm, setRegForm] = useState({ fullName: '', email: '', phone: '' });
  
  // Booking Form
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('0');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Fetch data on modal open
  const handleOpenWalkInModal = async () => {
    setShowWalkInModal(true);
    setModalError('');
    setSelectedServices([]);
    setSelectedSlot('');
    setSelectedCustomerId('');
    setRegForm({ fullName: '', email: '', phone: '' });
    setSelectedStaffId('0');
    setBookingDate(new Date().toISOString().split('T')[0]);
    
    try {
      // Fetch services
      const sRes = await api.get('/services', { params: { status: 'ACTIVE', limit: 100 } });
      if (sRes.data && sRes.data.success) {
        setServices(sRes.data.data.services);
      }
      
      // Fetch staff
      const stRes = await api.get('/staff');
      if (stRes.data && stRes.data.success) {
        setStaffs(stRes.data.data.staff || stRes.data.data);
      }

      // Fetch customers
      const cRes = await api.get('/users', { params: { role: 'CUSTOMER', limit: 500 } });
      if (cRes.data && cRes.data.success) {
        setCustomers(cRes.data.data.users);
      }
    } catch (err) {
      console.error(err);
      setModalError('Failed to load initial walk-in wizard data.');
    }
  };

  // Fetch slots whenever date, staff, or selected services change
  useEffect(() => {
    if (!showWalkInModal || selectedServices.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const fetchWalkInSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await api.get('/appointments/slots', {
          params: {
            serviceIds: selectedServices.join(','),
            staffId: selectedStaffId,
            date: bookingDate
          }
        });
        if (res.data && res.data.success) {
          setAvailableSlots(res.data.data.slots);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchWalkInSlots();
  }, [showWalkInModal, selectedServices, selectedStaffId, bookingDate]);

  const handleServiceToggle = (id) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setSelectedSlot('');
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmittingWalkIn(true);

    try {
      let customerId = selectedCustomerId;

      // 1. If REGISTER tab, create customer account first
      if (walkInTab === 'REGISTER') {
        if (!regForm.fullName || !regForm.email) {
          throw new Error('Customer Name and Email are required.');
        }
        const createRes = await api.post('/users', {
          fullName: regForm.fullName,
          email: regForm.email,
          phone: regForm.phone,
          role: 'CUSTOMER'
        });
        if (createRes.data && createRes.data.success) {
          customerId = createRes.data.data.user.id;
        } else {
          throw new Error('Failed to register customer account.');
        }
      }

      if (!customerId) {
        throw new Error('Please select or register a customer.');
      }
      if (selectedServices.length === 0) {
        throw new Error('Please select at least one service.');
      }
      if (!selectedSlot) {
        throw new Error('Please select a time slot.');
      }

      // 2. Book appointment (automatic WAITING check-in happens on server if today)
      const bookRes = await api.post('/appointments', {
        customerId,
        serviceIds: selectedServices,
        staffId: Number(selectedStaffId),
        appointmentDate: bookingDate,
        startTime: selectedSlot,
        notes: notes || 'Walk-in booking registered by cashier'
      });

      if (bookRes.data && bookRes.data.success) {
        setShowWalkInModal(false);
        fetchTodayAppointments();
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || err.message || 'Failed to complete walk-in booking.');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments?date=${dateFilter}&limit=100`);
      if (res.data && res.data.success) {
        setAppointments(res.data.data.appointments);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch today\'s queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();

    // Setup real-time updates via Socket.IO
    initiateSocketConnection('cashier');
    subscribeToEvent('queue:updated', fetchTodayAppointments);
    subscribeToEvent('appointment:status-changed', fetchTodayAppointments);

    return () => {
      unsubscribeFromEvent('queue:updated');
      unsubscribeFromEvent('appointment:status-changed');
      disconnectSocket();
    };
  }, [dateFilter]);

  const handleCheckIn = async (id) => {
    try {
      const res = await api.post(`/appointments/${id}/check-in`);
      if (res.data && res.data.success) {
        fetchTodayAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleNoShow = async (id) => {
    try {
      const res = await api.patch(`/appointments/${id}/status`, { status: 'NO_SHOW' });
      if (res.data && res.data.success) {
        fetchTodayAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Group appointments by status
  const confirmed = appointments.filter(appt => appt.status === 'CONFIRMED' || appt.status === 'PENDING');
  const waiting = appointments.filter(appt => appt.status === 'WAITING');
  const inProgress = appointments.filter(appt => appt.status === 'IN_PROGRESS');
  const finished = appointments.filter(appt => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status));

  const formatTime = (timeStr) => {
    return timeStr.slice(0, 5); // Format HH:MM:SS to HH:MM
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Live Queue Board</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Track customer arrivals and stylist workflows in real-time.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenWalkInModal}
            className="rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition"
          >
            + Live Walk-In Booking
          </button>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-slate-600">Select Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-pink-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          
          {/* COLUMN 1: CONFIRMED */}
          <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Confirmed / Scheduled</h3>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">{confirmed.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {confirmed.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 font-medium">No scheduled sessions</p>
              ) : (
                confirmed.map(appt => (
                  <div key={appt.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-slate-900">{appt.customer_name}</h4>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {formatTime(appt.start_time)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-pink-700">
                      {appt.services.map(s => s.name).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-medium">Stylist: {appt.staff_name}</p>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleCheckIn(appt.id)}
                        className="flex-1 rounded-lg bg-pink-700 py-1.5 text-xs font-bold text-white hover:bg-pink-600 transition"
                      >
                        Check In
                      </button>
                      <button
                        onClick={() => handleNoShow(appt.id)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
                        title="Mark No Show"
                      >
                        No-Show
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: WAITING */}
          <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700">Waiting (Checked In)</h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{waiting.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {waiting.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 font-medium">Waiting area empty</p>
              ) : (
                waiting.map(appt => (
                  <div key={appt.id} className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 shadow-sm border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-slate-900">{appt.customer_name}</h4>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        Checked In
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-pink-700">
                      {appt.services.map(s => s.name).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-medium">Stylist: {appt.staff_name}</p>
                    {appt.notes && <p className="mt-2 text-xs italic text-slate-400 truncate">"{appt.notes}"</p>}
                    
                    <button
                      onClick={() => navigate('/cashier/pos', { state: { appointment: appt } })}
                      className="mt-4 w-full rounded-lg bg-pink-700 py-1.5 text-xs font-bold text-white hover:bg-pink-600 transition"
                    >
                      Checkout / Bill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: IN PROGRESS */}
          <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-sky-700">In Progress</h3>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">{inProgress.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {inProgress.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 font-medium">No sessions in progress</p>
              ) : (
                inProgress.map(appt => (
                  <div key={appt.id} className="rounded-xl border border-sky-200 bg-sky-50/30 p-4 shadow-sm border-l-4 border-l-sky-500">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-slate-900">{appt.customer_name}</h4>
                      <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        Active
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-pink-700">
                      {appt.services.map(s => s.name).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-medium">Stylist: {appt.staff_name}</p>
                    
                    <button
                      onClick={() => navigate('/cashier/pos', { state: { appointment: appt } })}
                      className="mt-4 w-full rounded-lg bg-pink-700 py-1.5 text-xs font-bold text-white hover:bg-pink-600 transition"
                    >
                      Checkout / Bill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 4: FINISHED */}
          <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">Finished Today</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{finished.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {finished.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8 font-medium">None finished yet</p>
              ) : (
                finished.map(appt => (
                  <div key={appt.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm opacity-70">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-slate-800">{appt.customer_name}</h4>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Stylist: {appt.staff_name}</p>
                    <p className="text-[11px] font-semibold text-slate-600 mt-1 truncate">
                      {appt.services.map(s => s.name).join(', ')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Live Walk-In Booking</h3>
              <button 
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-650 border border-red-100 font-semibold font-sans">
                {modalError}
              </div>
            )}

            {/* Wizard Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setWalkInTab('EXISTING')}
                className={`flex-1 py-2 text-center text-xs font-bold transition-all border-b-2 ${
                  walkInTab === 'EXISTING' 
                    ? 'border-pink-700 text-pink-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Book for Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setWalkInTab('REGISTER')}
                className={`flex-1 py-2 text-center text-xs font-bold transition-all border-b-2 ${
                  walkInTab === 'REGISTER' 
                    ? 'border-pink-700 text-pink-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Register Customer & Book
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              {walkInTab === 'EXISTING' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                    required={walkInTab === 'EXISTING'}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Customer Name</label>
                    <input
                      type="text"
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                      required={walkInTab === 'REGISTER'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                      required={walkInTab === 'REGISTER'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="Phone (Optional)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Service Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Select Services</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(s.id)}
                        onChange={() => handleServiceToggle(s.id)}
                        className="rounded border-slate-300 text-pink-700 focus:ring-pink-500"
                      />
                      <span>{s.name} (LKR {Number(s.price).toFixed(2)})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date, Stylist & Slot Selection */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Booking Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Select Stylist</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                  >
                    <option value="0">Any Available Stylist</option>
                    {staffs.map(st => (
                      <option key={st.id} value={st.id}>{st.full_name || st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Slots Picker */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Select Time Slot</label>
                {selectedServices.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium italic">Please select at least one service to see slots.</p>
                ) : slotsLoading ? (
                  <p className="text-xs text-pink-700 font-semibold animate-pulse">Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-red-500 font-medium">No slots available for this day/stylist.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-28 overflow-y-auto p-2 border border-slate-200 rounded-lg font-mono">
                    {availableSlots.map(slot => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-1 text-center text-xs font-bold rounded-lg border transition ${
                          selectedSlot === slot 
                            ? 'bg-pink-700 border-pink-700 text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {slot.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Special Instructions / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. Walk-in customer prefers direct styling"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="rounded-lg bg-pink-700 hover:bg-pink-600 disabled:bg-slate-200 disabled:text-slate-400 px-4 py-2 text-xs font-bold text-white shadow-md transition"
                >
                  {submittingWalkIn ? 'Processing Booking...' : 'Create Live Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default QueueBoard;
