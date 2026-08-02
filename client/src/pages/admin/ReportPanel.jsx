import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';

export const ReportPanel = () => {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const [sRes, pRes, stRes] = await Promise.all([
        api.get('/reports/services'),
        api.get('/reports/products'),
        api.get('/reports/staff')
      ]);

      if (sRes.data.success) setServices(sRes.data.data.services);
      if (pRes.data.success) setProducts(pRes.data.data.products);
      if (stRes.data.success) setStaff(stRes.data.data.staff);

    } catch (err) {
      console.error(err);
      setError('Failed to compile performance reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Review salon service popularities, product retail figures, and staff appointment statistics.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchReports}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition"
          >
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="rounded-xl bg-pink-700 hover:bg-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition"
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Print only header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Salon Shyani — Administrative Performance Report</h1>
        <p className="text-xs text-slate-500">Generated on {new Date().toLocaleString()}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium print:hidden">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center print:hidden">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Services report */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 print:bg-white print:px-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 print:text-sm print:text-slate-900">Service Popularity & Revenue</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500 border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100 print:bg-white">
                  <tr>
                    <th className="px-6 py-3 print:px-0">Service Name</th>
                    <th className="px-6 py-3 text-center print:px-0">Sessions Booked</th>
                    <th className="px-6 py-3 text-right print:px-0">Revenue Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-200">
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-6 text-center text-slate-400 font-medium print:px-0">
                        No service logs found.
                      </td>
                    </tr>
                  ) : (
                    services.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/20">
                        <td className="px-6 py-4 text-slate-900 font-bold print:px-0">{s.name}</td>
                        <td className="px-6 py-4 text-center text-slate-700 print:px-0">{s.count}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 print:px-0">LKR {s.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Products retail report */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden print:border-none print:shadow-none print:page-break-before">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 print:bg-white print:px-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 print:text-sm print:text-slate-900">Product Retail Volumes</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500 border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100 print:bg-white">
                  <tr>
                    <th className="px-6 py-3 print:px-0">Product Name</th>
                    <th className="px-6 py-3 text-center print:px-0">Units Sold</th>
                    <th className="px-6 py-3 text-right print:px-0">Retail Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-6 text-center text-slate-400 font-medium print:px-0">
                        No product sales logs found.
                      </td>
                    </tr>
                  ) : (
                    products.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/20">
                        <td className="px-6 py-4 text-slate-900 font-bold print:px-0">{p.name}</td>
                        <td className="px-6 py-4 text-center text-slate-700 print:px-0">{p.qtySold}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 print:px-0">LKR {p.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staff report */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 print:bg-white print:px-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 print:text-sm print:text-slate-900">Stylist Assignments & Ratios</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500 border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100 print:bg-white">
                  <tr>
                    <th className="px-6 py-3 print:px-0">Stylist Name</th>
                    <th className="px-6 py-3 text-center print:px-0">Total Bookings</th>
                    <th className="px-6 py-3 text-center print:px-0">Completed</th>
                    <th className="px-6 py-3 text-center print:px-0">Cancelled</th>
                    <th className="px-6 py-3 text-right print:px-0">Completion Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-200">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-6 text-center text-slate-400 font-medium print:px-0">
                        No staff booking logs compiled.
                      </td>
                    </tr>
                  ) : (
                    staff.map((st, i) => {
                      const ratio = st.total > 0 ? (st.completed / st.total * 100).toFixed(0) : 0;
                      return (
                        <tr key={i} className="hover:bg-slate-50/20">
                          <td className="px-6 py-4 text-slate-900 font-bold print:px-0">{st.name}</td>
                          <td className="px-6 py-4 text-center text-slate-700 print:px-0">{st.total}</td>
                          <td className="px-6 py-4 text-center text-slate-700 print:px-0">{st.completed}</td>
                          <td className="px-6 py-4 text-center text-slate-700 print:px-0">{st.cancelled}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-pink-700 print:px-0">{ratio}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportPanel;
