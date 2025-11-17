"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HeadNurseUserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          "id, first_name, last_name, email, user_role, address, date_of_birth, sex, created_at"
        )
        .order("created_at", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to fetch users:", error);
        setError("Unable to load users. Please try again later.");
        setUsers([]);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      name:
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.email ||
        "Unknown user",
      email: user.email || "—",
      role: user.user_role || "—",
      barangay: user.address || "Not specified",
      status: user.status || "Active",
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return displayUsers;
    const term = search.toLowerCase();
    return displayUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        (user.barangay || "").toLowerCase().includes(term)
    );
  }, [search, displayUsers]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header
          title="User Management"
          subtitle="Manage system users and permissions"
        />

        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/30"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <p className="text-sm font-semibold text-gray-900">
                  System Users
                </p>
                <p className="text-sm text-gray-500">
                  All registered users and their roles
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Email</th>
                      <th className="px-6 py-3 text-left">Role</th>
                      <th className="px-6 py-3 text-left">Barangay</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          Loading users…
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-sm text-red-500"
                        >
                          {error}
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          No users found for “{search}”.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {user.role}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {user.barangay}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-gray-500">
                              <button
                                type="button"
                                className="hover:text-[#3E5F44]"
                                aria-label={`Edit ${user.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="hover:text-red-500"
                                aria-label={`Delete ${user.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

