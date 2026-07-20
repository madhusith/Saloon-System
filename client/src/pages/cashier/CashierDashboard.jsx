import React from 'react';
import { useAuth } from '../../context/authContext.jsx';

export const CashierDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Welcome, {user?.fullName}!</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome to your Cashier/POS workspace.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950">Live Queue</h3>
          <p className="mt-2 text-sm text-slate-500">View check-ins, queue orders, and today's stylist timelines in real-time.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950">Walk-In POS</h3>
          <p className="mt-2 text-sm text-slate-500">Start a walk-in billing transaction, sell products, or checkout bookings.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950">Refund Approvals</h3>
          <p className="mt-2 text-sm text-slate-500">Check refund status or request discount overrides from administrators.</p>
        </div>
      </div>
    </div>
  );
};
export default CashierDashboard;
