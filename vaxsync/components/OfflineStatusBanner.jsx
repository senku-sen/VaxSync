"use client";

import React, { useState, useEffect } from 'react';
import { useOffline } from './OfflineProvider';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Status banner that shows offline/online status and sync progress
 */
export function OfflineStatusBanner() {
  // Prevent hydration mismatch - only render after mount
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isOnline,
    pendingCount,
    isSyncing,
    syncProgress,
    failedOperations,
    showBanner,
    bannerMessage,
    bannerType,
    triggerSync,
    retryFailed,
    hideBanner
  } = useOffline();

  // Don't render on server or before mount to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Don't show if no banner and online with no pending
  if (!showBanner && isOnline && pendingCount === 0 && failedOperations.length === 0) {
    return null;
  }

  const getBackgroundColor = () => {
    if (!isOnline) return 'bg-amber-500';
    if (bannerType === 'error' || failedOperations.length > 0) return 'bg-red-500';
    if (bannerType === 'success') return 'bg-green-500';
    if (bannerType === 'warning') return 'bg-amber-500';
    if (isSyncing) return 'bg-blue-500';
    if (pendingCount > 0) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (isSyncing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (failedOperations.length > 0) return <AlertTriangle className="h-4 w-4" />;
    if (pendingCount > 0) return <Cloud className="h-4 w-4" />;
    if (bannerType === 'success') return <CheckCircle className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (bannerMessage) return bannerMessage;
    if (!isOnline) return 'You are offline. Changes will be saved locally.';
    if (isSyncing && syncProgress) {
      return `Syncing... (${syncProgress.current}/${syncProgress.total})`;
    }
    if (isSyncing) return 'Syncing your changes...';
    if (failedOperations.length > 0) {
      return `${failedOperations.length} operation(s) failed to sync`;
    }
    if (pendingCount > 0) {
      return `${pendingCount} change(s) pending sync`;
    }
    return 'All changes synced';
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 ${getBackgroundColor()} text-white px-4 py-2 shadow-lg transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 min-w-0">
          {getIcon()}
          <span className="text-sm font-medium truncate">{getMessage()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sync button - show when online and has pending */}
          {isOnline && pendingCount > 0 && !isSyncing && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-7 px-2"
              onClick={triggerSync}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync Now
            </Button>
          )}

          {/* Retry button - show when has failed operations */}
          {isOnline && failedOperations.length > 0 && !isSyncing && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-7 px-2"
              onClick={retryFailed}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Failed
            </Button>
          )}

          {/* Close button */}
          {showBanner && bannerType !== 'warning' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
              onClick={hideBanner}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar for sync */}
      {isSyncing && syncProgress && (
        <div className="max-w-7xl mx-auto mt-1">
          <div className="bg-white/30 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact offline indicator for use in headers/sidebars
 */
export function OfflineIndicator({ className = '' }) {
  const [mounted, setMounted] = useState(false);
  const { isOnline, pendingCount, isSyncing } = useOffline();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {!isOnline ? (
        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      ) : isSyncing ? (
        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : pendingCount > 0 ? (
        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">
          <Cloud className="h-3 w-3" />
          <span>{pendingCount} pending</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Floating sync button for mobile
 */
export function FloatingSyncButton({ className = '' }) {
  const [mounted, setMounted] = useState(false);
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOffline();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isOnline || pendingCount === 0 || isSyncing) {
    return null;
  }

  return (
    <button
      onClick={triggerSync}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all ${className}`}
    >
      <RefreshCw className="h-5 w-5" />
      <span className="font-medium">Sync ({pendingCount})</span>
    </button>
  );
}

export default OfflineStatusBanner;

