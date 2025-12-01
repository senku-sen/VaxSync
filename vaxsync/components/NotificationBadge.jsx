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
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        let totalUnread = 0;
        let hasUrgent = false;

        if (userRole === 'Health Worker') {
          // Health Worker: Resident Approvals + Vaccine Requests + Sessions
          const [residentNotifs, vaccineNotifs, sessionNotifs] = await Promise.all([
            fetchResidentApprovalNotifications(userId),
            fetchVaccineRequestNotifications(userId),
            fetchVaccinationSessionNotifications(userId, barangayId, false),
          ]);

          // Count unread notifications
          const residentUnread = residentNotifs.data?.filter(n => !n.read).length || 0;
          const vaccineUnread = vaccineNotifs.data?.filter(n => !n.read).length || 0;
          const sessionUnread = sessionNotifs.data?.filter(n => !n.read && n.isUpcoming).length || 0;

          totalUnread = residentUnread + vaccineUnread + sessionUnread;

          // Check for urgent notifications
          hasUrgent = residentUnread > 0 || vaccineUnread > 0 || sessionUnread > 0;
        } else if (userRole === 'Head Nurse') {
          // Head Nurse: Vaccine Requests + All Sessions
          const [vaccineNotifs, sessionNotifs] = await Promise.all([
            fetchVaccineRequestNotifications(userId),
            fetchVaccinationSessionNotifications(userId, null, true),
          ]);

          const vaccineUnread = vaccineNotifs.data?.filter(n => !n.read && n.status === 'pending').length || 0;
          const sessionUnread = sessionNotifs.data?.filter(n => !n.read && n.isUpcoming).length || 0;

          totalUnread = vaccineUnread + sessionUnread;
          hasUrgent = vaccineUnread > 0 || sessionUnread > 0;
        }

        setUnreadCount(totalUnread);
        setBadgeColor(hasUrgent ? 'bg-red-500' : 'bg-gray-400');
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId, userRole, barangayId]);

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
