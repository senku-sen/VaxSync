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

export default function InventoryHeader({ title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    fetchNotificationCount();
    
    // Refresh notification count every 5 seconds
    const interval = setInterval(fetchNotificationCount, 5000);

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        console.log('Notification change detected');
        fetchNotificationCount();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      console.log('Fetching notifications for user:', user.id);

      const { data, count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      console.log('Notification query result:', { count, error, dataLength: data?.length });

      if (error) {
        console.error('Error fetching notifications:', error);
        // If table doesn't exist or permission denied, set count to 0
        setNotificationCount(0);
      } else if (count !== null) {
        setNotificationCount(count);
      }
    } catch (err) {
      console.error('Error in fetchNotificationCount:', err);
      setNotificationCount(0);
    }
  };

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}
    try { 
      localStorage.removeItem('vaxsync_user'); 
      // Clear the auth cookie
      document.cookie = 'vaxsync_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch {}
    window.location.href = "/pages/signin";
  }

  const handleNotificationClick = () => {
    // Determine the base path (Public_Health_Nurse or Rural_Health_Midwife)
    const isPublicHealthNurse = pathname.includes("Public_Health_Nurse");
    const isRuralHealthMidwife = pathname.includes("Rural_Health_Midwife");
    
    if (isPublicHealthNurse) {
      router.push("/pages/Public_Health_Nurse/notifications");
    } else if (isRuralHealthMidwife) {
      router.push("/pages/Rural_Health_Midwife/notifications");
    } else {
      // Fallback: check localStorage for user role if pathname doesn't indicate role
      try {
        const cachedUser = JSON.parse(localStorage.getItem('vaxsync_user') || 'null');
        if (cachedUser?.user_role === "Public Health Nurse") {
          router.push("/pages/Public_Health_Nurse/notifications");
        } else {
          router.push("/pages/Rural_Health_Midwife/notifications");
        }
      } catch (err) {
        // Default to Rural Health Midwife if error
        router.push("/pages/Rural_Health_Midwife/notifications");
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
        
        <div className="relative cursor-pointer flex items-center gap-2" onClick={handleNotificationClick}>
          <Bell className="h-5 w-5 text-gray-700 hover:text-gray-900 transition-colors" />
          {notificationCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
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
              <a href={pathname.includes("Public_Health_Nurse") ? "/pages/Public_Health_Nurse/settings-privacy" : "/pages/Rural_Health_Midwife/settings-privacy"} className="flex items-center">
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
