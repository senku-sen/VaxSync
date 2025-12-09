"use client";

import { Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ResidentsTableView({
  residents,
  loading,
  selectedBarangay,
  openEditDialog,
  handleDeleteResident,
  formatDate,
  onViewDetails = () => {},
  selectedResidents = new Set(),
  onToggleSelection = () => {},
  onSelectAll = () => {},
  showSelection = false,
}) {
  const formatVaccineList = (vaccines) => {
    if (!vaccines || !Array.isArray(vaccines) || vaccines.length === 0) {
      return "None";
    }
    return vaccines
      .map((v) => (typeof v === "object" ? v.name : v))
      .map((v) => v.toUpperCase())
      .join(", ");
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "None";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E5F44]"></div>
        </div>
      ) : residents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No residents found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {showSelection && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 w-12">
                    <Checkbox
                      checked={
                        residents.length > 0 &&
                        selectedResidents.size === residents.length
                      }
                      onCheckedChange={onSelectAll}
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Sex
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Birthday
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Mother
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Barangay
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Defaulters
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Date of Vaccine
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Vaccines Given
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {residents.map((resident, index) => (
                <tr
                  key={resident.id}
                  className={`border-b hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {showSelection && (
                    <td className="px-4 py-3 w-12">
                      <Checkbox
                        checked={selectedResidents.has(resident.id)}
                        onCheckedChange={() =>
                          onToggleSelection(resident.id)
                        }
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {resident.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {resident.sex || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateDisplay(resident.birthday)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {resident.mother || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {resident.barangay || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      resident.missed_schedule_of_vaccine && resident.missed_schedule_of_vaccine.length > 0
                        ? 'bg-orange-100 text-orange-800'
                        : 'text-gray-600'
                    }`}>
                      {formatVaccineList(resident.missed_schedule_of_vaccine)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateDisplay(resident.administered_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      resident.vaccines_given && resident.vaccines_given.length > 0
                        ? 'bg-green-100 text-green-800'
                        : 'text-gray-600'
                    }`}>
                      {formatVaccineList(resident.vaccines_given)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(resident.submitted_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(resident)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditDialog(resident)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit resident"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteResident(resident.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete resident"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
