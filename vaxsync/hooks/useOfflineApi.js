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
 * General purpose hook for offline-first API calls
 * Can be used with any endpoint that follows REST conventions
 * 
 * @param {string} cacheKey - Unique key for caching this data
 * @param {object} options - Configuration options
 * @returns {object} Data, loading state, and API methods
 */
export function useOfflineApi(cacheKey, options = {}) {
  const {
    onError,
    initialData = null,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const mountedRef = useRef(true);

  /**
   * Check if we're online
   */
  const checkOnline = useCallback(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }, []);

  /**
   * Generic GET request with offline support
   */
  const get = useCallback(async (endpoint, fetchOptions = {}) => {
    const { params = {}, silent = false } = fetchOptions;
    
    if (!silent) {
      setLoading(true);
      setError(null);
    }

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

        const responseData = await response.json();

        // Cache the response
        await cacheData(actualCacheKey, responseData, 'api');

        if (mountedRef.current) {
          setData(responseData);
          setIsFromCache(false);
        }

        return { success: true, data: responseData };

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
          return { success: true, data: cached, fromCache: true };
        }

        if (mountedRef.current) {
          setError(err.message);
          if (onError) onError(err);
        }
        return { success: false, error: err.message };
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
          return { success: true, data: cached, fromCache: true };
        } else {
          const offlineError = 'No cached data available while offline';
          if (mountedRef.current) {
            setError(offlineError);
            setLoading(false);
          }
          return { success: false, error: offlineError };
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message);
          setLoading(false);
        }
        return { success: false, error: err.message };
      }
    }
  }, [cacheKey, checkOnline, onError]);

  /**
   * Generic POST request with offline support
   */
  const post = useCallback(async (endpoint, body, postOptions = {}) => {
    const { 
      description = 'Create item',
      optimisticUpdate = true,
      dataKey = null // Key to extract array from response (e.g., 'residents')
    } = postOptions;

    const isOnline = checkOnline();
    const tempId = generateTempId();

    // Optimistic update
    if (optimisticUpdate && data) {
      const optimisticItem = { ...body, id: tempId, _pending: true };
      
      setData(prevData => {
        if (Array.isArray(prevData)) {
          return [...prevData, optimisticItem];
        } else if (dataKey && prevData?.[dataKey]) {
          return { ...prevData, [dataKey]: [...prevData[dataKey], optimisticItem] };
        }
        return prevData;
      });
    }

    if (isOnline) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        
        // Update with real data from server
        if (mountedRef.current && optimisticUpdate) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return prevData.map(item => 
                item.id === tempId ? { ...result, _pending: false } : item
              );
            } else if (dataKey && prevData?.[dataKey]) {
              return {
                ...prevData,
                [dataKey]: prevData[dataKey].map(item =>
                  item.id === tempId ? { ...result, _pending: false } : item
                )
              };
            }
            return prevData;
          });
        }

        return { success: true, data: result };

      } catch (err) {
        // Revert optimistic update on error
        if (optimisticUpdate) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return prevData.filter(item => item.id !== tempId);
            } else if (dataKey && prevData?.[dataKey]) {
              return {
                ...prevData,
                [dataKey]: prevData[dataKey].filter(item => item.id !== tempId)
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
        body,
        type: 'create',
        description,
        cacheKey,
        tempId
      });

      return { success: true, pending: true, tempId };
    }
  }, [cacheKey, data, checkOnline]);

  /**
   * Generic PUT/PATCH request with offline support
   */
  const update = useCallback(async (endpoint, id, updateData, updateOptions = {}) => {
    const {
      method = 'PATCH',
      description = 'Update item',
      optimisticUpdate = true,
      dataKey = null,
      idField = 'id'
    } = updateOptions;

    const isOnline = checkOnline();
    const payload = { [idField]: id, ...updateData };
    let originalItem = null;

    // Optimistic update
    if (optimisticUpdate && data) {
      setData(prevData => {
        if (Array.isArray(prevData)) {
          originalItem = prevData.find(item => item[idField] === id);
          return prevData.map(item =>
            item[idField] === id ? { ...item, ...updateData, _pending: true } : item
          );
        } else if (dataKey && prevData?.[dataKey]) {
          originalItem = prevData[dataKey].find(item => item[idField] === id);
          return {
            ...prevData,
            [dataKey]: prevData[dataKey].map(item =>
              item[idField] === id ? { ...item, ...updateData, _pending: true } : item
            )
          };
        }
        return prevData;
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
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Remove pending flag
        if (mountedRef.current) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return prevData.map(item =>
                item[idField] === id ? { ...item, _pending: false } : item
              );
            } else if (dataKey && prevData?.[dataKey]) {
              return {
                ...prevData,
                [dataKey]: prevData[dataKey].map(item =>
                  item[idField] === id ? { ...item, _pending: false } : item
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
                item[idField] === id ? originalItem : item
              );
            } else if (dataKey && prevData?.[dataKey]) {
              return {
                ...prevData,
                [dataKey]: prevData[dataKey].map(item =>
                  item[idField] === id ? originalItem : item
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
  }, [cacheKey, data, checkOnline]);

  /**
   * Generic DELETE request with offline support
   */
  const remove = useCallback(async (endpoint, id, deleteOptions = {}) => {
    const {
      description = 'Delete item',
      optimisticUpdate = true,
      useQueryParams = false,
      dataKey = null,
      idField = 'id'
    } = deleteOptions;

    const isOnline = checkOnline();
    let originalItem = null;

    // Optimistic update - remove from UI immediately
    if (optimisticUpdate && data) {
      setData(prevData => {
        if (Array.isArray(prevData)) {
          originalItem = prevData.find(item => item[idField] === id);
          return prevData.filter(item => item[idField] !== id);
        } else if (dataKey && prevData?.[dataKey]) {
          originalItem = prevData[dataKey].find(item => item[idField] === id);
          return {
            ...prevData,
            [dataKey]: prevData[dataKey].filter(item => item[idField] !== id)
          };
        }
        return prevData;
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
          options.body = JSON.stringify({ [idField]: id });
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        return { success: true };

      } catch (err) {
        // Revert optimistic update
        if (optimisticUpdate && originalItem) {
          setData(prevData => {
            if (Array.isArray(prevData)) {
              return [...prevData, originalItem];
            } else if (dataKey && prevData?.[dataKey]) {
              return {
                ...prevData,
                [dataKey]: [...prevData[dataKey], originalItem]
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
        body: { [idField]: id },
        params: useQueryParams ? { id } : undefined,
        type: 'delete',
        description,
        cacheKey
      });

      return { success: true, pending: true };
    }
  }, [cacheKey, data, checkOnline]);

  /**
   * Manually trigger sync
   */
  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncAll();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Clear cached data
   */
  const clearCache = useCallback(async () => {
    const { deleteCachedData } = await import('@/lib/offlineStorage');
    await deleteCachedData(cacheKey);
    setData(initialData);
  }, [cacheKey, initialData]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
    // State
    data,
    loading,
    error,
    isFromCache,
    isSyncing,
    isOnline: checkOnline(),
    
    // Methods
    get,
    post,
    update,
    remove,
    sync,
    clearCache,
    
    // Utility
    setData
  };
}

export default useOfflineApi;


