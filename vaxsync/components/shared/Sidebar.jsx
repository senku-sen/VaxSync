"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  Package,
  MapPin,
  Syringe,
  Calendar,
  Users,
  CheckCircle,
  FileText,
  ArrowUpCircle,
  BarChart3,
  Bell,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Load user role from localStorage on mount
  useEffect(() => {
    try {
      const cachedUser = JSON.parse(localStorage.getItem('vaxsync_user') || 'null');
      if (cachedUser?.user_role) {
        setUserRole(cachedUser.user_role);
      }
    } catch (err) {
      console.error('Error loading user role:', err);
    }
  }, []);

  const isSettingsStandalone = pathname === "/pages/settings-privacy";

  // If we don't have a role yet, don't render (prevents flicker/incorrect base on settings)
  if (!userRole) return null;

  // Always derive basePath from userRole (not from current pathname) so settings page does not flip context
  const basePath = userRole === "Public Health Nurse"
    ? "/pages/PublicHealthNurse"
    : "/pages/RuralHealthMidwife";

  // Only render for known contexts or settings page
  const isRolePath = pathname.startsWith(basePath);
  if (!isRolePath && !isSettingsStandalone) return null;

  // Full list of items
  const allMenuItems = [
    { name: "Dashboard", icon: Home, path: `${basePath}/dashboard` },
    { name: "Inventory", icon: Package, path: `${basePath}/inventory` },
    { name: "Barangay Management", icon: MapPin, path: `${basePath}/barangay-management`, adminOnly: true },
    
    { name: "Vaccination Schedule", icon: Calendar, path: `${basePath}/vaccination_schedule` },
    { name: "NIP Tracking", icon: Users, path: `${basePath}/residents` },

    { name: "Vaccine Requests", icon: FileText, path: `${basePath}/vaccination_request` },
   
    { name: "Reports", icon: BarChart3, path: `${basePath}/reports`, adminOnly: true },
    { name: "User Management", icon: UserCog, path: `${basePath}/usermanagement`, adminOnly: true },
  ];

  // Filter: Public Health Nurse = all | Rural Health Midwife = no admin items
  const menuItems = allMenuItems.filter(item => {
    if (!item.adminOnly) return true;
    // Admin items only for Public Health Nurse
    return userRole === "Public Health Nurse";
  });


  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md rounded-full p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-[#F2F2F2] text-gray-800 flex flex-col border-r border-gray-300 transform transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-300">
          <div className="flex items-center h-full">
            <img src="/VSyncLogo.png" alt="VaxSync" className="h-24 w-auto" />
          </div>
          <Button
            variant="ghost"
            className="lg:hidden text-gray-700 p-1"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <div key={item.name} className="relative">
                  <Button
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start text-base font-medium px-4 py-6 ${
                      isActive
                        ? "bg-[#3E5F44] text-white hover:bg-[#3E5F44]/90"
                        : "text-gray-900 hover:bg-gray-300"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href={item.path}>
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        
      </div>
    </>
  );
}