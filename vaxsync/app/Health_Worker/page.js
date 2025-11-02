'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import DistributionChart from '@/components/dashboard/DistributionChart';

export default function HealthWorkerDashboard() {
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
