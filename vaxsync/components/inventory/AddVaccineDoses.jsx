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
import { useOffline } from "@/components/OfflineProvider";
import { queueOperation } from "@/lib/syncManager";
import { generateTempId } from "@/lib/offlineStorage";
import { toast } from "sonner";

export default function AddVaccineDoses({ onSuccess, onClose, selectedVaccine }) {
  const { isOnline, showNotification } = useOffline();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    quantity_available: "",
    expiry_date: "",
    batch_number: "",
    notes: ""
  });

  // Initialize form with selected vaccine data when editing
  useEffect(() => {
    if (selectedVaccine) {
      setFormData({
        name: selectedVaccine.name || "",
        quantity_available: selectedVaccine.quantity_available || "",
        expiry_date: selectedVaccine.expiry_date || "",
        batch_number: selectedVaccine.batch_number || "",
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

    // Check if online
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine || isOnline) 
      : isOnline;

    try {
      if (selectedVaccine) {
        // EDIT MODE: Update existing vaccine
        if (actuallyOnline) {
          try {
            const response = await fetch('/api/vaccines', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: selectedVaccine.id,
                name: formData.name,
                quantity_available: parseInt(formData.quantity_available),
                expiry_date: formData.expiry_date,
                batch_number: formData.batch_number || "",
                notes: formData.notes || "",
                status: "Good"
              })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
              throw new Error(result.error || "Failed to update vaccine");
            }

            console.log("Vaccine updated:", result.data);

            setSuccess(true);
            setSuccessMessage("✓ Vaccine updated successfully!");
            toast.success("Vaccine updated successfully");

            // Close after delay
            setTimeout(() => {
              onSuccess?.();
              onClose?.();
            }, 1500);
          } catch (err) {
            console.error("Error updating vaccine:", err);
            throw err;
          }
        } else {
          // Offline - queue the operation
          await queueOperation({
            endpoint: '/api/vaccines',
            method: 'PUT',
            body: {
              id: selectedVaccine.id,
              name: formData.name,
              quantity_available: parseInt(formData.quantity_available),
              expiry_date: formData.expiry_date,
              batch_number: formData.batch_number || "",
              notes: formData.notes || "",
              status: "Good"
            },
            type: 'update',
            description: `Update vaccine: ${formData.name}`,
            cacheKey: 'vaccines_list'
          });

          setSuccess(true);
          setSuccessMessage("✓ Changes saved locally. Will sync when online.");
          toast.info("Changes saved locally. Will sync when online.");

          // Close after delay
          setTimeout(() => {
            onSuccess?.();
            onClose?.();
          }, 1500);
        }
      } else {
        // CREATE MODE: Add new vaccine
        if (actuallyOnline) {
          try {
            const response = await fetch('/api/vaccines', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.name,
                quantity_available: parseInt(formData.quantity_available),
                expiry_date: formData.expiry_date,
                batch_number: formData.batch_number || "",
                notes: formData.notes || "",
                status: "Good",
                create_doses: true
              })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
              throw new Error(result.error || "Failed to create vaccine");
            }

            console.log("Vaccine created:", result.data);

            if (result.warning) {
              setError(`Vaccine created but ${result.warning}: ${result.dosesError || ''}`);
              toast.warning(result.warning);
            } else {
              setSuccess(true);
              setSuccessMessage(
                `✓ Vaccine added successfully!\n\nCreated ${result.dosesCount || 0} dose record(s).`
              );
              toast.success(`Vaccine added successfully! Created ${result.dosesCount || 0} dose(s).`);

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
            console.error("Error creating vaccine:", err);
            throw err;
          }
        } else {
          // Offline - queue the operation
          const tempId = generateTempId();
          
          await queueOperation({
            endpoint: '/api/vaccines',
            method: 'POST',
            body: {
              name: formData.name,
              quantity_available: parseInt(formData.quantity_available),
              expiry_date: formData.expiry_date,
              notes: formData.notes || "",
              status: "Good",
              create_doses: true
            },
            type: 'create',
            description: `Create vaccine: ${formData.name}`,
            cacheKey: 'vaccines_list',
            tempId
          });

          setSuccess(true);
          setSuccessMessage(
            `✓ Vaccine saved locally. Will sync when online.\n\nDoses will be created automatically when synced.`
          );
          toast.info("Vaccine saved locally. Will sync when online.");

          // Reset form
          setFormData({
            name: "",
            quantity_available: "",
            expiry_date: "",
            batch_number: "",
            notes: ""
          });

          // Close after delay
          setTimeout(() => {
            onSuccess?.();
            onClose?.();
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Error submitting vaccine:", err);
      setError(err.message || "Failed to submit vaccine");
      toast.error(err.message || "Failed to submit vaccine");
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
          value={formData.name || ""}
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
          value={formData.quantity_available || ""}
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
          value={formData.expiry_date || ""}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
        />
      </div>

      {/* Batch Number - MANUAL INPUT */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Batch Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="batch_number"
          value={formData.batch_number || ""}
          onChange={handleChange}
          placeholder="e.g., BATCH-2025-001"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the batch number manually from the vaccine package
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes || ""}
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
