// ============================================
// VACCINE REQUEST MODAL
// ============================================
// Modal form for submitting vaccine requests
// Validates required fields before submission
// ============================================

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { validateVaccineForRequest } from "@/lib/vaccineRequestValidation";
import { getBarangayVaccineTotal } from "@/lib/BarangayVaccineInventory";

export default function VaccineRequestModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  barangayName = "Barangay A",
  profileID = null,
  barangayId = null,
  vaccines = [],
  isLoading = false
}) {
  // Form data state
  const [formData, setFormData] = useState({
    vaccine_id: "",
    quantity_dose: "",
    quantity_vial: "",
    notes: ""
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vaccine validation state
  const [vaccineValidation, setVaccineValidation] = useState({
    isValid: false,
    isChecking: false,
    validationErrors: []
  });

  // Vaccine quantity dose from Head Nurse inventory
  const [vaccineQuantityDose, setVaccineQuantityDose] = useState(null);

  // Validate vaccine when selected
  useEffect(() => {
    const validateSelectedVaccine = async () => {
      if (!formData.vaccine_id) {
        setVaccineValidation({
          isValid: false,
          isChecking: false,
          validationErrors: []
        });
        return;
      }

      setVaccineValidation(prev => ({ ...prev, isChecking: true }));

      try {
        // Validate vaccine (checks: exists, not expired)
        const { isValid, errors: validationErrors } = await validateVaccineForRequest(
          formData.vaccine_id
        );

        // Fetch quantity dose from barangay inventory
        const quantityDose = await getBarangayVaccineTotal(barangayId, formData.vaccine_id);
        setVaccineQuantityDose(quantityDose);

        setVaccineValidation({
          isValid,
          isChecking: false,
          validationErrors: validationErrors || []
        });

        console.log('Vaccine validation result:', { isValid, validationErrors });
      } catch (err) {
        console.error('Error validating vaccine:', err);
        setVaccineValidation({
          isValid: false,
          isChecking: false,
          validationErrors: ['Error validating vaccine']
        });
      }
    };

    validateSelectedVaccine();
  }, [formData.vaccine_id, barangayId]);

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    // Check vaccine is selected
    if (!formData.vaccine_id) {
      newErrors.vaccine_id = "Please select a vaccine";
    }

    // Check vaccine is valid (exists and not expired)
    if (formData.vaccine_id && !vaccineValidation.isValid) {
      newErrors.vaccine_id = "Selected vaccine is not valid or is expired";
    }

    // Check quantity dose is filled
    if (!formData.quantity_dose) {
      newErrors.quantity_dose = "Quantity (doses) is required";
    }

    // Check quantity dose is positive
    if (formData.quantity_dose && parseInt(formData.quantity_dose) <= 0) {
      newErrors.quantity_dose = "Quantity must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submission with validation
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check system IDs
    if (!barangayId) {
      alert("Barangay ID is missing. Please refresh the page.");
      return;
    }
    
    if (!profileID) {
      alert("Profile ID is missing. Please refresh the page.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare request data
      const requestData = {
        ...formData,
        barangay_id: barangayId,
        requested_by: profileID,
        status: 'pending'
      };
      
      console.log('Submitting request:', requestData);
      await onSubmit(requestData);
      
      // Reset form after successful submission
      setFormData({ vaccine_id: "", quantity_dose: "", quantity_vial: "", notes: "" });
      setErrors({});
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ vaccine_id: "", quantity_dose: "", quantity_vial: "", notes: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
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
          {/* Show validation errors */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Please fix the following errors</p>
                {Object.values(errors).map((error, idx) => (
                  error && <p key={idx} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Show vaccine validation errors */}
          {formData.vaccine_id && vaccineValidation.validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Vaccine validation issues</p>
                {vaccineValidation.validationErrors.map((error, idx) => (
                  <p key={idx} className="text-sm text-amber-600">{error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Show vaccine validation success */}
          {formData.vaccine_id && vaccineValidation.isValid && !vaccineValidation.isChecking && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700">Vaccine is valid and available</p>
                {vaccineQuantityDose !== null && (
                  <p className="text-sm text-green-600 mt-1">
                    Available in Head Nurse inventory: <span className="font-semibold">{vaccineQuantityDose} doses</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Vaccine Select */}
          <div className="mb-4">
            <label htmlFor="vaccine_id" className="block text-sm font-medium text-gray-700 mb-2">
              Vaccine Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="vaccine_id"
                name="vaccine_id"
                value={formData.vaccine_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.vaccine_id ? 'border-red-500' : 'border-gray-300'
                }`}
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
              {formData.vaccine_id && vaccineValidation.isChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-[#4A7C59] border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Inputs - Side by Side */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="quantity_dose" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (doses) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity_dose"
                name="quantity_dose"
                value={formData.quantity_dose}
                onChange={handleChange}
                placeholder="Number"
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                  errors.quantity_dose ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="quantity_vial" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (vial)
              </label>
              <input
                type="number"
                id="quantity_vial"
                name="quantity_vial"
                value={formData.quantity_vial}
                onChange={handleChange}
                placeholder="Number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
              />
            </div>
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-[#004085] hover:bg-[#003366] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}