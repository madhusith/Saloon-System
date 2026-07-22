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
    </div>
  );
};
export default QueueBoard;
