// ============================================
// BARANGAY FORM COMPONENT
// ============================================
// Reusable form component for adding/editing barangays
// Used in pages/headNurse/barangay-management.jsx
// ============================================

"use client";

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

export default function BarangayForm({
  formData,
  editMode,
  isLoading,
  onSubmit,
  onChange,
  onClose,
}) {
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
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm sm:text-base">
            Barangay Name
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Enter barangay name"
            required
            className="text-sm sm:text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="municipality" className="text-sm sm:text-base">
            Municipality
          </Label>
          <Input
            id="municipality"
            name="municipality"
            value={formData.municipality}
            onChange={onChange}
            placeholder="Enter municipality"
            required
            className="text-sm sm:text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="health_center_address" className="text-sm sm:text-base">
            Health Center Address
          </Label>
          <Input
            id="health_center_address"
            name="health_center_address"
            value={formData.health_center_address}
            onChange={onChange}
            placeholder="Enter complete address"
            required
            className="text-sm sm:text-base"
          />
        </div>
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
