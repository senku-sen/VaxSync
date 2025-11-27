// ============================================
// SCHEDULE CONFIRMATION MODAL
// ============================================
// Shows confirmation after vaccination session scheduled
// Displays session details and success message
// ============================================

import { CheckCircle, X } from "lucide-react";

export default function ScheduleConfirmationModal({
  isOpen,
  onClose,
  sessionData = null,
  vaccineInfo = null
}) {
  if (!isOpen || !sessionData) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Session Scheduled!</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Success Message */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Your vaccination session has been successfully scheduled.
            </p>
          </div>

          {/* Session Details */}
          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Session Details</h3>

              {/* Barangay */}
              <div className="mb-3">
                <p className="text-xs text-gray-500">Barangay</p>
                <p className="text-sm font-medium text-gray-900">
                  {sessionData.barangayName || "Not specified"}
                </p>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {sessionData.date ? new Date(sessionData.date).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {sessionData.time || "N/A"}
                  </p>
                </div>
              </div>

              {/* Vaccines - Handle both single and multiple */}
              {sessionData.isMultiple && sessionData.sessions ? (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Vaccines Scheduled</p>
                  <div className="space-y-2">
                    {sessionData.sessions.map((session, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{session.vaccineName}</p>
                        <p className="text-xs text-gray-600">Target: {session.target} people</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Single Vaccine */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Vaccine</p>
                    <p className="text-sm font-medium text-gray-900">
                      {vaccineInfo?.name || sessionData.vaccineName || "N/A"}
                    </p>
                  </div>

                  {/* Target */}
                  <div>
                    <p className="text-xs text-gray-500">Target People</p>
                    <p className="text-sm font-medium text-gray-900">
                      {sessionData.target || "N/A"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-900">Status</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Scheduled
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
