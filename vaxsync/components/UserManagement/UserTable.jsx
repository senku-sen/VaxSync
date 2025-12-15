
"use client";

import { Pencil, Trash2 } from "lucide-react";

const StatusBadge = ({ status = "Active" }) => {
  const variants = {
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-gray-100 text-gray-600",
    Pending: "bg-yellow-100 text-yellow-700",
    Suspended: "bg-red-100 text-red-700",
  };

  const pillClass = variants[status] || variants.Active;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${pillClass}`}>
      {status}
    </span>
  );
};

export default function UserTable({
  users = [],
  onEdit,
  onDelete,
  onManageRole,
  onViewActivity,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <p className="text-sm font-semibold text-gray-900">System Users</p>
        <p className="text-sm text-gray-500">All registered users and their roles</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Barangay</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-gray-600">{user.role}</td>
                  <td className="px-6 py-4 text-gray-600">{user.barangay}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className="text-gray-500 hover:text-[#3E5F44] transition"
                        aria-label={`Edit ${user.name}`}
                        onClick={() => onEdit?.(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-red-500 transition"
                        aria-label={`Delete ${user.name}`}
                        onClick={() => onDelete?.(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {onManageRole && (
                        <button
                          type="button"
                          onClick={() => onManageRole(user)}
                          className="text-gray-500 hover:text-blue-600 transition text-xs font-medium"
                        >
                          Manage Role
                        </button>
                      )}
                      {onViewActivity && (
                        <button
                          type="button"
                          onClick={() => onViewActivity(user)}
                          className="text-gray-500 hover:text-purple-600 transition text-xs font-medium"
                        >
                          View Activity
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
