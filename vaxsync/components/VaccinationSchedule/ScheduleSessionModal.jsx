// Schedule Session Modal
// Modal form for scheduling vaccination sessions
// Collects date, time, vaccine, and target information

import { useState, useEffect, useRef } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
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
    vaccine_id: "",
    target: ""
  },
  errors = {},
  onFormChange = () => {},
  barangays = [],
  isHeadNurse = false
}) {
  // Vaccine inventory validation state
  const [vaccineInventory, setVaccineInventory] = useState({
    isValid: false,
    isChecking: false,
    availableQuantity: 0,
    validationErrors: []
  });

  // Vaccines with inventory in barangay
  const [vaccinesWithInventory, setVaccinesWithInventory] = useState([]);

  // Doses per person for target calculation
  const [dosesPerPerson, setDosesPerPerson] = useState(1);
  
  // Form ref for submitting from footer button
  const formRef = useRef(null);
  
  // Maximum possible target based on available doses
  const maxPossibleTarget = vaccineInventory.isValid && dosesPerPerson > 0
    ? Math.floor(vaccineInventory.availableQuantity / dosesPerPerson)
    : 0;

  // Determine which barangayId to use (from props or from form data for Head Nurse)
  const effectiveBarangayId = isHeadNurse ? formData.barangay_id : barangayId;

  // Load vaccines with inventory when barangay changes
  useEffect(() => {
    const loadVaccinesWithInventory = async () => {
      if (!effectiveBarangayId) {
        console.log('No barangayId, clearing vaccines with inventory');
        setVaccinesWithInventory([]);
        return;
      }

      try {
        console.log('Loading vaccines with inventory for barangay:', effectiveBarangayId);

        // Fetch all inventory for barangay
        const { data: inventory, error } = await fetchBarangayVaccineInventory(effectiveBarangayId);

        if (error) {
          console.warn('Error fetching inventory:', error);
          setVaccinesWithInventory([]);
          return;
        }

        if (!inventory || inventory.length === 0) {
          console.log('No inventory items found');
          setVaccinesWithInventory([]);
          return;
        }

        // Group inventory items by vaccine ID
        const inventoryByVaccine = inventory.reduce((acc, item) => {
          if ((item.quantity_vial || 0) <= 0) return acc;
          
          const vaccineDose = item.VaccineDoses || {};
          const vaccine = vaccineDose.Vaccine || {};
          const vaccineId = vaccine.id || vaccineDose.vaccine_id || item.vaccine_id;
          
          if (!vaccineId) return acc;
          
          if (!acc[vaccineId]) {
            acc[vaccineId] = {
              id: vaccineId,
              name: vaccine.name || 'Unknown Vaccine',
              doseCode: vaccineDose.dose_code || '',
              batch_number: item.batch_number,
              expiry_date: item.expiry_date,
              items: [],
              totalVials: 0,
              totalDoses: 0
            };
          }
          
          acc[vaccineId].items.push(item);
          acc[vaccineId].totalVials += item.quantity_vial || 0;
          acc[vaccineId].totalDoses += item.quantity_dose || 0;
          
          return acc;
        }, {});
        
        // Convert to array of vaccines with aggregated quantities
        const vaccinesWithQty = Object.values(inventoryByVaccine).map(vaccine => ({
          id: vaccine.id,
          vaccine_dose_id: vaccine.items[0]?.vaccine_id,
          inventory_id: vaccine.items[0]?.id,
          name: vaccine.doseCode ? `${vaccine.name} (${vaccine.doseCode})` : vaccine.name,
          vaccineName: vaccine.name,
          doseCode: vaccine.doseCode,
          batch_number: vaccine.batch_number,
          expiry_date: vaccine.expiry_date,
          availableQuantity: vaccine.totalVials,
          availableDoses: vaccine.totalDoses,
          items: vaccine.items // Keep reference to all inventory items for this vaccine
        }));
        
        console.log('Vaccines with quantity:', vaccinesWithQty);

        console.log('Vaccines with quantity:', vaccinesWithQty);
        setVaccinesWithInventory(vaccinesWithQty);
      } catch (err) {
        console.error('Error loading vaccines with inventory:', err);
        setVaccinesWithInventory([]);
      }
    };

    loadVaccinesWithInventory();
  }, [effectiveBarangayId, vaccines]);

  // Validate vaccine inventory when selected
  useEffect(() => {
    const validateVaccineInventory = async () => {
      if (!formData.vaccine_id || !effectiveBarangayId) {
        setVaccineInventory({
          isValid: false,
          isChecking: false,
          availableQuantity: 0,
          validationErrors: []
        });
        return;
      }

      setVaccineInventory(prev => ({ ...prev, isChecking: true }));

      try {
        // Validate vaccine and check inventory
        const { isValid, availableQuantity, errors: validationErrors } = await validateVaccineForSchedule(
          formData.vaccine_id,
          effectiveBarangayId
        );

        setVaccineInventory({
          isValid,
          isChecking: false,
          availableQuantity: availableQuantity || 0,
          validationErrors: validationErrors || []
        });

        console.log('Vaccine inventory validation:', { isValid, availableQuantity, validationErrors });
      } catch (err) {
        console.error('Error validating vaccine inventory:', err);
        setVaccineInventory({
          isValid: false,
          isChecking: false,
          availableQuantity: 0,
          validationErrors: ['Error checking inventory']
        });
      }
    };

    validateVaccineInventory();
  }, [formData.vaccine_id, effectiveBarangayId]);

  // Handle form submission with doses_per_person included
  const handleSubmit = (e) => {
    e.preventDefault();
    // Include doses_per_person in formData before submitting
    const formDataWithDoses = { 
      ...formData, 
      doses_per_person: dosesPerPerson,
      // Include the first inventory item's ID for reference
      inventory_item_id: vaccinesWithInventory.find(v => v.id === formData.vaccine_id)?.inventory_id
    };
    
    // Update form data with the new values
    onFormChange(formDataWithDoses);
    
    // Attach doses_per_person to event for immediate access
    e.doses_per_person = dosesPerPerson;
    
    // Call the original onSubmit handler
    onSubmit(e);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormChange({ ...formData, [name]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
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
        <div className="p-6 overflow-y-auto flex-1">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
            
            {/* Vaccine Inventory Validation */}
            {formData.vaccine_id && vaccineInventory.validationErrors.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Inventory Issues</p>
                  {vaccineInventory.validationErrors.map((error, idx) => (
                    <p key={`inventory-error-${idx}`} className="text-sm text-amber-600">{error}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Vaccine Available */}
            {formData.vaccine_id && vaccineInventory.isValid && !vaccineInventory.isChecking && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-700">Vaccine Available</p>
                  <p className="text-sm text-green-600">
                    {vaccineInventory.availableQuantity} vials available
                    {dosesPerPerson > 0 && (
                      <span className="block mt-1">
                        At {dosesPerPerson} dose(s) per person: <span className="font-semibold">
                          Max {maxPossibleTarget} people
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
            
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
                <option value="">
                  {vaccinesWithInventory.length === 0 ? 'No vaccines in inventory' : 'Select vaccine'}
                </option>
                {vaccinesWithInventory.map((vaccine) => (
                  <option key={vaccine.inventory_id || vaccine.id} value={vaccine.id}>
                    {vaccine.name} - {vaccine.availableQuantity} vials ({vaccine.availableDoses} doses)
                  </option>
                ))}
              </select>
            </div>

            {/* Doses Per Person */}
            <div>
              <label htmlFor="dosesPerPerson" className="block text-sm font-medium text-gray-700 mb-2">
                Doses per person <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="dosesPerPerson"
                value={dosesPerPerson}
                onChange={(e) => setDosesPerPerson(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Enter doses per person"
                min="1"
                step="1"
                disabled={!vaccineInventory.isValid}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent placeholder:text-gray-600 ${
                  !vaccineInventory.isValid ? 'bg-gray-50 text-gray-400 border-gray-300' : 'border-gray-300'
                }`}
              />
              {vaccineInventory.isValid && (
                <p className="text-xs text-gray-500 mt-1">
                  Available vials: {vaccineInventory.availableQuantity} ÷ {dosesPerPerson} dose(s) = <span className="font-semibold text-gray-700">{maxPossibleTarget} people max</span>
                </p>
              )}
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
                placeholder={vaccineInventory.isValid ? `Max: ${maxPossibleTarget} people` : 'Select vaccine first'}
                min="1"
                disabled={!vaccineInventory.isValid}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent placeholder:text-gray-600 ${
                  errors.target ? 'border-red-500' : 'border-gray-300'
                } ${!vaccineInventory.isValid ? 'bg-gray-50 text-gray-400' : ''} ${formData.target > maxPossibleTarget ? 'border-orange-500' : ''}`}
              />
              {vaccineInventory.isValid && formData.target && (
                <p className={`text-xs mt-1 ${formData.target > maxPossibleTarget ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                  Doses needed: {formData.target} people × {dosesPerPerson} dose(s) = <span className="font-semibold">{Math.round(formData.target * dosesPerPerson * 10) / 10} vials</span>
                  {formData.target > maxPossibleTarget && <span className="ml-2">(exceeds available inventory)</span>}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (formRef.current) {
                  formRef.current.requestSubmit();
                }
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
