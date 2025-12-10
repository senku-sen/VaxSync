"use client";

import { Bell, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { OfflineIndicator } from "@/components/OfflineStatusBanner";
import { loadUserProfile } from "@/lib/vaccineRequest";
import {
  fetchVaccineRequestNotifications,
  fetchResidentApprovalNotifications,
  fetchVaccinationSessionNotifications,
  fetchLowStockNotifications,
  subscribeToVaccineRequestUpdates,
  subscribeToResidentUpdates,
  subscribeToVaccinationSessionUpdates,
  subscribeToInventoryUpdates,
} from "@/lib/notification";

export default function InventoryHeader({ title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [barangayId, setBarangayId] = useState(null);

  // Initialize user info
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
        console.error("Error initializing user:", err);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (!userId || !userRole) return;

    // Initial fetch
    fetchNotificationCount();

    // Listen for localStorage changes from notification pages
    const handleStorageChange = (e) => {
      if (e.key === 'headNurseNotifications' || e.key === 'healthWorkerNotifications') {
        console.log("🔔 localStorage change detected, updating notification count");
        fetchNotificationCount();
      }
    };

    // Also listen for custom event when notifications are updated within the same tab
    const handleNotificationUpdate = () => {
      console.log("🔔 Custom notification update event received - forcing fresh count");
      // Defer to avoid setState during render
      setTimeout(() => {
        fetchNotificationCount();
      }, 0);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    // Subscribe to real-time Supabase updates for instant notifications
    const rawRole = userRole || "";
    const normalizedRole = rawRole.replace(/\s+/g, "_");
const isSupervisor =
  normalizedRole === "HeadNurse" ||  // If you have this role
  normalizedRole === "PublicHealthNurse" ||
  normalizedRole === "RuralHealthMidwife" ||
  rawRole === "Public Health Nurse" ||
  rawRole === "Rural Health Midwife";

    // Subscribe to vaccine requests (null for admins to see all, userId for users)
    const unsubscribeVaccine = subscribeToVaccineRequestUpdates(
      isSupervisor ? null : userId, 
      (payload) => {
        console.log("🔔 Real-time vaccine request:", payload);
        fetchNotificationCount();
      }
    );

    // Subscribe to vaccination sessions
    const unsubscribeSessions = subscribeToVaccinationSessionUpdates(
      isSupervisor ? null : barangayId,
      (payload) => {
        console.log("🔔 Real-time session update:", payload);
        fetchNotificationCount();
      }
    );

    // Subscribe to inventory updates for low stock alerts
    const unsubscribeInventory = subscribeToInventoryUpdates((payload) => {
      console.log("🔔 Real-time inventory update:", payload);
      fetchNotificationCount();
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      if (unsubscribeVaccine) unsubscribeVaccine();
      if (unsubscribeSessions) unsubscribeSessions();
      if (unsubscribeInventory) unsubscribeInventory();
    };
  }, [userId, userRole, barangayId]);

  const fetchNotificationCount = async () => {
    try {
      let unreadCount = 0;

      // Normalize role (support both spaced and underscored variants)
      const rawRole = userRole || "";
      const normalizedRole = rawRole.replace(/\s+/g, "_");

      const isSupervisor =
        normalizedRole === "Head_Nurse" ||
        normalizedRole === "Rural_Health_Midwife" ||
        normalizedRole === "Rural_Health_Midwife_(RHM)" ||
        rawRole === "Rural Health Midwife (RHM)";

      // Determine cache key based on role
      // Support both spaced and underscored role names
      const cacheKey = isSupervisor ? "headNurseNotifications" : "healthWorkerNotifications";

      // Get cached read/archived status from localStorage
      let cachedMap = {};
      let cachedNotifications = [];
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          cachedNotifications = JSON.parse(cached);
          cachedMap = Object.fromEntries(
            cachedNotifications.map((n) => [n.id, { read: n.read, archived: n.archived }])
          );
        }
      } catch (e) {
        // Ignore cache errors
      }

      // Count unread from cached notifications (faster, more reliable)
      // but don't set state from cache; always compute final count from fresh fetch.
      const cachedUnreadCount = cachedNotifications.filter(
        (n) => !n.read && !n.archived
      ).length;

      // Fetch fresh data every time to avoid stale badge
      const residentPromise = fetchResidentApprovalNotifications(userId).catch(
        () => ({ data: [] })
      );

      // For supervisors, see ALL vaccine requests + ALL sessions.
      // For front-line users, see only their own requests/sessions.
      const vaccinePromise = isSupervisor
        ? fetchVaccineRequestNotifications(null).catch(() => ({ data: [] }))
        : fetchVaccineRequestNotifications(userId).catch(() => ({ data: [] }));

      const sessionPromise = isSupervisor
        ? fetchVaccinationSessionNotifications(userId, null, true).catch(
            () => ({ data: [] })
          )
        : fetchVaccinationSessionNotifications(userId, barangayId, false).catch(
            () => ({ data: [] })
          );

      // Also fetch low stock notifications (UNDERSTOCK < 100% or STOCKOUT = 0%)
      const lowStockPromise = fetchLowStockNotifications(100).catch(() => ({ data: [] }));

      const [residentNotifs, vaccineNotifs, sessionNotifs, lowStockNotifs] = await Promise.all([
        residentPromise,
        vaccinePromise,
        sessionPromise,
        lowStockPromise,
      ]);

      // Count unread notifications: those NOT marked as read AND NOT archived
      const residentUnread = (residentNotifs.data || []).filter(
        (n) => !cachedMap[n.id]?.read && !cachedMap[n.id]?.archived
      ).length;

      const vaccineUnread = (vaccineNotifs.data || []).filter(
        (n) => !cachedMap[n.id]?.read && !cachedMap[n.id]?.archived
      ).length;

      const sessionUnread = (sessionNotifs.data || []).filter(
        (n) => !cachedMap[n.id]?.read && !cachedMap[n.id]?.archived
      ).length;

      const lowStockUnread = (lowStockNotifs.data || []).filter(
        (n) => !cachedMap[n.id]?.read && !cachedMap[n.id]?.archived
      ).length;

      unreadCount = residentUnread + vaccineUnread + sessionUnread + lowStockUnread;

      console.log('🔔 Notification count calculated:', {
        residentUnread,
        vaccineUnread,
        sessionUnread,
        lowStockUnread,
        total: unreadCount,
        cachedCount: cachedUnreadCount
      });

      setNotificationCount(unreadCount);
    } catch (err) {
      // On error, just hide the badge
      setNotificationCount(0);
    }
  };

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      // Clear all localStorage items related to auth
      localStorage.removeItem("vaxsync_user");
      localStorage.removeItem("headNurseNotifications");
      localStorage.removeItem("healthWorkerNotifications");
      // Clear the auth cookie
      document.cookie =
        "vaxsync_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // Clear all Supabase cookies
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.split("=")[0].trim();
        if (cookieName.includes("sb-") || cookieName.includes("supabase")) {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });
    } catch {}
    // Use replace instead of href to prevent back-button access
    window.location.replace("/pages/signin");
  }

  const handleNotificationClick = () => {
    // Don't clear localStorage - we want to preserve read/archived status
    // The notification page will handle refreshing and updating the count
    // Determine the base path (RuralHealthMidwife or PublicHealthNurse)
    const isRuralHealthMidwife = pathname.includes("RuralHealthMidwife");
    const isPublicHealthNurse = pathname.includes("PublicHealthNurse");

    if (isRuralHealthMidwife) {
      router.push("/pages/RuralHealthMidwife/notifications");
    } else if (isPublicHealthNurse) {
      router.push("/pages/PublicHealthNurse/notifications");
    } else {
      // Fallback: check localStorage for user role if pathname doesn't indicate role
      try {
        const cachedUser = JSON.parse(
          localStorage.getItem("vaxsync_user") || "null"
        );
        if (cachedUser?.user_role === "Public Health Nurse") {
          router.push("/pages/PublicHealthNurse/notifications");
        } else {
          router.push("/pages/RuralHealthMidwife/notifications");
        }
      } catch (err) {
        // Default to RuralHealthMidwife if error
        router.push("/pages/RuralHealthMidwife/notifications");
      }
    }
  };

  return (
    <div className="flex items-center justify-between p-9 border-b border-gray-200 bg-white">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 text-sm mt-2">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-8">
        {/* Offline status indicator */}
        <OfflineIndicator />

        <div
          className="relative cursor-pointer"
          onClick={handleNotificationClick}
          title={`Unread notifications: ${notificationCount}`}
        >
          <Bell className="h-5 w-5 text-gray-700 hover:text-gray-900 transition-colors" />
          {notificationCount > 0 && (
            <span 
              className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 border-2 border-white shadow-lg z-10 flex items-center justify-center"
              aria-label={`${notificationCount} unread notifications`}
            >
              {notificationCount > 9 ? (
                <span className="text-[9px] font-bold text-white leading-none">9+</span>
              ) : (
                <span className="text-[9px] font-bold text-white leading-none">
                  {notificationCount}
                </span>
              )}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-6 w-6">
              <User className="h-5 w-5 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-[#3E5F44] rounded-md shadow-sm">
            <DropdownMenuItem
              className="flex items-center cursor-pointer"
              onClick={() => {
                const settingsPath = userRole === "Public Health Nurse" 
                  ? "/pages/PublicHealthNurse/settings-privacy" 
                  : "/pages/RuralHealthMidwife/settings-privacy";
                router.push(settingsPath);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings & Privacy
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}