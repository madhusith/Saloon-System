// client/src/layouts/CustomerLayout.jsx
import React from 'react';
import DashboardLayout from './DashboardLayout.jsx';

export const CustomerLayout = () => {
  const customerLinks = [
    { name: 'Customer Dashboard', path: '/customer', exact: true },
    { name: 'Book Session', path: '/customer/book' },
    { name: 'My Appointments', path: '/customer/appointments' },
    { name: 'Product Shop', path: '/customer/shop' },
    { name: 'My Orders', path: '/customer/orders' }
  ];

  return <DashboardLayout menuLinks={customerLinks} portalName="Customer Portal" />;
};
export default CustomerLayout;
