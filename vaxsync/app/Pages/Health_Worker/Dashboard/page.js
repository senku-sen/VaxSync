'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Stats Card Component
function StatsCard({ label, value, unit, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className={`text-4xl font-bold ${color} mb-1`}>{value}</p>
      <p className="text-xs text-gray-500">{unit}</p>
    </div>
  );
}

export default function HealthWorkerDashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Stock', value: 0, unit: 'Doses available', color: 'text-[#93DA97]' },
    { label: 'Used Today', value: 0, unit: 'Doses administered', color: 'text-[#93DA97]' },
    { label: 'Low Stock Alerts', value: 0, unit: 'Vaccines below threshold', color: 'text-[#93DA97]' },
    { label: 'Active Users', value: 0, unit: 'Health workers online', color: 'text-[#93DA97]' }
  ]);

  const [weeklyData, setWeeklyData] = useState([
    { day: 'Mon', usage: 0 },
    { day: 'Tue', usage: 0 },
    { day: 'Wed', usage: 0 },
    { day: 'Thu', usage: 0 },
    { day: 'Fri', usage: 0 },
    { day: 'Sat', usage: 0 },
    { day: 'Sun', usage: 0 }
  ]);

  const [barangayData, setBarangayData] = useState([
    { name: 'Barangay A', percentage: 0, color: '#3E5F44' },
    { name: 'Barangay B', percentage: 0, color: '#5E936C' },
    { name: 'Barangay C', percentage: 0, color: '#93DA97' },
    { name: 'Barangay D', percentage: 0, color: '#C8E6C9' }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { data: vaccines } = await supabase.from('barangay_vaccine_inventory').select('*');
        const { data: sessions } = await supabase.from('vaccination_sessions').select('*');
        const { data: workers } = await supabase.from('user_profiles').select('*').eq('role', 'health_worker');
        const { data: barangays } = await supabase.from('barangays').select('*');

        const totalStock = vaccines?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
        const lowStock = vaccines?.filter(v => (v.quantity || 0) < 50).length || 0;
        const today = new Date().toISOString().split('T')[0];
        const usedToday = sessions?.filter(s => s.session_date === today).reduce((sum, s) => sum + (s.administered || 0), 0) || 0;
        const activeUsers = workers?.length || 0;

        setStats([
          { label: 'Total Stock', value: totalStock, unit: 'Doses available', color: 'text-[#93DA97]' },
          { label: 'Used Today', value: usedToday, unit: 'Doses administered', color: 'text-[#93DA97]' },
          { label: 'Low Stock Alerts', value: lowStock, unit: 'Vaccines below threshold', color: 'text-[#93DA97]' },
          { label: 'Active Users', value: activeUsers, unit: 'Health workers online', color: 'text-[#93DA97]' }
        ]);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayUsage = sessions?.filter(s => s.session_date === dateStr).reduce((sum, s) => sum + (s.administered || 0), 0) || 0;
          weekData.push({ day: days[6 - i], usage: dayUsage });
        }
        setWeeklyData(weekData);

        if (barangays && barangays.length > 0) {
          const colors = ['#3E5F44', '#5E936C', '#93DA97', '#C8E6C9'];
          let totalSessions = 0;

          for (const barangay of barangays) {
            const count = sessions?.filter(s => s.barangay_id === barangay.id).length || 0;
            totalSessions += count;
          }

          const distributions = [];
          for (let i = 0; i < barangays.length; i++) {
            const barangay = barangays[i];
            const count = sessions?.filter(s => s.barangay_id === barangay.id).length || 0;
            const percentage = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
            distributions.push({
              name: barangay.name,
              percentage,
              color: colors[i % colors.length]
            });
          }
          setBarangayData(distributions);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getPieSlice = (percentage, startAngle) => {
    const radius = 60;
    const centerX = 100;
    const centerY = 100;
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = Math.round((centerX + radius * Math.cos(startRad)) * 1000) / 1000;
    const y1 = Math.round((centerY + radius * Math.sin(startRad)) * 1000) / 1000;
    const x2 = Math.round((centerX + radius * Math.cos(endRad)) * 1000) / 1000;
    const y2 = Math.round((centerY + radius * Math.sin(endRad)) * 1000) / 1000;

    const largeArc = angle > 180 ? 1 : 0;

    return {
      path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      labelX: Math.round((centerX + (radius * 0.65) * Math.cos((startRad + endRad) / 2)) * 100) / 100,
      labelY: Math.round((centerY + (radius * 0.65) * Math.sin((startRad + endRad) / 2)) * 100) / 100
    };
  };

  // Calculate line chart points
  const getLineChartPoints = () => {
    if (!weeklyData || weeklyData.length === 0) return [];
    
    const maxUsage = Math.max(...weeklyData.map(d => d.usage), 1);
    const chartWidth = 400;
    const chartHeight = 150;
    const padding = 40;
    const pointSpacing = weeklyData.length > 1 ? (chartWidth - padding * 2) / (weeklyData.length - 1) : 0;

    return weeklyData.map((data, index) => {
      const x = padding + index * pointSpacing;
      const y = chartHeight - (data.usage / maxUsage) * (chartHeight - padding);
      return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, ...data };
    });
  };

  const linePoints = getLineChartPoints();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Real-time vaccine inventory overview</p>
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
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.unit}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Usage Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Weekly Usage Trend</h2>
              <p className="text-sm text-gray-600 mb-6">Vaccine doses used per day</p>

              <svg width="100%" height="250" viewBox="0 0 480 200" className="mb-4">
                {/* Grid lines */}
                {[0, 45, 90, 135, 180].map((y, i) => (
                  <line key={`grid-${i}`} x1="40" y1={y} x2="460" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                ))}

                {/* Y-axis labels */}
                {[180, 135, 90, 45, 0].map((y, i) => (
                  <text key={`label-${i}`} x="20" y={y + 5} fontSize="12" fill="#9ca3af" textAnchor="end">
                    {i * 45}
                  </text>
                ))}

                {/* Line chart */}
                {linePoints.length > 0 && (
                  <polyline
                    points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#3E5F44"
                    strokeWidth="2"
                  />
                )}

                {/* Data points */}
                {linePoints.map((p, i) => (
                  <circle key={`point-${i}`} cx={Math.round(p.x)} cy={Math.round(p.y)} r="4" fill="#3E5F44" />
                ))}

                {/* X-axis labels */}
                {linePoints.map((p, i) => (
                  <text key={`day-${i}`} x={Math.round(p.x)} y="195" fontSize="12" fill="#9ca3af" textAnchor="middle">
                    {p.day}
                  </text>
                ))}

                {/* Legend */}
                <text x="200" y="220" fontSize="12" fill="#6b7280" textAnchor="middle">
                  ← usage
                </text>
              </svg>
            </div>

            {/* Distribution by Barangay Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Distribution by Barangay</h2>
              <p className="text-sm text-gray-600 mb-8">Vaccine allocation percentage</p>

              <div className="flex flex-col items-center justify-center">
                {/* Pie Chart */}
                <svg width="280" height="280" viewBox="0 0 200 200" className="mb-8">
                  {(() => {
                    let currentAngle = -90;
                    return barangayData.map((data, index) => {
                      const slice = getPieSlice(data.percentage, currentAngle);
                      const result = (
                        <g key={index}>
                          <path d={slice.path} fill={data.color} stroke="white" strokeWidth="2" />
                          {data.percentage > 5 && (
                            <text
                              x={slice.labelX}
                              y={slice.labelY}
                              fontSize="12"
                              fill="white"
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {data.percentage}%
                            </text>
                          )}
                        </g>
                      );
                      currentAngle += (data.percentage / 100) * 360;
                      return result;
                    });
                  })()}
                </svg>
              </div>

              {/* Legend - Horizontal Layout */}
              <div className="flex flex-wrap gap-4 justify-center">
                {barangayData.map((data, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: data.color }}></div>
                    <span className="text-sm text-gray-700 font-medium">{data.name}: {data.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
