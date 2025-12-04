"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  cacheData,
  getCachedData,
  addPendingOperation,
  applyOperationToCache,
  generateTempId
} from '@/lib/offlineStorage';
import { queueOperation, syncAll } from '@/lib/syncManager';

/**
 * Hook for offline-first data fetching with optimistic updates
 * 
 * @param {string} endpoint - API endpoint
 * @param {object} options - Configuration options
 * @returns {object} Data, loading state, and mutation functions
 */
export function useOfflineData(endpoint, options = {}) {
  const {
    cacheKey = endpoint,
    autoFetch = true,
    onError,
    transformData,
    dataExtractor = (response) => response, // Function to extract data from response
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef(null);

  /**
   * Check if we're online
   */
  const checkOnline = useCallback(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }, []);

  /**
   * Fetch data from API and cache it
   */
  const fetchData = useCallback(async (fetchOptions = {}) => {
    const { silent = false, params = {} } = fetchOptions;

    if (!silent) setLoading(true);
    setError(null);

    const isOnline = checkOnline();

    // Build URL with params
    let url = endpoint;
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url = `${endpoint}?${queryString}`;
    }

    // Generate cache key with params
    const actualCacheKey = Object.keys(params).length > 0 
      ? `${cacheKey}_${JSON.stringify(params)}`
      : cacheKey;

    if (isOnline) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        let responseData = await response.json();
        
        // Transform data if transformer provided
        if (transformData) {
          responseData = transformData(responseData);
        }

        // Extract actual data
        const extractedData = dataExtractor(responseData);

        // Cache the response
        await cacheData(actualCacheKey, responseData, 'api');

        if (mountedRef.current) {
          setData(responseData);
          setIsFromCache(false);
          lastFetchRef.current = Date.now();
        }

        return responseData;

      } catch (err) {
        console.warn('Fetch failed, trying cache:', err.message);
        
        // Try to get cached data on fetch failure
        const cached = await getCachedData(actualCacheKey);
        
        if (cached) {
          if (mountedRef.current) {
            setData(cached);
            setIsFromCache(true);
            setError(null);
          }
          return cached;
        }

        if (mountedRef.current) {
          setError(err.message);
          if (onError) onError(err);
        }
        throw err;
      } finally {
        if (mountedRef.current && !silent) {
          setLoading(false);
        }
      }
    } else {
      // Offline - get from cache
      try {
        const cached = await getCachedData(actualCacheKey);
        
        if (cached) {
          if (mountedRef.current) {
            setData(cached);
            setIsFromCache(true);
            setLoading(false);
          }
          return cached;
        } else {
          const offlineError = 'No cached data available while offline';
          if (mountedRef.current) {
            setError(offlineError);
            setLoading(false);
            if (onError) onError(new Error(offlineError));
          }
          return null;
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message);
          setLoading(false);
          if (onError) onError(err);
        }
        throw err;
      }
    }
  }, [endpoint, cacheKey, checkOnline, transformData, dataExtractor, onError]);

  /**
   * Create a new item (POST)
   */
  const create = useCallback(async (itemData, createOptions = {}) => {
    const { 
      description = 'Create item',
      optimisticUpdate = true 
    } = createOptions;

    const isOnline = checkOnline();
    const tempId = generateTempId();

    // Optimistic update
    if (optimisticUpdate && data) {
      const optimisticItem = { ...itemData, id: tempId, _pending: true };
      
      // Update local state immediately
      setData(prevData => {
        if (Array.isArray(prevData)) {
          return [...prevData, optimisticItem];
        } else if (prevData?.residents) {
          return { ...prevData, residents: [...prevData.residents, optimisticItem] };
        }
        return prevData;
      });

      // Apply to cache
      await applyOperationToCache(cacheKey, {
        method: 'POST',
        body: itemData,
        tempId
      });
    }

    if (isOnline) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        
        // Update with real data from server
        if (mountedRef.current) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return prevData.map(item => 
                item.id === tempId ? { ...result, _pending: false } : item
              );
            } else if (prevData?.residents) {
              return {
                ...prevData,
                residents: prevData.residents.map(item =>
                  item.id === tempId ? { ...result, _pending: false } : item
                )
              };
            }
            return prevData;
          });
        }

        // Refresh data from server
        await fetchData({ silent: true });

        return { success: true, data: result };

      } catch (err) {
        // Revert optimistic update on error
        if (optimisticUpdate) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return prevData.filter(item => item.id !== tempId);
            } else if (prevData?.residents) {
              return {
                ...prevData,
                residents: prevData.residents.filter(item => item.id !== tempId)
              };
            }
            return prevData;
          });
        }
        return { success: false, error: err.message };
      }
    } else {
      // Offline - queue the operation
      await queueOperation({
        endpoint,
        method: 'POST',
        body: itemData,
        type: 'create',
        description,
        cacheKey,
        tempId
      });

      return { success: true, pending: true, tempId };
    }
  }, [endpoint, cacheKey, data, checkOnline, fetchData]);

  /**
   * Update an existing item (PUT/PATCH)
   */
  const update = useCallback(async (id, updateData, updateOptions = {}) => {
    const {
      method = 'PATCH',
      description = 'Update item',
      optimisticUpdate = true
    } = updateOptions;

    const isOnline = checkOnline();
    const payload = { id, ...updateData };

    // Store original data for rollback
    let originalItem = null;

    // Optimistic update
    if (optimisticUpdate && data) {
      setData(prevData => {
        if (Array.isArray(prevData)) {
          originalItem = prevData.find(item => item.id === id);
          return prevData.map(item =>
            item.id === id ? { ...item, ...updateData, _pending: true } : item
          );
        } else if (prevData?.residents) {
          originalItem = prevData.residents.find(item => item.id === id);
          return {
            ...prevData,
            residents: prevData.residents.map(item =>
              item.id === id ? { ...item, ...updateData, _pending: true } : item
            )
          };
        }
        return prevData;
      });

      await applyOperationToCache(cacheKey, {
        method,
        body: payload
      });
    }

    if (isOnline) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Remove pending flag
        if (mountedRef.current) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return prevData.map(item =>
                item.id === id ? { ...item, _pending: false } : item
              );
            } else if (prevData?.residents) {
              return {
                ...prevData,
                residents: prevData.residents.map(item =>
                  item.id === id ? { ...item, _pending: false } : item
                )
              };
            }
            return prevData;
          });
        }

        return { success: true, data: result };

      } catch (err) {
        // Revert optimistic update
        if (optimisticUpdate && originalItem) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return prevData.map(item =>
                item.id === id ? originalItem : item
              );
            } else if (prevData?.residents) {
              return {
                ...prevData,
                residents: prevData.residents.map(item =>
                  item.id === id ? originalItem : item
                )
              };
            }
            return prevData;
          });
        }
        return { success: false, error: err.message };
      }
    } else {
      // Offline - queue the operation
      await queueOperation({
        endpoint,
        method,
        body: payload,
        type: 'update',
        description,
        cacheKey
      });

      return { success: true, pending: true };
    }
  }, [endpoint, cacheKey, data, checkOnline]);

  /**
   * Delete an item (DELETE)
   */
  const remove = useCallback(async (id, deleteOptions = {}) => {
    const {
      description = 'Delete item',
      optimisticUpdate = true,
      useQueryParams = false
    } = deleteOptions;

    const isOnline = checkOnline();
    let originalItem = null;

    // Optimistic update - remove from UI immediately
    if (optimisticUpdate && data) {
      setData(prevData => {
        if (Array.isArray(prevData)) {
          originalItem = prevData.find(item => item.id === id);
          return prevData.filter(item => item.id !== id);
        } else if (prevData?.residents) {
          originalItem = prevData.residents.find(item => item.id === id);
          return {
            ...prevData,
            residents: prevData.residents.filter(item => item.id !== id)
          };
        }
        return prevData;
      });

      await applyOperationToCache(cacheKey, {
        method: 'DELETE',
        body: { id }
      });
    }

    if (isOnline) {
      try {
        let url = endpoint;
        let options = {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        };

        if (useQueryParams) {
          url = `${endpoint}?id=${id}`;
        } else {
          options.body = JSON.stringify({ id });
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return { success: true };

      } catch (err) {
        // Revert optimistic update
        if (optimisticUpdate && originalItem) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return [...prevData, originalItem];
            } else if (prevData?.residents) {
              return {
                ...prevData,
                residents: [...prevData.residents, originalItem]
              };
            }
            return prevData;
          });
        }
        return { success: false, error: err.message };
      }
    } else {
      // Offline - queue the operation
      await queueOperation({
        endpoint,
        method: 'DELETE',
        body: { id },
        params: useQueryParams ? { id } : undefined,
        type: 'delete',
        description,
        cacheKey
      });

      return { success: true, pending: true };
    }
  }, [endpoint, cacheKey, data, checkOnline]);

  /**
   * Manually trigger sync
   */
  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncAll();
      // Refresh data after sync
      await fetchData({ silent: true });
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchData]);

  /**
   * Refresh data from server
   */
  const refresh = useCallback(async () => {
    return fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    
    if (autoFetch) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [autoFetch]); // Only depend on autoFetch to avoid infinite loops

  // Listen for online status changes to auto-sync
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Back online - syncing...');
      await sync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [sync]);

  return {
    data,
    loading,
    error,
    isFromCache,
    isSyncing,
    isOnline: checkOnline(),
    // Methods
    fetchData,
    create,
    update,
    remove,
    sync,
    refresh,
    // Utility
    setData
  };
}

export default useOfflineData;


