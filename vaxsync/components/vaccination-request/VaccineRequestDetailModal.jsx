// ============================================
// VACCINE REQUEST DETAIL MODAL COMPONENT
// ============================================
// Displays detailed information about a vaccine request
// Used in VaccineRequestsTable when clicking row or eye icon
// ============================================

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VaccineRequestDetailModal({
  isOpen,
  request,
  vaccine,
  onClose,
  isAdmin = false,
  onUpdate = null,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    quantity_dose: 0,
    quantity_vial: 0,
    notes: "",
    status: "pending",
  });

  useEffect(() => {
    if (request) {
      setEditData({
        quantity_dose: request.quantity_dose || 0,
        quantity_vial: request.quantity_vial || 0,
        notes: request.notes || "",
        status: request.status || "pending",
      });
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(request.id, editData);
      setIsEditing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
      case "released":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Request ID: {request.request_code || request.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Badge / Dropdown */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            {isEditing && isAdmin ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="released">Released</option>
              </select>
            ) : (
              <Badge
                variant="default"
                className={`${getStatusColor(editData.status)} border-0 px-3 py-1`}
              >
                {editData.status}
              </Badge>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Request Information */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Vaccine Type
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {vaccine?.name || "Loading..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quantity (doses)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={editData.quantity_dose}
                    onChange={(e) => setEditData({ ...editData, quantity_dose: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {editData.quantity_dose} doses
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quantity (vials)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={editData.quantity_vial}
                    onChange={(e) => setEditData({ ...editData, quantity_vial: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {editData.quantity_vial || '-'} vials
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Request Date
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {new Date(request.created_at).toLocaleDateString("en-CA")}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Request Time
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {new Date(request.created_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Notes Section - Only editable for Health Worker */}
          {!isAdmin && (
            <>
              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Notes
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
                    rows="3"
                    placeholder="Add notes..."
                  />
                ) : (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">
                      {editData.notes || "No notes provided"}
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>
            </>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Requested By
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {request.requested_by || "System"}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {(isAdmin || request.status === "pending") && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
