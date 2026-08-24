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
import BookAppointment from './pages/customer/BookAppointment.jsx';
import CustomerAppointments from './pages/customer/CustomerAppointments.jsx';
import AdminAppointments from './pages/admin/AdminAppointments.jsx';
import StaffUnavailability from './pages/staff/StaffUnavailability.jsx';
import CashierDashboard from './pages/cashier/CashierDashboard.jsx';
import QueueBoard from './pages/cashier/QueueBoard.jsx';
import POS from './pages/cashier/POS.jsx';
import SalesHistory from './pages/cashier/SalesHistory.jsx';
import ProductManagement from './pages/admin/ProductManagement.jsx';
import InventoryHistory from './pages/admin/InventoryHistory.jsx';
import ProductShop from './pages/customer/ProductShop.jsx';
import Cart from './pages/customer/Cart.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import MyOrders from './pages/customer/MyOrders.jsx';
import OrderDetails from './pages/customer/OrderDetails.jsx';
import OrderManagement from './pages/admin/OrderManagement.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';
import NotificationLogs from './pages/admin/NotificationLogs.jsx';
import ReportPanel from './pages/admin/ReportPanel.jsx';


function HomePage() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-700 border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    const redirectPath = user.role === 'ADMIN' ? '/admin' 
                       : user.role === 'STAFF' ? '/staff' 
                       : user.role === 'CASHIER' ? '/cashier' 
                       : '/customer';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-[#060212] text-slate-200 flex flex-col justify-between relative overflow-hidden tech-grid">
      {/* Glow Spots Background */}
      <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] rounded-full glow-spot-1 pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[40%] rounded-full glow-spot-2 pointer-events-none z-0"></div>

      {/* Navigation Header */}
      <nav className="relative h-16 bg-[#0c081e]/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-12 z-10">
        <div className="flex items-center space-x-2.5">
          <img src="/logo.png" alt="Beauty Lane Logo" className="h-8 w-auto rounded-md object-contain" />
          <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 tracking-wide">
            Beauty Lane
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="rounded-xl bg-pink-700 hover:bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow transition-all duration-150"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-slate-300 transition-all duration-150"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative flex-1 max-w-6xl mx-auto w-full px-6 py-16 flex flex-col justify-center z-10 animate-fade-in-up">
        <header className="text-center max-w-3xl mx-auto space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-400 font-mono">
            Premium Management Solution
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Salon <span className="gradient-text">Management System</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed md:text-base max-w-2xl mx-auto">
            Experience next-generation appointments, dynamic stylist schedule hours, real-time live queue boards, cashier POS invoicing, inventory loggers, and analytical dashboards.
          </p>
        </header>

        {/* Roles Quick Link Cards */}
        <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 delay-100 animate-fade-in-up">
          {/* Admin Panel */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-pink-950/10 hover:shadow-pink-500/5 hover:border-pink-500/30 hover:-translate-y-1.5 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <span className="text-lg">👩‍💼</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white tracking-tight">Admin Panel</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Configure services, stylists hours, check database audits, and compile business summaries.</p>
            </div>
            <Link
              to="/admin"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-400 hover:text-pink-300 group"
            >
              <span>Enter Portal</span>
              <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Stylist Dashboard */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-pink-950/10 hover:shadow-pink-500/5 hover:border-pink-500/30 hover:-translate-y-1.5 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <span className="text-lg">💇‍♀️</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white tracking-tight">Stylist Dashboard</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">View assigned client service sessions, update workloads timeline, and update shift leaves blocks.</p>
            </div>
            <Link
              to="/staff"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-400 hover:text-pink-300 group"
            >
              <span>Enter Portal</span>
              <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Cashier POS */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-pink-950/10 hover:shadow-pink-500/5 hover:border-pink-500/30 hover:-translate-y-1.5 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <span className="text-lg">💵</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white tracking-tight">Cashier POS</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Coordinate live client queues checks, record walk-in billing checkouts, and print invoice receipts.</p>
            </div>
            <Link
              to="/cashier"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-400 hover:text-pink-300 group"
            >
              <span>Enter Portal</span>
              <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Customer Portal */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-pink-950/10 hover:shadow-pink-500/5 hover:border-pink-500/30 hover:-translate-y-1.5 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <span className="text-lg">💅</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white tracking-tight">Customer Portal</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Book stylist appointments slots, browse retail product catalogues, and checkout items.</p>
            </div>
            <Link
              to="/customer"
              className="mt-6 inline-flex items-center text-xs font-bold text-pink-400 hover:text-pink-300 group"
            >
              <span>Enter Portal</span>
              <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative h-14 border-t border-white/5 bg-[#080414]/30 flex items-center justify-center text-[10px] text-slate-500 font-medium z-10">
        © 2026 Beauty Lane Management System. Powered by Alibaba Cloud. All rights reserved.
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
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="inventory" element={<InventoryHistory />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="reports" element={<ReportPanel />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="email-logs" element={<NotificationLogs />} />
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
          <Route path="book" element={<BookAppointment />} />
          <Route path="appointments" element={<CustomerAppointments />} />
          <Route path="shop" element={<ProductShop />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
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
          <Route path="queue" element={<QueueBoard />} />
          <Route path="pos" element={<POS />} />
          <Route path="sales" element={<SalesHistory />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;