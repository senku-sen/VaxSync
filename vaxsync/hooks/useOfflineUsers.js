"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useOffline } from '@/components/OfflineProvider';
import { cacheData, getCachedData } from '@/lib/offlineStorage';
import { queueOperation } from '@/lib/syncManager';

/**
 * Hook for offline-first users data management
 * 
 * @returns {object} Users data and CRUD methods
 */
export function useOfflineUsers() {
  const { isOnline, showNotification } = useOffline();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const mountedRef = useRef(true);
  
  const cacheKey = 'users_list';

  /**
   * Fetch users from Supabase with offline fallback
   */
  const fetchUsers = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);

    if (isOnline) {
      try {
        const { supabase } = await import('@/lib/supabase');
        
        const { data: userData, error: fetchError } = await supabase
          .from("UserProfiles")
          .select(
            "id, first_name, last_name, email, user_role, address, assigned_barangay_id, date_of_birth, sex, created_at"
          )
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        // Cache the data
        await cacheData(cacheKey, userData || [], 'users');
        
        if (mountedRef.current) {
          setUsers(userData || []);
          setIsFromCache(false);
          setLoading(false);
        }
        return userData || [];

      } catch (err) {
        console.warn('Failed to fetch users, trying cache:', err.message);
        
        // Try cache
        const cached = await getCachedData(cacheKey);
        if (cached && mountedRef.current) {
          setUsers(cached);
          setIsFromCache(true);
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
          setUsers(cached);
          setIsFromCache(true);
          setLoading(false);
          return cached;
        }
        if (mountedRef.current) {
          setError('No cached data available while offline');
          setLoading(false);
        }
        return [];
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message);
          setLoading(false);
        }
        return [];
      }
    }
  }, [isOnline]);

  /**
   * Update a user with offline support
   */
  const updateUser = useCallback(async (id, userData) => {
    const originalUsers = [...users];

    // Optimistic update
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, ...userData, _pending: true } : u
    ));

    if (isOnline) {
      try {
        const response = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, data: userData })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        showNotification?.('User updated successfully!', 'success');
        await fetchUsers();
        return { success: true };

      } catch (err) {
        // Revert
        setUsers(originalUsers);
        showNotification?.(`Failed to update user: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      await queueOperation({
        endpoint: '/api/users',
        method: 'PATCH',
        body: { id, data: userData },
        type: 'update',
        description: `Update user: ${userData.first_name || ''} ${userData.last_name || ''}`,
        cacheKey
      });

      showNotification?.('User changes saved locally. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, users, fetchUsers, showNotification]);

  /**
   * Delete a user with offline support
   */
  const deleteUser = useCallback(async (id) => {
    const originalUsers = [...users];

    // Optimistic update
    setUsers(prev => prev.filter(u => u.id !== id));

    if (isOnline) {
      try {
        const response = await fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }

        showNotification?.('User deleted successfully!', 'success');
        return { success: true };

      } catch (err) {
        // Revert
        setUsers(originalUsers);
        showNotification?.(`Failed to delete user: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    } else {
      // Queue for offline
      await queueOperation({
        endpoint: '/api/users',
        method: 'DELETE',
        body: { id },
        type: 'delete',
        description: `Delete user ID: ${id}`,
        cacheKey
      });

      showNotification?.('Delete queued. Will sync when online.', 'info');
      return { success: true, pending: true };
    }
  }, [isOnline, users, showNotification]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    users,
    loading,
    error,
    isFromCache,
    isOnline,
    fetchUsers,
    updateUser,
    deleteUser,
    setUsers
  };
}

export default useOfflineUsers;
