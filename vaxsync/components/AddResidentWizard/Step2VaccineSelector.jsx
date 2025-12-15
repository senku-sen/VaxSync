"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, WifiOff } from "lucide-react";
import { useOffline } from "@/components/OfflineProvider";
import { cacheData, getCachedData } from "@/lib/offlineStorage";

// Fallback vaccines for offline mode when no cache is available
const FALLBACK_VACCINES = [
  { id: 'bcg', name: 'BCG', doses: 1 },
  { id: 'hepb', name: 'Hepatitis B', doses: 3 },
  { id: 'penta', name: 'Pentavalent', doses: 3 },
  { id: 'opv', name: 'OPV', doses: 3 },
  { id: 'ipv', name: 'IPV', doses: 2 },
  { id: 'pcv', name: 'PCV', doses: 3 },
  { id: 'mcv', name: 'MCV', doses: 2 },
  { id: 'mmr', name: 'MMR', doses: 2 },
  { id: 'rotavirus', name: 'Rotavirus', doses: 2 },
  { id: 'flu', name: 'Influenza', doses: 1 },
  { id: 'td', name: 'TD', doses: 2 },
];

const VACCINES_CACHE_KEY = 'vaccines_list';

export default function Step2VaccineSelector({
  vaccineStatus,
  formData,
  onFormDataChange,
  isLoading,
  errors,
}) {
  const { isOnline } = useOffline();
  const [vaccines, setVaccines] = useState([]);
  const [loadingVaccines, setLoadingVaccines] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [customVaccine, setCustomVaccine] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    fetchVaccines();
  }, [isOnline]);

  const fetchVaccines = async () => {
    setLoadingVaccines(true);
    
    // Check actual online status
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine && isOnline) 
      : isOnline;

    if (actuallyOnline) {
      try {
        const response = await fetch("/api/vaccines");
        if (response.ok) {
          const data = await response.json();
          const vaccineList = data.data || [];
          setVaccines(vaccineList);
          setIsFromCache(false);
          
          // Cache for offline use
          if (vaccineList.length > 0) {
            await cacheData(VACCINES_CACHE_KEY, vaccineList, 'vaccines');
          }
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (err) {
        console.log("Failed to fetch vaccines, trying cache:", err.message);
        await loadFromCacheOrFallback();
      }
    } else {
      // Offline - load from cache or use fallback
      await loadFromCacheOrFallback();
    }
    
    setLoadingVaccines(false);
  };

  const loadFromCacheOrFallback = async () => {
    try {
      const cached = await getCachedData(VACCINES_CACHE_KEY);
      if (cached && cached.length > 0) {
        setVaccines(cached);
        setIsFromCache(true);
        console.log("Loaded vaccines from cache");
        return;
      }
    } catch (err) {
      console.log("Cache retrieval failed:", err.message);
    }
    
    // Use fallback vaccines
    setVaccines(FALLBACK_VACCINES);
    setIsFromCache(true);
    console.log("Using fallback vaccines list");
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
          {/* Offline indicator */}
          {!isOnline && isFromCache && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <WifiOff className="w-3 h-3" />
              <span>Offline - using {vaccines === FALLBACK_VACCINES ? 'default' : 'cached'} vaccine list</span>
            </div>
          )}
          
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
                    <SelectValue placeholder={loadingVaccines ? "Loading..." : "Select vaccine"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vaccines.length > 0 ? (
                      vaccines.map((vaccine) => (
                        <SelectItem key={vaccine.id} value={vaccine.name}>
                          {getVaccineDisplay(vaccine)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_vaccines__" disabled>No vaccines available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setUseCustom(true)}
                  variant="outline"
                  disabled={isLoading}
                  title="Enter a custom vaccine name"
                >
                  Custom
                </Button>
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
