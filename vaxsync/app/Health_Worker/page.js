'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import DistributionChart from '@/components/dashboard/DistributionChart';

export default function HealthWorkerDashboard() {
  // DASH-04: Barangay filter state
  const [selectedBarangay, setSelectedBarangay] = useState('all');

  const barangays = [
    { value: 'all', label: 'All Barangays' },
    { value: 'barangay-a', label: 'Barangay Alawihao' },
    { value: 'barangay-b', label: 'Barangay Awitan' },
    { value: 'barangay-c', label: 'Barangay Bagasbas' },
    { value: 'barangay-d', label: 'Barangay Borabod' },
    { value: 'barangay-e', label: 'Barangay Calasgasan' }
  ];

  // DASH-04: Get barangay-specific data
  const getBarangayData = (barangay) => {
    const dataByBarangay = {
      'all': {
        totalStock: 2450,
        usedToday: 145,
        lowStockItems: 3,
        activeUsers: 12,
        barangayName: 'All Barangays'
      },
      'barangay-a': {
        totalStock: 520,
        usedToday: 32,
        lowStockItems: 1,
        activeUsers: 3,
        barangayName: 'Barangay Alawihao'
      },
      'barangay-b': {
        totalStock: 480,
        usedToday: 28,
        lowStockItems: 0,
        activeUsers: 2,
        barangayName: 'Barangay Awitan'
      },
      'barangay-c': {
        totalStock: 610,
        usedToday: 38,
        lowStockItems: 1,
        activeUsers: 4,
        barangayName: 'Barangay Bagasbas'
      },
      'barangay-d': {
        totalStock: 420,
        usedToday: 24,
        lowStockItems: 1,
        activeUsers: 2,
        barangayName: 'Barangay Borabod'
      },
      'barangay-e': {
        totalStock: 420,
        usedToday: 23,
        lowStockItems: 0,
        activeUsers: 1,
        barangayName: 'Barangay Calasgasan'
      }
    };
    return dataByBarangay[barangay] || dataByBarangay['all'];
  };

  const [dashboardData, setDashboardData] = useState({
    ...getBarangayData('all')
  });

  // DASH-04: Get barangay-specific chart data
  const getBarangayChartData = (barangay) => {
    const chartDataByBarangay = {
      'all': {
        weeklyData: [
          { day: 'Mon', value: 120 },
          { day: 'Tue', value: 150 },
          { day: 'Wed', value: 100 },
          { day: 'Thu', value: 170 },
          { day: 'Fri', value: 130 },
          { day: 'Sat', value: 90 },
          { day: 'Sun', value: 80 }
        ],
        barangayDistribution: [
          { name: 'Barangay A', value: 35, color: '#3E5F44' },
          { name: 'Barangay B', value: 28, color: '#5E936C' },
          { name: 'Barangay C', value: 22, color: '#93DA97' },
          { name: 'Barangay D', value: 15, color: '#C8E6C9' }
        ]
      },
      'barangay-a': {
        weeklyData: [
          { day: 'Mon', value: 45 },
          { day: 'Tue', value: 52 },
          { day: 'Wed', value: 38 },
          { day: 'Thu', value: 60 },
          { day: 'Fri', value: 48 },
          { day: 'Sat', value: 32 },
          { day: 'Sun', value: 28 }
        ],
        barangayDistribution: [
          { name: 'Barangay Alawihao', value: 100, color: '#3E5F44' }
        ]
      },
      'barangay-b': {
        weeklyData: [
          { day: 'Mon', value: 35 },
          { day: 'Tue', value: 42 },
          { day: 'Wed', value: 30 },
          { day: 'Thu', value: 48 },
          { day: 'Fri', value: 38 },
          { day: 'Sat', value: 28 },
          { day: 'Sun', value: 22 }
        ],
        barangayDistribution: [
          { name: 'Barangay Awitan', value: 100, color: '#5E936C' }
        ]
      },
      'barangay-c': {
        weeklyData: [
          { day: 'Mon', value: 50 },
          { day: 'Tue', value: 58 },
          { day: 'Wed', value: 42 },
          { day: 'Thu', value: 68 },
          { day: 'Fri', value: 52 },
          { day: 'Sat', value: 38 },
          { day: 'Sun', value: 32 }
        ],
        barangayDistribution: [
          { name: 'Barangay Bagasbas', value: 100, color: '#93DA97' }
        ]
      },
      'barangay-d': {
        weeklyData: [
          { day: 'Mon', value: 30 },
          { day: 'Tue', value: 35 },
          { day: 'Wed', value: 25 },
          { day: 'Thu', value: 42 },
          { day: 'Fri', value: 32 },
          { day: 'Sat', value: 24 },
          { day: 'Sun', value: 20 }
        ],
        barangayDistribution: [
          { name: 'Barangay Borabod', value: 100, color: '#C8E6C9' }
        ]
      },
      'barangay-e': {
        weeklyData: [
          { day: 'Mon', value: 28 },
          { day: 'Tue', value: 33 },
          { day: 'Wed', value: 23 },
          { day: 'Thu', value: 40 },
          { day: 'Fri', value: 30 },
          { day: 'Sat', value: 23 },
          { day: 'Sun', value: 18 }
        ],
        barangayDistribution: [
          { name: 'Barangay Calasgasan', value: 100, color: '#E8FFD7' }
        ]
      }
    };
    return chartDataByBarangay[barangay] || chartDataByBarangay['all'];
  };

  const [chartData, setChartData] = useState(getBarangayChartData('all'));

  // Set user role for Health Worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', 'Health Worker');
    }
  }, []);

  // DASH-04: Update data when barangay filter changes
  useEffect(() => {
    const newData = getBarangayData(selectedBarangay);
    const newChartData = getBarangayChartData(selectedBarangay);
    setDashboardData(newData);
    setChartData(newChartData);
  }, [selectedBarangay]);

  // DASH-01: Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData(prev => ({
        ...prev,
        usedToday: prev.usedToday + Math.floor(Math.random() * 2)
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // DASH-04: Handle barangay change
  const handleBarangayChange = (e) => {
    setSelectedBarangay(e.target.value);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Dashboard - Health Worker</h1>
            <p className="text-xs text-gray-500 mt-0.5">Real-time vaccine inventory overview</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
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
              subtitle="doses available"
              valueColor="text-[#93DA97]"
            />
            <StatsCard
              title="Used Today"
              value={dashboardData.usedToday}
              subtitle="doses administered"
              valueColor="text-[#93DA97]"
            />
            <StatsCard
              title="Low Stock Items"
              value={dashboardData.lowStockItems}
              subtitle="vaccines below threshold"
              valueColor="text-[#93DA97]"
            />
            <StatsCard
              title="Active Users"
              value={dashboardData.activeUsers}
              subtitle="health workers online"
              valueColor="text-[#93DA97]"
            />
          </div>

          {/* NO Alert Banner for Health Worker - DASH-03 design decision */}

          {/* DASH-02: Charts Section - DASH-04: Charts update based on selected barangay */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">Weekly Usage Trend</h2>
                <p className="text-xs text-gray-500">
                  {selectedBarangay === 'all' 
                    ? 'Monitoring weekly vaccine distribution' 
                    : `${dashboardData.barangayName} weekly distribution`}
                </p>
              </div>
              <UsageTrendChart data={chartData.weeklyData} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">Distribution by Barangay</h2>
                <p className="text-xs text-gray-500">
                  {selectedBarangay === 'all' 
                    ? 'Current vaccine distribution' 
                    : `${dashboardData.barangayName} distribution`}
                </p>
              </div>
              <DistributionChart data={chartData.barangayDistribution} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
