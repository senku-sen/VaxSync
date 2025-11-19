'use client';

import { useState } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import DistributionChart from '@/components/dashboard/DistributionChart';
import { useDashboardData } from '@/lib/hooks/useDashboardData';

export default function HealthWorkerDashboard() {
  // DASH-04: Barangay filter state (limited to assigned barangay)
  const [selectedBarangay, setSelectedBarangay] = useState('barangay-a');

  // Fetch data from Supabase
  const { dashboardData, chartData, loading } = useDashboardData(selectedBarangay);

  const barangays = [
    { value: 'barangay-a', label: 'Barangay Alawihao' },
    { value: 'barangay-b', label: 'Barangay Awitan' },
    { value: 'barangay-c', label: 'Barangay Bagasbas' },
    { value: 'barangay-d', label: 'Barangay Borabod' },
    { value: 'barangay-e', label: 'Barangay Calasgasan' }
  ];

  const handleBarangayChange = (e) => {
    setSelectedBarangay(e.target.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E5F44] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 flex items-start justify-between border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time vaccine inventory overview - Health Worker</p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* DASH-04: Barangay Filter Section (User can only view assigned barangay) */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Your Barangay:</label>
                <select
                  value={selectedBarangay}
                  onChange={handleBarangayChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                >
                  {barangays.map(brgy => (
                    <option key={brgy.value} value={brgy.value}>{brgy.label}</option>
                  ))}
                </select>
              </div>

              {/* Active Filter Indicator */}
              <div className="flex items-center gap-2 text-sm text-[#3E5F44]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Viewing: {barangays.find(b => b.value === selectedBarangay)?.label}</span>
              </div>
            </div>
          </div>

          {/* DASH-01: Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Stock"
              value={dashboardData.totalStock}
              subtitle="Doses available"
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
              title="Active Alerts"
              value={dashboardData.actualAlerts}
              subtitle="Items needing attention"
              valueColor="text-[#93DA97]"
            />
          </div>

          {/* DASH-03: Alert Banner (Limited for Health Worker) */}
          {dashboardData.lowStockItems > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-800 text-sm flex-1">
                <strong>Attention:</strong> {dashboardData.lowStockItems} vaccine stocks are running low. Contact your supervisor.
              </p>
            </div>
          )}

          {/* DASH-02: Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Usage Trend */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">Weekly Usage Trend</h2>
                <p className="text-xs text-gray-500">Vaccine doses used per day</p>
              </div>
              <UsageTrendChart data={chartData.weeklyData} />
            </div>

            {/* Distribution by Barangay */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">Distribution by Barangay</h2>
                <p className="text-xs text-gray-500">Vaccine allocation percentage</p>
              </div>
              <DistributionChart data={chartData.barangayDistribution} />
            </div>
          </div>
        </div>
      </div>
  );
}
