// ============================================
// SCHEDULE SESSION MODAL WITH PARTICIPANTS
// ============================================
// Modal for scheduling vaccination sessions
// with inline participant selection
// Participants limited by target count
// ============================================

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Plus, Trash2, Users, Search } from "lucide-react";
import { validateVaccineForSchedule } from "@/lib/vaccineRequestValidation";
import { fetchBarangayVaccineInventory } from "@/lib/barangayVaccineInventory";
import { supabase } from "@/lib/supabase";

export default function ScheduleSessionModalWithParticipants({
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
    vaccines: [{ vaccine_id: "", target: "", selectedParticipants: [] }]
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

  // Available residents for selection
  const [availableResidents, setAvailableResidents] = useState([]);

  // Loading state for residents
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);

  // Expanded vaccine index for participant selection
  const [expandedVaccineIndex, setExpandedVaccineIndex] = useState(null);

  // Search state for residents
  const [residentSearch, setResidentSearch] = useState("");

  // Step tracking: 0 = vaccine/date/time, 1 = select participants
  const [currentStep, setCurrentStep] = useState(0);

  // Determine which barangayId to use
  const effectiveBarangayId = isHeadNurse ? formData.barangay_id : barangayId;

  // Filter residents based on search
  const filteredResidents = availableResidents.filter(resident =>
    resident.name?.toLowerCase().includes(residentSearch.toLowerCase()) ||
    resident.contact?.toLowerCase().includes(residentSearch.toLowerCase())
  );

  // Load vaccines with inventory when barangay changes
  useEffect(() => {
    const loadVaccinesWithInventory = async () => {
      if (!effectiveBarangayId) {
        setVaccinesWithInventory([]);
        return;
      }

      try {
        const { data: inventory, error } = await fetchBarangayVaccineInventory(effectiveBarangayId);

        if (error || !inventory || inventory.length === 0) {
          setVaccinesWithInventory([]);
          return;
        }

        const vaccineIdsWithInventory = inventory
          .filter(item => (item.quantity_vial || 0) > 0)
          .map(item => item.vaccine_id);

        const filteredVaccines = vaccines.filter(vaccine =>
          vaccineIdsWithInventory.includes(vaccine.id)
        );

        let vaccinesWithQty = [];

        if (filteredVaccines.length > 0) {
          vaccinesWithQty = filteredVaccines.map(vaccine => {
            const inventoryItem = inventory.find(item => item.vaccine_id === vaccine.id);
            return {
              ...vaccine,
              availableQuantity: inventoryItem?.quantity_vial || 0
            };
          });
        } else {
          vaccinesWithQty = inventory
            .filter(item => (item.quantity_vial || 0) > 0)
            .map(item => ({
              id: item.vaccine_id,
              name: item.vaccine?.name || 'Unknown Vaccine',
              batch_number: item.vaccine?.batch_number,
              expiry_date: item.vaccine?.expiry_date,
              availableQuantity: item.quantity_vial || 0
            }));
        }

        setVaccinesWithInventory(vaccinesWithQty);
      } catch (err) {
        console.error('Error loading vaccines with inventory:', err);
        setVaccinesWithInventory([]);
      }
    };

    loadVaccinesWithInventory();
  }, [effectiveBarangayId, vaccines]);

  // Load available residents when barangay changes
  useEffect(() => {
    const loadAvailableResidents = async () => {
      if (!effectiveBarangayId) {
        setAvailableResidents([]);
        return;
      }

      setIsLoadingResidents(true);
      try {
        // Get barangay name first
        const { data: barangayData } = await supabase
          .from('barangays')
          .select('name')
          .eq('id', effectiveBarangayId)
          .single();

        if (!barangayData) {
          setAvailableResidents([]);
          return;
        }

        // Fetch residents from that barangay
        console.log('Fetching residents for barangay:', barangayData.name);
        
        const { data: residents, error } = await supabase
          .from('residents')
          .select('*')
          .eq('barangay', barangayData.name)
          .order('name');

        if (error) {
          console.error('Error fetching residents - Details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          setAvailableResidents([]);
          return;
        }

        if (!residents) {
          console.warn('No residents data returned for barangay:', barangayData.name);
          setAvailableResidents([]);
          return;
        }

        console.log('Loaded residents:', residents.length, 'for barangay:', barangayData.name, residents);
        setAvailableResidents(residents);
      } catch (err) {
        console.error('Error loading residents:', err);
        setAvailableResidents([]);
      } finally {
        setIsLoadingResidents(false);
      }
    };

    loadAvailableResidents();
  }, [effectiveBarangayId]);

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

  const handleParticipantToggle = (vaccineIndex, residentId) => {
    const newVaccines = [...formData.vaccines];
    const currentSelected = newVaccines[vaccineIndex].selectedParticipants || [];
    const target = parseInt(newVaccines[vaccineIndex].target) || 0;

    if (currentSelected.includes(residentId)) {
      // Remove resident
      newVaccines[vaccineIndex].selectedParticipants = currentSelected.filter(id => id !== residentId);
    } else {
      // Add resident if not exceeding target
      if (currentSelected.length < target) {
        newVaccines[vaccineIndex].selectedParticipants = [...currentSelected, residentId];
      }
    }

    onFormChange({ ...formData, vaccines: newVaccines });
  };

  const addVaccine = () => {
    const newVaccines = [...formData.vaccines, { vaccine_id: "", target: "", selectedParticipants: [] }];
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

  const getDuplicateVaccines = () => {
    const vaccineIds = formData.vaccines
      .map(v => v.vaccine_id)
      .filter(id => id);
    return new Set(vaccineIds).size !== vaccineIds.length;
  };

  const hasDuplicates = getDuplicateVaccines();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
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
          {/* Step Indicator */}
          <div className="mb-6 flex items-center gap-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
              currentStep === 0 ? 'bg-[#4A7C59] text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 ${currentStep >= 1 ? 'bg-[#4A7C59]' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
              currentStep === 1 ? 'bg-[#4A7C59] text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              2
            </div>
          </div>

          {/* Step Titles */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStep === 0 ? 'Step 1: Schedule Details' : 'Step 2: Select Participants'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === 0 
                ? 'Set the date, time, vaccine, and target number of people'
                : 'Search and select residents to participate in this session'}
            </p>
          </div>

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

          {/* STEP 1: Schedule Details */}
          {currentStep === 0 && (
          <form onSubmit={(e) => {
            e.preventDefault();
            setCurrentStep(1);
          }} className="space-y-4">
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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Vaccines & Participants <span className="text-red-500">*</span></h3>

              {formData.vaccines.map((vaccineItem, index) => {
                const inventory = vaccineInventoryMap[vaccineItem.vaccine_id] || {
                  isValid: false,
                  availableQuantity: 0,
                  validationErrors: []
                };

                const selectedCount = (vaccineItem.selectedParticipants || []).length;
                const target = parseInt(vaccineItem.target) || 0;
                const isExpanded = expandedVaccineIndex === index;

                return (
                  <div key={index} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Vaccine Header */}
                    <div className="p-4 bg-gray-50 space-y-3">
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
                            <option key={vaccine.id} value={vaccine.id}>
                              {vaccine.name}
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
                          disabled={!inventory.isValid}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent placeholder:text-gray-600 ${
                            errors[`target_${index}`] ? 'border-red-500' : 'border-gray-300'
                          } ${!inventory.isValid ? 'bg-gray-50 text-gray-400' : ''}`}
                        />
                        {inventory.isValid && vaccineItem.target && parseInt(vaccineItem.target) > inventory.availableQuantity && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Target exceeds available vials ({inventory.availableQuantity}). You can still proceed, but may need to adjust.
                          </p>
                        )}
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

            {/* Modal Footer - Step 1 */}
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
                Next: Select Participants
              </button>
            </div>
          </form>
          )}

          {/* STEP 2: Select Participants */}
          {currentStep === 1 && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name or contact..."
                value={residentSearch}
                onChange={(e) => setResidentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
              />
            </div>

            {/* Vaccine Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Session Summary</h4>
              {formData.vaccines.map((vaccine, idx) => {
                const vaccineInfo = vaccinesWithInventory.find(v => v.id === vaccine.vaccine_id);
                return (
                  <div key={idx} className="text-sm text-blue-800 mb-1">
                    <span className="font-medium">{vaccineInfo?.name || 'Unknown Vaccine'}</span>
                    {' '} - Target: <span className="font-semibold">{vaccine.target} people</span>
                    {' '} - Selected: <span className="font-semibold">{(vaccine.selectedParticipants || []).length}</span>
                  </div>
                );
              })}
            </div>

            {/* Residents List */}
            <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              {isLoadingResidents ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#4A7C59] border-t-transparent"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading residents...</p>
                </div>
              ) : filteredResidents.length > 0 ? (
                <div className="space-y-2">
                  {filteredResidents.map((resident) => {
                    const vaccineIndex = expandedVaccineIndex ?? 0;
                    const vaccineItem = formData.vaccines[vaccineIndex];
                    const isSelected = (vaccineItem?.selectedParticipants || []).includes(resident.id);
                    const selectedCount = (vaccineItem?.selectedParticipants || []).length;
                    const target = parseInt(vaccineItem?.target) || 0;
                    const canSelect = selectedCount < target || isSelected;

                    return (
                      <label
                        key={resident.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : canSelect
                            ? 'border-gray-200 hover:bg-gray-50'
                            : 'border-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleParticipantToggle(vaccineIndex, resident.id)}
                          disabled={!canSelect}
                          className="w-4 h-4 text-[#4A7C59] rounded focus:ring-2 focus:ring-[#4A7C59]"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{resident.name}</p>
                          <p className="text-xs text-gray-600">
                            {resident.contact || 'No contact'} | Birthday: {resident.birthday || 'N/A'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">
                    {residentSearch ? 'No residents match your search' : 'No residents available'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer - Step 2 */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Session"}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
