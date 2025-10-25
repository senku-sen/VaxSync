'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AlertCard from '@/components/alerts/AlertCard';
import AlertDetailModal from '@/components/alerts/AlertDetailModal';

export default function HeadNurseDashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // DASH-01: Dashboard summary data
  const [dashboardData, setDashboardData] = useState({
    totalStock: 2450,
    usedToday: 145,
    lowStockAlerts: 3,
    activeUsers: 12,
    lastUpdated: new Date().toLocaleTimeString()
  });

  // DASH-02: Weekly usage data
  const [weeklyData] = useState([
    { day: 'Mon', value: 120 },
    { day: 'Tue', value: 150 },
    { day: 'Wed', value: 100 },
    { day: 'Thu', value: 170 },
    { day: 'Fri', value: 130 },
    { day: 'Sat', value: 90 },
    { day: 'Sun', value: 80 }
  ]);

  // DASH-02: Barangay distribution data
  const [barangayData] = useState([
    { name: 'Barangay A', percentage: 35, color: '#3E5F44' },
    { name: 'Barangay B', percentage: 28, color: '#5E936C' },
    { name: 'Barangay C', percentage: 22, color: '#93DA97' },
    { name: 'Barangay D', percentage: 15, color: '#C8E6C9' }
  ]);
  
  // DASH-03: Alert data with automatic updates
  const [alertData, setAlertData] = useState({
    criticalAlerts: [
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
    warningAlerts: [
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
  });

  // Set user role for Head Nurse
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', 'Head Nurse');
    }
  }, []);

  // DASH-03: Auto-refresh alerts - updates automatically when thresholds are reached
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would fetch from API to check for new alerts
      // Simulating automatic alert updates
      console.log('Checking for new alerts...');
      // API call would go here: fetchAlerts()
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const totalAlerts = alertData.criticalAlerts.length + alertData.warningAlerts.length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard - Head Nurse</h1>
              <p className="text-sm text-gray-500 mt-1">Low-stock alerts and vaccine monitoring</p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell with Alert Count */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {totalAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {totalAlerts}
                  </span>
                )}
              </button>
              
              {/* User Profile */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
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

          {/* DASH-01: Alert Banner */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800">{dashboardData.lowStockAlerts} vaccine types are running low. Please reorder soon.</p>
          </div>

          {/* DASH-02: Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Weekly Usage Trend Chart */}
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
                  
                  {/* X-axis labels */}
                  {weeklyData.map((item, index) => (
                    <text key={item.day} x={60 + index * 60} y="230" fontSize="12" fill="#9ca3af">
                      {item.day}
                    </text>
                  ))}
                  
                  {/* Line chart */}
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
                  
                  {/* Data points */}
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

            {/* Distribution by Barangay Chart */}
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
                
                {/* Legend */}
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

          {/* DASH-03: Alert Summary Banner */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5 mb-6 flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-lg flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-1">
                {totalAlerts} Active Alert{totalAlerts !== 1 ? 's' : ''} Require Attention
              </h2>
              <p className="text-sm text-red-700">
                {alertData.criticalAlerts.length} critical alert{alertData.criticalAlerts.length !== 1 ? 's' : ''} and {alertData.warningAlerts.length} warning{alertData.warningAlerts.length !== 1 ? 's' : ''}. 
                Vaccines are nearing depletion or expiry. Please review and take action.
              </p>
            </div>
          </div>

          {/* DASH-03: Critical Alerts Section */}
          {alertData.criticalAlerts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                  {alertData.criticalAlerts.length}
                </span>
              </div>
              <div className="space-y-4">
                {alertData.criticalAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onClick={() => setSelectedAlert(alert)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* DASH-03: Warning Alerts Section */}
          {alertData.warningAlerts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Warning Alerts</h3>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-full">
                  {alertData.warningAlerts.length}
                </span>
              </div>
              <div className="space-y-4">
                {alertData.warningAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onClick={() => setSelectedAlert(alert)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Alerts State */}
          {totalAlerts === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
              <p className="text-sm text-gray-600">No low-stock or expiry alerts at this time. All vaccines are within safe levels.</p>
            </div>
          )}
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
