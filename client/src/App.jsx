import React from 'react';
import { Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext.jsx';
import ProtectedRoute from './layouts/ProtectedRoute.jsx';

// Auth Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import ChangePasswordForce from './pages/auth/ChangePasswordForce.jsx';

// Layouts
import AdminLayout from './layouts/AdminLayout.jsx';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import StaffLayout from './layouts/StaffLayout.jsx';
import CashierLayout from './layouts/CashierLayout.jsx';

// Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import UsersList from './pages/admin/UsersList.jsx';
import ServicesList from './pages/admin/ServicesList.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import StaffSchedules from './pages/staff/StaffSchedules.jsx';
import StaffUnavailability from './pages/staff/StaffUnavailability.jsx';
import CashierDashboard from './pages/cashier/CashierDashboard.jsx';

function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 md:px-12">
        <span className="text-xl font-extrabold text-pink-700 tracking-wide">Salon Shyani</span>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm font-semibold text-slate-700">Hi, {user.fullName}</span>
              <Link
                to={user.role === 'ADMIN' ? '/admin' : user.role === 'STAFF' ? '/staff' : user.role === 'CASHIER' ? '/cashier' : '/customer'}
                className="rounded-lg bg-pink-700 px-4 py-2 text-xs font-bold text-white hover:bg-pink-600 transition"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg bg-pink-700 px-4 py-2 text-xs font-bold text-white hover:bg-pink-600 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <header className="text-center max-w-3xl mx-auto space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-700">Premium Management Solution</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Salon Management System
          </h1>
          <p className="text-base text-slate-500 leading-relaxed md:text-lg">
            Welcome to Salon Shyani. Experience seamless appointments, customized stylist choices, POS cashier checkouts, inventory logs, and real-time dashboard notifications.
          </p>
        </header>

        {/* Roles Quick Link Cards */}
        <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 transition-all duration-200">
            <div>
              <span className="text-2xl">👩‍💼</span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Admin Panel</h3>
              <p className="mt-2 text-sm text-slate-500">Configure services, schedules, audit user statuses, and view business reports.</p>
            </div>
            <Link
              to="/admin"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-700 hover:text-pink-600"
            >
              Enter Portal →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 transition-all duration-200">
            <div>
              <span className="text-2xl">💇‍♀️</span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Stylist Dashboard</h3>
              <p className="mt-2 text-sm text-slate-500">View daily assigned service sessions, status updates, and personal shift hours.</p>
            </div>
            <Link
              to="/staff"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-700 hover:text-pink-600"
            >
              Enter Portal →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 transition-all duration-200">
            <div>
              <span className="text-2xl">💵</span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Cashier POS</h3>
              <p className="mt-2 text-sm text-slate-500">Coordinate checking in walk-in sales, card/cash invoicing, and active queues.</p>
            </div>
            <Link
              to="/cashier"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-700 hover:text-pink-600"
            >
              Enter Portal →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-pink-200 transition-all duration-200">
            <div>
              <span className="text-2xl">💅</span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Customer Portal</h3>
              <p className="mt-2 text-sm text-slate-500">Schedule appointments, view booking histories, and browse styling collections.</p>
            </div>
            <Link
              to="/customer"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-700 hover:text-pink-600"
            >
              Enter Portal →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 bg-white flex items-center justify-center text-xs text-slate-400">
        © 2026 Salon Shyani Management System. All rights reserved.
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Forced Password Change (Authenticated, no role checks) */}
        <Route
          path="/change-password-force"
          element={
            <ProtectedRoute>
              <ChangePasswordForce />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="services" element={<ServicesList />} />
        </Route>

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboard />} />
        </Route>

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['STAFF']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffDashboard />} />
          <Route path="schedule" element={<StaffSchedules />} />
          <Route path="unavailability" element={<StaffUnavailability />} />
        </Route>

        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={['CASHIER']}>
              <CashierLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CashierDashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;