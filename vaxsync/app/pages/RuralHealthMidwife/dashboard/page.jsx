'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { useAuth, AuthLoading } from '@/hooks/UseAuth';

export default function Page() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [weeklyData, setWeeklyData] = useState([]);
  const [barangayData, setBarangayData] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [vaccineTypes, setVaccineTypes] = useState([]);
  const [residentStats, setResidentStats] = useState({});
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [vaccineRequests, setVaccineRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || authLoading || !user) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user profile to find assigned barangay
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const { data: userProfile } = await supabase
          .from('UserProfiles')
          .select('assigned_barangay_id')
          .eq('id', authUser.id)
          .single();

        const barangayId = userProfile?.assigned_barangay_id;

        // Get sessions for this barangay only (Head Nurse sees only their assigned barangay)
        let sessionsQuery = supabase.from('VaccinationSessions').select('*');
        if (barangayId) {
          sessionsQuery = sessionsQuery.eq('barangay_id', barangayId);
        }
        const { data: sessions, error: sessionsError } = await sessionsQuery;
        
        if (sessionsError) {
          console.error('Sessions error:', sessionsError);
        }

        const { data: vaccineList, error: vaccineError } = await supabase
          .from('Vaccines')
          .select('id, name');
        
        if (vaccineError) {
          console.error('Vaccine error:', vaccineError);
        }

        // Get residents for this barangay only
        let residentsQuery = supabase.from('Residents').select('*');
        if (barangayId) {
          // Get barangay name first
          const { data: barangayData } = await supabase
            .from('Barangays')
            .select('name')
            .eq('id', barangayId)
            .single();
          
          if (barangayData?.name) {
            residentsQuery = residentsQuery.eq('barangay', barangayData.name);
          }
        }
        const { data: residents, error: residentsError } = await residentsQuery;
        
        if (residentsError) {
          console.error('Residents error:', residentsError);
        }

        // Get upcoming vaccination sessions (next 7 days) - for this barangay only
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        let upcomingQuery = supabase
          .from('VaccinationSessions')
          .select('*, Vaccines(name)')
          .gte('session_date', today)
          .lte('session_date', nextWeekStr);
        
        if (barangayId) {
          upcomingQuery = upcomingQuery.eq('barangay_id', barangayId);
        }
        
        const { data: upcoming } = await upcomingQuery
          .order('session_date', { ascending: true })
          .order('session_time', { ascending: true });
        setUpcomingSessions(upcoming || []);
        
        // Get vaccine requests for this barangay only
        let requestsQuery = supabase
          .from('VaccineRequests')
          .select('*, Vaccines(name)');
        
        if (barangayId) {
          requestsQuery = requestsQuery.eq('barangay_id', barangayId);
        }
        
        const { data: requests } = await requestsQuery
          .order('created_at', { ascending: false });
        setVaccineRequests(requests || []);

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

        // Fetch vaccine distribution from backend API (specific barangay)
        try {
          const apiUrl = barangayId 
            ? `/api/dashboard?barangay_id=${barangayId}&role=head_nurse`
            : `/api/dashboard?role=head_nurse`;
          
          const distributionRes = await fetch(apiUrl);
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

        console.log('📊 Dashboard Data Loaded:', {
          barangayId,
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
        const vaccinationRate = totalResidents > 0 ? Math.round((vaccinatedResidents / totalResidents) * 100) : 0;

        setResidentStats({
          total: totalResidents,
          vaccinated: vaccinatedResidents,
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
  }, [isAuthenticated, authLoading, user, user?.id]);

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
        <div className="flex-1 lg:ml-72">
          <Header title="Dashboard" subtitle="Real-time vaccine program overview" />
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">Error loading dashboard: {error}</p>
            </div>
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

          {/* Resident Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="text-sm text-gray-600">Total Residents</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{residentStats.total || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Registered beneficiaries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Available Vaccines Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Vaccines</h2>
              <div className="grid grid-cols-2 gap-3">
                {vaccineTypes.map((vaccine, index) => (
                  <div key={vaccine.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      <p className="text-sm font-medium text-gray-800">{vaccine.name}</p>
                    </div>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h2>
                <span className="text-sm text-blue-600">Next 7 days</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800">{new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-sm text-gray-600">{session.Vaccines?.name || 'Vaccine'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{session.target - (session.administered || 0)} slots left</p>
                        <p className="text-xs text-gray-500">{session.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming sessions scheduled</p>
                )}
              </div>
            </div>
          </div>

          {/* Vaccine Requests */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Vaccine Requests</h2>
                <span className="text-sm text-blue-600">Recent Activity</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {vaccineRequests.length > 0 ? (
                  vaccineRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800">{request.Vaccines?.name || 'Vaccine'}</p>
                        <p className="text-sm text-gray-600">{request.quantity_dose} doses requested</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent vaccine requests</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
