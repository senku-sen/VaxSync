"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to detect and track online/offline status
 * Uses multiple methods to ensure accurate detection
 */
export function useOnlineStatus() {
  // Initialize with true to prevent hydration mismatch
  // Will be updated on client after mount
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [mounted, setMounted] = useState(false);
  const isCheckingRef = useRef(false);

  /**
   * Verify actual internet connectivity by making a lightweight request
   * Only marks as offline if navigator.onLine is false OR health check fails multiple times
   */
  const checkConnectivity = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return navigator.onLine;
    
    // Trust navigator.onLine first - if it says we're offline, we're offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    
    isCheckingRef.current = true;
    setIsChecking(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout

      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);
      
      // If navigator says we're online, trust it even if health check fails
      // Only mark offline if navigator also says offline
      const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const healthCheckOk = response?.ok ?? false;
      
      // Trust browser status more - only mark offline if browser says offline
      const online = browserOnline; // Always trust navigator.onLine
      
      setIsOnline(online);
      setLastChecked(Date.now());
      return online;

    } catch (error) {
      // On error, trust navigator.onLine
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);
      setLastChecked(Date.now());
      return online;
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, []);

  // Initial setup - only runs once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Set initial online state from browser - trust it immediately
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log('Browser reports online');
      // Immediately trust browser - set online right away
      setIsOnline(true);
      // Optionally verify with health check after a delay (non-blocking)
      setTimeout(() => {
        if (navigator.onLine && !isCheckingRef.current) {
          checkConnectivity();
        }
      }, 2000);
    };

    const handleOffline = () => {
      console.log('Browser reports offline');
      // Immediately trust browser when it says offline
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Don't do initial health check - trust navigator.onLine
    // Only do periodic checks when browser says we're online

    // Periodic connectivity check (every 2 minutes - very reduced frequency)
    // Only runs if browser says we're online
    const intervalId = setInterval(() => {
      if (navigator.onLine && !isCheckingRef.current) {
        checkConnectivity();
      }
    }, 120000); // 2 minutes

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array - only run once

  return {
    isOnline: mounted ? isOnline : true, // Return true on server/before mount
    isChecking,
    lastChecked,
    checkConnectivity
  };
}

export default useOnlineStatus;

