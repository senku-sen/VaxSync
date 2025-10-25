'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import DistributionChart from '@/components/dashboard/DistributionChart';

export default function HealthWorkerDashboard() {
  const router = useRouter();
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalStock: 520,
    usedToday: 32,
    lowStockItems: 1,
    actualAlerts: 3,
    pendingReports: 2
  });

  // Chart data
  const [weeklyData] = useState([
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 52 },
    { day: 'Wed', value: 38 },
    { day: 'Thu', value: 60 },
    { day: 'Fri', value: 48 },
    { day: 'Sat', value: 32 },
    { day: 'Sun', value: 28 }
  ]);

  const [distributionData] = useState([
    { name: 'COVID-19', value: 35, color: '#3E5F44' },
    { name: 'Measles', value: 25, color: '#5E936C' },
    { name: 'Polio', value: 20, color: '#93DA97' },
    { name: 'Hepatitis B', value: 20, color: '#C8E6C9' }
  ]);

  // NOTIF-02: Report reminders
  const [reportReminders, setReportReminders] = useState([
    {
      id: 1,
      reportType: 'Weekly Vaccine Usage Report',
      dueDate: '2025-10-26',
      barangay: 'Barangay Alawihao',
      status: 'pending',
      daysUntilDue: 1,
      submitted: false
    },
    {
      id: 2,
      reportType: 'Monthly Stock Inventory Report',
      dueDate: '2025-10-26',
      barangay: 'Barangay Alawihao',
      status: 'pending',
      daysUntilDue: 1,
      submitted: false
    }
  ]);

  // Set user role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', 'Health Worker');
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData(prev => ({
        ...prev,
        usedToday: prev.usedToday + Math.floor(Math.random() * 2)
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const pendingReminders = reportReminders.filter(r => !r.submitted);
  const urgentReminders = pendingReminders.filter(r => r.daysUntilDue <= 1);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Dashboard - Health Worker</h1>
              <p className="text-xs text-gray-500 mt-0.5">Barangay Alawihao vaccine inventory overview</p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* NOTIF-02: Notification Bell */}
              <button
                onClick={() => router.push('/notifications')}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {urgentReminders.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {urgentReminders.length}
                  </span>
                )}
              </button>
              
              {/* User Profile */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* DASH-01: Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatsCard
              title="Total Stock"
              value={dashboardData.totalStock}
              subtitle="Good standing"
              valueColor="text-[#93DA97]"
            />
            <StatsCard
              title="Used Today"
              value={dashboardData.usedToday}
              subtitle="Doses administered"
              valueColor="text-[#93DA97]"
            />
            <StatsCard
              title="Low Stock Items"
              value={dashboardData.lowStockItems}
              subtitle="Vaccines below threshold"
              valueColor="text-[#93DA97]"
            />
            <StatsCard
              title="Pending Reports"
              value={dashboardData.pendingReports}
              subtitle="Reports due soon"
              valueColor="text-yellow-600"
            />
          </div>

          {/* NOTIF-02: Alert Banner */}
          {urgentReminders.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5 flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800 flex-1">
                {urgentReminders.length} report{urgentReminders.length > 1 ? 's' : ''} due soon. Please submit before the deadline.
              </p>
              <button
                onClick={() => router.push('/notifications')}
                className="px-4 py-2 text-sm font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors"
              >
                View Reports
              </button>
            </div>
          )}

          {/* DASH-02: Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Weekly Usage Trend */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">Weekly Usage Trend</h2>
                <p className="text-xs text-gray-500">Barangay Alawihao weekly distribution</p>
              </div>
              <UsageTrendChart data={weeklyData} />
            </div>

            {/* Distribution by Vaccine Type */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">Distribution by Vaccine Type</h2>
                <p className="text-xs text-gray-500">Current vaccine distribution</p>
              </div>
              <DistributionChart data={distributionData} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
