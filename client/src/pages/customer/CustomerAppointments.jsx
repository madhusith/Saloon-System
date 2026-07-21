// client/src/pages/customer/CustomerAppointments.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

export const CustomerAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments', {
                params: {
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
            console.error('Failed to load appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [page]);

    const handleCancelAppointment = async (id, refStr, dateStr, timeStr) => {
        // Check 24-hour limit on client side too
        const apptDatetime = new Date(`${dateStr}T${timeStr}`);
        const hoursDiff = (apptDatetime - new Date()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            alert('Appointments can only be cancelled at least 24 hours in advance. Please call the salon directly.');
            return;
        }

        if (!window.confirm(`Are you sure you want to cancel appointment ${refStr}?`)) {
            return;
        }

        try {
            const res = await api.patch(`/appointments/${id}/cancel`);
            if (res.data && res.data.success) {
                alert('Appointment cancelled successfully.');
                fetchAppointments();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel appointment.');
        }
    };

    const isCancellable = (appt) => {
        if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appt.status)) {
            return false;
        }
        const apptDatetime = new Date(`${appt.appointment_date}T${appt.start_time}`);
        const hoursDiff = (apptDatetime - new Date()) / (1000 * 60 * 60);
        return hoursDiff >= 24;
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
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">My Appointments</h1>
                <p className="mt-1 text-sm text-slate-500">Track your upcoming pampering visits or review past history.</p>
            </div>

            {/* Appointment Cards / List */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center space-y-2">
                        <p className="text-base font-medium text-slate-500">No appointments found.</p>
                        <p className="text-xs text-slate-400">You haven't scheduled any pamper sessions yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {appointments.map((appt) => (
                            <div
                                key={appt.id}
                                className="p-6 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                {/* Details Column */}
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-sm font-bold tracking-wider text-slate-800">{appt.booking_reference}</span>
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase tracking-wider border ${getStatusBadgeClass(appt.status)}`}>
                                            {appt.status}
                                        </span>
                                    </div>

                                    <p className="text-sm font-bold text-slate-900">
                                        {appt.services.map((s) => s.name).join(', ')}
                                    </p>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mr-1.5 h-4 w-4 text-slate-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                            </svg>
                                            {appt.appointment_date} @ {appt.start_time.substring(0, 5)}
                                        </span>
                                        <span className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mr-1.5 h-4 w-4 text-slate-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            Stylist: {appt.staff_name}
                                        </span>
                                    </div>

                                    {appt.notes && (
                                        <p className="text-xs text-slate-400 italic">Notes: "{appt.notes}"</p>
                                    )}
                                </div>

                                {/* Price and Action Column */}
                                <div className="flex flex-row md:flex-col md:items-end justify-between items-center gap-2 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                                    <div className="text-right">
                                        <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wide">Total price</span>
                                        <span className="font-extrabold text-pink-700 text-base">LKR {Number(appt.total_price).toLocaleString()}</span>
                                    </div>

                                    {isCancellable(appt) ? (
                                        <button
                                            onClick={() => handleCancelAppointment(appt.id, appt.booking_reference, appt.appointment_date, appt.start_time)}
                                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-300 transition"
                                        >
                                            Cancel Booking
                                        </button>
                                    ) : (
                                        !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appt.status) && (
                                            <span className="text-xxs font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-1 select-none" title="Cancellation locked: Must cancel at least 24 hours in advance">
                                                Cancellation Locked
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
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

export default CustomerAppointments;
