/**
 * ============================================
 * ADD VACCINE - DOSE BASED
 * ============================================
 * Updated to auto-create vaccine doses
 * when a vaccine is added
 * ============================================
 */

"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { createVaccine, updateVaccine } from "@/lib/vaccine";
import { createVaccineDoses } from "@/lib/vaccineDosingFunctions";
import { createMonthlyReportEntryForVaccine } from "@/lib/vaccineMonthlyReport";
import { VACCINE_DOSING_SCHEDULE } from "@/lib/vaccineDosingSchedule";

export default function AddVaccineDoses({ onSuccess, onClose, selectedVaccine }) {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    quantity_available: "",
    expiry_date: "",
    notes: ""
  });

  // Initialize form with selected vaccine data when editing
  useEffect(() => {
    if (selectedVaccine) {
      setFormData({
        name: selectedVaccine.name || "",
        quantity_available: selectedVaccine.quantity_available || "",
        expiry_date: selectedVaccine.expiry_date || "",
        notes: selectedVaccine.notes || ""
      });
    }
  }, [selectedVaccine]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push("Vaccine name is required");
    }
    if (!formData.quantity_available || formData.quantity_available <= 0) {
      errors.push("Quantity must be greater than 0");
    }
    if (!formData.expiry_date) {
      errors.push("Expiry date is required");
    }

    return errors;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join("\n"));
      return;
    }

    setIsLoading(true);

    try {
      if (selectedVaccine) {
        // EDIT MODE: Update existing vaccine
        const { data: vaccine, error: vaccineError } = await updateVaccine(
          selectedVaccine.id,
          {
            name: formData.name,
            quantity_available: parseInt(formData.quantity_available),
            expiry_date: formData.expiry_date,
            notes: formData.notes || "",
            status: "Good"
          }
        );

        if (vaccineError || !vaccine) {
          throw new Error(vaccineError?.message || "Failed to update vaccine");
        }

        console.log("Vaccine updated:", vaccine);

        setSuccess(true);
        setSuccessMessage("✓ Vaccine updated successfully!");

        // Close after delay
        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 1500);
      } else {
        // CREATE MODE: Add new vaccine
        // 1. Create vaccine
        const { data: vaccine, error: vaccineError } = await createVaccine({
          name: formData.name,
          quantity_available: parseInt(formData.quantity_available),
          expiry_date: formData.expiry_date,
          notes: formData.notes || "",
          status: "Good"
        });

        if (vaccineError || !vaccine) {
          throw new Error(vaccineError?.message || "Failed to create vaccine");
        }

        console.log("Vaccine created:", vaccine);

        // 2. Auto-create doses
        const { success: dosesSuccess, doses, error: dosesError } = await createVaccineDoses(
          vaccine.id,
          formData.name,
          parseInt(formData.quantity_available)
        );

        if (!dosesSuccess) {
          console.error("❌ Error creating doses:", dosesError);
          const errorMsg = dosesError?.message || "Failed to create doses";
          setError(`Vaccine created but failed to create doses: ${errorMsg}`);
          return;
        }

        console.log("✅ Doses created:", doses?.length || 0, "doses");

        // 3. Auto-create monthly report entry
        console.log("📊 Creating monthly report entry...");
        const { success: reportSuccess, error: reportError } = await createMonthlyReportEntryForVaccine(
          vaccine.id,
          formData.name,
          parseInt(formData.quantity_available)
        );

        if (reportSuccess) {
          console.log("✅ Monthly report entry created");
        } else {
          console.warn("⚠️ Warning: Failed to create monthly report entry:", reportError);
          // Don't fail the vaccine creation if monthly report fails
        }

        // Success (keep dose records attached to this vaccine_id)
        setSuccess(true);
        setSuccessMessage(
          `✓ Vaccine added successfully!\n\nCreated ${doses?.length || 0} dose record(s).\n📊 Monthly report updated.`
        );

        // Reset form
        setFormData({
          name: "",
          quantity_available: "",
          expiry_date: "",
          notes: ""
        });

        // Close after delay
        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 2000);
      }
    } catch (err) {
      console.error("Error submitting vaccine:", err);
      setError(err.message || "Failed to submit vaccine");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Success!</p>
            <p className="text-sm text-green-700 whitespace-pre-wrap">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}

      {/* Vaccine Name - Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vaccine Name <span className="text-red-500">*</span>
        </label>
        <select
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent bg-white"
        >
          <option value="">-- Select a vaccine --</option>
          {Object.keys(VACCINE_DOSING_SCHEDULE).map((vaccineName) => (
            <option key={vaccineName} value={vaccineName}>
              {vaccineName}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Select from registered vaccines in the system
        </p>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity (doses) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="quantity_available"
          value={formData.quantity_available}
          onChange={handleChange}
          placeholder="e.g., 600"
          min="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          This will be automatically divided among all vaccine doses
        </p>
      </div>

      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expiry Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="expiry_date"
          value={formData.expiry_date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes..."
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">How it works:</span> When you add a vaccine,
          the system automatically creates individual dose records. For example, adding
          "Pentavalent (600 doses)" creates PENTA1, PENTA2, and PENTA3 with 200 doses
          each.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || success}
          className="flex-1 py-2 px-4 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3E6B4D] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {selectedVaccine ? "Updating..." : "Adding..."}
            </>
          ) : (
            selectedVaccine ? "Update Vaccine" : "Add Vaccine"
          )}
        </button>
      </div>
    </form>
  );
}
