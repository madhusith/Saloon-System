import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext.jsx';
import api from '../../services/api.js';

export const StaffUnavailability = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Selection state for Admin
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(user?.id || '');

  // Unavailability list state
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [unavailabilityType, setUnavailabilityType] = useState('LEAVE');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch staff list for dropdown (if Admin)
  const fetchStaffList = async () => {
    try {
      const res = await api.get('/staff');
      if (res.data && res.data.success) {
        setStaffList(res.data.data.staff);
        if (!selectedStaffId && res.data.data.staff.length > 0) {
          setSelectedStaffId(res.data.data.staff[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  // Fetch blocked slots for selected staff member
  const fetchUnavailability = async (staffId) => {
    if (!staffId) return;
    setLoading(true);
    try {
      const res = await api.get(`/staff/${staffId}/unavailability`);
      if (res.data && res.data.success) {
        setSlots(res.data.data.unavailability || []);
      }
    } catch (err) {
      console.error('Failed to load unavailability slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStaffList();
    }
  }, []);

  useEffect(() => {
    fetchUnavailability(selectedStaffId);
  }, [selectedStaffId]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setActionLoading(true);

    const startDatetime = `${startDate}T${startTime}:00`;
    const endDatetime = `${endDate}T${endTime}:00`;

    if (new Date(startDatetime) >= new Date(endDatetime)) {
      setFormError('End date/time must be after the start date/time.');
      setActionLoading(false);
      return;
    }

    try {
      const res = await api.post(`/staff/${selectedStaffId}/unavailability`, {
        unavailabilityType,
        startDatetime,
        endDatetime,
        description
      });
      if (res.data && res.data.success) {
        setFormSuccess('Block/leave slot created successfully.');
        setDescription('');
        setStartDate('');
        setEndDate('');
        fetchUnavailability(selectedStaffId);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add unavailability block.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to remove this blocked period?')) return;

    try {
      const res = await api.delete(`/staff/${selectedStaffId}/unavailability/${slotId}`);
      if (res.data && res.data.success) {
        fetchUnavailability(selectedStaffId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove block.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Stylist Unavailability & Leaves</h1>
        <p className="mt-1 text-sm text-slate-500">Block slots for leaves, breaks, meetings, and off-duty times.</p>
      </div>

      {/* Admin Dropdown */}
      {isAdmin && staffList.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center space-x-4">
          <label className="text-sm font-semibold text-slate-700">Select Stylist:</label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
          >
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.full_name} ({staff.specialization || 'General'})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Unavailability Block Panel */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-950 mb-4">Add Unavailability Block</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-100">{formError}</div>
            )}
            {formSuccess && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-100">{formSuccess}</div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Type</label>
              <select
                value={unavailabilityType}
                onChange={(e) => setUnavailabilityType(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              >
                <option value="LEAVE">Leave / Day Off</option>
                <option value="BREAK">Break</option>
                <option value="MEETING">Meeting</option>
                <option value="PERSONAL">Personal Time</option>
                <option value="BLOCKED">Admin Block</option>
              </select>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <span className="block text-xs font-bold text-pink-600 uppercase tracking-wider">Start Date & Time</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <span className="block text-xs font-bold text-pink-600 uppercase tracking-wider">End Date & Time</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Notes / Description</label>
              <textarea
                rows="2"
                placeholder="Reason or details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex w-full justify-center rounded-lg bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm disabled:opacity-50 transition"
            >
              {actionLoading ? 'Saving Block...' : 'Block Period'}
            </button>
          </form>
        </div>

        {/* Unavailability List Panel */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950 mb-4">Current Blocked Windows</h3>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center space-y-2 border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">No blocked slots</p>
              <p className="text-xs text-slate-400">Add a block using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const start = new Date(slot.start_datetime);
                const end = new Date(slot.end_datetime);
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-pink-100 hover:bg-slate-50 transition-all duration-200"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xxs font-bold uppercase tracking-wider border ${
                          slot.unavailability_type === 'LEAVE' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          slot.unavailability_type === 'BREAK' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          slot.unavailability_type === 'MEETING' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {slot.unavailability_type}
                        </span>
                        {slot.description && (
                          <span className="text-xs font-semibold text-slate-700">{slot.description}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">
                        <strong>Start:</strong> {start.toLocaleString()}
                        <br />
                        <strong>End:</strong> {end.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="rounded p-1.5 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition"
                      title="Delete Block"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffUnavailability;
