'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import AlertBanner from '@/components/dashboard/AlertBanner';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import DistributionChart from '@/components/dashboard/DistributionChart';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalStock: 2450,
    usedToday: 145,
    lowStockItems: 3,
    actualAlerts: 12,
    alerts: [
      {
        id: 1,
        message: '3 vaccine stocks are running low. Please reorder soon!',
        type: 'warning'
      }
    ]
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would fetch from API
      setDashboardData(prev => ({
        ...prev,
        // Data would be updated from backend
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Real-time vaccine inventory overview</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification Badge */}
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
        {/* Stats Cards */}
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
            subtitle="Vaccines Below threshold"
            valueColor="text-[#93DA97]"
          />
          <StatsCard
            title="Actual Alerts"
            value={dashboardData.actualAlerts}
            subtitle="Urgent items critical"
            valueColor="text-[#93DA97]"
          />
        </div>

        {/* Alert Banner */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-5">
            {dashboardData.alerts.map(alert => (
              <AlertBanner
                key={alert.id}
                message={alert.message}
                type={alert.type}
              />
            ))}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Weekly Usage Trend */}
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-800">Weekly Usage Trend</h2>
              <p className="text-xs text-gray-500">Monitoring weekly vaccine distribution</p>
            </div>
            <UsageTrendChart />
          </div>

          {/* Distribution by Barangay */}
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-800">Distribution by Barangay</h2>
              <p className="text-xs text-gray-500">Current vaccine distribution</p>
            </div>
            <DistributionChart />
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
