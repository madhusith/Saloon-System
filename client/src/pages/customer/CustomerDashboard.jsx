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
        api.get('/appointments/my?limit=3'),
        api.get('/orders/my?limit=3')
      ]);

      if (apptRes.data && apptRes.data.success) {
        setAppointments(apptRes.data.data.appointments || []);
      }
      if (orderRes.data && orderRes.data.success) {
        setOrders(res => orderRes.data.data.orders || []);
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Premium Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-700 via-rose-700 to-indigo-900 text-white p-8 md:p-10 shadow-lg shadow-pink-900/10">
        {/* Glow circles design background */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-pink-500/20 blur-2xl"></div>

        <div className="relative space-y-4 max-w-xl">
          <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-pink-200">
            Welcome to Salon Shyani
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Hello, {user?.fullName}!
          </h1>
          <p className="text-sm md:text-base text-pink-100/90 leading-relaxed font-medium">
            Manage your hair styling sessions, track product pickup schedules, and browse professional haircare products directly from your personalized portal.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/customer/book"
              className="rounded-xl bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-pink-800 shadow transition-all hover:scale-105 duration-200"
            >
              ✂️ Book New Session
            </Link>
            <Link
              to="/customer/shop"
              className="rounded-xl bg-pink-600/35 hover:bg-pink-600/50 border border-white/20 px-5 py-2.5 text-xs font-bold text-white transition-all duration-200"
            >
              🧴 Shop Products
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Quick Counter Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 delay-100 animate-fade-in-up">
        {/* Upcoming appointments count */}
        <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Bookings</span>
            <span className="text-xl">📅</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{upcomingAppts.length}</p>
          <span className="text-[10px] text-slate-400 font-bold block">Active sessions today or upcoming</span>
        </div>

        {/* Pending pickup orders count */}
        <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Pickup Orders</span>
            <span className="text-xl">🛒</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{activeOrders.length}</p>
          <span className="text-[10px] text-slate-400 font-bold block">Items preparing at front desk</span>
        </div>

        {/* Profile info status */}
        <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Account</span>
            <span className="text-xl">👤</span>
          </div>
          <p className="text-sm font-extrabold text-slate-800 truncate">{user?.email}</p>
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Role: CUSTOMER</span>
        </div>
      </div>

      {/* Main Grid: Shortcuts & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 delay-200 animate-fade-in-up">
        
        {/* Quick Shortcuts */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/customer/appointments"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-pink-200 hover:shadow-md transition duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🕒</span>
                <div className="text-left">
                  <span className="font-bold text-slate-800 text-sm block">My Appointments</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Reschedule or cancel bookings</span>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-pink-600 transition">→</span>
            </Link>

            <Link
              to="/customer/orders"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-pink-200 hover:shadow-md transition duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🛍️</span>
                <div className="text-left">
                  <span className="font-bold text-slate-800 text-sm block">My Product Orders</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Track checkout pickup status</span>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-pink-600 transition">→</span>
            </Link>

            <Link
              to="/customer/shop"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-pink-200 hover:shadow-md transition duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">✨</span>
                <div className="text-left">
                  <span className="font-bold text-slate-800 text-sm block">Salon Product Catalog</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Order premium skincare online</span>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-pink-600 transition">→</span>
            </Link>
          </div>
        </div>

        {/* Live Schedules / Upcoming items */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Upcoming Appointments</h3>
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 min-h-[180px]">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
              </div>
            ) : upcomingAppts.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <span className="text-3xl block">💁‍♀️</span>
                <p className="text-xs font-bold text-slate-400">You have no upcoming appointment slots booked.</p>
                <Link
                  to="/customer/book"
                  className="inline-flex rounded-lg bg-pink-700 hover:bg-pink-600 text-[10px] font-bold text-white px-4 py-2 shadow-sm transition"
                >
                  Book Stylist Now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingAppts.map(appt => (
                  <div key={appt.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {appt.services?.map(s => s.name).join(', ') || 'Custom Styling Service'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        Stylist: {appt.staff_name || 'Any Available Stylist'}
                      </span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-700 block">
                        {new Date(appt.appointment_date).toLocaleDateString()} @ {appt.start_time.substring(0, 5)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        appt.status === 'WAITING' ? 'bg-amber-100 text-amber-800' : 'bg-pink-100 text-pink-800'
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
