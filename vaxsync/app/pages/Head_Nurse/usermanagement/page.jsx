"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DeleteUserModal from "@/components/modals/delete-user-modals";

const FEATURE_CHECKLIST = [
  { key: "dashboard", label: "Dashboard" },
  { key: "inventory", label: "Inventory" },
  { key: "vaccine_usage", label: "Vaccine Usage" },
  { key: "vaccination_schedule", label: "Vaccination Schedule" },
  { key: "resident_data", label: "Resident Data" },
  { key: "vaccine_requests", label: "Vaccine Requests" },
  { key: "notifications", label: "Notifications" },
];

const defaultPermissionsForRole = (role) => {
  return FEATURE_CHECKLIST.reduce((acc, feature) => {
    acc[feature.key] = true;
    return acc;
  }, {});
};

export default function HeadNurseUserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
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
        setUsers(
          (data || []).map((user) => ({
            ...user,
            permissions: defaultPermissionsForRole(user.user_role),
          }))
        );
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

  const handleDeleteClick = (user) => {
    console.log('Delete button clicked for user:', user);
    console.log('User ID to delete:', user.id);
    console.log('User ID type:', typeof user.id);
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      setDeletingUserId(userId);
      
      console.log('Attempting to delete user with ID:', userId);
      
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      // Check if response is ok before trying to parse JSON
      let responseData;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('Delete response status:', response.status);
      console.log('Delete response data:', responseData);

      if (!response.ok) {
        let errorMessage = responseData?.error || responseData?.details || responseData?.message || `Server error: ${response.status}`;
        
        // Provide more helpful error messages
        if (responseData?.code === '23503' || errorMessage.includes('barangays') || errorMessage.includes('assigned')) {
          errorMessage = responseData?.message || "This user is assigned to one or more barangays. Please unassign them first before deleting.";
        }
        
        console.error('Delete failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Verify deletion was successful
      if (responseData.warning) {
        console.warn('Delete warning:', responseData.warning);
        throw new Error(responseData.error || 'User not found or already deleted');
      }

      // Check if deletion was actually successful
      if (!responseData.message && !responseData.deletedCount) {
        throw new Error('Delete operation completed but no confirmation received');
      }

      console.log('User deleted successfully from database');

      // Wait a bit for smooth animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Remove user from local state only after successful deletion
      setUsers(users.filter((u) => u.id !== userId));
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeletingUserId(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.message || 'Unknown error occurred. Please try again.';
      alert(`Failed to delete user: ${errorMessage}`);
      setDeletingUserId(null);
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  return (
    <>
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
                        <tr 
                          key={user.id} 
                          className={`hover:bg-gray-50 transition-all duration-300 ${
                            deletingUserId === user.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                          }`}
                        >
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModalForUser(user);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(user)}
                                className="hover:text-red-500 cursor-pointer"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={handleCloseDeleteModal}
          onDelete={handleDeleteUser}
        />
      )}
    </div>

    {isModalOpen && activeUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {activeUser.user_role === "RHM/HRH" ? "User Information" : "Edit User"}
              </h2>
              <p className="text-sm text-gray-500">
                {activeUser.user_role === "RHM/HRH"
                  ? "RHM/HRH accounts are view-only."
                  : "Update user details and access permissions."}
              </p>
            </div>
            <button
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              onClick={closeModal}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
            {modalError ? (
              <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalError}
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">
                First Name
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/30 disabled:bg-gray-100"
                value={formState.first_name}
                onChange={(e) => handleFormChange("first_name", e.target.value)}
                disabled={activeUser.user_role === "RHM/HRH"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Last Name
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/30 disabled:bg-gray-100"
                value={formState.last_name}
                onChange={(e) => handleFormChange("last_name", e.target.value)}
                disabled={activeUser.user_role === "RHM/HRH"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/30 disabled:bg-gray-100"
                value={formState.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/30 disabled:bg-gray-100"
                value={formState.user_role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  handleFormChange("user_role", newRole);
                  setPermissionDraft(defaultPermissionsForRole(newRole));
                }}
                disabled={activeUser.user_role === "RHM/HRH"}
              >
                <option value="Health Worker">Health Worker</option>
                <option value="RHM/HRH">RHM/HRH</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Address / Barangay
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/30 disabled:bg-gray-100"
                value={formState.address}
                onChange={(e) => handleFormChange("address", e.target.value)}
                disabled={activeUser.user_role === "RHM/HRH"}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Page Access
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {FEATURE_CHECKLIST.map((feature) => (
                <label
                  key={feature.key}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={permissionDraft?.[feature.key] ?? false}
                    onChange={() => togglePermission(feature.key)}
                    disabled={activeUser.user_role === "RHM/HRH"}
                  />
                  {feature.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <Button variant="ghost" onClick={closeModal}>
              Close
            </Button>
            {activeUser.user_role !== "RHM/HRH" && (
              <Button
                onClick={handleSave}
                className="bg-[#3E5F44] text-white hover:bg-[#2F4B35]"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

