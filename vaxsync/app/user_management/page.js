'use client';

import { useMemo, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import UserTable from '@/components/user-management/UserTable';
import AddUserModal from '@/components/modals/add-user-modals';
import EditUserModal from '@/components/modals/edit-user-modals';
import DeleteUserModal from '@/components/modals/delete-user-modals';
import ManageRoleModal from '@/components/modals/manage-role-modals';
import ViewActivityModal from '@/components/modals/view-activity-modals';
import { Search, Plus } from 'lucide-react';

const withDisplayFields = (user) => {
  if (!user) return null;
  const fullName =
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    'Unnamed user';

  return {
    ...user,
    name: fullName,
    email: user.email || '—',
    role: user.role || user.user_role || '—',
    barangay: user.barangay || user.address || 'Not specified',
    status: user.status || 'Active',
  };
};

export default function UserManagement() {
  const [users, setUsers] = useState([
    {
      id: 1,
      first_name: 'Selwyn',
      last_name: 'Duro',
      email: 'sduro@gov.edu.ph',
      user_role: 'Head Nurse',
      address: 'Main Office',
      status: 'Active',
    },
    {
      id: 2,
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      email: 'juan@health.gov',
      user_role: 'Health Worker',
      address: 'Barangay A',
      status: 'Active',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const formattedUsers = useMemo(() => users.map(withDisplayFields), [users]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return formattedUsers;
    const term = searchTerm.toLowerCase();
    return formattedUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        (user.barangay || '').toLowerCase().includes(term)
    );
  }, [formattedUsers, searchTerm]);

  const prepareModalUser = (user) => {
    if (!user) return null;
    return withDisplayFields(user);
  };

  const handleAddUser = (newUser) => {
    setUsers((prev) => [
      ...prev,
      {
        ...newUser,
        id: Math.max(0, ...prev.map((u) => u.id)) + 1,
        first_name: newUser.first_name || newUser.name?.split(' ')[0] || '',
        last_name:
          newUser.last_name || newUser.name?.split(' ').slice(1).join(' ') || '',
        user_role: newUser.role,
        address: newUser.barangay,
        status: newUser.status || 'Active',
      },
    ]);
    setActiveModal(null);
  };

  const handleEditUser = (updatedUser) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === updatedUser.id
          ? {
              ...user,
              ...updatedUser,
              first_name:
                updatedUser.first_name ||
                updatedUser.name?.split(' ')[0] ||
                user.first_name,
              last_name:
                updatedUser.last_name ||
                updatedUser.name?.split(' ').slice(1).join(' ') ||
                user.last_name,
              user_role: updatedUser.user_role || updatedUser.role || user.user_role,
              address: updatedUser.address || updatedUser.barangay || user.address,
              status: updatedUser.status || user.status,
            }
          : user
      )
    );
    setActiveModal(null);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setActiveModal(null);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleUpdateRole = (userId, newRole) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, user_role: newRole, role: newRole } : user
      )
    );
    setActiveModal(null);
    setSelectedUser(null);
  };

  const openModal = (modal, user = null) => {
    setSelectedUser(user ? prepareModalUser(user) : null);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAF7]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 text-sm">Manage system users and permissions</p>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <button className="p-2 hover:text-gray-600 transition" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
              SD
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/20"
                />
              </div>
              <button
                onClick={() => openModal('add')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3E5F44] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#324c38] transition"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
            </div>

            <UserTable
              users={filteredUsers}
              onEdit={(user) => {
                const original = users.find((u) => u.id === user.id) || user;
                openModal('edit', original);
              }}
              onDelete={(user) => {
                const original = users.find((u) => u.id === user.id) || user;
                openModal('delete', original);
              }}
              onManageRole={(user) => {
                const original = users.find((u) => u.id === user.id) || user;
                openModal('manageRole', original);
              }}
              onViewActivity={(user) => {
                const original = users.find((u) => u.id === user.id) || user;
                openModal('viewActivity', original);
              }}
            />
          </div>
        </div>
      </div>

      {activeModal === 'add' && <AddUserModal onClose={closeModal} onAdd={handleAddUser} />}
      {activeModal === 'edit' && selectedUser && (
        <EditUserModal user={selectedUser} onClose={closeModal} onSave={handleEditUser} />
      )}
      {activeModal === 'delete' && selectedUser && (
        <DeleteUserModal user={selectedUser} onClose={closeModal} onDelete={handleDeleteUser} />
      )}
      {activeModal === 'manageRole' && selectedUser && (
        <ManageRoleModal user={selectedUser} onClose={closeModal} onUpdateRole={handleUpdateRole} />
      )}
      {activeModal === 'viewActivity' && selectedUser && (
        <ViewActivityModal user={selectedUser} onClose={closeModal} />
      )}
    </div>
  );
}