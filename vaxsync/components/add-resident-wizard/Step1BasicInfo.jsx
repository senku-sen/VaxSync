"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BARANGAYS } from "@/lib/utils";

export default function Step1BasicInfo({
  formData,
  onFormDataChange,
  selectedBarangay,
  isLoading,
}) {
  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.birthday) {
      newErrors.birthday = "Birthday is required";
    } else {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.birthday = "Birthday must be in the past";
      }
    }

    if (!formData.sex) {
      newErrors.sex = "Sex is required";
    }

    if (!formData.barangay) {
      newErrors.barangay = "Barangay is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Expose validation to parent
  if (typeof window !== "undefined") {
    window.validateStep1 = validateStep;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Enter the resident's basic information
        </p>
      </div>

      <div>
        <Label htmlFor="name" className="text-sm font-medium">
          Full Name *
        </Label>
        <Input
          id="name"
          placeholder="Enter full name"
          value={formData.name}
          onChange={(e) => {
            onFormDataChange("name", e.target.value);
            if (errors.name) setErrors({ ...errors, name: "" });
          }}
          disabled={isLoading}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birthday" className="text-sm font-medium">
            Birthday *
          </Label>
          <Input
            id="birthday"
            type="date"
            value={formData.birthday}
            onChange={(e) => {
              onFormDataChange("birthday", e.target.value);
              if (errors.birthday) setErrors({ ...errors, birthday: "" });
            }}
            disabled={isLoading}
            className={errors.birthday ? "border-red-500" : ""}
          />
          {errors.birthday && (
            <p className="text-sm text-red-600 mt-1">{errors.birthday}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sex" className="text-sm font-medium">
            Sex *
          </Label>
          <Select
            value={formData.sex}
            onValueChange={(value) => {
              onFormDataChange("sex", value);
              if (errors.sex) setErrors({ ...errors, sex: "" });
            }}
            disabled={isLoading}
          >
            <SelectTrigger
              id="sex"
              className={errors.sex ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          {errors.sex && (
            <p className="text-sm text-red-600 mt-1">{errors.sex}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="barangay" className="text-sm font-medium">
          Barangay *
        </Label>
        <Select
          value={formData.barangay}
          onValueChange={(value) => {
            onFormDataChange("barangay", value);
            if (errors.barangay) setErrors({ ...errors, barangay: "" });
          }}
          disabled={!!selectedBarangay || isLoading}
        >
          <SelectTrigger
            id="barangay"
            className={`${selectedBarangay ? "bg-gray-100 cursor-not-allowed" : ""} ${
              errors.barangay ? "border-red-500" : ""
            }`}
          >
            <SelectValue placeholder="Select barangay" />
          </SelectTrigger>
          <SelectContent>
            {selectedBarangay ? (
              <SelectItem value={selectedBarangay}>{selectedBarangay}</SelectItem>
            ) : (
              BARANGAYS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {selectedBarangay && (
          <p className="text-xs text-gray-500 mt-1">
            Locked to your assigned barangay
          </p>
        )}
        {errors.barangay && (
          <p className="text-sm text-red-600 mt-1">{errors.barangay}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Note:</span> All resident names will
          be stored in uppercase format.
        </p>
      </div>
    </div>
  );
}
