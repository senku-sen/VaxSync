"use client";

import { useCallback, useEffect, useState } from 'react';
import { useOffline } from '@/components/OfflineProvider';
import { cacheData, getCachedData } from '@/lib/offlineStorage';
import { queueOperation } from '@/lib/syncManager';

/**
 * Hook for offline-first vaccine request management
 * 
 * @param {object} options - Configuration options
 * @returns {object} Vaccine requests data and methods
 */
export function useOfflineVaccineRequests(options = {}) {
  const { isAdmin = false, userId = null, barangayId = null } = options;
  const { isOnline, showNotification } = useOffline();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const cacheKey = isAdmin ? 'vaccine_requests_admin' : `vaccine_requests_${userId || 'all'}`;

  /**
   * Load vaccine requests with offline fallback
   */
  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isOnline) {
      try {
        const { loadVaccineRequestsData } = await import('@/lib/vaccineRequest');
        const { data, error: fetchError } = await loadVaccineRequestsData({ 
          isAdmin, 
          userId, 
          barangayId 
        });

        if (fetchError) throw new Error(fetchError);

        // Cache the data
        await cacheData(cacheKey, data || [], 'vaccine_requests');
        setRequests(data || []);
        setIsFromCache(false);
        setLoading(false);
        return data || [];

      } catch (err) {
        console.warn('Failed to fetch requests, trying cache:', err.message);
        
        // Try cache
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setRequests(cached);
          setIsFromCache(true);
          setLoading(false);
          return cached;
        }
        
        setError(err.message);
        setLoading(false);
        return [];
      }
    } else {
      // Offline - get from cache
      try {
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setRequests(cached);
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
        return [];
      }
    }
  }, [isOnline, isAdmin, userId, barangayId, cacheKey]);

  /**
   * Update request status (approve, reject, release)
   */
  const updateStatus = useCallback(async (requestId, newStatus, notes = '') => {
    const originalRequests = [...requests];

    // Optimistic update
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: newStatus, _pending: true }
        : req
    ));

    if (isOnline) {
      try {
        const { updateVaccineRequestStatus } = await import('@/lib/vaccineRequest');
        const result = await updateVaccineRequestStatus(requestId, newStatus, notes);

        if (!result.success) throw new Error(result.error || 'Update failed');

        showNotification?.(`Request ${newStatus} successfully!`, 'success');
        await loadRequests();
        return { success: true };

      } catch (err) {
        // Revert
        setRequests(originalRequests);
        showNotification?.(`Failed to update: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      await queueOperation({
        endpoint: '/api/vaccine-requests/status',
        method: 'PATCH',
        body: { id: requestId, status: newStatus, notes },
        type: 'status_update',
        description: `Update request ${requestId} to ${newStatus}`,
        cacheKey
      });

      showNotification?.('Status change queued. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, requests, cacheKey, loadRequests, showNotification]);

  /**
   * Create a new vaccine request
   */
  const createRequest = useCallback(async (requestData) => {
    if (isOnline) {
      try {
        const { createVaccineRequest } = await import('@/lib/vaccineRequest');
        const result = await createVaccineRequest(requestData);

        if (!result.success) throw new Error(result.error || 'Create failed');

        showNotification?.('Request created successfully!', 'success');
        await loadRequests();
        return { success: true, data: result.data };

      } catch (err) {
        showNotification?.(`Failed to create: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      const { generateTempId } = await import('@/lib/offlineStorage');
      const tempId = generateTempId();

      await queueOperation({
        endpoint: '/api/vaccine-requests',
        method: 'POST',
        body: requestData,
        type: 'create',
        description: 'Create vaccine request',
        cacheKey,
        tempId
      });

      // Optimistic update
      setRequests(prev => [...prev, { ...requestData, id: tempId, _pending: true, status: 'pending' }]);

      showNotification?.('Request saved locally. Will sync when online.', 'info');
      return { success: true, pending: true, tempId };
    }
  }, [isOnline, cacheKey, loadRequests, showNotification]);

  /**
   * Delete a vaccine request
   */
  const deleteRequest = useCallback(async (requestId) => {
    const originalRequests = [...requests];

    // Optimistic update
    setRequests(prev => prev.filter(req => req.id !== requestId));

    if (isOnline) {
      try {
        const { deleteVaccineRequestData } = await import('@/lib/vaccineRequest');
        const result = await deleteVaccineRequestData(requestId);

        if (!result.success) throw new Error(result.error || 'Delete failed');

        showNotification?.('Request deleted successfully!', 'success');
        return { success: true };

      } catch (err) {
        // Revert
        setRequests(originalRequests);
        showNotification?.(`Failed to delete: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      await queueOperation({
        endpoint: '/api/vaccine-requests',
        method: 'DELETE',
        body: { id: requestId },
        type: 'delete',
        description: `Delete request ${requestId}`,
        cacheKey
      });

      showNotification?.('Delete queued. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, requests, cacheKey, showNotification]);

  // Initial fetch
  useEffect(() => {
    loadRequests();
  }, []);

  return {
    requests,
    loading,
    error,
    isFromCache,
    isOnline,
    loadRequests,
    updateStatus,
    createRequest,
    deleteRequest,
    setRequests
  };
}

export default useOfflineVaccineRequests;

