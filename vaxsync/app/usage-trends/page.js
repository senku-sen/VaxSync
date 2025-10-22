'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MonthlyTrendChart from '@/components/trends/MonthlyTrendChart';
import BarangayComparisonChart from '@/components/trends/BarangayComparisonChart';
import VaccineTypeChart from '@/components/trends/VaccineTypeChart';

export default function UsageTrends() {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [selectedVaccine, setSelectedVaccine] = useState('all');

  const barangays = [
    'All Barangays',
    'Barangay A',
    'Barangay B',
    'Barangay C',
    'Barangay D'
  ];

  const vaccines = [
    'All Vaccines',
    'COVID-19',
    'Polio',
    'Measles',
    'Hepatitis B'
  ];

  const dateRanges = [
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'last-year', label: 'Last Year' }
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 flex items-start justify-between border-b border-gray-200">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Usage Trends & Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">Monitor vaccine usage patterns and consumption trends</p>
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
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  {dateRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Barangay Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  {barangays.map((barangay, index) => (
                    <option key={index} value={index === 0 ? 'all' : barangay.toLowerCase().replace(' ', '-')}>
                      {barangay}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vaccine Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vaccine Type</label>
                <select
                  value={selectedVaccine}
                  onChange={(e) => setSelectedVaccine(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  {vaccines.map((vaccine, index) => (
                    <option key={index} value={index === 0 ? 'all' : vaccine.toLowerCase().replace(' ', '-')}>
                      {vaccine}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="mt-5 flex justify-end">
              <button className="px-5 py-2.5 bg-[#3E5F44] text-white text-sm font-medium rounded-md hover:bg-[#2d4532] transition-colors shadow-sm">
                Apply Filters
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Total Doses Used</h3>
              <p className="text-2xl font-bold text-[#3E5F44]">3,245</p>
              <p className="text-xs text-gray-400 mt-1">In selected period</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Average Daily Usage</h3>
              <p className="text-2xl font-bold text-[#5E936C]">108</p>
              <p className="text-xs text-gray-400 mt-1">Doses per day</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Peak Usage Day</h3>
              <p className="text-2xl font-bold text-[#93DA97]">245</p>
              <p className="text-xs text-gray-400 mt-1">Highest recorded</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Growth Rate</h3>
              <p className="text-2xl font-bold text-green-600">+12%</p>
              <p className="text-xs text-gray-400 mt-1">vs previous period</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="space-y-5">
            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">Monthly Usage Trend</h2>
                <p className="text-xs text-gray-500">Vaccine consumption over time</p>
              </div>
              <MonthlyTrendChart dateRange={dateRange} selectedVaccine={selectedVaccine} />
            </div>

            {/* Two Column Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Barangay Comparison */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-gray-800">Usage by Barangay</h2>
                  <p className="text-xs text-gray-500">Comparison across locations</p>
                </div>
                <BarangayComparisonChart selectedBarangay={selectedBarangay} />
              </div>

              {/* Vaccine Type Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-gray-800">Usage by Vaccine Type</h2>
                  <p className="text-xs text-gray-500">Distribution of vaccine types</p>
                </div>
                <VaccineTypeChart selectedBarangay={selectedBarangay} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
