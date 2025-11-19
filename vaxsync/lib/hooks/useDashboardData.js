import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useDashboardData(selectedBarangay = 'all') {
  const [dashboardData, setDashboardData] = useState({
    totalStock: 0,
    usedToday: 0,
    lowStockItems: 0,
    actualAlerts: 0,
    barangayName: 'All Barangays'
  });
  const [chartData, setChartData] = useState({
    weeklyData: [],
    barangayDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedBarangay]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch inventory data
      let query = supabase.from('inventory').select('*');
      if (selectedBarangay !== 'all') {
        query = query.eq('barangay', selectedBarangay);
      }
      const { data: inventoryData, error: invError } = await query;
      if (invError) throw invError;

      // Fetch usage data (last 7 days)
      const { data: usageData, error: usageError } = await supabase
        .from('vaccine_usage')
        .select('*')
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      if (usageError) throw usageError;

      // Fetch alerts
      const { data: alertsData, error: alertError } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active');
      if (alertError) throw alertError;

      // Calculate dashboard stats
      const totalStock = inventoryData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const usedToday = usageData?.filter(item => {
        const itemDate = new Date(item.date).toDateString();
        const today = new Date().toDateString();
        return itemDate === today;
      }).reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      const lowStockItems = inventoryData?.filter(item => item.quantity < item.threshold).length || 0;
      const actualAlerts = alertsData?.length || 0;

      // Get barangay name
      const barangayMap = {
        'all': 'All Barangays',
        'barangay-a': 'Barangay Alawihao',
        'barangay-b': 'Barangay Awitan',
        'barangay-c': 'Barangay Bagasbas',
        'barangay-d': 'Barangay Borabod',
        'barangay-e': 'Barangay Calasgasan'
      };

      setDashboardData({
        totalStock,
        usedToday,
        lowStockItems,
        actualAlerts,
        barangayName: barangayMap[selectedBarangay] || 'All Barangays'
      });

      // Process chart data
      const weeklyData = processWeeklyData(usageData);
      const barangayDistribution = processBarangayDistribution(inventoryData);

      setChartData({
        weeklyData,
        barangayDistribution
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (usageData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyUsage = {};

    days.forEach(day => {
      weeklyUsage[day] = 0;
    });

    usageData?.forEach(item => {
      const date = new Date(item.date);
      const dayIndex = date.getDay();
      const dayName = days[(dayIndex + 6) % 7]; // Adjust for Monday start
      weeklyUsage[dayName] += item.quantity || 0;
    });

    return days.map(day => ({
      day,
      value: weeklyUsage[day]
    }));
  };

  const processBarangayDistribution = (inventoryData) => {
    const barangayMap = {
      'barangay-a': { name: 'Barangay A', color: '#3E5F44' },
      'barangay-b': { name: 'Barangay B', color: '#5E936C' },
      'barangay-c': { name: 'Barangay C', color: '#93DA97' },
      'barangay-d': { name: 'Barangay D', color: '#C8E6C9' }
    };

    const distribution = {};
    let total = 0;

    inventoryData?.forEach(item => {
      const barangay = item.barangay || 'barangay-a';
      distribution[barangay] = (distribution[barangay] || 0) + (item.quantity || 0);
      total += item.quantity || 0;
    });

    return Object.entries(distribution).map(([barangay, quantity]) => ({
      name: barangayMap[barangay]?.name || barangay,
      value: total > 0 ? Math.round((quantity / total) * 100) : 0,
      color: barangayMap[barangay]?.color || '#93DA97'
    }));
  };

  return { dashboardData, chartData, loading, error, refetch: fetchDashboardData };
}
