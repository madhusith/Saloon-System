import React from 'react';
import DashboardLayout from './DashboardLayout.jsx';

export const CashierLayout = () => {
  const cashierLinks = [
    { name: 'Dashboard', path: '/cashier', exact: true },
    { name: 'Live Queue', path: '/cashier/queue' },
    { name: 'Walk-In / POS', path: '/cashier/pos' },
    { name: 'Sales History', path: '/cashier/sales' }
  ];

  return <DashboardLayout menuLinks={cashierLinks} portalName="Cashier Portal" />;
};
export default CashierLayout;
