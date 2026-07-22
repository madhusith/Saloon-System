import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext.jsx';
import api from '../../services/api.js';

export const CashierDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard stats
  const [stats, setStats] = useState({
    queueTotal: 0,
    waitingTotal: 0,
    revenueTotal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];
        
        const [apptsRes, salesRes] = await Promise.all([
          api.get(`/appointments?date=${todayStr}&limit=100`),
          api.get(`/sales?date=${todayStr}&limit=100`)
        ]);

        const appts = apptsRes.data.data.appointments || [];
        const sales = salesRes.data.data.sales || [];

        const queueTotal = appts.length;
        const waitingTotal = appts.filter(a => a.status === 'WAITING').length;
        const revenueTotal = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);

        setStats({ queueTotal, waitingTotal, revenueTotal });
      } catch (err) {
        console.error('Failed to load cashier stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Welcome, {user?.fullName}!</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Welcome to your Cashier & Point of Sale workspace.</p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sessions</p>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-900">{stats.queueTotal} Bookings</h3>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiting in Queue</p>
            <h3 className="mt-2 text-2xl font-extrabold text-amber-600">{stats.waitingTotal} Checked In</h3>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales Revenue</p>
            <h3 className="mt-2 text-2xl font-extrabold text-pink-700">LKR {stats.revenueTotal.toFixed(2)}</h3>
          </div>
        </div>
      )}

      {/* Actions Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 transition-all duration-200">
          <div>
            <span className="text-2xl">📋</span>
            <h3 className="mt-4 text-base font-bold text-slate-900">Live Queue Board</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">View scheduled sessions, mark customer check-ins, and trace stylist loads.</p>
          </div>
          <Link
            to="/cashier/queue"
            className="mt-6 rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2 text-center text-xs font-bold text-white shadow-sm transition"
          >
            Open Queue Board
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 transition-all duration-200">
          <div>
            <span className="text-2xl">🛒</span>
            <h3 className="mt-4 text-base font-bold text-slate-900">Walk-In / POS Checkout</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">Add services and products to bill walk-in clients, apply discounts, or take payments.</p>
          </div>
          <Link
            to="/cashier/pos"
            className="mt-6 rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2 text-center text-xs font-bold text-white shadow-sm transition"
          >
            Start Billing POS
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 transition-all duration-200">
          <div>
            <span className="text-2xl">🧾</span>
            <h3 className="mt-4 text-base font-bold text-slate-900">Sales Log & Invoices</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">Browse invoices history, query transactions by type or date, and reprint invoices.</p>
          </div>
          <Link
            to="/cashier/sales"
            className="mt-6 rounded-lg bg-pink-700 hover:bg-pink-600 px-4 py-2 text-center text-xs font-bold text-white shadow-sm transition"
          >
            View Sales Log
          </Link>
        </div>
      </div>
    </div>
  );
};
export default CashierDashboard;
