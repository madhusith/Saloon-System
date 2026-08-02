// client/src/layouts/AdminLayout.jsx
import React from 'react';
import DashboardLayout from './DashboardLayout.jsx';

export const AdminLayout = () => {
  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin', exact: true },
    { name: 'User Management', path: '/admin/users' },
    { name: 'Services Management', path: '/admin/services' },
    { name: 'Appointments Schedule', path: '/admin/appointments' },
    { name: 'Product Catalog', path: '/admin/products' },
    { name: 'Inventory Log', path: '/admin/inventory' },
    { name: 'Product Orders', path: '/admin/orders' },
    { name: 'Performance Reports', path: '/admin/reports' },
    { name: 'Audit Trail Logs', path: '/admin/audit-logs' },
    { name: 'Email Delivery Logs', path: '/admin/email-logs' }
  ];

  return <DashboardLayout menuLinks={adminLinks} portalName="Admin Panel" />;
};
export default AdminLayout;
