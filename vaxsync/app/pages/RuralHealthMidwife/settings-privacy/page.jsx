"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LogOut } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPrivacyPage() {
  const [activeTab, setActiveTab] = useState("account"); // "account" | "org"
  const [profile, setProfile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function handleLogout() {
    try { await supabase.auth.signOut(); } catch {}
    try { localStorage.removeItem('vaxsync_user'); } catch {}
    window.location.href = "/pages/signin";
  }

  async function handleChangePassword() {
    setSaveMessage("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSaveMessage("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveMessage("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setSaveMessage("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      // Get email for re-auth
      const { data: sessionData } = await supabase.auth.getSession();
      let email = sessionData?.session?.user?.email || profile?.email;
      if (!email) {
        try { const cached = JSON.parse(localStorage.getItem('vaxsync_user') || 'null'); email = cached?.email; } catch {}
      }
      if (!email) {
        setSaveMessage("Unable to determine user email. Please sign in again.");
        setSaving(false);
        return;
      }

      // Verify current password by signing in
      const { error: signinError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signinError) {
        setSaveMessage("Current password is incorrect.");
        setSaving(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setSaveMessage(updateError.message || "Failed to update password.");
      } else {
        setSaveMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (e) {
      setSaveMessage("Unexpected error while updating password.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      // Try session first
      const { data: sessionData } = await supabase.auth.getSession();
      const userFromSession = sessionData?.session?.user;

      // Fallback to getUser
      const { data: userData } = await supabase.auth.getUser();
      const user = userFromSession || userData?.user;
      let loaded = false;
      if (user) {
        // Prefer selecting by id; fallback to email if needed
        let { data, error } = await supabase
          .from("user_profiles")
          .select("first_name,last_name,email,address,user_role")
          .eq("id", user.id)
          .single();

        if (error) {
          const alt = await supabase
            .from("user_profiles")
            .select("first_name,last_name,email,address,user_role")
            .eq("email", user.email || "")
            .single();
          if (!alt.error) data = alt.data;
        }

        if (isMounted && data) {
          setProfile(data);
          loaded = true;
        }
      }

      // Final fallback: cached minimal profile from localStorage (set at signin)
      if (!loaded) {
        try {
          const cached = JSON.parse(localStorage.getItem('vaxsync_user') || 'null');
          if (cached && isMounted) {
            setProfile({
              first_name: cached.first_name || "",
              last_name: cached.last_name || "",
              email: cached.email || "",
              address: cached.address || "",
              user_role: cached.user_role || "",
            });
          }
        } catch {}
      }
    }
    fetchProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });
    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Header title="Settings & Privacy" subtitle="Configure system preferences" />
        <div className="p-6 lg:p-8">

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab("account")}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === "account"
                  ? "text-[#3E5F44] border-[#3E5F44]"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              Account Information
            </button>
            <button
              onClick={() => setActiveTab("org")}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === "org"
                  ? "text-[#3E5F44] border-[#3E5F44]"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
            >
              Organization Information
            </button>
          </div>

          {/* Content */}
          {activeTab === "account" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
              {/* Account Information Card */}
              <Card className="lg:col-span-2 border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h2>
                  <p className="text-sm text-gray-600 mb-6">View and manage your personal account details</p>

                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">First Name</Label>
                      <Input value={profile?.first_name || ""} readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                      <Input value={profile?.last_name || ""} readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                      <Input value={profile?.email || ""} readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Address</Label>
                      <Input value={profile?.address || ""} readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">User Role</Label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="h-3 w-3 rounded-full bg-[#3E5F44]"></div>
                        <span className="text-sm font-medium text-gray-900">{profile?.user_role || "Not assigned"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Account & Security Card */}
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Security</h2>
                  <p className="text-sm text-gray-600 mb-6">Update your password</p>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Current Password</Label>
                      <Input 
                        type="password" 
                        className="mt-2" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">New Password</Label>
                      <Input 
                        type="password" 
                        className="mt-2" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
                      <Input 
                        type="password" 
                        className="mt-2" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button 
                        disabled={saving} 
                        onClick={handleChangePassword} 
                        className="w-full bg-[#3E5F44] text-white hover:bg-[#3E5F44]/90"
                      >
                        {saving ? "Updating..." : "Update Password"}
                      </Button>
                      {saveMessage && (
                        <p className={`text-sm ${saveMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                          {saveMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button 
                      onClick={handleLogout} 
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="max-w-2xl">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Organization Information</h2>
                  <p className="text-sm text-gray-600 mb-6">Your organization and barangay details</p>

                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Regional Health Unit (RHU)</Label>
                      <Input value="Daet Camarines Norte - RHU 1" readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Barangay</Label>
                      <Input value="Pamorangan" readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <Input value="contact@rhu.gov" readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone</Label>
                      <Input value="+63-123-456-7890" readOnly className="mt-2 bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Address</Label>
                      <Input value="Daet, Camarines Norte" readOnly className="mt-2 bg-gray-50" />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button 
                      onClick={handleLogout} 
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
