"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2VaccineStatus from "./Step2VaccineStatus";
import Step3ReviewSummary from "./Step3ReviewSummary";

export default function AddResidentWizard({
  isOpen,
  onClose,
  selectedBarangay,
  selectedBarangayId,
  userId,
  onSuccess,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [barangayId, setBarangayId] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1
    name: "",
    birthday: "",
    sex: "",
    barangay: selectedBarangay || "",
    mother: "",

    // Step 2
    vaccineStatus: "",
    missedSessions: null,
    selectedSession: null,
    selectedVaccines: [],
    selectedUpcomingSession: null,
    selectedFullyVaccinatedSessions: null,
  });

  // Initialize barangay ID and form data when wizard opens
  useEffect(() => {
    if (isOpen && selectedBarangay) {
      // Set barangay in form data
      setFormData((prev) => ({
        ...prev,
        barangay: selectedBarangay,
      }));
      initializeData();
    }
  }, [isOpen, selectedBarangay, selectedBarangayId]);

  const initializeData = async () => {
    try {
      // If barangayId is passed directly, use it
      if (selectedBarangayId) {
        setBarangayId(selectedBarangayId);
      } else {
        // Otherwise, fetch barangay ID from barangay name
        const barangayResponse = await fetch(
          `/api/barangays?name=${encodeURIComponent(selectedBarangay)}`
        );
        if (barangayResponse.ok) {
          const barangayData = await barangayResponse.json();
          const bId = barangayData.data?.[0]?.id;
          if (bId) {
            setBarangayId(bId);
          }
        }
      }
    } catch (err) {
      console.error("Error initializing wizard data:", err);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    setError(null);

    // Validate current step before proceeding
    if (currentStep === 1) {
      // Validate Step 1: Basic Info
      if (!formData.name.trim()) {
        setError("Please enter resident name");
        return;
      }
      if (!formData.birthday) {
        setError("Please select birthday");
        return;
      }
      if (!formData.sex) {
        setError("Please select sex");
        return;
      }
    } else if (currentStep === 2) {
      // Validate Step 2: Vaccine Status
      if (!formData.vaccineStatus) {
        setError("Please select vaccine status");
        return;
      }

      if (formData.vaccineStatus === "not_vaccinated") {
        if (formData.missedSessions === null) {
          setError("Please select if resident is first timer or missed sessions");
          return;
        }
        if (formData.missedSessions === false && !formData.selectedSession) {
          setError("Please select an upcoming session");
          return;
        }
        if (formData.missedSessions === true && formData.selectedVaccines.length === 0 && !formData.selectedSession) {
          setError("Please add vaccines or select sessions");
          return;
        }
      } else if (formData.vaccineStatus === "partially_vaccinated") {
        if (formData.selectedVaccines.length === 0) {
          setError("Please add at least one vaccine");
          return;
        }
        if (!formData.selectedUpcomingSession || (Array.isArray(formData.selectedUpcomingSession) && formData.selectedUpcomingSession.length === 0)) {
          setError("Please select an upcoming session to register the resident");
          return;
        }
      } else if (formData.vaccineStatus === "fully_vaccinated") {
        if (formData.selectedVaccines.length === 0) {
          setError("Please add at least one vaccine");
          return;
        }
        if (!formData.selectedFullyVaccinatedSessions || (Array.isArray(formData.selectedFullyVaccinatedSessions) && formData.selectedFullyVaccinatedSessions.length === 0)) {
          setError("Please select an upcoming session to register the resident");
          return;
        }
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleCancel = () => {
    setCurrentStep(1);
    setError(null);
    setFormData({
      name: "",
      birthday: "",
      sex: "",
      barangay: selectedBarangay || "",
      mother: "",
      vaccineStatus: "",
      missedSessions: null,
      selectedSession: null,
      selectedVaccines: [],
      selectedUpcomingSession: null,
      selectedFullyVaccinatedSessions: null,
    });
    onClose();
  };

  const getAdministeredDate = () => {
    if (formData.vaccineStatus === "fully_vaccinated") {
      // Get the latest (most recent) vaccine date
      if (formData.selectedVaccines.length > 0) {
        const dates = formData.selectedVaccines.map(
          (v) => new Date(v.vaccineDate)
        );
        const latestDate = new Date(Math.max(...dates));
        return latestDate.toISOString().split("T")[0];
      }
    }
    // For other statuses: today
    return new Date().toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Resolve barangay ID (prefer passed-in / initialized value)
      let effectiveBarangayId = barangayId || selectedBarangayId || null;

      // If still missing, try to look it up by barangay name from the form
      if (!effectiveBarangayId && formData.barangay) {
        try {
          const resp = await fetch(
            `/api/barangays?name=${encodeURIComponent(formData.barangay)}`
          );

          if (resp.ok) {
            const json = await resp.json();
            const lookedUpId = json.data?.[0]?.id;
            if (lookedUpId) {
              effectiveBarangayId = lookedUpId;
              setBarangayId(lookedUpId);
            }
          }
        } catch (lookupErr) {
          console.error("Error looking up barangay by name:", lookupErr);
        }
      }

      if (!effectiveBarangayId) {
        throw new Error("Barangay ID not found");
      }

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Step 1: Create resident record
      // For missed sessions: don't add vaccines to vaccines_given, add dates to missed_schedule_of_vaccine instead
      let vaccinesToAdd = [];
      let missedDates = [];

      if (formData.vaccineStatus === "not_vaccinated" && formData.missedSessions === true) {
        // Missed sessions - add vaccine dates to missed_schedule_of_vaccine, not vaccines_given
        missedDates = formData.selectedVaccines.map((v) => v.vaccineDate);
      } else {
        // For other statuses, add vaccines to vaccines_given
        // Extract vaccine names from selectedVaccines array
        vaccinesToAdd = formData.selectedVaccines.map((v) => {
          // Ensure we get the vaccine name and preserve it properly
          const vaccineName = v.vaccineName || '';
          return vaccineName.trim();
        }).filter(name => name.length > 0);
        
        console.log('Vaccines to add:', vaccinesToAdd);
      }

      const residentData = {
        name: formData.name.toUpperCase(),
        birthday: formData.birthday,
        sex: formData.sex,
        barangay: formData.barangay,
        barangay_id: effectiveBarangayId,
        vaccine_status: formData.vaccineStatus,
        administered_date: getAdministeredDate(),
        vaccines_given: vaccinesToAdd,
        missed_schedule_of_vaccine: missedDates,
        mother: formData.mother || null,
        status: "pending",
        submitted_by: userId,
      };

      const residentResponse = await fetch("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(residentData),
      });

      if (!residentResponse.ok) {
        const errorData = await residentResponse.json();
        throw new Error(errorData.error || "Failed to create resident");
      }

      const residentResult = await residentResponse.json();
      const residentId = residentResult.data?.id;

      // Step 2: Create session beneficiary records (if applicable)
      // Similar to vaccination session participant addition process
      try {
        const sessionsToAdd = [];
        const customVaccinesToAdd = [];

        if (formData.vaccineStatus === "not_vaccinated") {
          // First timer - add to selected upcoming sessions
          if (formData.missedSessions === false) {
            const selectedSessions = Array.isArray(formData.selectedSession) 
              ? formData.selectedSession 
              : (formData.selectedSession?.sessionId ? [formData.selectedSession] : []);
            sessionsToAdd.push(...selectedSessions);
          } else if (formData.missedSessions === true) {
            // Missed sessions - add custom vaccines + past sessions + upcoming sessions
            const selectedPastSessions = Array.isArray(formData.selectedSession) 
              ? formData.selectedSession 
              : (formData.selectedSession?.sessionId ? [formData.selectedSession] : []);
            sessionsToAdd.push(...selectedPastSessions);
            
            // Also add upcoming sessions if selected
            const selectedUpcomingSessions = Array.isArray(formData.selectedUpcomingSession)
              ? formData.selectedUpcomingSession
              : (formData.selectedUpcomingSession?.sessionId ? [formData.selectedUpcomingSession] : []);
            sessionsToAdd.push(...selectedUpcomingSessions);
            
            // Also add custom vaccines with session_id: null
            customVaccinesToAdd.push(...(formData.selectedVaccines || []));
          }
        } else if (formData.vaccineStatus === "partially_vaccinated") {
          // Partially vaccinated - add custom vaccines + selected upcoming sessions
          customVaccinesToAdd.push(...(formData.selectedVaccines || []));
          const selectedSessions = Array.isArray(formData.selectedUpcomingSession)
            ? formData.selectedUpcomingSession
            : (formData.selectedUpcomingSession?.sessionId ? [formData.selectedUpcomingSession] : []);
          sessionsToAdd.push(...selectedSessions);
        } else if (formData.vaccineStatus === "fully_vaccinated") {
          // Fully vaccinated - add custom vaccines + selected sessions
          customVaccinesToAdd.push(...(formData.selectedVaccines || []));
          const selectedSessions = Array.isArray(formData.selectedFullyVaccinatedSessions)
            ? formData.selectedFullyVaccinatedSessions
            : (formData.selectedFullyVaccinatedSessions?.sessionId ? [formData.selectedFullyVaccinatedSessions] : []);
          sessionsToAdd.push(...selectedSessions);
        }

        // Create beneficiary records for each selected session
        if (sessionsToAdd.length > 0) {
          console.log(`Creating beneficiaries for ${sessionsToAdd.length} session(s)`);
          let successCount = 0;
          let failCount = 0;

          for (const session of sessionsToAdd) {
            try {
              const beneficiaryRecord = {
                session_id: session.sessionId,
                resident_id: residentId,
                attended: null,  // Not yet attended
                vaccinated: null, // Not yet vaccinated
              };

              const beneficiaryResponse = await fetch("/api/session-beneficiaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(beneficiaryRecord),
              });

              if (!beneficiaryResponse.ok) {
                const errorData = await beneficiaryResponse.json();
                console.warn(`⚠️ Failed to create beneficiary for session ${session.sessionId}:`, errorData);
                failCount++;
              } else {
                console.log(`✅ Beneficiary created for session ${session.sessionId}`);
                successCount++;
              }
            } catch (err) {
              console.warn(`Error creating beneficiary for session ${session.sessionId}:`, err);
              failCount++;
            }
          }

          if (successCount > 0) {
            console.log(`✅ Successfully created ${successCount} beneficiary record(s)`);
          }
          if (failCount > 0) {
            console.warn(`⚠️ Failed to create ${failCount} beneficiary record(s)`);
          }
        }

        // Create beneficiary records for custom vaccines (session_id: null)
        if (customVaccinesToAdd.length > 0) {
          console.log(`Creating custom vaccine beneficiaries for ${customVaccinesToAdd.length} vaccine(s)`);
          let successCount = 0;
          let failCount = 0;

          for (const vaccine of customVaccinesToAdd) {
            try {
              // Determine attended and vaccinated status based on vaccine status
              let attended = null;
              let vaccinated = null;
              
              if (formData.vaccineStatus === "not_vaccinated" && formData.missedSessions === true) {
                // Missed sessions: not attended, not vaccinated
                attended = false;
                vaccinated = false;
              } else if (formData.vaccineStatus === "partially_vaccinated") {
                // Partially vaccinated: attended and vaccinated (already received vaccine)
                attended = true;
                vaccinated = true;
              } else if (formData.vaccineStatus === "fully_vaccinated") {
                // Fully vaccinated: attended and vaccinated (already received vaccine)
                attended = true;
                vaccinated = true;
              }
              
              const beneficiaryRecord = {
                session_id: null,  // Custom vaccine - no session
                resident_id: residentId,
                vaccine_name: vaccine.vaccineName,  // Store vaccine name for custom vaccines
                attended: attended,
                vaccinated: vaccinated,
              };

              const beneficiaryResponse = await fetch("/api/session-beneficiaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(beneficiaryRecord),
              });

              if (!beneficiaryResponse.ok) {
                const errorData = await beneficiaryResponse.json();
                console.warn(`⚠️ Failed to create custom vaccine beneficiary:`, errorData);
                failCount++;
              } else {
                console.log(`✅ Custom vaccine beneficiary created for ${vaccine.vaccineName}`);
                successCount++;
              }
            } catch (err) {
              console.warn(`Error creating custom vaccine beneficiary for ${vaccine.vaccineName}:`, err.message || err);
              failCount++;
            }
          }

          if (successCount > 0) {
            console.log(`✅ Successfully created ${successCount} custom vaccine beneficiary record(s)`);
          }
          if (failCount > 0) {
            console.warn(`⚠️ Failed to create ${failCount} custom vaccine beneficiary record(s)`);
          }
        }

        if (sessionsToAdd.length === 0 && customVaccinesToAdd.length === 0) {
          console.log("ℹ️ No sessions or custom vaccines selected for beneficiary creation");
        }
      } catch (err) {
        console.warn("⚠️ Error creating session beneficiaries:", err);
        // Don't fail resident creation if beneficiary creation fails
      }

      toast.success("Resident added successfully!");
      handleCancel();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error creating resident:", err);
      setError(err.message || "Failed to create resident");
      toast.error(err.message || "Failed to create resident");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#4A7C59] to-[#3E6B4D] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Add New Resident</h2>
            <p className="text-sm text-green-100 mt-1">
              Step {currentStep} of 3
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step <= currentStep ? "bg-[#4A7C59]" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {currentStep === 1 && (
            <Step1BasicInfo
              formData={formData}
              onFormDataChange={updateFormData}
              selectedBarangay={selectedBarangay}
              isLoading={isLoading}
            />
          )}

          {currentStep === 2 && (
            <Step2VaccineStatus
              formData={formData}
              onFormDataChange={updateFormData}
              selectedBarangay={selectedBarangay}
              isLoading={isLoading}
            />
          )}

          {currentStep === 3 && (
            <Step3ReviewSummary
              formData={formData}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}

          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-4 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3E6B4D] transition-colors disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3E6B4D] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
