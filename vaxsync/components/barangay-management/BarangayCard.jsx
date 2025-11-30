// ============================================
// BARANGAY CARD COMPONENT
// ============================================
// Reusable card component for displaying barangay information
// Used in pages/headNurse/barangay-management.jsx
// ============================================

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, MoreHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";

const registeredDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default function BarangayCard({ barangay, onEdit, onDelete, isMenuOpen, onMenuToggle }) {
  // Reference for click-outside detection
  const menuRef = useRef(null);

  const registeredDate = barangay?.created_at
    ? registeredDateFormatter.format(new Date(barangay.created_at))
    : "Unknown";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onMenuToggle(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen, onMenuToggle]);

  // Handle edit action and close menu
  const handleEditClick = () => {
    onEdit(barangay);
    onMenuToggle(false);
  };

  // Handle delete action and close menu
  const handleDeleteClick = () => {
    onDelete(barangay);
    onMenuToggle(false);
  };

  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Header: Menu + Title + Municipality */}
        <div className="flex justify-between items-start mb-4">
          {/* Title and Municipality */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{barangay.name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {barangay.municipality || "Daet"}
            </p>
          </div>

          {/* Menu Button on Right (Above Badge) */}
          <div className="relative -mr-2" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMenuToggle(!isMenuOpen)}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </Button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleEditClick}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 transition-colors"
                >
                  <Edit className="w-4 h-4 text-black" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-end mb-4">
          <Badge variant="default" className="bg-green-100 text-green-700 border-0">
            Active
          </Badge>
        </div>

        {/* Population & Registration Date */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Population</p>
            <p className="text-sm font-semibold text-gray-900">{barangay.population?.toLocaleString() || "0"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Registered</p>
            <p className="text-sm text-gray-900">{registeredDate}</p>
          </div>
        </div>

        {/* Assigned Health Worker */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Assigned Health Worker</p>
          {barangay.assigned_health_worker ? (
            <p className="text-sm font-medium text-gray-900">
              {barangay.assigned_health_worker.first_name} {barangay.assigned_health_worker.last_name}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">No health worker assigned</p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
