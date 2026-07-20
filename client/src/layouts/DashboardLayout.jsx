import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext.jsx';

export const DashboardLayout = ({ menuLinks, portalName }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Mobile Sidebar Back Drop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-white">Salon Shyani</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Portal Name Indicator */}
        <div className="px-6 py-4 bg-slate-950/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-500">{portalName}</p>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {menuLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.exact}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-pink-700 text-white shadow-md shadow-pink-900/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {link.icon && <span className="mr-3">{link.icon}</span>}
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-700 font-bold text-white uppercase">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-semibold truncate text-white">{user?.fullName}</h4>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mr-2 h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm lg:justify-end">
          <button
            className="text-slate-500 hover:text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex items-center space-x-4">
            <span className="hidden text-sm font-medium text-slate-500 md:inline">Logged in as {user?.role?.toLowerCase()}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold text-sm uppercase">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
