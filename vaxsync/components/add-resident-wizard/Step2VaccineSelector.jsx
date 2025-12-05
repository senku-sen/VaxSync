"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export default function Step2VaccineSelector({
  vaccineStatus,
  formData,
  onFormDataChange,
  isLoading,
  errors,
}) {
  const [vaccines, setVaccines] = useState([]);
  const [loadingVaccines, setLoadingVaccines] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [customVaccine, setCustomVaccine] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    fetchVaccines();
  }, []);

  const fetchVaccines = async () => {
    setLoadingVaccines(true);
    try {
      const response = await fetch("/api/vaccines");
      if (response.ok) {
        const data = await response.json();
        setVaccines(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching vaccines:", err);
    } finally {
      setLoadingVaccines(false);
    }
  };

  const getVaccineDisplay = (vaccine) => {
    // Show vaccine name with doses if available
    if (vaccine.doses) {
      return `${vaccine.name} (${vaccine.doses} doses)`;
    }
    return vaccine.name;
  };

  const isDateInPast = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const addVaccine = () => {
    setValidationError("");

    const vaccineName = useCustom ? customVaccine : selectedVaccine;

    if (!vaccineName.trim()) {
      setValidationError("Please select or enter a vaccine");
      return;
    }

    if (!vaccineDate) {
      setValidationError("Please select a date");
      return;
    }

    if (!isDateInPast(vaccineDate)) {
      setValidationError("Vaccine date must be in the past");
      return;
    }

    // Check for duplicates
    const isDuplicate = formData.selectedVaccines.some(
      (v) =>
        v.vaccineName.toLowerCase() === vaccineName.toLowerCase() &&
        v.vaccineDate === vaccineDate
    );

    if (isDuplicate) {
      setValidationError("This vaccine is already added for this date");
      return;
    }

    const newVaccine = {
      vaccineName: vaccineName.trim(),  // Keep original case, just trim whitespace
      vaccineDate,
    };

    console.log('Adding vaccine:', newVaccine);

    onFormDataChange("selectedVaccines", [
      ...formData.selectedVaccines,
      newVaccine,
    ]);

    // Reset form
    setSelectedVaccine("");
    setVaccineDate("");
    setCustomVaccine("");
    setUseCustom(false);
  };

  const removeVaccine = (index) => {
    onFormDataChange(
      "selectedVaccines",
      formData.selectedVaccines.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      {/* Add Vaccine Form */}
      <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900">Add Vaccine</h4>

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-900">{validationError}</p>
          </div>
        )}

        <div className="space-y-3">
          {!useCustom ? (
            <div>
              <Label htmlFor="vaccine-select" className="text-sm font-medium">
                Select Vaccine
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedVaccine}
                  onValueChange={setSelectedVaccine}
                  disabled={isLoading || loadingVaccines}
                >
                  <SelectTrigger id="vaccine-select" className="flex-1">
                    <SelectValue placeholder="Select vaccine" />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccines.map((vaccine) => (
                      <SelectItem key={vaccine.id} value={vaccine.name}>
                        {getVaccineDisplay(vaccine)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {vaccines.length > 0 && (
                  <Button
                    onClick={() => setUseCustom(true)}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Custom
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="vaccine-custom" className="text-sm font-medium">
                Enter Vaccine Name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="vaccine-custom"
                  placeholder="Enter vaccine name"
                  value={customVaccine}
                  onChange={(e) => setCustomVaccine(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    setUseCustom(false);
                    setCustomVaccine("");
                  }}
                  variant="outline"
                  disabled={isLoading}
                >
                  Select
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="vaccine-date" className="text-sm font-medium">
              Vaccination Date
            </Label>
            <Input
              id="vaccine-date"
              type="date"
              value={vaccineDate}
              onChange={(e) => setVaccineDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={addVaccine}
            disabled={isLoading || loadingVaccines}
            className="w-full bg-[#4A7C59] hover:bg-[#3E6B4D] text-white"
          >
            Add Vaccine
          </Button>
        </div>
      </div>

      {/* Selected Vaccines List */}
      {formData.selectedVaccines.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">
            Selected Vaccines ({formData.selectedVaccines.length})
          </h4>
          <div className="space-y-2">
            {formData.selectedVaccines.map((vaccine, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {vaccine.vaccineName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(vaccine.vaccineDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeVaccine(index)}
                  disabled={isLoading}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.selectedVaccines && (
        <p className="text-sm text-red-600">{errors.selectedVaccines}</p>
      )}
    </div>
  );
}
