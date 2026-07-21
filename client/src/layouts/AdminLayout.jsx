// client/src/layouts/AdminLayout.jsx
import React from 'react';
import DashboardLayout from './DashboardLayout.jsx';

export const AdminLayout = () => {
  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin', exact: true },
    { name: 'User Management', path: '/admin/users' },
    { name: 'Services Management', path: '/admin/services' },
    { name: 'Appointments Schedule', path: '/admin/appointments' }
  ];

  return <DashboardLayout menuLinks={adminLinks} portalName="Admin Panel" />;
};
export default AdminLayout;
