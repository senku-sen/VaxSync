'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function HeadNurseDashboard() {
  // DASH-01: Dashboard data with real-time updates
  const [dashboardData, setDashboardData] = useState({
    totalStock: 2450,
    usedToday: 145,
    lowStockAlerts: 3,
    activeUsers: 12,
    lastUpdated: new Date().toLocaleTimeString()
  });

  // DASH-02: Weekly usage data (dynamic)
  const [weeklyData] = useState([
    { day: 'Mon', value: 120 },
    { day: 'Tue', value: 150 },
    { day: 'Wed', value: 100 },
    { day: 'Thu', value: 170 },
    { day: 'Fri', value: 130 },
    { day: 'Sat', value: 90 },
    { day: 'Sun', value: 80 }
  ]);

  // DASH-02: Barangay distribution data (dynamic)
  const [barangayData] = useState([
    { name: 'Barangay A', percentage: 35, color: '#3E5F44' },
    { name: 'Barangay B', percentage: 28, color: '#5E936C' },
    { name: 'Barangay C', percentage: 22, color: '#93DA97' },
    { name: 'Barangay D', percentage: 15, color: '#C8E6C9' }
  ]);

  // DASH-02: Filter states for date and barangay
  const [selectedDateRange, setSelectedDateRange] = useState('last-7-days');
  const [selectedBarangay, setSelectedBarangay] = useState('all');

  // Set user role for Head Nurse
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', 'Head Nurse');
    }
  }, []);

  // DASH-01: Auto-refresh - updates automatically every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data updates
      // In production, this would fetch from API
      setDashboardData(prev => ({
        ...prev,
        usedToday: prev.usedToday + Math.floor(Math.random() * 3),
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
              {/* DASH-01: Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

              {/* DASH-03: Alert Banner (Head Nurse Only) */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{dashboardData.lowStockAlerts} vaccine types are running low. Please reorder soon.</p>
              </div>

              {/* DASH-02: Filters Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Filter Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={selectedDateRange}
                      onChange={(e) => setSelectedDateRange(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="last-7-days">Last 7 Days</option>
                      <option value="last-30-days">Last 30 Days</option>
                      <option value="last-3-months">Last 3 Months</option>
                      <option value="last-6-months">Last 6 Months</option>
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
                      <option value="all">All Barangays</option>
                      <option value="barangay-a">Barangay A</option>
                      <option value="barangay-b">Barangay B</option>
                      <option value="barangay-c">Barangay C</option>
                      <option value="barangay-d">Barangay D</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Usage Trend Chart - Dynamic */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-800">Weekly Usage Trend</h3>
                    <p className="text-xs text-gray-500">Vaccine doses used per day</p>
                  </div>
                  <div className="h-64">
                    <svg className="w-full h-full" viewBox="0 0 500 250">
                      {/* Chart axes */}
                      <line x1="40" y1="10" x2="40" y2="210" stroke="#e5e7eb" strokeWidth="2"/>
                      <line x1="40" y1="210" x2="480" y2="210" stroke="#e5e7eb" strokeWidth="2"/>
                      
                      {/* Y-axis labels */}
                      <text x="25" y="15" fontSize="12" fill="#9ca3af">180</text>
                      <text x="25" y="65" fontSize="12" fill="#9ca3af">135</text>
                      <text x="30" y="115" fontSize="12" fill="#9ca3af">90</text>
                      <text x="30" y="165" fontSize="12" fill="#9ca3af">45</text>
                      <text x="35" y="215" fontSize="12" fill="#9ca3af">0</text>
                      
                      {/* X-axis labels - Dynamic */}
                      {weeklyData.map((item, index) => (
                        <text key={item.day} x={60 + index * 60} y="230" fontSize="12" fill="#9ca3af">
                          {item.day}
                        </text>
                      ))}
                      
                      {/* Line chart - Dynamic with animation */}
                      <polyline
                        points={weeklyData.map((item, index) => 
                          `${70 + index * 60},${210 - (item.value / 180) * 200}`
                        ).join(' ')}
                        fill="none"
                        stroke="#5E936C"
                        strokeWidth="3"
                        strokeDasharray="1000"
                        strokeDashoffset="1000"
                        style={{
                          animation: 'drawLine 2s ease-out forwards'
                        }}
                      />
                      
                      {/* Data points - Dynamic with animation */}
                      {weeklyData.map((item, index) => (
                        <circle
                          key={`point-${item.day}`}
                          cx={70 + index * 60}
                          cy={210 - (item.value / 180) * 200}
                          r="4"
                          fill="#5E936C"
                          style={{
                            animation: `fadeIn 0.5s ease-out ${0.3 + index * 0.1}s forwards`,
                            opacity: 0
                          }}
                        />
                      ))}
                      
                      {/* Legend */}
                      <line x1="200" y1="245" x2="220" y2="245" stroke="#5E936C" strokeWidth="2"/>
                      <text x="225" y="250" fontSize="11" fill="#6b7280">usage</text>
                      
                      <style>{`
                        @keyframes drawLine {
                          to { stroke-dashoffset: 0; }
                        }
                        @keyframes fadeIn {
                          to { opacity: 1; }
                        }
                      `}</style>
                    </svg>
                  </div>
                </div>

                {/* Distribution by Barangay Chart - Dynamic Pie Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-800">Distribution by Barangay</h3>
                    <p className="text-xs text-gray-500">Vaccine allocation percentage</p>
                  </div>
                  <div className="h-64 flex items-center justify-between">
                    <svg className="w-48 h-48" viewBox="0 0 200 200">
                      {(() => {
                        let currentAngle = -90;
                        return barangayData.map((item, index) => {
                          const angle = (item.percentage / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          currentAngle = endAngle;
                          
                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;
                          
                          // Round to 2 decimal places to avoid hydration mismatch
                          const x1 = Math.round((100 + 80 * Math.cos(startRad)) * 100) / 100;
                          const y1 = Math.round((100 + 80 * Math.sin(startRad)) * 100) / 100;
                          const x2 = Math.round((100 + 80 * Math.cos(endRad)) * 100) / 100;
                          const y2 = Math.round((100 + 80 * Math.sin(endRad)) * 100) / 100;
                          
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={item.name}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={item.color}
                              style={{
                                animation: `scaleIn 0.8s ease-out ${index * 0.2}s forwards`,
                                transformOrigin: '100px 100px',
                                opacity: 0
                              }}
                            />
                          );
                        });
                      })()}
                      
                      <style>{`
                        @keyframes scaleIn {
                          from { opacity: 0; transform: scale(0); }
                          to { opacity: 1; transform: scale(1); }
                        }
                      `}</style>
                    </svg>
                    
                    {/* Legend - Dynamic */}
                    <div className="flex flex-col gap-2">
                      {barangayData.map((item, index) => (
                        <div 
                          key={item.name} 
                          className="flex items-center gap-2"
                          style={{
                            animation: `slideIn 0.5s ease-out ${0.5 + index * 0.1}s forwards`,
                            opacity: 0
                          }}
                        >
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-gray-600">
                            {item.name}: {item.percentage}%
                          </span>
                        </div>
                      ))}
                      <style>{`
                        @keyframes slideIn {
                          from { opacity: 0; transform: translateX(-10px); }
                          to { opacity: 1; transform: translateX(0); }
                        }
                      `}</style>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
