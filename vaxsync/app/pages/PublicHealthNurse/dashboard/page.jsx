'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { useAuth, AuthLoading } from '@/hooks/UseAuth';

export default function Page() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [weeklyData, setWeeklyData] = useState([]);
  const [barangayData, setBarangayData] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [vaccineTypes, setVaccineTypes] = useState([]);
  const [residentStats, setResidentStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get ALL vaccination sessions (Health Worker sees all barangays)
        const { data: sessions } = await supabase.from('VaccinationSessions').select('*');

        const { data: barangays } = await supabase.from('Barangays').select('*');
        const { data: vaccineList } = await supabase.from('Vaccines').select('id, name');

        // Get ALL residents (Health Worker sees all)
        const { data: residents } = await supabase.from('Residents').select('*');

        // Calculate weekly data (last 7 days)
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

        // Fetch vaccine distribution from backend API (all barangays)
        try {
          const distributionRes = await fetch(`/api/dashboard?role=health_worker`);
          if (distributionRes.ok) {
            const distributionData = await distributionRes.json();
            if (distributionData.success && distributionData.data.distribution.length > 0) {
              setBarangayData(distributionData.data.distribution);
            } else {
              setBarangayData([{
                name: 'No Data',
                percentage: 100,
                color: '#3E5F44',
                doses: 0
              }]);
            }
          }
        } catch (error) {
          console.error('Error fetching vaccine distribution:', error);
          setBarangayData([{
            name: 'No Data',
            percentage: 100,
            color: '#3E5F44',
            doses: 0
          }]);
        }

        // Calculate session statistics
        const scheduled = sessions?.filter(s => s.status === 'Scheduled').length || 0;
        const inProgress = sessions?.filter(s => s.status === 'In progress').length || 0;
        const completed = sessions?.filter(s => s.status === 'Completed').length || 0;
        const totalSessions = scheduled + inProgress + completed;
        const completionRate = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;

        console.log('📊 Health Worker Dashboard Data Loaded:', {
          sessions: sessions?.length,
          residents: residents?.length,
          scheduled,
          inProgress,
          completed,
          totalResidents: residents?.length,
          vaccineTypes: vaccineList?.length
        });

        setSessionStats({
          scheduled,
          inProgress,
          completed,
          completionRate
        });

        // Set vaccine types
        setVaccineTypes(vaccineList || []);

        // Calculate resident statistics
        const totalResidents = residents?.length || 0;
        const vaccinatedResidents = residents?.filter(r => r.vaccine_status === 'fully_vaccinated' || r.vaccine_status === 'vaccinated').length || 0;
        const pendingResidents = residents?.filter(r => r.status === 'pending').length || 0;
        const vaccinationRate = totalResidents > 0 ? Math.round((vaccinatedResidents / totalResidents) * 100) : 0;

        setResidentStats({
          total: totalResidents,
          vaccinated: vaccinatedResidents,
          pending: pendingResidents,
          vaccinationRate
        });
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, authLoading, isAuthenticated]);

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

  const getLineChartPoints = () => {
    const maxUsage = Math.max(...weeklyData.map(d => d.usage), 1);
    const chartWidth = 400;
    const chartHeight = 150;
    const padding = 40;
    const pointSpacing = (chartWidth - padding * 2) / 6;

    return weeklyData.map((data, index) => {
      const x = padding + index * pointSpacing;
      const y = chartHeight - (data.usage / maxUsage) * (chartHeight - padding);
      return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, ...data };
    });
  };

  const linePoints = getLineChartPoints();

  // Show loading while checking auth
  if (authLoading || !isAuthenticated) {
    return <AuthLoading />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-72 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error loading dashboard: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-72">
      <Header title="Dashboard" subtitle="Real-time vaccine program overview" />

      <div className="p-8">

        {/* Session Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600">Scheduled Sessions</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">{sessionStats.scheduled}</p>
            <p className="text-xs text-gray-500 mt-1">Upcoming sessions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-4xl font-bold text-yellow-600 mt-2">{sessionStats.inProgress}</p>
            <p className="text-xs text-gray-500 mt-1">Active sessions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600">Completed Sessions</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{sessionStats.completed}</p>
            <p className="text-xs text-gray-500 mt-1">Finished sessions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-4xl font-bold text-[#3E5F44] mt-2">{sessionStats.completionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Overall progress</p>
          </div>
        </div>

        {/* Resident Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600">Total Residents</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{residentStats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Registered beneficiaries</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600">Vaccinated</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{residentStats.vaccinated}</p>
            <p className="text-xs text-gray-500 mt-1">Fully vaccinated</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-600">Vaccination Rate</p>
            <p className="text-4xl font-bold text-[#3E5F44] mt-2">{residentStats.vaccinationRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Coverage percentage</p>
          </div>
        </div>

        {/* Vaccine Types Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Vaccines</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {vaccineTypes.map((vaccine, index) => (
              <div key={vaccine.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <p className="text-sm font-medium text-gray-800">{vaccine.name}</p>
                </div>
                <p className="text-xs text-gray-600">Vaccine Type</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
