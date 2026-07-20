import React from 'react';
import DashboardLayout from './DashboardLayout.jsx';

export const CashierLayout = () => {
  const cashierLinks = [
    { name: 'Cashier Dashboard', path: '/cashier', exact: true }
  ];

  return <DashboardLayout menuLinks={cashierLinks} portalName="Cashier Dashboard" />;
};
export default CashierLayout;
