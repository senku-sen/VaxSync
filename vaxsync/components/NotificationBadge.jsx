'use client';

import { useState, useEffect } from 'react';
import { loadUserProfile } from '@/lib/VaccineRequest';
import { getNotificationStatus } from "@/lib/NotificationStatus";
import {
  fetchVaccineRequestNotifications,
  fetchResidentApprovalNotifications,
  fetchVaccinationSessionNotifications,
  fetchLowStockNotifications,
} from "@/lib/notification";

/**
 * FEATURE 2: Notification Badge Component
 * Displays unread notification count in sidebar
 * Shows different badge colors based on notification type
 */
export default function NotificationBadge() {
  const [hasUnread, setHasUnread] = useState(false);
  const [badgeColor, setBadgeColor] = useState('bg-red-500');
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [barangayId, setBarangayId] = useState(null);

  // Check if online
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Initialize user info and fetch notifications
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const profile = await loadUserProfile();
        if (profile) {
          setUserId(profile.id);
          setUserRole(profile.user_role);
          setBarangayId(profile.assigned_barangay_id);
        }
      } catch (err) {
        console.error('Error initializing user:', err);
      }
    };

    initializeUser();
  }, []);

  // Fetch unread presence (database is source of truth)
  useEffect(() => {
    if (!userId || !isOnline) return; // Don't fetch when offline

    const fetchNotifications = async () => {
      try {
        const statusMap = await getNotificationStatus(userId).catch(() => ({}));

        const [
          residentNotifs,
          vaccineNotifs,
          sessionNotifs,
          lowStockNotifs,
        ] = await Promise.all([
          fetchResidentApprovalNotifications(userId).catch(() => ({ data: [] })),
          fetchVaccineRequestNotifications(userId).catch(() => ({ data: [] })),
          fetchVaccinationSessionNotifications(userId, barangayId, true).catch(() => ({ data: [] })),
          fetchLowStockNotifications(100).catch(() => ({ data: [] })),
        ]);

        const allNotifs = [
          ...(residentNotifs.data || []),
          ...(vaccineNotifs.data || []),
          ...(sessionNotifs.data || []),
          ...(lowStockNotifs.data || []),
        ];

        const anyUnread = allNotifs.some((n) => {
          const status = statusMap[String(n.id)] || {};
          const isRead = status.read === true;
          const isArchived = status.archived === true;
          return !isRead && !isArchived;
        });

        setHasUnread(anyUnread);
        setBadgeColor(anyUnread ? 'bg-red-500' : 'bg-gray-400');
      } catch (err) {
        // Silently fail when offline - don't log errors
        if (isOnline) {
          console.error('Error fetching notifications:', err);
        }
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds (only when online)
    let interval;
    if (isOnline) {
      interval = setInterval(fetchNotifications, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [userId, isOnline]);

  // Show dot only when there is at least one unread notification
  if (!hasUnread) return null;

  return (
    <div
      className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow"
      aria-label="Unread notifications"
    />
  );
}
