'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import UserTable from '@/components/user-table';
import AddUserModal from '@/components/modals/add-user-modals';
import EditUserModal from '@/components/modals/edit-user-modals';
import DeleteUserModal from '@/components/modals/delete-user-modals';
import ManageRoleModal from '@/components/modals/manage-role-modals';
import ViewActivityModal from '@/components/modals/view-activity-modals';

export default function UserManagement() {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Selwyn Duro',
      email: 'sduro@gov.edu.ph',
      role: 'Head Nurse',
      barangay: 'Main Office',
      status: 'Active',
      activity: [
        { action: 'Login', timestamp: '2024-11-17 09:30 AM' },
        { action: 'Updated profile', timestamp: '2024-11-16 02:15 PM' },
        { action: 'Login', timestamp: '2024-11-15 08:00 AM' },
      ],
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      email: 'juan@health.gov',
      role: 'Health Worker',
      barangay: 'Barangay A',
      status: 'Active',
      activity: [
        { action: 'Login', timestamp: '2024-11-17 10:00 AM' },
        { action: 'Added record', timestamp: '2024-11-16 03:45 PM' },
      ],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (newUser) => {
    setUsers([...users, { ...newUser, id: Math.max(...users.map((u) => u.id), 0) + 1 }]);
    setActiveModal(null);
  };

  const handleEditUser = (updatedUser) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setActiveModal(null);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter((u) => u.id !== userId));
    setActiveModal(null);
    setSelectedUser(null);
  };

  const handleUpdateRole = (userId, newRole) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setActiveModal(null);
    setSelectedUser(null);
  };

  const openModal = (modal, user = null) => {
    setSelectedUser(user);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 text-sm">Manage system users and permissions</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Search and Add Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => openModal('add')}
                className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>+</span> Add User
              </button>
            </div>

            {/* Users Table */}
            <UserTable
              users={filteredUsers}
              onEdit={(user) => openModal('edit', user)}
              onDelete={(user) => openModal('delete', user)}
              onManageRole={(user) => openModal('manageRole', user)}
              onViewActivity={(user) => openModal('viewActivity', user)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
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