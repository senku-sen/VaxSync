"use client";

import { Bell, LogOut, User, Settings, Menu } from "lucide-react";
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
import { getNotificationStatus } from "@/lib/notificationStatus";

export default function InventoryHeader({ title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();

  const [hasUnread, setHasUnread] = useState(false);
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

    // Listen for custom event when notifications are updated within the same tab
    const handleNotificationUpdate = () => {
      fetchNotificationCount();
    };

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
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      if (unsubscribeVaccine) unsubscribeVaccine();
      if (unsubscribeSessions) unsubscribeSessions();
      if (unsubscribeInventory) unsubscribeInventory();
    };
  }, [userId, userRole, barangayId]);

  const fetchNotificationCount = async () => {
    try {
      // Fetch status rows (read/archived) from DB
      const statusMap = await getNotificationStatus(userId).catch(() => ({}));

      // Fetch latest notifications (IDs only)
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
    } catch (err) {
      // On error, hide the badge
      setHasUnread(false);
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

  const toggleSidebar = () => {
    // Dispatch a custom event to toggle the sidebar
    window.dispatchEvent(new CustomEvent('toggleSidebar'));
  };

  return (
    <div className="flex items-center justify-between p-9 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="lg:hidden p-0 h-6 w-6"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 text-sm mt-2">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center space-x-8">
        {/* Offline status indicator */}
        <OfflineIndicator />

        <div
          className="relative cursor-pointer"
          onClick={handleNotificationClick}
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-700 hover:text-gray-900 transition-colors" />
          {hasUnread && (
            <div
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-lg z-10"
              aria-label="Unread notifications"
            />
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
                  ? "/pages/PublicHealthNurse/SettingsPrivacy" 
                  : "/pages/RuralHealthMidwife/SettingsPrivacy";
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