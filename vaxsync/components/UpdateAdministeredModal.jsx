// ============================================
// UPDATE ADMINISTERED MODAL
// ============================================
// Modal for updating administered count and status
// Shows progress bar and allows status change
// ============================================

import { X, AlertCircle, CheckCircle } from "lucide-react";

export default function UpdateAdministeredModal({
  isOpen,
  onClose,
  onSubmit,
  session = null,
  isSubmitting = false,
  errors = {}
}) {
  if (!isOpen || !session) return null;

  const administered = session.administered || 0;
  const target = session.target || 0;
  const progress = target > 0 ? Math.round((administered / target) * 100) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onSubmit({
      ...session,
      [name]: name === 'administered' ? Math.min(parseInt(value, 10) || 0, target) : value
    }, 'update');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Update Vaccination Progress</h2>
            <p className="text-sm text-gray-500 mt-1">
              {session.barangays?.name || "Barangay"}
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
        <div className="p-6">
          {/* Session Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Vaccine</p>
                <p className="font-semibold text-gray-900">{session.vaccines?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-600">Date & Time</p>
                <p className="font-semibold text-gray-900">{session.session_date} {session.session_time}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Progress</label>
              <span className="text-sm font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progress === 100 ? 'bg-green-600' :
                  progress >= 75 ? 'bg-yellow-600' :
                  progress >= 50 ? 'bg-blue-600' :
                  'bg-orange-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {administered} of {target} people vaccinated
            </p>
          </div>

          {/* Validation Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Please fix the errors</p>
                {Object.values(errors).map((error, idx) => (
                  error && <p key={idx} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(session, 'submit');
          }} className="space-y-4">
            {/* Administered Count */}
            <div>
              <label htmlFor="administered" className="block text-sm font-medium text-gray-700 mb-2">
                Administered Count <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="administered"
                  name="administered"
                  value={session.administered || 0}
                  onChange={handleChange}
                  min="0"
                  max={target}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    errors.administered ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-medium">
                  / {target}
                </span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={session.status || "Scheduled"}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In progress">In progress</option>
                <option value="Completed">Completed</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {progress === 100 && administered > 0 ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={14} /> All targets met - consider marking as Completed
                  </span>
                ) : null}
              </p>
            </div>

            {/* Status Info */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Current Status:</span> {session.status || "Scheduled"}
              </p>
              {progress === 100 && administered > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ All vaccination targets have been met
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Progress"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
