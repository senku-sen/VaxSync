// ============================================
// SCHEDULE SESSION MODAL - MULTIPLE VACCINES
// ============================================
// Modal form for scheduling vaccination sessions
// with support for multiple vaccines per session
// ============================================

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { validateVaccineForSchedule } from "@/lib/VaccineRequestValidation";
import { fetchBarangayVaccineInventory } from "@/lib/BarangayVaccineInventory";

export default function ScheduleSessionModal({
  isOpen,
  onClose,
  onSubmit,
  barangayName = "Not assigned",
  barangayId = null,
  vaccines = [],
  isSubmitting = false,
  formData = {
    barangay_id: "",
    date: "",
    time: "",
    vaccines: [{ vaccine_id: "", target: "" }]
  },
  errors = {},
  onFormChange = () => {},
  barangays = [],
  isHeadNurse = false
}) {
  // Vaccines with inventory in barangay
  const [vaccinesWithInventory, setVaccinesWithInventory] = useState([]);

  // Vaccine inventory validation state for each vaccine
  const [vaccineInventoryMap, setVaccineInventoryMap] = useState({});

  // Determine which barangayId to use (from props or from form data for Head Nurse)
  const effectiveBarangayId = isHeadNurse ? formData.barangay_id : barangayId;

  // Load vaccines with inventory when barangay changes
  useEffect(() => {
    const loadVaccinesWithInventory = async () => {
      if (!effectiveBarangayId) {
        setVaccinesWithInventory([]);
        return;
      }

      try {
        // Fetch all inventory for barangay
        const { data: inventory, error } = await fetchBarangayVaccineInventory(effectiveBarangayId);

        if (error || !inventory || inventory.length === 0) {
          setVaccinesWithInventory([]);
          return;
        }

        console.log('Raw inventory for multiple modal:', inventory);

        // Create vaccine objects from inventory data with quantities
        const vaccinesWithQty = inventory
          .filter(item => (item.quantity_vial || 0) > 0)
          .map(item => {
            // Get vaccine info from the nested structure
            const vaccineDose = item.VaccineDoses;
            const vaccine = vaccineDose?.Vaccine;
            const vaccineId = vaccine?.id || vaccineDose?.vaccine_id || item.vaccine_id;
            const vaccineName = vaccine?.name || 'Unknown Vaccine';
            const doseCode = vaccineDose?.dose_code || '';
            
            return {
              id: item.id,  // Use inventory ID as unique key
              vaccine_id: vaccineId,  // Actual vaccine ID
              inventory_id: item.id,
              name: doseCode ? `${vaccineName} (${doseCode})` : vaccineName,
              vaccineName: vaccineName,
              doseCode: doseCode,
              batch_number: item.batch_number,
              expiry_date: item.expiry_date,
              availableQuantity: item.quantity_vial || 0,
              availableDoses: item.quantity_dose || 0
            };
          });

        console.log('Vaccines with quantity for multiple modal:', vaccinesWithQty);
        setVaccinesWithInventory(vaccinesWithQty);
      } catch (err) {
        console.error('Error loading vaccines with inventory:', err);
        setVaccinesWithInventory([]);
      }
    };

    loadVaccinesWithInventory();
  }, [effectiveBarangayId, vaccines]);

  // Validate vaccine inventory when vaccine is selected
  useEffect(() => {
    const validateAllVaccines = async () => {
      const newInventoryMap = {};

      for (const vaccineItem of formData.vaccines) {
        if (!vaccineItem.vaccine_id || !effectiveBarangayId) {
          newInventoryMap[vaccineItem.vaccine_id] = {
            isValid: false,
            availableQuantity: 0,
            validationErrors: []
          };
          continue;
        }

        try {
          const { isValid, availableQuantity, errors: validationErrors } = await validateVaccineForSchedule(
            vaccineItem.vaccine_id,
            effectiveBarangayId
          );

          newInventoryMap[vaccineItem.vaccine_id] = {
            isValid,
            availableQuantity: availableQuantity || 0,
            validationErrors: validationErrors || []
          };
        } catch (err) {
          newInventoryMap[vaccineItem.vaccine_id] = {
            isValid: false,
            availableQuantity: 0,
            validationErrors: ['Error checking inventory']
          };
        }
      }

      setVaccineInventoryMap(newInventoryMap);
    };

    validateAllVaccines();
  }, [formData.vaccines, effectiveBarangayId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormChange({ ...formData, [name]: value });
  };

  const handleVaccineChange = (index, field, value) => {
    const newVaccines = [...formData.vaccines];
    newVaccines[index] = { ...newVaccines[index], [field]: value };
    onFormChange({ ...formData, vaccines: newVaccines });
  };

  const addVaccine = () => {
    const newVaccines = [...formData.vaccines, { vaccine_id: "", target: "" }];
    onFormChange({ ...formData, vaccines: newVaccines });
  };

  const removeVaccine = (index) => {
    if (formData.vaccines.length === 1) {
      alert("At least one vaccine is required");
      return;
    }
    const newVaccines = formData.vaccines.filter((_, i) => i !== index);
    onFormChange({ ...formData, vaccines: newVaccines });
  };

  // Check for duplicate vaccines
  const getDuplicateVaccines = () => {
    const vaccineIds = formData.vaccines
      .map(v => v.vaccine_id)
      .filter(id => id);
    return new Set(vaccineIds).size !== vaccineIds.length;
  };

  const hasDuplicates = getDuplicateVaccines();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Vaccination Session</h2>
            <p className="text-sm text-gray-500 mt-1">{barangayName}</p>
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
                <p className="text-sm font-medium text-red-700">Please fix the following errors</p>
                {Object.values(errors).map((error, idx) => (
                  error && <p key={idx} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Vaccines Warning */}
          {hasDuplicates && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Duplicate vaccines detected</p>
                <p className="text-sm text-amber-600">Please select different vaccines</p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Barangay */}
            <div>
              <label htmlFor="barangay_id" className="block text-sm font-medium text-gray-700 mb-2">
                Barangay {isHeadNurse && <span className="text-red-500">*</span>}
              </label>
              {isHeadNurse ? (
                <select
                  id="barangay_id"
                  name="barangay_id"
                  value={formData.barangay_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                    errors.barangay_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a barangay</option>
                  {barangays.map((barangay) => (
                    <option key={barangay.id} value={barangay.id}>
                      {barangay.name} ({barangay.municipality})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={barangayName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              )}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent placeholder:text-gray-600 ${
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent placeholder:text-gray-600 ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>

            {/* Vaccines Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Vaccines <span className="text-red-500">*</span></h3>

              {formData.vaccines.map((vaccineItem, index) => {
                const inventory = vaccineInventoryMap[vaccineItem.vaccine_id] || {
                  isValid: false,
                  availableQuantity: 0,
                  validationErrors: []
                };

                return (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Vaccine {index + 1}</label>
                      {formData.vaccines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVaccine(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Vaccine Selection */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Select Vaccine</label>
                      <select
                        value={vaccineItem.vaccine_id}
                        onChange={(e) => handleVaccineChange(index, "vaccine_id", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                          errors[`vaccine_${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">
                          {vaccinesWithInventory.length === 0 ? 'No vaccines in inventory' : 'Select vaccine'}
                        </option>
                        {vaccinesWithInventory.map((vaccine) => (
                          <option key={vaccine.id} value={vaccine.vaccine_id || vaccine.id}>
                            {vaccine.name} - {vaccine.availableQuantity} vials ({vaccine.availableDoses} doses)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Target (number of people)</label>
                      <input
                        type="number"
                        value={vaccineItem.target}
                        onChange={(e) => handleVaccineChange(index, "target", e.target.value)}
                        placeholder={inventory.isValid ? `Max: ${inventory.availableQuantity} people` : 'Select vaccine first'}
                        min="1"
                        max={inventory.availableQuantity || undefined}
                        disabled={!inventory.isValid}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent placeholder:text-gray-600 ${
                          errors[`target_${index}`] ? 'border-red-500' : 'border-gray-300'
                        } ${!inventory.isValid ? 'bg-gray-50 text-gray-400' : ''}`}
                      />
                    </div>

                    {/* Inventory Status */}
                    {vaccineItem.vaccine_id && inventory.isValid && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-900">
                          <span className="font-semibold">Available:</span> {inventory.availableQuantity} vials
                        </p>
                      </div>
                    )}

                    {vaccineItem.vaccine_id && inventory.validationErrors.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        {inventory.validationErrors.map((error, idx) => (
                          <p key={idx} className="text-sm text-amber-700">{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Another Vaccine Button */}
              <button
                type="button"
                onClick={addVaccine}
                className="w-full py-2 px-4 border-2 border-dashed border-[#4A7C59] text-[#4A7C59] rounded-lg hover:bg-[#4A7C59] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Vaccine
              </button>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4 border-t">
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
                disabled={isSubmitting || hasDuplicates}
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
