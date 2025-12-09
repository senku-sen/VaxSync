// ============================================
// BARANGAY FORM COMPONENT
// ============================================
// Modal form for adding/editing barangays
// Validates required fields before submission
// ============================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function BarangayForm({
  formData,
  editMode,
  isLoading,
  onSubmit,
  onChange,
  onClose,
}) {
  // Track validation errors
  const [errors, setErrors] = useState({});

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    // Check barangay name is filled
    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Barangay name is required";
    }

    // Check municipality is filled
    if (!formData.municipality || formData.municipality.trim() === "") {
      newErrors.municipality = "Municipality is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(e);
    }
  };

  return (
    <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl">
          {editMode ? "Edit Barangay" : "Register New Barangay"}
        </DialogTitle>
        <DialogDescription className="text-sm sm:text-base">
          {editMode
            ? "Update the barangay information."
            : "Add a new barangay to the system without leaving the current page."}
        </DialogDescription>
      </DialogHeader>

      {/* Show validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Please fill in all required fields
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Barangay Name Input */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-gray-700">
            Barangay Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name || ""}
            onChange={onChange}
            placeholder="Enter barangay name"
            className={`text-sm sm:text-base border-gray-300 focus:border-green-500 focus:ring-green-500 ${
              errors.name ? "border-red-500" : ""
            }`}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Municipality Input */}
        <div className="space-y-2">
          <Label htmlFor="municipality" className="text-sm sm:text-base font-semibold text-gray-700">
            Municipality <span className="text-red-500">*</span>
          </Label>
          <Input
            disabled
            id="municipality"
            name="municipality"
            value={formData.municipality || "Daet"}
            onChange={onChange}
            placeholder="Daet"
            className={`text-sm sm:text-base border-gray-300 focus:border-green-500 focus:ring-green-500 ${
              errors.municipality ? "border-red-500" : ""
            }`}
          />
          {errors.municipality && <p className="text-sm text-red-600">{errors.municipality}</p>}
        </div>

        {/* Population Input */}
        <div className="space-y-2">
          <Label htmlFor="population" className="text-sm sm:text-base font-semibold text-gray-700">
            Population
          </Label>
          <Input
            id="population"
            name="population"
            type="number"
            value={formData.population || ""}
            onChange={onChange}
            placeholder="Enter population"
            min="0"
            className="text-sm sm:text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Form Actions */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-sm sm:text-base py-2 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="text-sm sm:text-base py-2 px-4"
          >
            {isLoading ? "Saving..." : editMode ? "Save" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
