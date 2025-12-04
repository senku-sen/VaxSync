"use client";

import { useCallback, useEffect, useState } from 'react';
import { useOfflineApi } from './useOfflineApi';
import { useOffline } from '@/components/OfflineProvider';
import { cacheData, getCachedData } from '@/lib/offlineStorage';

/**
 * Hook for offline-first inventory data management
 * Works with Supabase directly for fetching, but queues mutations when offline
 * 
 * @param {object} options - Configuration options
 * @returns {object} Inventory data and CRUD methods
 */
export function useOfflineInventory(options = {}) {
  const { barangayId = null } = options;
  const { isOnline, showNotification } = useOffline();
  
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const cacheKey = barangayId ? `inventory_${barangayId}` : 'inventory_all';

  /**
   * Fetch vaccines from Supabase with offline fallback
   */
  const fetchVaccines = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isOnline) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        let query = supabase
          .from('vaccines')
          .select('*')
          .order('name', { ascending: true });

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Cache the data
        await cacheData(cacheKey, data || [], 'inventory');
        setVaccines(data || []);
        setIsFromCache(false);
        setLoading(false);
        return data || [];

      } catch (err) {
        console.warn('Failed to fetch vaccines, trying cache:', err.message);
        
        // Try cache
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setVaccines(cached);
          setIsFromCache(true);
          setLoading(false);
          return cached;
        }
        
        setError(err.message);
        setLoading(false);
        throw err;
      }
    } else {
      // Offline - get from cache
      try {
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setVaccines(cached);
          setIsFromCache(true);
          setLoading(false);
          return cached;
        }
        setError('No cached data available while offline');
        setLoading(false);
        return [];
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    }
  }, [isOnline, cacheKey]);

  /**
   * Add vaccine doses with offline support
   */
  const addVaccineDoses = useCallback(async (vaccineId, dosesToAdd, vialsToAdd = 0) => {
    if (isOnline) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        // Get current vaccine data
        const { data: vaccine, error: fetchError } = await supabase
          .from('vaccines')
          .select('quantity_doses, quantity_vials')
          .eq('id', vaccineId)
          .single();

        if (fetchError) throw fetchError;

        // Update with new quantities
        const { error: updateError } = await supabase
          .from('vaccines')
          .update({
            quantity_doses: (vaccine.quantity_doses || 0) + dosesToAdd,
            quantity_vials: (vaccine.quantity_vials || 0) + vialsToAdd
          })
          .eq('id', vaccineId);

        if (updateError) throw updateError;

        showNotification?.('Vaccine doses added successfully!', 'success');
        await fetchVaccines();
        return { success: true };

      } catch (err) {
        showNotification?.(`Failed to add doses: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      const { queueOperation } = await import('@/lib/syncManager');
      
      await queueOperation({
        endpoint: '/api/inventory/add-doses',
        method: 'POST',
        body: { vaccineId, dosesToAdd, vialsToAdd },
        type: 'inventory_update',
        description: `Add ${dosesToAdd} doses to vaccine`,
        cacheKey
      });

      // Optimistic update
      setVaccines(prev => prev.map(v => 
        v.id === vaccineId 
          ? { 
              ...v, 
              quantity_doses: (v.quantity_doses || 0) + dosesToAdd,
              quantity_vials: (v.quantity_vials || 0) + vialsToAdd,
              _pending: true 
            }
          : v
      ));

      showNotification?.('Changes saved locally. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, cacheKey, fetchVaccines, showNotification]);

  /**
   * Delete vaccine with offline support
   */
  const deleteVaccine = useCallback(async (vaccineId) => {
    const originalVaccines = [...vaccines];

    // Optimistic update
    setVaccines(prev => prev.filter(v => v.id !== vaccineId));

    if (isOnline) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        const { error: deleteError } = await supabase
          .from('vaccines')
          .delete()
          .eq('id', vaccineId);

        if (deleteError) throw deleteError;

        showNotification?.('Vaccine deleted successfully!', 'success');
        return { success: true };

      } catch (err) {
        // Revert
        setVaccines(originalVaccines);
        showNotification?.(`Failed to delete: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      const { queueOperation } = await import('@/lib/syncManager');
      
      await queueOperation({
        endpoint: '/api/inventory',
        method: 'DELETE',
        body: { id: vaccineId },
        type: 'delete',
        description: `Delete vaccine ID: ${vaccineId}`,
        cacheKey
      });

      showNotification?.('Delete queued. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, vaccines, cacheKey, showNotification]);

  // Initial fetch
  useEffect(() => {
    fetchVaccines();
  }, []);

  return {
    vaccines,
    loading,
    error,
    isFromCache,
    isOnline,
    fetchVaccines,
    addVaccineDoses,
    deleteVaccine,
    setVaccines
  };
}

export default useOfflineInventory;

