"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { 
  subscribeSyncStatus, 
  getSyncStatus, 
  syncAll, 
  getFailedOperations,
  retryFailed,
  clearFailedOperation 
} from '@/lib/syncManager';
import { getPendingOperationsCount, clearAllCache, clearPendingOperations } from '@/lib/offlineStorage';

const OfflineContext = createContext(null);

/**
 * Provider component that manages offline state globally
 */
export function OfflineProvider({ children }) {
  const { isOnline: hookIsOnline, isChecking, checkConnectivity } = useOnlineStatus();
  
  // Trust navigator.onLine directly for immediate checks
  // This prevents false offline detection when health check is slow
  const isOnline = typeof navigator !== 'undefined' 
    ? (navigator.onLine || hookIsOnline) // Trust navigator first, fallback to hook
    : hookIsOnline;
  
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [failedOperations, setFailedOperations] = useState([]);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('info'); // 'info', 'warning', 'success', 'error'

  /**
   * Refresh sync status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const count = await getPendingOperationsCount();
      setPendingCount(count);
      
      const status = await getSyncStatus();
      setLastSyncTime(status.lastSyncTime);
      setIsSyncing(status.isSyncing);
      
      const failed = await getFailedOperations();
      setFailedOperations(failed);
    } catch (error) {
      console.error('Error refreshing sync status:', error);
    }
  }, []);

  /**
   * Trigger manual sync
   */
  const triggerSync = useCallback(async () => {
    if (isSyncing || !isOnline) return { success: false };

    setIsSyncing(true);
    showNotification('Syncing your changes...', 'info');

    try {
      const result = await syncAll({
        onProgress: (progress) => {
          setSyncProgress(progress);
        }
      });

      setSyncProgress(null);
      
      if (result.synced > 0) {
        showNotification(`Synced ${result.synced} change(s) successfully!`, 'success');
      } else if (result.failed > 0) {
        showNotification(`${result.failed} operation(s) failed to sync`, 'error');
      }

      await refreshStatus();
      return result;

    } catch (error) {
      console.error('Sync failed:', error);
      showNotification('Sync failed. Will retry later.', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, refreshStatus]);

  /**
   * Retry failed operations
   */
  const handleRetryFailed = useCallback(async () => {
    if (!isOnline) {
      showNotification('Cannot retry while offline', 'warning');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await retryFailed();
      await refreshStatus();
      
      if (result.synced > 0) {
        showNotification(`Retried and synced ${result.synced} operation(s)`, 'success');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, refreshStatus]);

  /**
   * Clear a specific failed operation
   */
  const handleClearFailed = useCallback(async (operationId) => {
    await clearFailedOperation(operationId);
    await refreshStatus();
  }, [refreshStatus]);

  /**
   * Clear all offline data (for troubleshooting)
   */
  const clearOfflineData = useCallback(async () => {
    try {
      await clearAllCache();
      await clearPendingOperations();
      await refreshStatus();
      showNotification('Offline data cleared', 'success');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      showNotification('Failed to clear offline data', 'error');
    }
  }, [refreshStatus]);

  /**
   * Show notification banner
   */
  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    setBannerMessage(message);
    setBannerType(type);
    setShowBanner(true);

    if (duration > 0) {
      setTimeout(() => {
        setShowBanner(false);
      }, duration);
    }
  }, []);

  /**
   * Hide notification banner
   */
  const hideBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  // Subscribe to sync status updates
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((status) => {
      switch (status.type) {
        case 'sync_started':
          setIsSyncing(true);
          break;
        case 'sync_progress':
          setSyncProgress(status);
          break;
        case 'sync_completed':
          setIsSyncing(false);
          setSyncProgress(null);
          refreshStatus();
          break;
        case 'operation_queued':
          setPendingCount(status.pendingCount);
          break;
        case 'operation_cleared':
          refreshStatus();
          break;
      }
    });

    return unsubscribe;
  }, [refreshStatus]);

  // Initial status load
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      // Delay sync slightly to ensure stable connection
      const timeoutId = setTimeout(() => {
        triggerSync();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, pendingCount, isSyncing, triggerSync]);

  // Track if this is the initial mount to prevent showing banner on load
  const [initialMount, setInitialMount] = useState(true);

  useEffect(() => {
    // Skip first render to prevent hydration issues
    const timer = setTimeout(() => {
      setInitialMount(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Show offline/online status changes (only after initial mount)
  useEffect(() => {
    if (initialMount) return;
    
    if (!isOnline) {
      showNotification('You are offline. Changes will be saved locally.', 'warning', 0);
    } else if (pendingCount > 0) {
      showNotification(`Back online! Syncing ${pendingCount} pending change(s)...`, 'info');
    } else {
      hideBanner();
    }
  }, [isOnline, pendingCount, showNotification, hideBanner, initialMount]);

  const value = {
    // State
    isOnline,
    isChecking,
    pendingCount,
    isSyncing,
    syncProgress,
    lastSyncTime,
    failedOperations,
    showBanner,
    bannerMessage,
    bannerType,
    
    // Actions
    triggerSync,
    retryFailed: handleRetryFailed,
    clearFailed: handleClearFailed,
    clearOfflineData,
    refreshStatus,
    checkConnectivity,
    showNotification,
    hideBanner
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

/**
 * Hook to access offline context
 */
export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

export default OfflineProvider;

