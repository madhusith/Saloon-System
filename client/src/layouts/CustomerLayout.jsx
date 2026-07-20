import React from 'react';
import DashboardLayout from './DashboardLayout.jsx';

export const CustomerLayout = () => {
  const customerLinks = [
    { name: 'Customer Dashboard', path: '/customer', exact: true }
  ];

  return <DashboardLayout menuLinks={customerLinks} portalName="Customer Portal" />;
};
export default CustomerLayout;
