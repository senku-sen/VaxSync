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
import { Edit, Trash2, MapPin } from "lucide-react";

export default function BarangayCard({ barangay, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header: Name + Status Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{barangay.name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {barangay.municipality}
            </p>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-700 border-0">
            Active
          </Badge>
        </div>

        {/* Health Center Address */}
        <div className="mb-4 py-3 border-y border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Health Center Address
          </p>
          <p className="text-sm text-gray-900">{barangay.health_center_address}</p>
        </div>

        {/* Registration Date */}
        <p className="text-xs text-gray-500 mb-4">
          Registered: {new Date(barangay.created_at).toLocaleDateString()}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(barangay)}
            className="flex-1 flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(barangay)}
            className="flex-1 flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
