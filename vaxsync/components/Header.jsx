"use client";

import { Bell } from "lucide-react";
import ProfileMenu from "@/components/ProfileMenu";

export default function Header({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between p-9 border-b border-gray-200 bg-white">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 text-sm mt-2">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-8">
        <div className="relative">
          <Bell className="h-5 w-5 text-gray-700 hover:text-gray-700 cursor-pointer" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </div>
        <ProfileMenu />
      </div>
    </div>
  );
}
