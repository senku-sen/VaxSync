'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Icon = ({ name, isActive }) => {
  const iconClass = `w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`;
  
  const icons = {
    dashboard: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    inventory: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    calendar: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    users: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    check: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    document: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    download: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
    chart: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bell: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    user: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    settings: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    logout: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  };
  
  return icons[name] || icons.document;
};

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('Health Worker');

  // Get user role on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || 'Health Worker';
      setUserRole(role);
    }
  }, []);

  // Health Worker menu items (6 items)
  const healthWorkerMenuItems = [
    { name: 'Dashboard', path: '/Health_Worker', icon: 'dashboard' },
    { name: 'Vaccination Schedule', path: '/vaccination-schedule', icon: 'calendar' },
    { name: 'Resident Data', path: '/resident-data', icon: 'users' },
    { name: 'Vaccine Requests', path: '/vaccine-requests', icon: 'document' },
    { name: 'Notifications', path: '/notifications', icon: 'bell' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  // Head Nurse menu items (11 items)
  const headNurseMenuItems = [
    { name: 'Dashboard', path: '/Head_Nurse', icon: 'dashboard' },
    { name: 'Vaccination Schedule', path: '/vaccination-schedule', icon: 'calendar' },
    { name: 'Resident Data', path: '/resident-data', icon: 'users' },
    { name: 'Resident Approval', path: '/resident-approval', icon: 'check' },
    { name: 'Vaccine Requests', path: '/vaccine-requests', icon: 'document' },
    { name: 'Request Approval', path: '/request-approval', icon: 'download' },
    { name: 'Reports', path: '/reports', icon: 'chart' },
    { name: 'Notifications', path: '/notifications', icon: 'bell' },
    { name: 'User Management', path: '/user-management', icon: 'user' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  // Select menu items based on role
  const menuItems = userRole === 'Head Nurse' ? headNurseMenuItems : healthWorkerMenuItems;

  return (
    <div className="w-56 bg-white min-h-screen flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-5 flex items-center gap-2 border-b border-gray-200">
        <div className="w-7 h-7 bg-[#3E5F44] rounded flex items-center justify-center text-white font-bold text-xs">
          V
        </div>
        <span className="font-semibold text-gray-800 text-base">VaxSync</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-md text-sm transition-colors
                ${isActive 
                  ? 'bg-[#3E5F44] text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-100 font-normal'
                }
              `}
            >
              <Icon name={item.icon} isActive={isActive} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-normal text-gray-700 hover:bg-gray-100 transition-colors">
          <Icon name="logout" isActive={false} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
