'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast from '@/components/common/Toast';

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Health Worker',
    barangay: 'Barangay A'
  });

  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Geldwyn Duro',
      email: 'sduro@gov.admin.edu.ph',
      role: 'Head Nurse',
      barangay: 'Main Office',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      email: 'juan@rhu.gov',
      role: 'Health Worker',
      barangay: 'Barangay A',
      status: 'Active'
    }
  ]);

  const handleAddUser = () => {
    const newUser = {
      id: users.length + 1,
      ...formData,
      status: 'Active'
    };
    setUsers([...users, newUser]);
    setShowAddModal(false);
    setFormData({ name: '', email: '', role: 'Health Worker', barangay: 'Barangay A' });
    setToast({ show: true, message: 'User added successfully!', type: 'success' });
  };

  const handleEditUser = () => {
    setUsers(users.map(user => 
      user.id === selectedUser.id ? { ...user, ...formData } : user
    ));
    setShowEditModal(false);
    setSelectedUser(null);
    setToast({ show: true, message: 'User updated successfully!', type: 'success' });
  };

  const handleDeleteUser = () => {
    setUsers(users.filter(user => user.id !== selectedUser.id));
    setSelectedUser(null);
    setToast({ show: true, message: 'User deleted successfully!', type: 'success' });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      barangay: user.barangay
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">User Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage system users and permissions</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Search Bar and Add User Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-md flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent placeholder:text-gray-400"
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="ml-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#3E5F44] text-white text-sm font-medium rounded-md hover:bg-[#2d4532] transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">System Users</h2>
              <p className="text-xs text-gray-500 mt-0.5">All registered users and their roles</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {user.name}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.role}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.barangay}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-700 border-green-200">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-gray-600 hover:text-[#3E5F44] hover:bg-gray-100 rounded transition-colors" 
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openDeleteDialog(user)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Add New User</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Create a new system user account</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', email: '', role: 'Health Worker', barangay: 'Barangay A' });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                >
                  <option>Health Worker</option>
                  <option>Head Nurse</option>
                  <option>Municipal Health Officer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">Barangay</label>
                <select
                  value={formData.barangay}
                  onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                >
                  <option>Main Office</option>
                  <option>Barangay A</option>
                  <option>Barangay B</option>
                  <option>Barangay C</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', email: '', role: 'Health Worker', barangay: 'Barangay A' });
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!formData.name || !formData.email}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-md hover:from-[#2d4532] hover:to-[#4a7255] transition-all shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit User</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Update user information</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                >
                  <option>Health Worker</option>
                  <option>Head Nurse</option>
                  <option>Municipal Health Officer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3E5F44] mb-2">Barangay</label>
                <select
                  value={formData.barangay}
                  onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                >
                  <option>Main Office</option>
                  <option>Barangay A</option>
                  <option>Barangay B</option>
                  <option>Barangay C</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-md hover:from-[#2d4532] hover:to-[#4a7255] transition-all shadow-md"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </DashboardLayout>
  );
}
