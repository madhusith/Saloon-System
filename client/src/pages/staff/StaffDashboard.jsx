import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext.jsx';
import api from '../../services/api.js';
import { initiateSocketConnection, disconnectSocket, subscribeToEvent, unsubscribeFromEvent } from '../../services/socket.js';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      // Get all appointments for this staff member today
      const res = await api.get(`/appointments?staffId=${user.id}&date=${todayStr}&limit=100`);
      if (res.data && res.data.success) {
        setAppointments(res.data.data.appointments);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments for today.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();

    // Sockets live updates
    initiateSocketConnection('staff');
    subscribeToEvent('queue:updated', fetchTodayAppointments);
    subscribeToEvent('appointment:status-changed', fetchTodayAppointments);

    return () => {
      unsubscribeFromEvent('queue:updated');
      unsubscribeFromEvent('appointment:status-changed');
      disconnectSocket();
    };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      if (res.data && res.data.success) {
        fetchTodayAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const formatTime = (timeStr) => {
    return timeStr.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Hi, {user?.fullName}!</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Manage your daily client workflow sessions.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Queue timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">My Schedule Sessions Today</h2>
          
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-slate-400 font-semibold py-8 text-center">
              You do not have any appointments assigned for today.
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`rounded-xl border p-5 shadow-sm transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    appt.status === 'WAITING' ? 'border-amber-200 bg-amber-50/20' :
                    appt.status === 'IN_PROGRESS' ? 'border-sky-200 bg-sky-50/20' :
                    appt.status === 'COMPLETED' ? 'border-slate-100 bg-slate-50/30 opacity-70' :
                    'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        appt.status === 'WAITING' ? 'bg-amber-100 text-amber-800' :
                        appt.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-800' :
                        appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{appt.customer_name}</h3>
                    <p className="text-xs font-semibold text-pink-700">
                      Services: {appt.services.map(s => s.name).join(', ')}
                    </p>
                    {appt.notes && (
                      <p className="text-xs text-slate-400 italic mt-1">"{appt.notes}"</p>
                    )}
                  </div>

                  {/* Actions depending on status */}
                  <div className="flex space-x-2 w-full sm:w-auto">
                    {appt.status === 'WAITING' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'IN_PROGRESS')}
                        className="w-full sm:w-auto rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                      >
                        Start Service
                      </button>
                    )}
                    {appt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'COMPLETED')}
                        className="w-full sm:w-auto rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                      >
                        Complete Service
                      </button>
                    )}
                    {appt.status === 'CONFIRMED' && (
                      <span className="text-xs font-semibold text-slate-400">Waiting for check-in</span>
                    )}
                    {appt.status === 'COMPLETED' && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">✓ Completed</span>
                    )}
                    {['CANCELLED', 'NO_SHOW'].includes(appt.status) && (
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md">𐄂 {appt.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">Workstation Info</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Your clients will show up here as soon as they are checked in by the cashier. 
          </p>
          <div className="rounded-lg bg-slate-50 p-4 text-xs font-semibold text-slate-600 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span><strong>Waiting:</strong> Client has arrived at the salon and is checked in.</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-sky-500"></span>
              <span><strong>In Progress:</strong> You have started the haircut/treatment session.</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span><strong>Completed:</strong> Session finished; ready for checkout billing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StaffDashboard;
