import React from 'react';
import { useAuth } from '../../context/authContext.jsx';

export const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Hi, {user?.fullName}!</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome to your Stylist Dashboard.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950">Today's Appointments</h3>
          <p className="mt-2 text-sm text-slate-500">You have no appointments scheduled for today.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950">My Schedule</h3>
          <p className="mt-2 text-sm text-slate-500">Configure your shift hours, block off leaves, and check weekly working periods.</p>
        </div>
      </div>
    </div>
  );
};
export default StaffDashboard;
