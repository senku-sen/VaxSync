"use client";

import { Bell, User } from "lucide-react";

export default function InventoryHeader({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between p-9 border-b border-gray-200 bg-white">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 text-sm mt-2">{subtitle}</p>
      </div>
      <div className="flex space-x-8">
        <Bell className="h-5 w-5 text-gray-700 hover:text-gray-700 cursor-pointer" />
        <User className="h-5 w-5 text-gray-700 hover:text-gray-700 cursor-pointer" />
      </div>
    </div>
  );
}
