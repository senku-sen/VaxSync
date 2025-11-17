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
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [cachedRole, setCachedRole] = useState("");

  const isHealthWorker = pathname.startsWith("/pages/Health_Worker");
  const isHeadNurse = pathname.startsWith("/pages/Head_Nurse");
  const isSettingsStandalone = pathname === "/pages/settings-privacy";

  useEffect(() => {
    if (isSettingsStandalone) {
      try {
        const cached = JSON.parse(localStorage.getItem("vaxsync_user") || "null");
        if (cached?.user_role) setCachedRole(cached.user_role);
      } catch {}
    }
  }, [isSettingsStandalone]);

  const roleIsHW = isHealthWorker || (isSettingsStandalone && cachedRole === "Health Worker");
  const roleIsHN = isHeadNurse || (isSettingsStandalone && cachedRole === "RHM/HRH");

  if (!roleIsHW && !roleIsHN && !isSettingsStandalone) return null;

  const basePath = roleIsHW ? "/pages/Health_Worker" : "/pages/Head_Nurse";

  // Full list of items
  const allMenuItems = [
    { name: "Dashboard", icon: Home, path: basePath },
    { name: "Inventory", icon: Package, path: `${basePath}/inventory` },
    { name: "Barangay Management", icon: MapPin, path: `${basePath}/barangay-management`, adminOnly: true },
    { name: "Vaccine Usage", icon: Syringe, path: `${basePath}/vaccine-usage` },
    { name: "Vaccination Schedule", icon: Calendar, path: `${basePath}/schedule` },
    { name: "Resident Data", icon: Users, path: `${basePath}/residents` },
    { name: "Resident Approval", icon: CheckCircle, path: `${basePath}/resident-approval`, adminOnly: true },
    { name: "Vaccine Requests", icon: FileText, path: `${basePath}/vaccination_request` },
    { name: "Request Approval", icon: ArrowUpCircle, path: `${basePath}/request-approval`, adminOnly: true },
    { name: "Reports", icon: BarChart3, path: `${basePath}/reports`, adminOnly: true },
    { name: "Notifications", icon: Bell, path: `${basePath}/notifications` },
    { name: "User Management", icon: UserCog, path: `${basePath}/usermanagement`, adminOnly: true },
  ];

  // Filter: Health Worker = no admin items | RHM/HRH = all
  const menuItems = allMenuItems.filter(item => !item.adminOnly || roleIsHN);

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
        className={`fixed inset-y-0 left-0 w-64 bg-[#F2F2F2] text-gray-800 flex flex-col border-r border-gray-300 transform transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-gray-300">
          <div className="flex items-center">
            <img src="/VSyncLogo.png" alt="VaxSync" className="h-25 w-auto" />
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
                <Button
                  key={item.name}
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
              );
            })}
          </div>
        </nav>

      </div>
    </>
  );
}