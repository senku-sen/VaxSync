'use client';

import { useState } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import DistributionChart from '@/components/dashboard/DistributionChart';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useAlerts } from '@/lib/hooks/useAlerts';
import { useBarangays } from '@/lib/hooks/useBarangays';

export default function HeadNurseDashboard() {
  // DASH-04: Barangay filter state
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Fetch data from Supabase
  const { dashboardData, chartData, loading, error } = useDashboardData(selectedBarangay);
  const { alertData } = useAlerts();
  const { barangays } = useBarangays();

  // Convert barangays to dropdown format
  const barangayOptions = barangays.map(b => ({
    value: b.code,
    label: b.name
  }));

  const handleBarangayChange = (e) => {
    setSelectedBarangay(e.target.value);
  };

  const handleClearFilter = () => {
    setSelectedBarangay('all');
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
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
            <p className="text-sm text-gray-500 mt-1">Real-time vaccine inventory overview - Head Nurse</p>
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
          {/* DASH-04: Barangay Filter Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter by Barangay:</label>
                <select
                  value={selectedBarangay}
                  onChange={handleBarangayChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                >
                  {barangayOptions.map(brgy => (
                    <option key={brgy.value} value={brgy.value}>{brgy.label}</option>
                  ))}
                </select>
              </div>

              {/* Active Filter Indicator */}
              {selectedBarangay !== 'all' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-[#3E5F44]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Showing data for: {barangayOptions.find(b => b.value === selectedBarangay)?.label}</span>
                  </div>
                  <button
                    onClick={handleClearFilter}
                    className="px-3 py-1 text-sm text-white bg-[#3E5F44] rounded-md hover:bg-[#2d4532] transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
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
              subtitle="Urgent items critical"
              valueColor="text-[#93DA97]"
            />
          </div>

          {/* DASH-03: Alert Banner */}
          {dashboardData.lowStockItems > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 text-sm flex-1">
                <strong>Alert:</strong> {dashboardData.lowStockItems} vaccine stocks are running low. Please reorder soon!
              </p>
            </div>
          )}

          {/* DASH-03: Stock Alerts Section */}
          {(alertData.criticalAlerts.length > 0 || alertData.warningAlerts.length > 0) && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Stock Alerts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Critical Alerts */}
                {alertData.criticalAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900">{alert.vaccine_name}</h3>
                        <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                        <p className="text-xs text-red-600 mt-2">Stock: {alert.current_stock} / Threshold: {alert.threshold}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Warning Alerts */}
                {alertData.warningAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-900">{alert.vaccine_name}</h3>
                        <p className="text-sm text-yellow-700 mt-1">{alert.message}</p>
                        <p className="text-xs text-yellow-600 mt-2">Stock: {alert.current_stock} / Threshold: {alert.threshold}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Alert Detail Modal */}
      {showAlertModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Alert Details</h2>
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-gray-500">Vaccine</p>
                  <p className="text-sm font-medium text-gray-800">{selectedAlert.vaccine_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Batch</p>
                  <p className="text-sm font-medium text-gray-800">{selectedAlert.batch}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Stock</p>
                  <p className="text-sm font-medium text-gray-800">{selectedAlert.current_stock} doses</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Threshold</p>
                  <p className="text-sm font-medium text-gray-800">{selectedAlert.threshold} doses</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-800">{selectedAlert.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Alert Type</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{selectedAlert.alert_type}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#3E5F44] rounded-lg hover:bg-[#2d4532] transition-colors">
                  Request Replenishment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
