'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function HealthWorkerDashboard() {
  // DASH-01 ONLY: Dashboard data with real-time updates
  const [dashboardData, setDashboardData] = useState({
    totalStock: 2450,
    usedToday: 145,
    lowStockAlerts: 3,
    activeUsers: 12,
    lastUpdated: new Date().toLocaleTimeString()
  });

  // Set user role for Health Worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', 'Health Worker');
    }
  }, []);

  // DASH-01: Auto-refresh - updates automatically every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data updates
      // In production, this would fetch from API
      setDashboardData(prev => ({
        ...prev,
        usedToday: prev.usedToday + Math.floor(Math.random() * 2),
        lastUpdated: new Date().toLocaleTimeString()
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1">
          <div className="min-h-screen">
            {/* Header */}
            <div className="bg-white px-6 py-5 flex items-start justify-between border-b border-gray-200">
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
            <div className="p-8">
              {/* DASH-01: Summary Cards ONLY (No DASH-02 charts for Health Worker) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Stock Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Total Stock</p>
                  <p className="text-4xl font-bold text-[#5E936C] mb-1">{dashboardData.totalStock}</p>
                  <p className="text-xs text-gray-500">Doses available</p>
                </div>

                {/* Used Today Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Used Today</p>
                  <p className="text-4xl font-bold text-[#5E936C] mb-1">{dashboardData.usedToday}</p>
                  <p className="text-xs text-gray-500">Doses administered</p>
                </div>

                {/* Low Stock Alerts Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Low Stock Alerts</p>
                  <p className="text-4xl font-bold text-[#5E936C] mb-1">{dashboardData.lowStockAlerts}</p>
                  <p className="text-xs text-gray-500">Vaccines below threshold</p>
                </div>

                {/* Active Users Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Active Users</p>
                  <p className="text-4xl font-bold text-[#5E936C] mb-1">{dashboardData.activeUsers}</p>
                  <p className="text-xs text-gray-500">Health workers online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
