'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MonthlyTrendChart from '@/components/trends/MonthlyTrendChart';
import BarangayComparisonChart from '@/components/trends/BarangayComparisonChart';
import VaccineTypeChart from '@/components/trends/VaccineTypeChart';

export default function UsageTrendsPage() {
  const [filters, setFilters] = useState({
    dateRange: '30',
    barangay: 'all',
    vaccineType: 'all'
  });

  const [stats] = useState({
    totalDoses: 12450,
    averageDaily: 415,
    peakDay: 'Thursday',
    growthRate: '+12.5%'
  });

  const [monthlyData] = useState([
    { month: 'Jan', value: 850 },
    { month: 'Feb', value: 920 },
    { month: 'Mar', value: 1100 },
    { month: 'Apr', value: 980 },
    { month: 'May', value: 1200 },
    { month: 'Jun', value: 1050 },
    { month: 'Jul', value: 1300 },
    { month: 'Aug', value: 1150 },
    { month: 'Sep', value: 1400 },
    { month: 'Oct', value: 1250 },
    { month: 'Nov', value: 1350 },
    { month: 'Dec', value: 900 }
  ]);

  const [barangayData] = useState([
    { name: 'Alawihao', value: 3200, color: '#3E5F44' },
    { name: 'Awitan', value: 2800, color: '#5E936C' },
    { name: 'Bagasbas', value: 3500, color: '#93DA97' },
    { name: 'Borabod', value: 2950, color: '#C8E6C9' }
  ]);

  const [vaccineTypeData] = useState([
    { name: 'COVID-19', value: 35, color: '#3E5F44' },
    { name: 'Polio', value: 25, color: '#5E936C' },
    { name: 'Measles', value: 20, color: '#93DA97' },
    { name: 'Hepatitis B', value: 12, color: '#C8E6C9' },
    { name: 'Others', value: 8, color: '#E8FFD7' }
  ]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Usage Trends & Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">Monitor vaccine usage patterns and trends</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="180">Last 6 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                <select
                  value={filters.barangay}
                  onChange={(e) => handleFilterChange('barangay', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                >
                  <option value="all">All Barangays</option>
                  <option value="alawihao">Barangay Alawihao</option>
                  <option value="awitan">Barangay Awitan</option>
                  <option value="bagasbas">Barangay Bagasbas</option>
                  <option value="borabod">Barangay Borabod</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vaccine Type</label>
                <select
                  value={filters.vaccineType}
                  onChange={(e) => handleFilterChange('vaccineType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                >
                  <option value="all">All Vaccines</option>
                  <option value="covid">COVID-19</option>
                  <option value="polio">Polio</option>
                  <option value="measles">Measles</option>
                  <option value="hepatitis">Hepatitis B</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">Total Doses Used</p>
              <p className="text-2xl font-bold text-[#3E5F44]">{stats.totalDoses.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">Average Daily</p>
              <p className="text-2xl font-bold text-[#5E936C]">{stats.averageDaily}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">Peak Usage Day</p>
              <p className="text-2xl font-bold text-[#93DA97]">{stats.peakDay}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">Growth Rate</p>
              <p className="text-2xl font-bold text-green-600">{stats.growthRate}</p>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Usage Trend</h2>
            <MonthlyTrendChart data={monthlyData} />
          </div>

          {/* Barangay Comparison and Vaccine Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Barangay Comparison</h2>
              <BarangayComparisonChart data={barangayData} />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Vaccine Type Distribution</h2>
              <VaccineTypeChart data={vaccineTypeData} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
