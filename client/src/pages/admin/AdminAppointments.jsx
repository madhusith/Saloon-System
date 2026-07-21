// client/src/pages/admin/AdminAppointments.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [status, setStatus] = useState('');
    const [staffId, setStaffId] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments', {
                params: {
                    date: date || undefined,
                    status: status || undefined,
                    staffId: staffId || undefined,
                    page,
                    limit
                }
            });
            if (res.data && res.data.success) {
                setAppointments(res.data.data.appointments);
                setTotal(res.data.data.meta.total);
                setTotalPages(res.data.data.meta.totalPages);
            }
        } catch (err) {
            console.error('Failed to fetch appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await api.get('/staff');
            if (res.data && res.data.success) {
                setStaffList(res.data.data.staff);
            }
        } catch (err) {
            console.error('Failed to fetch staff:', err);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [date, status, staffId, page]);

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleUpdateStatus = async (id, nextStatus, refStr) => {
        if (!window.confirm(`Update status of ${refStr} to ${nextStatus}?`)) return;

        try {
            const res = await api.patch(`/appointments/${id}/status`, { status: nextStatus });
            if (res.data && res.data.success) {
                fetchAppointments();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'CONFIRMED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'WAITING':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'IN_PROGRESS':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'COMPLETED':
                return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'CANCELLED':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'NO_SHOW':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Appointments Schedule</h1>
                <p className="mt-1 text-sm text-slate-500">Track current bookings, check-in guests, and manage stylist queues.</p>
            </div>

            {/* Filter Panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Filter Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => { setDate(e.target.value); setPage(1); }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Stylist</label>
                        <select
                            value={staffId}
                            onChange={(e) => { setStaffId(e.target.value); setPage(1); }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        >
                            <option value="">All Stylists</option>
                            {staffList.map((s) => (
                                <option key={s.id} value={s.id}>{s.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Status</label>
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="WAITING">Waiting (Checked In)</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="NO_SHOW">No Show</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Appointments List Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center space-y-2">
                        <p className="text-base font-medium text-slate-500">No appointments found.</p>
                        <p className="text-xs text-slate-400">There are no bookings registered for these filter criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Customer Details</th>
                                    <th className="px-6 py-4">Services Booked</th>
                                    <th className="px-6 py-4">Stylist</th>
                                    <th className="px-6 py-4">Time Slot</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {appointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold tracking-wider text-slate-900">{appt.booking_reference}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-950">{appt.customer_name}</div>
                                            <div className="text-xs text-slate-500">{appt.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{appt.services.map((s) => s.name).join(', ')}</div>
                                            <div className="text-xs text-pink-700 font-bold">LKR {Number(appt.total_price).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">{appt.staff_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{appt.appointment_date}</div>
                                            <div className="text-xs text-slate-500 font-semibold">{appt.start_time.substring(0, 5)} - {appt.end_time.substring(0, 5)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase tracking-wider border ${getStatusBadgeClass(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {appt.status === 'CONFIRMED' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(appt.id, 'WAITING', appt.booking_reference)}
                                                        className="rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                                                    >
                                                        Check In
                                                    </button>
                                                )}
                                                {appt.status === 'WAITING' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS', appt.booking_reference)}
                                                        className="rounded-lg bg-indigo-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 shadow-sm"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                                {appt.status === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(appt.id, 'COMPLETED', appt.booking_reference)}
                                                        className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, 'CANCELLED', appt.booking_reference)}
                                                            className="rounded p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                                            title="Cancel Appointment"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, 'NO_SHOW', appt.booking_reference)}
                                                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                            title="Mark No Show"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m9 0V21a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 014.5 21V9m9 0h-9" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                        <span className="text-xs text-slate-500">Showing page {page} of {totalPages} ({total} total bookings)</span>
                        <div className="flex space-x-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAppointments;
