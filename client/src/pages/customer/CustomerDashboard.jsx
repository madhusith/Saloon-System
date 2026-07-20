import React from 'react';
import { useAuth } from '../../context/authContext.jsx';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Hello, {user?.fullName}!</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome to your Salon Customer Portal.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950">Book an Appointment</h3>
            <p className="mt-2 text-sm text-slate-500">Find eligible stylists, choose services, and pick an available date and time slot.</p>
          </div>
          <button className="mt-6 inline-flex items-center justify-center rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 transition self-start">
            Book Appointment
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950">My Bookings</h3>
            <p className="mt-2 text-sm text-slate-500">Check your appointment history, download digital receipts, or review booking details.</p>
          </div>
          <button className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition self-start">
            View History
          </button>
        </div>
      </div>
    </div>
  );
};
export default CustomerDashboard;
