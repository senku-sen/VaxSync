"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useOffline } from '@/components/OfflineProvider';
import { cacheData, getCachedData, generateTempId } from '@/lib/offlineStorage';
import { queueOperation } from '@/lib/syncManager';

/**
 * Hook for offline-first residents data management
 * 
 * @param {object} options - Configuration options
 * @returns {object} Residents data and CRUD methods
 */
export function useOfflineResidents(options = {}) {
  const {
    status = 'pending',
    search = '',
    barangay = ''
  } = options;

  const { isOnline, showNotification } = useOffline();
  
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const mountedRef = useRef(true);
  
  // Build cache key based on filters
  const cacheKey = `residents_${status}_${barangay || 'all'}`;

  /**
   * Fetch residents from API with offline fallback
   */
  const fetchResidents = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      status,
      search,
      barangay: barangay === 'all' ? '' : barangay
    });
    const endpoint = `/api/residents?${params}`;

    // Check online status - trust navigator.onLine directly for immediate checks
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine || isOnline) 
      : isOnline;

    if (actuallyOnline) {
      try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const responseData = await response.json();
        const residentsData = responseData?.residents || [];

        // Cache the response
        await cacheData(cacheKey, residentsData, 'residents');

        if (mountedRef.current) {
          setResidents(residentsData);
          setIsFromCache(false);
          setLoading(false);
        }
        return residentsData;

      } catch (err) {
        console.warn('Fetch failed, trying cache:', err.message);
        
        // Try to get cached data on fetch failure
        const cached = await getCachedData(cacheKey);
        
        if (cached && mountedRef.current) {
          setResidents(cached);
          setIsFromCache(true);
          setError(null);
          setLoading(false);
          return cached;
        }

        if (mountedRef.current) {
          setError(err.message);
          setLoading(false);
        }
        return [];
      }
    } else {
      // Offline - get from cache
      try {
        const cached = await getCachedData(cacheKey);
        
        if (cached && mountedRef.current) {
          setResidents(cached);
          setIsFromCache(true);
          setLoading(false);
          return cached;
        } else if (mountedRef.current) {
          setError('No cached data available while offline');
          setLoading(false);
          return [];
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message);
          setLoading(false);
        }
        return [];
      }
    }
  }, [status, search, barangay, isOnline, cacheKey]);

  /**
   * Create a new resident with offline support
   */
  const createResident = useCallback(async (residentData, submittedBy) => {
    const payload = { ...residentData, submitted_by: submittedBy };

    // Check online status - trust navigator.onLine directly
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine || isOnline) 
      : isOnline;

    if (actuallyOnline) {
      try {
        const response = await fetch('/api/residents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        showNotification?.('Resident created successfully!', 'success');
        await fetchResidents();
        return { success: true, data: result };

      } catch (err) {
        showNotification?.(`Failed to create resident: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      const tempId = generateTempId();

      await queueOperation({
        endpoint: '/api/residents',
        method: 'POST',
        body: payload,
        type: 'create',
        description: `Create resident: ${residentData.name}`,
        cacheKey,
        tempId
      });

      // Optimistic update
      setResidents(prev => [...prev, { ...payload, id: tempId, _pending: true }]);

      showNotification?.('Resident saved locally. Will sync when online.', 'info');
      return { success: true, pending: true, tempId };
    }
  }, [isOnline, cacheKey, fetchResidents, showNotification]);

  /**
   * Update a resident with offline support
   */
  const updateResident = useCallback(async (id, updateData) => {
    const originalResidents = [...residents];
    const payload = { id, ...updateData };

    // Optimistic update
    setResidents(prev => prev.map(r => 
      r.id === id ? { ...r, ...updateData, _pending: true } : r
    ));

    // Check online status - trust navigator.onLine directly
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine || isOnline) 
      : isOnline;

    if (actuallyOnline) {
      try {
        const response = await fetch('/api/residents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        showNotification?.('Resident updated successfully!', 'success');
        await fetchResidents();
        return { success: true };

      } catch (err) {
        // Revert
        setResidents(originalResidents);
        showNotification?.(`Failed to update resident: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      await queueOperation({
        endpoint: '/api/residents',
        method: 'PUT',
        body: payload,
        type: 'update',
        description: `Update resident ID: ${id}`,
        cacheKey
      });

      showNotification?.('Changes saved locally. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, residents, cacheKey, fetchResidents, showNotification]);

  /**
   * Delete a resident with offline support
   */
  const deleteResident = useCallback(async (id) => {
    const originalResidents = [...residents];

    // Optimistic update
    setResidents(prev => prev.filter(r => r.id !== id));

    // Check online status - trust navigator.onLine directly
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine || isOnline) 
      : isOnline;

    if (actuallyOnline) {
      try {
        const response = await fetch(`/api/residents?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        showNotification?.('Resident deleted successfully!', 'success');
        return { success: true };

      } catch (err) {
        // Revert
        setResidents(originalResidents);
        showNotification?.(`Failed to delete resident: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      await queueOperation({
        endpoint: '/api/residents',
        method: 'DELETE',
        params: { id },
        type: 'delete',
        description: `Delete resident ID: ${id}`,
        cacheKey
      });

      showNotification?.('Delete queued. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, residents, cacheKey, showNotification]);

  /**
   * Approve or reject a resident
   */
  const changeResidentStatus = useCallback(async (id, action) => {
    const originalResidents = [...residents];

    // Optimistic update - remove from current list
    setResidents(prev => prev.filter(r => r.id !== id));

    // Check online status - trust navigator.onLine directly
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine || isOnline) 
      : isOnline;

    if (actuallyOnline) {
      try {
        const response = await fetch('/api/residents', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        showNotification?.(`Resident ${action}d successfully!`, 'success');
        return { success: true };

      } catch (err) {
        // Revert
        setResidents(originalResidents);
        showNotification?.(`Failed to ${action} resident: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      await queueOperation({
        endpoint: '/api/residents',
        method: 'PATCH',
        body: { id, action },
        type: 'status_change',
        description: `${action} resident ID: ${id}`,
        cacheKey
      });

      showNotification?.(`${action} queued. Will sync when online.`, 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, residents, cacheKey, showNotification]);

  // Initial fetch and refetch when filters change
  useEffect(() => {
    mountedRef.current = true;
    fetchResidents();
    
    return () => {
      mountedRef.current = false;
    };
  }, [status, search, barangay]);

  return {
    // Data
    residents,
    loading,
    error,
    isFromCache,
    isOnline,
    
    // Methods
    createResident,
    updateResident,
    deleteResident,
    changeResidentStatus,
    refresh: fetchResidents,
    
    // Raw access for advanced use
    setResidents
  };
}

export default useOfflineResidents;
