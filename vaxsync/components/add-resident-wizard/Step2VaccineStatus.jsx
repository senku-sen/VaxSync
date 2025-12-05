"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Step2NotVaccinatedPopup from "./Step2NotVaccinatedPopup";
import Step2SessionSelector from "./Step2SessionSelector";
import Step2VaccineSelector from "./Step2VaccineSelector";

export default function Step2VaccineStatus({
  formData,
  onFormDataChange,
  selectedBarangay,
  isLoading,
}) {
  const [errors, setErrors] = useState({});

  const handleVaccineStatusChange = (value) => {
    onFormDataChange("vaccineStatus", value);
    onFormDataChange("missedSessions", null);
    onFormDataChange("selectedSession", null);
    onFormDataChange("selectedVaccines", []);
    onFormDataChange("selectedUpcomingSession", null);
    onFormDataChange("selectedFullyVaccinatedSessions", null);
    setErrors({});
  };

  const validateStep = () => {
    const newErrors = {};

    if (!formData.vaccineStatus) {
      newErrors.vaccineStatus = "Vaccine status is required";
    }

    if (formData.vaccineStatus === "not_vaccinated") {
      if (formData.missedSessions === null) {
        newErrors.missedSessions = "Please select if resident is first timer or missed sessions";
      } else if (formData.missedSessions === false && !formData.selectedSession) {
        newErrors.selectedSession = "Please select an upcoming session";
      } else if (formData.missedSessions === true && !formData.selectedSession) {
        newErrors.selectedSession = "Please select past sessions missed";
      }
    } else if (formData.vaccineStatus === "partially_vaccinated") {
      if (formData.selectedVaccines.length === 0) {
        newErrors.selectedVaccines = "Please add at least one vaccine";
      }
    } else if (formData.vaccineStatus === "fully_vaccinated") {
      if (formData.selectedVaccines.length === 0) {
        newErrors.selectedVaccines = "Please add at least one vaccine";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (typeof window !== "undefined") {
    window.validateStep2 = validateStep;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Vaccine Status
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Select the resident's vaccination status
        </p>
      </div>

      <div>
        <Label htmlFor="vaccine-status" className="text-sm font-medium">
          Vaccine Status *
        </Label>
        <Select
          value={formData.vaccineStatus}
          onValueChange={handleVaccineStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger
            id="vaccine-status"
            className={errors.vaccineStatus ? "border-red-500" : ""}
          >
            <SelectValue placeholder="Select vaccine status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_vaccinated">Not Vaccinated</SelectItem>
            <SelectItem value="partially_vaccinated">
              Partially Vaccinated
            </SelectItem>
            <SelectItem value="fully_vaccinated">Fully Vaccinated</SelectItem>
          </SelectContent>
        </Select>
        {errors.vaccineStatus && (
          <p className="text-sm text-red-600 mt-1">{errors.vaccineStatus}</p>
        )}
      </div>

      {/* NOT VACCINATED */}
      {formData.vaccineStatus === "not_vaccinated" && (
        <Step2NotVaccinatedPopup
          formData={formData}
          onFormDataChange={onFormDataChange}
          selectedBarangay={selectedBarangay}
          isLoading={isLoading}
          errors={errors}
        />
      )}

      {/* MISSED SESSIONS */}
      {formData.vaccineStatus === "not_vaccinated" && formData.missedSessions === true && (
        <div className="space-y-6 border-t pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Note:</span> Add vaccines the
              resident missed in past sessions, then select the sessions they missed and/or upcoming sessions.
            </p>
          </div>

          <Step2VaccineSelector
            vaccineStatus="missed_sessions"
            formData={formData}
            onFormDataChange={onFormDataChange}
            isLoading={isLoading}
            errors={errors}
          />

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              Past Sessions Missed
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Select past vaccination sessions this resident missed (you can select multiple)
            </p>
            <Step2SessionSelector
              sessionType="past"
              formData={formData}
              onFormDataChange={onFormDataChange}
              selectedBarangay={selectedBarangay}
              isLoading={isLoading}
              fieldName="selectedSession"
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              Upcoming Sessions (Optional)
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Optionally select upcoming sessions to add this resident to (you can select multiple)
            </p>
            <Step2SessionSelector
              sessionType="upcoming"
              formData={formData}
              onFormDataChange={onFormDataChange}
              selectedBarangay={selectedBarangay}
              isLoading={isLoading}
              fieldName="selectedUpcomingSession"
            />
          </div>
        </div>
      )}

      {/* PARTIALLY VACCINATED */}
      {formData.vaccineStatus === "partially_vaccinated" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Note:</span> Add vaccines the
              resident received in the past, then select an upcoming
              session to register them for.
            </p>
          </div>

          <Step2VaccineSelector
            vaccineStatus="partially_vaccinated"
            formData={formData}
            onFormDataChange={onFormDataChange}
            isLoading={isLoading}
            errors={errors}
          />

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              Upcoming Session *
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Select an upcoming session to register this resident for
            </p>
            <Step2SessionSelector
              sessionType="upcoming"
              formData={formData}
              onFormDataChange={onFormDataChange}
              selectedBarangay={selectedBarangay}
              isLoading={isLoading}
              fieldName="selectedUpcomingSession"
            />
          </div>
        </div>
      )}

      {/* FULLY VACCINATED */}
      {formData.vaccineStatus === "fully_vaccinated" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Note:</span> Add all vaccines the
              resident received. The latest vaccine date will be used as the
              vaccination completion date.
            </p>
          </div>

          <Step2VaccineSelector
            vaccineStatus="fully_vaccinated"
            formData={formData}
            onFormDataChange={onFormDataChange}
            isLoading={isLoading}
            errors={errors}
          />

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              Upcoming Sessions *
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Select upcoming sessions to register this resident for (you can select multiple)
            </p>
            <Step2SessionSelector
              sessionType="upcoming"
              formData={formData}
              onFormDataChange={onFormDataChange}
              selectedBarangay={selectedBarangay}
              isLoading={isLoading}
              fieldName="selectedFullyVaccinatedSessions"
            />
          </div>
        </div>
      )}

      {errors.selectedVaccines && (
        <p className="text-sm text-red-600">{errors.selectedVaccines}</p>
      )}
      {errors.selectedSession && (
        <p className="text-sm text-red-600">{errors.selectedSession}</p>
      )}
      {errors.missedSessions && (
        <p className="text-sm text-red-600">{errors.missedSessions}</p>
      )}
    </div>
  );
}
