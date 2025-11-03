import { useState } from "react";
import { X } from "lucide-react";

export default function VaccineRequestModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  barangayName = "Barangay A",
  vaccines = [],
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    vaccine_id: "",
    quantity_requested: "",
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (formData.vaccine_id && formData.quantity_requested) {
      // Since RLS is off, we don't need to include auth fields
      const requestData = {
        ...formData,
        status: 'pending' // Set initial status
      };
      onSubmit(requestData);
      setFormData({ vaccine_id: "", quantity_requested: "", notes: "" });
    }
  };

  const handleCancel = () => {
    setFormData({ vaccine_id: "", quantity_requested: "", notes: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Submit Vaccine Request</h2>
            <p className="text-sm text-gray-500 mt-1">Request vaccines for {barangayName}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Vaccine Select */}
          <div className="mb-4">
            <label htmlFor="vaccine_id" className="block text-sm font-medium text-gray-700 mb-2">
              Vaccine Type
            </label>
            <select
              id="vaccine_id"
              name="vaccine_id"
              value={formData.vaccine_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
            >
              <option value="">Select vaccine type</option>
              {isLoading ? (
                <option value="" disabled>Loading vaccines...</option>
              ) : vaccines.length === 0 ? (
                <option value="" disabled>No vaccines available</option>
              ) : (
                vaccines.map((vaccine) => (
                  <option key={vaccine.id} value={vaccine.id}>
                    {vaccine.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Quantity Input */}
          <div className="mb-4">
            <label htmlFor="quantity_requested" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity (doses)
            </label>
            <input
              type="number"
              id="quantity_requested"
              name="quantity_requested"
              value={formData.quantity_requested}
              onChange={handleChange}
              placeholder="Number of doses needed"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
            />
          </div>

          {/* Notes Textarea */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes or requirements"
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-[#004085] hover:bg-[#003366] text-white font-medium rounded-lg transition-colors"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}