import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext.jsx';
import api from '../../services/api.js';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const StaffSchedules = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Selection state for Admin
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(user?.id || '');

  // Schedule state
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch staff list for dropdown (if Admin)
  const fetchStaffList = async () => {
    try {
      const res = await api.get('/staff');
      if (res.data && res.data.success) {
        setStaffList(res.data.data.staff);
        // Default select first staff if not set
        if (!selectedStaffId && res.data.data.staff.length > 0) {
          setSelectedStaffId(res.data.data.staff[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  // Fetch schedule for the selected staff member
  const fetchSchedule = async (staffId) => {
    if (!staffId) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.get(`/staff/${staffId}/schedule`);
      if (res.data && res.data.success) {
        // Map raw schedule rows to active state items
        const rawItems = res.data.data.schedule || [];
        const mappedSchedule = DAYS_OF_WEEK.map((day) => {
          const match = rawItems.find((r) => r.day_of_week === day);
          return {
            dayOfWeek: day,
            isWorking: match ? !!match.is_working : true,
            startTime: match && match.start_time ? match.start_time.substring(0, 5) : '09:00',
            endTime: match && match.end_time ? match.end_time.substring(0, 5) : '18:00'
          };
        });
        setSchedule(mappedSchedule);
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setErrorMsg('Failed to load schedule. Make sure default schedules exist.');
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
    fetchSchedule(selectedStaffId);
  }, [selectedStaffId]);

  const handleCheckboxChange = (index) => {
    const updated = [...schedule];
    updated[index].isWorking = !updated[index].isWorking;
    setSchedule(updated);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    // Format schedule items for backend validator
    const formattedItems = schedule.map((item) => ({
      dayOfWeek: item.dayOfWeek,
      isWorking: item.isWorking,
      startTime: item.isWorking ? `${item.startTime}:00` : null,
      endTime: item.isWorking ? `${item.endTime}:00` : null
    }));

    try {
      const res = await api.put(`/staff/${selectedStaffId}/schedule`, {
        schedule: formattedItems
      });
      if (res.data && res.data.success) {
        setSuccessMsg('Weekly schedule saved successfully.');
        fetchSchedule(selectedStaffId);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Weekly Working Schedules</h1>
        <p className="mt-1 text-sm text-slate-500">Configure weekly hours and days of operation.</p>
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

      {/* Schedule Form */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="divide-y divide-slate-100">
            <div className="p-6 space-y-4">
              {successMsg && (
                <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100">{successMsg}</div>
              )}
              {errorMsg && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">{errorMsg}</div>
              )}

              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div
                    key={item.dayOfWeek}
                    className={`flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      item.isWorking
                        ? 'bg-white border-slate-200 hover:border-pink-200'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {/* Day & Checkbox */}
                    <div className="flex items-center space-x-3 w-48">
                      <input
                        type="checkbox"
                        checked={item.isWorking}
                        onChange={() => handleCheckboxChange(index)}
                        className="h-5 w-5 rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                      <span className="font-bold text-sm tracking-wide text-slate-800 uppercase">{item.dayOfWeek}</span>
                    </div>

                    {/* Time selection */}
                    {item.isWorking ? (
                      <div className="flex items-center space-x-3">
                        <input
                          type="time"
                          required
                          value={item.startTime}
                          onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none bg-white text-slate-900"
                        />
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">to</span>
                        <input
                          type="time"
                          required
                          value={item.endTime}
                          onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none bg-white text-slate-900"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 border border-slate-200 rounded px-2.5 py-1">OFF</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex rounded-lg bg-pink-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm disabled:opacity-50 transition"
              >
                {saving ? 'Saving schedule...' : 'Save Weekly Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StaffSchedules;
