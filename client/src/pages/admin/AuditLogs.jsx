import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      let url = `/reports/audit-logs?page=${page}&limit=15`;
      if (actionFilter) {
        url += `&action=${actionFilter}`;
      }
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setLogs(res.data.data.logs);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch audit trails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Administrative Audit Trail</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Trace configurations, role edits, discount overrides, and stock adjustments.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end justify-between">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter Action</label>
          <input
            type="text"
            placeholder="e.g. PRODUCT_CREATED, POS_CHECKOUT"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none w-64"
          />
        </div>
        <button
          onClick={() => { setActionFilter(''); setPage(1); setSelectedLog(null); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
        >
          Reset Filter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Logs table */}
        <div className="lg:col-span-2 space-y-4">
          {loading && logs.length === 0 ? (
            <div className="flex h-64 items-center justify-center bg-white border border-slate-200 rounded-xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-500 border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Operator</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">
                          No audit records found matching parameters.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`hover:bg-slate-50/20 cursor-pointer ${
                            selectedLog?.id === log.id ? 'bg-pink-50/10' : ''
                          }`}
                        >
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800 block">{log.user_name || 'System / Guest'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{log.user_role || 'GUEST'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">
                            {log.ip_address || '127.0.0.1'}
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

        {/* Detailed snapshot sidebar */}
        <div>
          {selectedLog ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 sticky top-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Audit Detail</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4 text-xs font-medium text-slate-600">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Action Code</span>
                  <span className="text-slate-900 font-bold text-sm block font-mono">{selectedLog.action}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Operator Details</span>
                  <span className="text-slate-800 block">Name: {selectedLog.user_name || 'System / Auto'}</span>
                  <span className="text-slate-500 block">Role: {selectedLog.user_role || 'GUEST'}</span>
                  <span className="text-slate-500 block">IP: {selectedLog.ip_address || '127.0.0.1'}</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Reference Entity</span>
                  <span className="text-slate-800 block">Type: <span className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded text-[10px]">{selectedLog.entity_type || 'N/A'}</span></span>
                  <span className="text-slate-800 block">Entity ID: <span className="font-mono">{selectedLog.entity_id || 'N/A'}</span></span>
                </div>

                {selectedLog.new_values_json && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">New Values JSON</span>
                    <pre className="text-[10px] font-mono text-pink-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(selectedLog.new_values_json), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.old_values_json && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Previous values JSON</span>
                    <pre className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(selectedLog.old_values_json), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 font-medium h-48 flex items-center justify-center">
              Select an action log from the list to audit specific state snapshots and values records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AuditLogs;
