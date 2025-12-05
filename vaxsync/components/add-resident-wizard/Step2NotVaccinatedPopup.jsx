"use client";

import { Button } from "@/components/ui/button";
import Step2SessionSelector from "./Step2SessionSelector";
import Step2VaccineSelector from "./Step2VaccineSelector";

export default function Step2NotVaccinatedPopup({
  formData,
  onFormDataChange,
  selectedBarangay,
  isLoading,
  errors,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <span className="font-semibold">Question:</span> Did this resident
          miss a vaccination session?
        </p>
      </div>

      {formData.missedSessions === null && (
        <div className="flex gap-4">
          <Button
            onClick={() => onFormDataChange("missedSessions", true)}
            disabled={isLoading}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            Yes, Missed Sessions
          </Button>
          <Button
            onClick={() => onFormDataChange("missedSessions", false)}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            No, First Timer
          </Button>
        </div>
      )}

      {formData.missedSessions === false && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Select upcoming sessions to add this first-time resident to (you can select multiple)
            </p>
          </div>
          <Step2SessionSelector
            sessionType="upcoming"
            formData={formData}
            onFormDataChange={onFormDataChange}
            selectedBarangay={selectedBarangay}
            isLoading={isLoading}
            fieldName="selectedSession"
          />
          <Button
            onClick={() => {
              onFormDataChange("missedSessions", null);
              onFormDataChange("selectedSession", null);
            }}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            Change Answer
          </Button>
        </div>
      )}

      {errors.selectedSession && (
        <p className="text-sm text-red-600">{errors.selectedSession}</p>
      )}
    </div>
  );
}
