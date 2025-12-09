
'use client';

import { useEffect, useMemo, useState } from 'react';

const ROLE_OPTIONS = ['Rural Health Midwife (RHM)', 'Public Health Nurse', 'Supervisor', 'Administrator'];
const STATUS_OPTIONS = ['Active', 'Inactive', 'Pending', 'Suspended'];

const buildInitialForm = (user) => {
  if (!user) {
    return {
      firstName: '',
      lastName: '',
      email: '',
      role: ROLE_OPTIONS[0],
      barangay: '',
      status: STATUS_OPTIONS[0],
    };
  }

  const nameParts = (user.name || '').trim().split(/\s+/);
  const firstName = user.first_name ?? nameParts[0] ?? '';
  const lastName = user.last_name ?? nameParts.slice(1).join(' ');

  return {
    firstName,
    lastName,
    email: user.email || '',
    role: user.role || user.user_role || ROLE_OPTIONS[0],
    barangay: user.barangay || user.address || '',
    status: user.status || STATUS_OPTIONS[0],
  };
};

export default function EditUserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState(buildInitialForm(user));

  useEffect(() => {
    setFormData(buildInitialForm(user));
  }, [user]);

  const fullName = useMemo(
    () => [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim(),
    [formData.firstName, formData.lastName]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...user,
      id: user.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      name: fullName || user.name || 'Unnamed user',
      email: formData.email,
      role: formData.role,
      user_role: formData.role,
      barangay: formData.barangay,
      address: formData.barangay,
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-semibold">Edit User</p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-1">{user?.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/20"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay / Location</label>
              <input
                type="text"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#3E5F44] focus:ring-2 focus:ring-[#3E5F44]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex flex-wrap gap-3">
              {STATUS_OPTIONS.map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setFormData((prev) => ({ ...prev, status }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    formData.status === status
                      ? 'bg-[#3E5F44] text-white border-[#3E5F44]'
                      : 'border-gray-300 text-gray-600 hover:border-[#3E5F44]/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#3E5F44] text-white font-semibold text-sm shadow-sm hover:bg-[#324c38] transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}