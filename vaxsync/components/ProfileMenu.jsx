"use client";

import { User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

export default function ProfileMenu() {
  async function handleLogout() {
    try { await supabase.auth.signOut(); } catch {}
    try { localStorage.removeItem("vaxsync_user"); } catch {}
    window.location.href = "/pages/signin";
  }

  return (
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
  );
}
