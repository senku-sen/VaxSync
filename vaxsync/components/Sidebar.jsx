"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Boxes,
  Syringe,
  CalendarDays,
  User,

  FileText,
  Bell,
  Users,
  Settings,
  LogOut,
  ClipboardCheck,
  FileCheck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Inventory", icon: Boxes, path: "/inventory" },
    { name: "Vaccination", icon: Syringe, path: "/vaccination" },
    { name: "Schedule", icon: CalendarDays, path: "/schedule" },
    { name: "Resident Data", icon: User, path: "/residents" },
    { name: "Vaccine Requests", icon: FileText, path: "/vaccine-requests" },
    { name: "Request Approval", icon: FileCheck, path: "/request-approval" },
    { name: "Reports", icon: ClipboardCheck, path: "/reports" },
    { name: "Notifications", icon: Bell, path: "/notifications" },
    { name: "User Management", icon: Users, path: "/users" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const logoutItem = { name: "Logout", icon: LogOut, path: "/logout" };

  return (
    <>
      {/* Mobile Button */}
      <Button
        variant="ghost"
        className="lg:hidden fixed top-4 left-4 z-50 text-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-[#F2F2F2] text-gray-800 flex flex-col border-r border-gray-300 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 z-40`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-gray-300">
          <div className="font-semibold text-lg text-gray-900 tracking-wide">
            VaxSync
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
                  className={`w-full justify-start text-base font-base px-4 py-6 ${
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

        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-300">
          <Button
            asChild
            variant={pathname === logoutItem.path ? "secondary" : "ghost"}
            className={`w-full justify-start text-base font-medium px-4 py-5 ${
              pathname === logoutItem.path
                ? "bg-[#3E5F44] text-white hover:bg-[#3E5F44]/90"
                : "text-gray-900 hover:bg-gray-300"
            }`}
            onClick={() => setIsOpen(false)}
          >
            <Link href={logoutItem.path}>
              <LogOut className="mr-3 h-5 w-5" />
              {logoutItem.name}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}