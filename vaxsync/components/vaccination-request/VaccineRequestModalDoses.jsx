/**
 * ============================================
 * VACCINE REQUEST MODAL - DOSE BASED
 * ============================================
 * Updated to request specific vaccine doses
 * instead of main vaccines
 * ============================================
 */

"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { getAllAvailableDoses, getDoseInfo } from "@/lib/vaccineDosingSchedule";
import { getDoseByCode } from "@/lib/vaccineDosingFunctions";
import { createVaccineRequest } from "@/lib/vaccineRequest";
import { calculateVialsNeeded, VACCINE_VIAL_MAPPING } from "@/lib/vaccineVialMapping";
import { supabase } from "@/lib/supabase";

export default function VaccineRequestModalDoses({
  isOpen,
  onClose,
  onSuccess,
  userProfile
}) {
  // Form state
  const [doseRequests, setDoseRequests] = useState([
    { doseCode: "", quantity: "", id: Date.now() }
  ]);

  // Available doses
  const [availableDoses, setAvailableDoses] = useState([]);

  // Dose details
  const [doseDetails, setDoseDetails] = useState({});

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load available doses from database on mount
  useEffect(() => {
    loadAvailableDoses();
  }, []);

  const loadAvailableDoses = async () => {
    try {
      // Fetch all doses with available inventory from vaccine_doses table
      const { data: doses, error: err } = await supabase
        .from("vaccine_doses")
        .select("dose_code, dose_label, quantity_available, vaccine_id, vaccines(name)")
        .gt("quantity_available", 0)  // Only doses with available inventory
        .order("dose_code");

      if (err) throw err;

      // Merge doses by dose_code - sum quantities from all vaccine batches
      const doseMap = new Map();
      doses.forEach(dose => {
        const key = dose.dose_code;
        if (doseMap.has(key)) {
          // Merge: add quantities together
          const existing = doseMap.get(key);
          existing.quantity_available += dose.quantity_available;
        } else {
          // First occurrence - create new entry
          doseMap.set(key, { ...dose });
        }
      });

      // Transform to match expected format
      const formattedDoses = Array.from(doseMap.values()).map(dose => ({
        value: dose.dose_code,
        label: `${dose.dose_code} (${dose.dose_label})`,
        vaccine_name: dose.vaccines?.name,
        quantity_available: dose.quantity_available
      }));

      setAvailableDoses(formattedDoses);
    } catch (err) {
      console.error("Error loading doses:", err);
      setError("Failed to load available doses");
    }
  };

  // Fetch dose details when dose code changes
  const fetchDoseDetails = async (doseCode) => {
    if (!doseCode || doseDetails[doseCode]) return;

    try {
      // Fetch ALL doses with this dose_code (may have multiple from different batches)
      const { data: doses, error: err } = await supabase
        .from("vaccine_doses")
        .select("*, vaccines(id, name)")
        .eq("dose_code", doseCode)
        .order("created_at", { ascending: false });  // Get newest first

      if (err) {
        console.error("❌ Supabase error fetching dose details:", {
          error: err,
          message: err?.message,
          code: err?.code,
          details: err?.details
        });
        throw err;
      }

      if (!doses || doses.length === 0) {
        console.warn(`⚠️ No doses found for dose_code: ${doseCode}`);
        return;
      }

      // Use the first (newest) dose as primary, but sum quantities from all
      const primaryDose = doses[0];
      const totalQuantity = doses.reduce((sum, dose) => sum + dose.quantity_available, 0);

      setDoseDetails(prev => ({
        ...prev,
        [doseCode]: {
          ...primaryDose,
          vaccine_id: primaryDose.vaccine_id,
          vaccine_name: primaryDose.vaccines?.name || "Unknown Vaccine",
          quantity_available: totalQuantity,  // Sum of all batches
          dose_label: primaryDose.dose_label,
          batch_count: doses.length  // Track how many batches
        }
      }));

      console.log("✅ Dose details fetched:", {
        doseCode,
        vaccine_id: primaryDose.vaccine_id,
        vaccine_name: primaryDose.vaccines?.name,
        total_quantity_available: totalQuantity,
        batch_count: doses.length
      });
    } catch (err) {
      console.error("❌ Error fetching dose details:", {
        error: err,
        message: err?.message,
        doseCode
      });
    }
  };

  // Handle dose selection
  const handleDoseChange = (id, doseCode) => {
    setDoseRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, doseCode } : req
      )
    );
    fetchDoseDetails(doseCode);
  };

  // Handle quantity change
  const handleQuantityChange = (id, quantity) => {
    setDoseRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, quantity: parseInt(quantity) || "" } : req
      )
    );
  };

  // Add another dose request
  const addDoseRequest = () => {
    setDoseRequests(prev => [
      ...prev,
      { doseCode: "", quantity: "", id: Date.now() }
    ]);
  };

  // Remove dose request
  const removeDoseRequest = (id) => {
    if (doseRequests.length === 1) {
      setError("At least one dose request is required");
      return;
    }
    setDoseRequests(prev => prev.filter(req => req.id !== id));
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    doseRequests.forEach((req, index) => {
      if (!req.doseCode) {
        errors.push(`Dose ${index + 1}: Please select a dose`);
      }
      if (!req.quantity || req.quantity <= 0) {
        errors.push(`Dose ${index + 1}: Please enter a valid quantity`);
      }

      const dose = doseDetails[req.doseCode];
      if (dose && req.quantity > dose.quantity_available) {
        errors.push(
          `❌ Dose ${index + 1} (${req.doseCode}): Quantity exceeds available!\n` +
          `   Requested: ${req.quantity} doses\n` +
          `   Available: ${dose.quantity_available} doses\n` +
          `   Please reduce the quantity and try again.`
        );
      }
    });

    return errors;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join("\n\n"));
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.querySelector('[role="alert"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setIsLoading(true);

    try {
      // Get barangay_id from user profile
      const barangayId = userProfile?.barangays?.id || userProfile?.assigned_barangay_id;
      
      if (!barangayId) {
        throw new Error("Barangay ID not found. Please refresh and try again.");
      }

      // Create requests for each dose
      const createdRequests = [];
      
      for (let i = 0; i < doseRequests.length; i++) {
        const req = doseRequests[i];
        
        // Get vaccine_id from dose details
        const vaccineId = doseDetails[req.doseCode]?.vaccine_id;
        
        if (!vaccineId) {
          throw new Error(`Vaccine ID not found for dose ${req.doseCode}`);
        }

        console.log(`Creating vaccine request ${i + 1}/${doseRequests.length}:`, {
          requested_by: userProfile.id,
          barangay_id: barangayId,
          vaccine_id: vaccineId,
          dose_code: req.doseCode,
          quantity_vial: req.quantity,
          quantity_dose: req.quantity
        });

        // Calculate vials needed based on vaccine mapping
        const vaccineName = doseDetails[req.doseCode]?.vaccine_name;
        const vialsNeeded = calculateVialsNeeded(vaccineName, parseInt(req.quantity));

        const { data, error: err } = await createVaccineRequest({
          requested_by: userProfile.id,
          barangay_id: barangayId,
          vaccine_id: vaccineId,
          quantity_vial: vialsNeeded,
          quantity_dose: req.quantity,
          notes: `Dose: ${req.doseCode}`
        });

        if (err) {
          console.error(`Request ${i + 1} creation failed:`, err);
          throw new Error(`Dose ${req.doseCode}: ${err?.message || JSON.stringify(err) || "Failed to create request"}`);
        }

        if (!data) {
          throw new Error(`No data returned for dose ${req.doseCode}`);
        }

        createdRequests.push(data);
        
        // Small delay between requests to avoid race conditions
        if (i < doseRequests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setDoseRequests([{ doseCode: "", quantity: "", id: Date.now() }]);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError(err.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A7C59] to-[#3E6B4D] text-white p-6 flex justify-between items-center rounded-t-xl sticky top-0">
          <div>
            <h2 className="text-xl font-bold">Request Vaccines</h2>
            <p className="text-sm text-green-100">Select specific vaccine doses</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Request Submitted!</p>
                <p className="text-sm text-green-700">
                  Your vaccine request has been submitted for approval.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">⚠️ Cannot Submit Request</p>
                <p className="text-sm text-red-700 whitespace-pre-wrap mt-2">{error}</p>
                <p className="text-xs text-red-600 mt-3 font-medium">
                  👉 Please adjust the quantities and try again.
                </p>
              </div>
            </div>
          )}

          {/* Dose Requests */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Vaccine Doses Needed</h3>

            {doseRequests.map((req, index) => (
              <div
                key={req.id}
                className="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Dose {index + 1}
                  </label>
                  {doseRequests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDoseRequest(req.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dose Selection */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Select Dose <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={req.doseCode}
                    onChange={(e) => handleDoseChange(req.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                  >
                    <option value="">-- Select a dose --</option>
                    {availableDoses.length > 0 ? (
                      availableDoses.map((dose) => (
                        <option key={dose.value} value={dose.value}>
                          {dose.label} - {dose.vaccine_name} ({dose.quantity_available} available)
                        </option>
                      ))
                    ) : (
                      <option disabled>No doses available</option>
                    )}
                  </select>
                  {availableDoses.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No vaccine doses available. Please add vaccines to inventory first.
                    </p>
                  )}
                </div>

                {/* Quantity Input (Doses) */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Quantity (Doses) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={req.quantity}
                    onChange={(e) => handleQuantityChange(req.id, e.target.value)}
                    placeholder="Enter quantity"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                      req.quantity && req.doseCode && doseDetails[req.doseCode] && 
                      req.quantity > doseDetails[req.doseCode].quantity_available
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  />
                  
                  {/* Warning if quantity exceeds available */}
                  {req.quantity && req.doseCode && doseDetails[req.doseCode] && 
                   req.quantity > doseDetails[req.doseCode].quantity_available && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900">Quantity Exceeds Available</p>
                        <p className="text-xs text-red-700 mt-1">
                          You requested {req.quantity} doses but only {doseDetails[req.doseCode].quantity_available} are available.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity (Vials) - Auto Calculated */}
                {req.quantity && req.doseCode && doseDetails[req.doseCode] && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Quantity (Vials) - Auto Calculated
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {(() => {
                        const vaccineName = doseDetails[req.doseCode].vaccine_name;
                        const vialsNeeded = calculateVialsNeeded(vaccineName, req.quantity);
                        const actualDosesPerVial = VACCINE_VIAL_MAPPING[vaccineName] || 10;
                        
                        return (
                          <>
                            {vialsNeeded} vials
                            <p className="text-xs text-gray-500 mt-1">
                              ({req.quantity} doses ÷ {actualDosesPerVial} doses per vial)
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Available Quantity */}
                {req.doseCode && doseDetails[req.doseCode] && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Available:</span>{" "}
                      {doseDetails[req.doseCode].quantity_available} doses
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      <span className="font-semibold">Vaccine:</span> {doseDetails[req.doseCode].vaccine_name}
                    </p>
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Dose:</span> {doseDetails[req.doseCode].dose_label}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Another Dose Button */}
          <button
            type="button"
            onClick={addDoseRequest}
            className="w-full py-2 px-4 border-2 border-dashed border-[#4A7C59] text-[#4A7C59] rounded-lg hover:bg-[#4A7C59] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Dose
          </button>

          {/* Info Box */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> Select specific vaccine doses
              (e.g., PENTA1, PENTA2) instead of main vaccines. This helps track which
              dose is given to each patient.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || success}
            className="flex-1 py-2 px-4 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3E6B4D] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
