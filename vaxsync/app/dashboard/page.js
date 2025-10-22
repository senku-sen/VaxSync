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
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  
  const barangays = [
    { value: 'all', label: 'All Barangays' },
    { value: 'barangay-a', label: 'Barangay Alawihao' },
    { value: 'barangay-b', label: 'Barangay Awitan' },
    { value: 'barangay-c', label: 'Barangay Bagasbas' },
    { value: 'barangay-d', label: 'Barangay Borabod' },
    { value: 'barangay-e', label: 'Barangay Calasgasan' }
  ];

  // DASH-04: Data varies based on selected barangay
  const getBarangayData = (barangay) => {
    const dataByBarangay = {
      'all': {
        totalStock: 2450,
        usedToday: 145,
        lowStockItems: 3,
        actualAlerts: 12,
        barangayName: 'All Barangays'
      },
      'barangay-a': {
        totalStock: 520,
        usedToday: 32,
        lowStockItems: 1,
        actualAlerts: 3,
        barangayName: 'Barangay Alawihao'
      },
      'barangay-b': {
        totalStock: 480,
        usedToday: 28,
        lowStockItems: 0,
        actualAlerts: 2,
        barangayName: 'Barangay Awitan'
      },
      'barangay-c': {
        totalStock: 610,
        usedToday: 38,
        lowStockItems: 1,
        actualAlerts: 4,
        barangayName: 'Barangay Bagasbas'
      },
      'barangay-d': {
        totalStock: 420,
        usedToday: 24,
        lowStockItems: 1,
        actualAlerts: 2,
        barangayName: 'Barangay Borabod'
      },
      'barangay-e': {
        totalStock: 420,
        usedToday: 23,
        lowStockItems: 0,
        actualAlerts: 1,
        barangayName: 'Barangay Calasgasan'
      }
    };
    return dataByBarangay[barangay] || dataByBarangay['all'];
  };

  const [dashboardData, setDashboardData] = useState({
    ...getBarangayData('all'),
    alerts: [
      {
        id: 1,
        message: '3 vaccine stocks are running low. Please reorder soon!',
        type: 'warning'
      }
    ],
    // DASH-03: Detailed alerts
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

  // DASH-04: Update data when barangay filter changes
  useEffect(() => {
    const newData = getBarangayData(selectedBarangay);
    setDashboardData(prev => ({
      ...prev,
      ...newData
    }));
  }, [selectedBarangay]);

  // DASH-01: Simulate real-time updates (auto-refresh)
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

  const handleBarangayChange = (e) => {
    setSelectedBarangay(e.target.value);
  };

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
        {/* DASH-04: Barangay Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Filter by Barangay</h2>
              <p className="text-xs text-gray-500 mt-0.5">View barangay-specific vaccine statistics</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Select Barangay:</label>
              <select
                value={selectedBarangay}
                onChange={handleBarangayChange}
                className="px-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent appearance-none cursor-pointer min-w-[200px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                {barangays.map((barangay) => (
                  <option key={barangay.value} value={barangay.value}>
                    {barangay.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedBarangay !== 'all' && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-[#3E5F44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600">
                Showing data for: <span className="font-semibold text-[#3E5F44]">{dashboardData.barangayName}</span>
              </span>
              <button
                onClick={() => setSelectedBarangay('all')}
                className="ml-auto text-xs font-medium text-[#3E5F44] hover:text-[#2d4532] flex items-center gap-1"
              >
                Clear Filter
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

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

        {/* DASH-03: Detailed Alerts Section */}
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

        {/* DASH-02: Charts Section */}
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

      {/* DASH-03: Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </DashboardLayout>
  );
}
