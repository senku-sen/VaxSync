"use client";

import { Bell, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

export default function InventoryHeader({ title, subtitle }) {
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}
    try { localStorage.removeItem('vaxsync_user'); } catch {}
    window.location.href = "/pages/signin";
  }

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-6 w-6">
              <User className="h-5 w-5 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-[#3E5F44] rounded-md shadow-sm">
            <DropdownMenuItem asChild className="flex items-center cursor-pointer">
              <a href="/pages/settings-privacy" className="flex items-center">
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
