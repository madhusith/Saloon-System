import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api.js';
import InvoiceView from './InvoiceView.jsx';

export const SalesHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search filters
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // If invoice search parameter is present, show invoice details
  const activeInvoiceId = searchParams.get('invoice');

  const fetchSalesLog = async () => {
    try {
      setLoading(true);
      setError('');
      
      let queryStr = `page=${page}&limit=10`;
      if (dateFilter) queryStr += `&date=${dateFilter}`;
      if (typeFilter) queryStr += `&saleType=${typeFilter}`;

      const res = await api.get(`/sales?${queryStr}`);
      if (res.data && res.data.success) {
        setSales(res.data.data.sales);
        setTotalPages(res.data.data.meta.totalPages);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch sales log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeInvoiceId) {
      fetchSalesLog();
    }
  }, [page, dateFilter, typeFilter, activeInvoiceId]);

  const viewInvoice = (id) => {
    setSearchParams({ invoice: id });
  };

  const closeInvoice = () => {
    setSearchParams({});
  };

  if (activeInvoiceId) {
    return (
      <div className="py-4">
        <InvoiceView saleId={activeInvoiceId} onClose={closeInvoice} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Sales History & Invoices</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Browse, query, and print receipts of completed salon checkouts.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Sale Type</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="WALK_IN">Walk-In Service</option>
            <option value="PRODUCT_ONLY">Product Sale Only</option>
            <option value="MIXED">Mixed Bill</option>
          </select>
        </div>

        <button
          onClick={() => { setDateFilter(''); setTypeFilter(''); setPage(1); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Total Amount</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No sales matching the criteria found.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/20">
                      <td className="px-6 py-4 font-bold text-slate-900">{sale.invoice_number}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{sale.customer_name || 'Walk-in Guest'}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          sale.sale_type === 'APPOINTMENT' ? 'bg-purple-100 text-purple-800' :
                          sale.sale_type === 'WALK_IN' ? 'bg-orange-100 text-orange-800' :
                          sale.sale_type === 'PRODUCT_ONLY' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {sale.sale_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900">LKR {Number(sale.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => viewInvoice(sale.id)}
                          className="rounded-lg bg-pink-700 hover:bg-pink-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-bold">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
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
export default SalesHistory;
