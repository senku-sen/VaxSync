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
  fetchVaccinationSessionNotifications
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
        console.error('Error initializing user:', err);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (!userId || !userRole) return;

    fetchNotificationCount();
    
    // Refresh notification count every 10 seconds
    const interval = setInterval(fetchNotificationCount, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [userId, userRole, barangayId]);

  const fetchNotificationCount = async () => {
    try {
      let totalUnread = 0;

      if (userRole === 'Health Worker') {
        // Health Worker: Resident Approvals + Vaccine Requests + Sessions
        const [residentNotifs, vaccineNotifs, sessionNotifs] = await Promise.all([
          fetchResidentApprovalNotifications(userId).catch(() => ({ data: [] })),
          fetchVaccineRequestNotifications(userId).catch(() => ({ data: [] })),
          fetchVaccinationSessionNotifications(userId, barangayId, false).catch(() => ({ data: [] })),
        ]);

        // Get cached read status from localStorage
        let cachedNotifications = {};
        try {
          const cached = localStorage.getItem('healthWorkerNotifications');
          if (cached) {
            const parsed = JSON.parse(cached);
            cachedNotifications = Object.fromEntries(parsed.map(n => [n.id, { read: n.read, archived: n.archived }]));
          }
        } catch (e) {
          // Ignore localStorage errors
        }

        const residentUnread = residentNotifs.data?.filter(n => !(cachedNotifications[n.id]?.read ?? n.read)).length || 0;
        const vaccineUnread = vaccineNotifs.data?.filter(n => !(cachedNotifications[n.id]?.read ?? n.read)).length || 0;
        const sessionUnread = sessionNotifs.data?.filter(n => !(cachedNotifications[n.id]?.read ?? n.read) && n.isUpcoming).length || 0;

        totalUnread = residentUnread + vaccineUnread + sessionUnread;
      } else if (userRole === 'Head Nurse') {
        // Head Nurse: Vaccine Requests + All Sessions
        const vaccineNotifs = await fetchVaccineRequestNotifications(userId).catch(() => ({ data: [] }));
        const sessionNotifs = await fetchVaccinationSessionNotifications(userId, null, true).catch(() => ({ data: [] }));

        // Get cached read status from localStorage
        let cachedNotifications = {};
        try {
          const cached = localStorage.getItem('headNurseNotifications');
          if (cached) {
            const parsed = JSON.parse(cached);
            cachedNotifications = Object.fromEntries(parsed.map(n => [n.id, { read: n.read, archived: n.archived }]));
          }
        } catch (e) {
          // Ignore localStorage errors
        }

        const vaccineUnread = vaccineNotifs.data?.filter(n => !(cachedNotifications[n.id]?.read ?? n.read) && n.status === 'pending').length || 0;
        // For Head Nurse, count all upcoming sessions (not just within 1 day)
        const sessionUnread = sessionNotifs.data?.filter(n => !(cachedNotifications[n.id]?.read ?? n.read) && (n.isUpcoming || (n.daysUntil > 0))).length || 0;

        totalUnread = vaccineUnread + sessionUnread;
      }

      setNotificationCount(totalUnread);
    } catch (err) {
      // Silently fail
      setNotificationCount(0);
    }
  };

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}
    try { localStorage.removeItem('vaxsync_user'); } catch {}
    window.location.href = "/pages/signin";
  }

  const handleNotificationClick = () => {
    // Determine the base path (Health_Worker or Head_Nurse)
    const isHealthWorker = pathname.includes("Health_Worker");
    const isHeadNurse = pathname.includes("Head_Nurse");
    
    if (isHealthWorker) {
      router.push("/pages/Health_Worker/notifications");
    } else if (isHeadNurse) {
      router.push("/pages/Head_Nurse/notifications");
    } else {
      // Fallback: check localStorage for user role if pathname doesn't indicate role
      try {
        const cachedUser = JSON.parse(localStorage.getItem('vaxsync_user') || 'null');
        if (cachedUser?.user_role === "Health Worker") {
          router.push("/pages/Health_Worker/notifications");
        } else {
          router.push("/pages/Head_Nurse/notifications");
        }
      } catch (err) {
        // Default to Head Nurse if error
        router.push("/pages/Head_Nurse/notifications");
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
        
        <div className="relative cursor-pointer" onClick={handleNotificationClick}>
          <Bell className={`h-5 w-5 transition-colors ${notificationCount > 0 ? 'text-red-500 hover:text-red-600' : 'text-gray-700 hover:text-gray-900'}`} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse border border-white"></span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-6 w-6">
              <User className="h-5 w-5 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-[#3E5F44] rounded-md shadow-sm">
            <DropdownMenuItem asChild className="flex items-center cursor-pointer">
              <a href={pathname.includes("Health_Worker") ? "/pages/Health_Worker/settings-privacy" : "/pages/Head_Nurse/settings-privacy"} className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings & Privacy
              </a>
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
