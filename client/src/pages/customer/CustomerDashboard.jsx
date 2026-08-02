import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext.jsx';
import api from '../../services/api.js';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [apptRes, orderRes] = await Promise.all([
        api.get('/appointments', { params: { limit: 3 } }),
        api.get('/orders/my', { params: { limit: 3 } })
      ]);

      if (apptRes.data && apptRes.data.success) {
        setAppointments(apptRes.data.data.appointments || []);
      }
      if (orderRes.data && orderRes.data.success) {
        setOrders(orderRes.data.data.orders || []);
      }
    } catch (err) {
      console.warn('Failed to load active user lists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const upcomingAppts = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'WAITING');
  const activeOrders = orders.filter(o => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED');

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* High-Contrast Premium Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#05020c] via-[#4c0d38] to-[#f472b6] text-white p-10 md:p-12 shadow-xl shadow-pink-950/20 border border-white/5">
        <div className="absolute -top-12 -right-12 h-60 w-60 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-pink-500/10 blur-2xl"></div>

        <div className="relative space-y-6 max-w-2xl">
          <span className="inline-block rounded-full bg-pink-500/20 border border-pink-400/30 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-pink-200">
            Welcome to Salon Shyani
          </span>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl leading-tight">
            Hello, {user?.fullName}!
          </h1>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              to="/customer/book"
              className="rounded-xl bg-white hover:bg-slate-100 px-7 py-4 text-xs font-black uppercase tracking-wider text-pink-900 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] duration-200"
            >
              Book New Session
            </Link>
            <Link
              to="/customer/shop"
              className="rounded-xl bg-pink-700/60 hover:bg-pink-700/80 border border-white/20 px-7 py-4 text-xs font-black uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] duration-200"
            >
              Shop Products
            </Link>
          </div>
        </div>
      </div>

      {/* Bold Stats Quick Counter Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 delay-100 animate-fade-in-up">
        {/* Upcoming appointments count */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm border border-slate-200 bg-white space-y-3 hover:shadow-md transition">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">Scheduled Bookings</span>
          <p className="text-4xl font-black text-slate-900 leading-none">{upcomingAppts.length}</p>
          <span className="text-xs text-slate-500 font-bold block">Active sessions booked</span>
        </div>

        {/* Pending pickup orders count */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm border border-slate-200 bg-white space-y-3 hover:shadow-md transition">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">Active Pickup Orders</span>
          <p className="text-4xl font-black text-slate-900 leading-none">{activeOrders.length}</p>
          <span className="text-xs text-slate-500 font-bold block">Items preparing at front desk</span>
        </div>

        {/* Profile info status */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm border border-slate-200 bg-white space-y-3 hover:shadow-md transition">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">Registered Account</span>
          <p className="text-sm font-black text-slate-900 leading-none truncate mt-2">{user?.email}</p>
          <span className="text-xs text-slate-500 font-bold block">Access Level: Customer</span>
        </div>
      </div>

      {/* Main Grid: Shortcuts & Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 delay-200 animate-fade-in-up">
        
        {/* Quick Shortcuts */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/customer/appointments"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-pink-500 hover:shadow-md transition duration-200"
            >
              <div className="text-left space-y-1">
                <span className="font-black text-slate-900 text-base block">My Appointments</span>
                <span className="text-xs text-slate-500 block font-bold">Reschedule or cancel bookings</span>
              </div>
              <span className="text-slate-400 group-hover:text-pink-700 font-bold text-lg transition">→</span>
            </Link>

            <Link
              to="/customer/orders"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-pink-500 hover:shadow-md transition duration-200"
            >
              <div className="text-left space-y-1">
                <span className="font-black text-slate-900 text-base block">My Product Orders</span>
                <span className="text-xs text-slate-500 block font-bold">Track checkout pickup status</span>
              </div>
              <span className="text-slate-400 group-hover:text-pink-700 font-bold text-lg transition">→</span>
            </Link>

            <Link
              to="/customer/shop"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-pink-500 hover:shadow-md transition duration-200"
            >
              <div className="text-left space-y-1">
                <span className="font-black text-slate-900 text-base block">Salon Product Catalog</span>
                <span className="text-xs text-slate-500 block font-bold">Order premium skincare online</span>
              </div>
              <span className="text-slate-400 group-hover:text-pink-700 font-bold text-lg transition">→</span>
            </Link>
          </div>
        </div>

        {/* Live Schedules / Upcoming items */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Upcoming Appointments</h3>
          
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 min-h-[220px]">
            {loading ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
              </div>
            ) : upcomingAppts.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-sm font-black text-slate-500">You have no upcoming appointment slots booked.</p>
                <Link
                  to="/customer/book"
                  className="inline-flex rounded-xl bg-pink-700 hover:bg-pink-600 text-xs font-black uppercase tracking-wider text-white px-5 py-3 shadow-md transition"
                >
                  Book Stylist Now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingAppts.map(appt => (
                  <div key={appt.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="font-black text-slate-900 text-base block">
                        {appt.services?.map(s => s.name).join(', ') || 'Custom Styling Service'}
                      </span>
                      <span className="text-xs text-slate-500 font-bold block">
                        Stylist: {appt.staff_name || 'Any Available Stylist'}
                      </span>
                    </div>
                    <div className="text-right space-y-2">
                      <span className="text-xs font-black text-slate-800 block">
                        {new Date(appt.appointment_date).toLocaleDateString()} @ {appt.start_time.substring(0, 5)}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        appt.status === 'WAITING' ? 'bg-amber-100 text-amber-800' : 'bg-pink-100 text-pink-850'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default CustomerDashboard;
