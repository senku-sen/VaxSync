"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DeleteUserModal from "@/components/modals/delete-user-modals";

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
  );
}

