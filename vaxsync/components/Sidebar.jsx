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
  CheckCircle,
  FileText,
  Bell,
  Users,
  Settings,
  LogOut,
  ClipboardCheck,
  FileCheck,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Inventory", icon: Boxes, path: "/inventory" },
    { name: "Vaccination", icon: Syringe, path: "/vaccination" },
    { name: "Schedule", icon: CalendarDays, path: "/schedule" },
    { name: "Resident Data", icon: User, path: "/residents" },
    { name: "Resident Approval", icon: CheckCircle, path: "/resident-approval" },
    { name: "Vaccine Requests", icon: FileText, path: "/vaccine-requests" },
    { name: "Request Approval", icon: FileCheck, path: "/request-approval" },
    { name: "Reports", icon: ClipboardCheck, path: "/reports" },
    { name: "Notifications", icon: Bell, path: "/notifications" },
    { name: "User Management", icon: Users, path: "/users" },
    { name: "Settings", icon: Settings, path: "/settings" },
    { name: "Logout", icon: LogOut, path: "/logout" },
  ];

  return (
    <div className="h-screen bg-gray-900 text-gray-200 w-64 p-4 flex flex-col border-r border-gray-700">
      <div className="text-center font-semibold text-lg text-white mb-6 tracking-wide">
        VaxSync
      </div>
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Button
              key={item.name}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start text-sm font-medium ${
                isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Link href={item.path}>
                <Icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>
     
    </div>
  );
}
