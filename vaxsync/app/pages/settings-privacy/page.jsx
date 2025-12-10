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
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="lg:ml-72">
        <Header title="Settings & Privacy" subtitle="Configure system preferences" />
        <div className="px-8 py-6">

          {/* Top Controls */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <Button
              className={`px-6 py-2 border rounded-lg font-medium transition-colors ${activeTab === "account" ? "bg-[#3E5F44] text-white border-[#3E5F44] hover:bg-[#3E5F44]/90" : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"}`}
              onClick={() => setActiveTab("account")}
            >
              Account Information
            </Button>
            <Button
              className={`px-6 py-2 border rounded-lg font-medium transition-colors ${activeTab === "org" ? "bg-[#3E5F44] text-white border-[#3E5F44] hover:bg-[#3E5F44]/90" : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"}`}
              onClick={() => setActiveTab("org")}
            >
              Organization Information
            </Button>
          </div>

          {/* Content */}
          {activeTab === "account" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 max-w-5xl">
        {/* Account Information Card */}
            <Card className="border border-[#3E5F44] rounded-md lg:col-span-7">
              <div className="p-4">
            <h2 className="font-semibold text-gray-900 mb-1">Account Information</h2>
            <p className="text-sm text-gray-600 mb-4">Manage your personal account details</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-gray-800">First Name</Label>
                  <Input value={profile?.first_name || ""} readOnly className="mt-1"  />
                </div>
                <div>
                  <Label className="text-gray-800">Last Name</Label>
                  <Input value={profile?.last_name || ""} readOnly className="mt-1"  />
                </div>
                <div>
                  <Label className="text-gray-800">Email</Label>
                  <Input value={profile?.email || ""} readOnly className="mt-1"  />
                </div>
                <div>
                  <Label className="text-gray-800">Address</Label>
                  <Input value={profile?.address || ""} readOnly className="mt-1" />
                </div>
              </div>

              {/* Right: role */}
              <div>
                <Label className="text-gray-800 mb-2 block">Role</Label>
                <RadioGroup value={profile?.user_role === "Public Health Nurse" ? "phn" : "rhm"} className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="rhm"
                      id="rhm"
                      className="border-gray-400 data-[state=checked]:bg-[#3E5F44] data-[state=checked]:border-[#3E5F44] after:hidden"
                      disabled
                    />
                    <Label htmlFor="rhm" className="text-gray-800">Rural Health Midwife (RHM)</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="phn"
                      id="phn"
                      className="border-gray-400 data-[state=checked]:bg-[#3E5F44] data-[state=checked]:border-[#3E5F44] after:hidden"
                      disabled
                    />
                    <Label htmlFor="phn" className="text-gray-800">Public Health Nurse</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Logout button at the bottom left */}
            <div className="mt-6">
              <Button onClick={handleLogout} className="bg-[#3E5F44] text-white hover:bg-[#3E5F44]/90">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </Card>

        {/* Account & Security Card */}
            <Card className="border border-[#3E5F44] rounded-md lg:col-span-5">
              <div className="p-4">
            <h2 className="font-semibold text-gray-900 mb-1">Account & Security</h2>
            <p className="text-sm text-gray-600 mb-4">Update your password and security settings</p>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-gray-800">Current Password</Label>
                <Input type="password" className="mt-1" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <Label className="text-gray-800">New Password</Label>
                <Input type="password" className="mt-1" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label className="text-gray-800">Confirm Password</Label>
                <Input type="password" className="mt-1" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button disabled={saving} onClick={handleChangePassword} className="bg-[#3E5F44] text-white hover:bg-[#3E5F44]/90">
                {saving ? "Saving..." : "Confirm Password"}
              </Button>
              {saveMessage ? (
                <p className="text-sm text-gray-700">{saveMessage}</p>
              ) : null}
            </div>
          </div>
        </Card>
          </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 max-w-4xl">
            <Card className="border border-[#3E5F44] rounded-md lg:col-span-8">
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 mb-1">Organization Information</h2>
                <p className="text-sm text-gray-600 mb-4">Set up your Barangay details</p>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-gray-800">RHU</Label>
                    <Input value="Daet Camarines Norte - RHU 1" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-800">Barangay</Label>
                    <Input value="Pamorangan" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-800">Email</Label>
                    <Input value="contact@rhu.gov" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-800">Phone</Label>
                    <Input value="+63-123-456-7890" readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-800">Address</Label>
                    <Input value="Daet, Camarines Norte" readOnly className="mt-1" />
                  </div>
                </div>

                <div className="mt-6">
                  <Button onClick={handleLogout} className="bg-[#3E5F44] text-white hover:bg-[#3E5F44]/90">
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


