// ============================================
// SCHEDULE SESSION MODAL
// ============================================
// Modal form for scheduling vaccination sessions
// Collects date, time, vaccine, and target information
// ============================================

import { X, AlertCircle } from "lucide-react";

export default function ScheduleSessionModal({
  isOpen,
  onClose,
  onSubmit,
  barangayName = "Not assigned",
  vaccines = [],
  isSubmitting = false,
  formData = {
    date: "",
    time: "",
    vaccine_id: "",
    target: ""
  },
  errors = {},
  onFormChange = () => {}
}) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormChange({ ...formData, [name]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Vaccination Session</h2>
            <p className="text-sm text-gray-500 mt-1">
              {barangayName}
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
          {/* Validation Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Please fill in all required fields</p>
                {Object.values(errors).map((error, idx) => (
                  error && <p key={idx} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Barangay (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barangay
              </label>
              <input
                type="text"
                value={barangayName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>

            {/* Time */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>

            {/* Vaccine */}
            <div>
              <label htmlFor="vaccine_id" className="block text-sm font-medium text-gray-700 mb-2">
                Vaccine <span className="text-red-500">*</span>
              </label>
              <select
                id="vaccine_id"
                name="vaccine_id"
                value={formData.vaccine_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.vaccine_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select vaccine</option>
                {vaccines.map((vaccine) => (
                  <option key={vaccine.id} value={vaccine.id}>
                    {vaccine.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target */}
            <div>
              <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
                Target (number of people) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="target"
                name="target"
                value={formData.target}
                onChange={handleChange}
                placeholder="Enter target number"
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.target ? 'border-red-500' : 'border-gray-300'
                }`}
              />
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
                {isSubmitting ? "Scheduling..." : "Schedule Session"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
