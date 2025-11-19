import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAlerts() {
  const [alertData, setAlertData] = useState({
    criticalAlerts: [],
    warningAlerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to real-time alerts
    const subscription = supabase
      .channel('alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Separate critical and warning alerts
      const critical = data?.filter(alert => alert.severity === 'critical') || [];
      const warning = data?.filter(alert => alert.severity === 'warning') || [];

      setAlertData({
        criticalAlerts: critical,
        warningAlerts: warning
      });
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'dismissed' })
        .eq('id', alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  return { alertData, loading, error, dismissAlert, refetch: fetchAlerts };
}
