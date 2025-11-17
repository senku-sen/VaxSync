'use client';

import { useState } from 'react';

const ROLES = [
  { id: 'health-worker', label: 'Health Worker', description: 'Can manage health records and vaccinations' },
  { id: 'head-nurse', label: 'Head Nurse', description: 'Oversees health workers and approves records' },
  { id: 'supervisor', label: 'Supervisor', description: 'Manages inventory and schedules' },
  { id: 'admin', label: 'Administrator', description: 'Full system access' },
];

export default function ManageRoleModal({ user, onClose, onUpdateRole }) {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const handleSave = () => {
    onUpdateRole(user.id, selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Manage Role</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Changing role for: <span className="font-medium text-gray-900">{user.name}</span>
          </p>

          <div className="space-y-3 mb-6">
            {ROLES.map((role) => (
              <label key={role.id} className="flex items-start p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-300 transition" style={{ borderColor: selectedRole === role.label ? '#16a34a' : undefined }}>
                <input
                  type="radio"
                  name="role"
                  value={role.label}
                  checked={selectedRole === role.label}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">{role.label}</p>
                  <p className="text-xs text-gray-600">{role.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Update Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}