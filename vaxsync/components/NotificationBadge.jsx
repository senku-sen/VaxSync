'use client';

import { useState, useEffect } from 'react';
import { fetchVaccineRequestNotifications, fetchResidentApprovalNotifications, fetchVaccinationSessionNotifications } from '@/lib/notification';
import { loadUserProfile } from '@/lib/vaccineRequest';

/**
 * FEATURE 2: Notification Badge Component
 * Displays unread notification count in sidebar
 * Shows different badge colors based on notification type
 */
export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Fetch notifications based on user role
  useEffect(() => {
    if (!userId || !isOnline) return; // Don't fetch when offline

    const fetchNotifications = async () => {
      try {
        // Determine cache key based on role
        const isSupervisor = userRole === 'Head Nurse' || userRole === 'Public Health Nurse';
        const cacheKey = isSupervisor ? "headNurseNotifications" : "healthWorkerNotifications";

        // Get cached read/archived status from localStorage
        let cachedMap = {};
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const cachedNotifications = JSON.parse(cached);
            // Normalize IDs to strings for consistent comparison
            cachedMap = Object.fromEntries(
              cachedNotifications.map((n) => [String(n.id), { 
                read: n.read === true || n.read === 'true' || n.read === 1,
                archived: n.archived === true || n.archived === 'true' || n.archived === 1
              }])
            );
          }
        } catch (e) {
          // Ignore cache errors
        }

        let totalUnread = 0;
        let hasUrgent = false;

        if (userRole === 'Rural Health Midwife (RHM)') {
          // Rural Health Midwife (RHM): Resident Approvals + Vaccine Requests + Sessions
          const [residentNotifs, vaccineNotifs, sessionNotifs] = await Promise.all([
            fetchResidentApprovalNotifications(userId).catch(() => ({ data: [] })),
            fetchVaccineRequestNotifications(userId).catch(() => ({ data: [] })),
            fetchVaccinationSessionNotifications(userId, barangayId, false).catch(() => ({ data: [] })),
          ]);

          // Count ONLY unread notifications from cache (source of truth)
          // DO NOT count notifications not in cache
          const residentUnread = (residentNotifs.data || []).filter(n => {
            const cached = cachedMap[String(n.id)];
            // Only count if in cache AND explicitly unread
            return cached ? (!cached.read && !cached.archived) : false;
          }).length;

          const vaccineUnread = (vaccineNotifs.data || []).filter(n => {
            const cached = cachedMap[String(n.id)];
            // Only count if in cache AND explicitly unread
            return cached ? (!cached.read && !cached.archived) : false;
          }).length;

          const sessionUnread = (sessionNotifs.data || []).filter(n => {
            const cached = cachedMap[String(n.id)];
            // Only count if in cache AND explicitly unread AND upcoming
            return cached ? (!cached.read && !cached.archived && n.isUpcoming) : false;
          }).length;

          totalUnread = residentUnread + vaccineUnread + sessionUnread;

          // Check for urgent notifications
          hasUrgent = residentUnread > 0 || vaccineUnread > 0 || sessionUnread > 0;
        } else if (userRole === 'Head Nurse' || userRole === 'Public Health Nurse') {
          // Public Health Nurse (head): Vaccine Requests + All Sessions
          const [vaccineNotifs, sessionNotifs] = await Promise.all([
            fetchVaccineRequestNotifications(userId).catch(() => ({ data: [] })),
            fetchVaccinationSessionNotifications(userId, null, true).catch(() => ({ data: [] })),
          ]);

          const vaccineUnread = (vaccineNotifs.data || []).filter(n => {
            const cached = cachedMap[String(n.id)];
            // Only count if in cache AND explicitly unread AND pending
            return cached ? (!cached.read && !cached.archived && n.status === 'pending') : false;
          }).length;

          const sessionUnread = (sessionNotifs.data || []).filter(n => {
            const cached = cachedMap[String(n.id)];
            // Only count if in cache AND explicitly unread AND upcoming
            return cached ? (!cached.read && !cached.archived && n.isUpcoming) : false;
          }).length;

          totalUnread = vaccineUnread + sessionUnread;
          hasUrgent = vaccineUnread > 0 || sessionUnread > 0;
        }

        setUnreadCount(totalUnread);
        setBadgeColor(hasUrgent ? 'bg-red-500' : 'bg-gray-400');
      } catch (err) {
        // Silently fail when offline - don't log errors
        if (isOnline) {
          console.error('Error fetching notifications:', err);
        }
      }
    };

    fetchNotifications();

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      setTimeout(() => {
        fetchNotifications();
      }, 100);
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'headNurseNotifications' || e.key === 'healthWorkerNotifications') {
        fetchNotifications();
      }
    });

    // Poll for new notifications every 30 seconds (only when online)
    let interval;
    if (isOnline) {
      interval = setInterval(fetchNotifications, 30000);
    }

    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      if (interval) clearInterval(interval);
    };
  }, [userId, userRole, barangayId, isOnline]);

  // Don't show badge if no unread notifications
  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className={`absolute -top-2 -right-2 ${badgeColor} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </div>
  );
}
