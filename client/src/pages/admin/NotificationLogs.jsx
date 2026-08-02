import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';

export const NotificationLogs = () => {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [recipientFilter, setRecipientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotificationLogs = async () => {
    try {
      setLoading(true);
      setError('');
      let url = `/reports/notifications?page=${page}&limit=15`;
      if (recipientFilter) {
        url += `&recipientEmail=${recipientFilter}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setNotifications(res.data.data.notifications);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notification logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationLogs();
  }, [page, statusFilter]);

  // Handle manual filter submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotificationLogs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Email Delivery Logs</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Trace welcome tokens, appointment confirmations, and shop pickup status email transmissions.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <form onSubmit={handleFilterSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Recipient Email</label>
            <input
              type="text"
              placeholder="e.g. rasika@example.test"
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none w-64 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none font-medium"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            className="rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            Apply Filter
          </button>
          <button
            type="button"
            onClick={() => { setRecipientFilter(''); setStatusFilter(''); setPage(1); }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
          >
            Clear Filters
          </button>
        </div>
      </form>

      {/* Logs Table */}
      {loading && notifications.length === 0 ? (
        <div className="flex h-64 items-center justify-center bg-white border border-slate-200 rounded-xl">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3">Recipient Email</th>
                  <th className="px-6 py-3">Notification Type</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3">Error details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No notifications logged.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/20">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {new Date(n.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{n.recipient_email}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500 font-mono">
                        {n.notification_type}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{n.subject}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          n.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' :
                          n.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-red-600 font-medium max-w-xs truncate">
                        {n.error_message || <span className="text-slate-300 font-normal">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-500">
                Page {page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default NotificationLogs;
