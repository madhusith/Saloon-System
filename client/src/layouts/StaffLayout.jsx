import React from 'react';
import DashboardLayout from './DashboardLayout.jsx';

export const StaffLayout = () => {
  const staffLinks = [
    { name: 'Staff Dashboard', path: '/staff', exact: true }
  ];

  return <DashboardLayout menuLinks={staffLinks} portalName="Staff Dashboard" />;
};
export default StaffLayout;
