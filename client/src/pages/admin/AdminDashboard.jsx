import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext.jsx';
import api from '../../services/api.js';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayAppointments: 0,
    queueCheckedIn: 0,
    lowStockCount: 0,
    activeCustomers: 0
  });
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const statsRes = await api.get('/reports/dashboard');
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      const revRes = await api.get('/reports/revenue');
      if (revRes.data && revRes.data.success) {
        setRevenueHistory(revRes.data.data.revenue);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load live dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute maximum revenue to scale custom SVG chart
  const maxRevenue = Math.max(...revenueHistory.map(r => r.total), 5000);

  // Generate SVG coordinates for revenue path
  const chartHeight = 140;
  const chartWidth = 600;
  const paddingRight = 10;
  const paddingLeft = 40;
  const points = revenueHistory.map((item, index) => {
    const x = paddingLeft + (index * (chartWidth - paddingLeft - paddingRight) / Math.max(revenueHistory.length - 1, 1));
    const y = chartHeight - 10 - (item.total / maxRevenue * (chartHeight - 20));
    return { x, y, date: item.date, total: item.total };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z` 
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Welcome back, {user?.fullName}!</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Here is a quick overview of Beauty Lane today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition"
        >
          🔄 Refresh Stats
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Sales Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-pink-700">
                <span className="text-2xl">💰</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">LKR {stats.todayRevenue.toFixed(2)}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Live cashier & online settlements</p>
              </div>
            </div>

            {/* Appointments */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-pink-700">
                <span className="text-2xl">📅</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointments Scheduled</span>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.todayAppointments}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Active bookings for today</p>
              </div>
            </div>

            {/* Checked-In Sessions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-pink-700">
                <span className="text-2xl">🎟️</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Checked-In Queue</span>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{stats.queueCheckedIn}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Clients checked-in / completed</p>
              </div>
            </div>

            {/* Low Stock Badge */}
            <div className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
              stats.lowStockCount > 0 ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center space-x-2 text-amber-700">
                <span className="text-2xl">⚠️</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Products</span>
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${stats.lowStockCount > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                  {stats.lowStockCount}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">Products below safety levels</p>
              </div>
            </div>
          </div>

          {/* Revenue Chart Widget */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">30-Day Revenue Trend</h3>
                <span className="text-xs font-semibold text-slate-400">Total Revenue (LKR)</span>
              </div>

              {revenueHistory.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 font-medium">
                  No historical sales logs recorded in the past 30 days.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Custom SVG Line Chart */}
                  <div className="w-full overflow-x-auto">
                    <svg className="w-full min-w-[500px]" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#be185d" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#be185d" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Y Axis grid lines & labels */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const val = (maxRevenue * ratio).toFixed(0);
                        const y = chartHeight - 10 - (ratio * (chartHeight - 20));
                        return (
                          <g key={i} className="opacity-40">
                            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#cbd5e1" strokeDasharray="3 3" />
                            <text x="5" y={y + 4} className="text-[9px] font-bold fill-slate-400 font-mono">
                              LKR {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Path */}
                      <path d={areaPath} fill="url(#chartGrad)" />

                      {/* Line Path */}
                      <path d={linePath} fill="none" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round" />

                      {/* Plot Points circles */}
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="3.5"
                          className="fill-white stroke-pink-700 stroke-2 hover:r-5 cursor-pointer transition-all duration-150"
                        >
                          <title>{`${p.date}: LKR ${p.total.toFixed(2)}`}</title>
                        </circle>
                      ))}
                    </svg>
                  </div>
                  <div className="flex justify-between px-2 text-[9px] font-bold text-slate-400 font-mono">
                    <span>{revenueHistory[0]?.date}</span>
                    <span>{revenueHistory[Math.floor(revenueHistory.length / 2)]?.date}</span>
                    <span>{revenueHistory[revenueHistory.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick stats distribution summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">Operational Meta</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Active Customer Accounts</span>
                  <span className="text-sm font-extrabold text-slate-800">{stats.activeCustomers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Today's Appointment Load</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {stats.todayAppointments} bookings
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Queue Activity Rate</span>
                  <span className="text-sm font-extrabold text-pink-700">
                    {stats.todayAppointments > 0 
                      ? `${(stats.queueCheckedIn / stats.todayAppointments * 100).toFixed(0)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-xs font-semibold text-slate-500 leading-relaxed border border-slate-100">
                ⚠️ Low stock items require prompt procurement processing to avoid checkout disruption during billing or online shopping.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default AdminDashboard;
