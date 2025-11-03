// ============================================
// VACCINE REQUEST DETAIL MODAL COMPONENT
// ============================================
// Displays detailed information about a vaccine request
// Used in VaccineRequestsTable when clicking row or eye icon
// ============================================

"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VaccineRequestDetailModal({
  isOpen,
  request,
  vaccine,
  onClose,
}) {
  if (!isOpen || !request) return null;

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
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <Badge
              variant="default"
              className={`${getStatusColor(request.status)} border-0 px-3 py-1`}
            >
              {request.status}
            </Badge>
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

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Quantity Requested
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {request.quantity_requested} doses
              </p>
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

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Notes Section */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Notes
            </label>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                {request.notes || "No notes provided"}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

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
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
