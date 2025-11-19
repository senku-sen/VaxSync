'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useBarangays() {
  const [barangays, setBarangays] = useState([
    { code: 'all', name: 'All Barangays' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBarangays();
  }, []);

  const fetchBarangays = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch barangays from Supabase
      const { data, error: err } = await supabase
        .from('barangays')
        .select('*')
        .order('name', { ascending: true });

      if (err) {
        console.error('Supabase error:', err);
        throw err;
      }

      if (!data || data.length === 0) {
        console.warn('No barangays found in Supabase');
        throw new Error('No barangays found');
      }

      // Map data to ensure correct field names
      const mappedData = data.map(item => ({
        code: item.code || item.id,
        name: item.name || item.barangay_name || 'Unknown'
      }));

      // Add "All Barangays" option at the beginning
      const allBarangays = [
        { code: 'all', name: 'All Barangays' },
        ...mappedData
      ];

      console.log('Barangays loaded:', allBarangays);
      setBarangays(allBarangays);
    } catch (err) {
      console.error('Error fetching barangays:', err);
      setError(err?.message || 'Failed to fetch barangays');
      // Fallback to default barangays if fetch fails
      console.log('Using fallback barangays');
      setBarangays([
        { code: 'all', name: 'All Barangays' },
        { code: 'barangay-a', name: 'Barangay Alawihao' },
        { code: 'barangay-b', name: 'Barangay Awitan' },
        { code: 'barangay-c', name: 'Barangay Bagasbas' },
        { code: 'barangay-d', name: 'Barangay Borabod' },
        { code: 'barangay-e', name: 'Barangay Calasgasan' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { barangays, loading, error, refetch: fetchBarangays };
}
