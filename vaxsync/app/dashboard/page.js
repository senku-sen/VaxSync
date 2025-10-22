'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import AlertBanner from '@/components/dashboard/AlertBanner';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import DistributionChart from '@/components/dashboard/DistributionChart';
import AlertCard from '@/components/alerts/AlertCard';
import AlertDetailModal from '@/components/alerts/AlertDetailModal';

export default function Dashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);
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
    ],
    detailedAlerts: {
      critical: [
        {
          id: 1,
          type: 'low-stock',
          severity: 'critical',
          vaccineName: 'COVID-19 Pfizer',
          batch: 'CV-2025-001',
          currentStock: 45,
          threshold: 100,
          location: 'Cold Storage A',
          expiryDate: '2025-06-15',
          message: 'Critical: Only 45 doses remaining',
          timestamp: '2 hours ago'
        },
        {
          id: 2,
          type: 'expiring-soon',
          severity: 'critical',
          vaccineName: 'Measles MMR',
          batch: 'MS-2025-003',
          currentStock: 520,
          threshold: 100,
          location: 'Cold Storage A',
          expiryDate: '2025-01-28',
          message: 'Expiring in 5 days',
          timestamp: '3 hours ago'
        }
      ],
      warning: [
        {
          id: 3,
          type: 'low-stock',
          severity: 'warning',
          vaccineName: 'Polio IPV',
          batch: 'PO-2025-002',
          currentStock: 85,
          threshold: 100,
          location: 'Cold Storage B',
          expiryDate: '2025-08-20',
          message: 'Stock below threshold: 85 doses remaining',
          timestamp: '5 hours ago'
        }
      ]
    }
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

        {/* Detailed Alerts Section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Stock Alerts</h2>
            <span className="text-xs text-gray-500">
              {dashboardData.detailedAlerts.critical.length + dashboardData.detailedAlerts.warning.length} active alerts
            </span>
          </div>

          {/* Critical Alerts */}
          {dashboardData.detailedAlerts.critical.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">Critical Alerts</h3>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {dashboardData.detailedAlerts.critical.length}
                </span>
              </div>
              <div className="space-y-3">
                {dashboardData.detailedAlerts.critical.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onClick={() => setSelectedAlert(alert)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Warning Alerts */}
          {dashboardData.detailedAlerts.warning.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">Warning Alerts</h3>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  {dashboardData.detailedAlerts.warning.length}
                </span>
              </div>
              <div className="space-y-3">
                {dashboardData.detailedAlerts.warning.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onClick={() => setSelectedAlert(alert)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

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

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </DashboardLayout>
  );
}
