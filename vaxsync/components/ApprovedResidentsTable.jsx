
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Edit, Trash2, Eye } from "lucide-react";

export default function ApprovedResidentsTable({
  residents,
  loading,
  selectedBarangay,
  openEditDialog,
  handleDeleteResident,
  getVaccineStatusBadge,
  formatDate,
  onViewDetails = () => {},
  // Selection props
  selectedResidents = new Set(),
  onToggleSelection = () => {},
  onSelectAll = () => {},
  showSelection = false,
}) {
  const allSelected = residents.length > 0 && residents.every(r => selectedResidents.has(r.id));
  const someSelected = residents.some(r => selectedResidents.has(r.id)) && !allSelected;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Approved Residents - {selectedBarangay === "all" ? "All Barangays" : (selectedBarangay || "Not Assigned")}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Total approved residents: {residents.length}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E5F44]"></div>
          </div>
        ) : residents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No approved residents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 md:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-xs">Name & Vaccines</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Sex</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Birthday</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Barangay</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Defaulters</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Date of Vaccine</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">Submitted</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((resident) => (
                  <tr key={resident.id} className={`border-b hover:bg-gray-50 ${selectedResidents.has(resident.id) ? 'bg-blue-50' : ''}`}>
                    {showSelection && (
                      <td className="py-2 px-2 text-center">
                        <Checkbox
                          checked={selectedResidents.has(resident.id)}
                          onCheckedChange={() => onToggleSelection(resident.id)}
                          aria-label={`Select ${resident.name}`}
                        />
                      </td>
                    )}
                    <td className="py-2 px-2">
                      <div className="font-medium text-xs mb-1">{resident.name}</div>
                      <div className="flex flex-wrap gap-0.5">
                        {resident.vaccines_given && Array.isArray(resident.vaccines_given) && resident.vaccines_given.length > 0 ? (
                          resident.vaccines_given.map((vaccine, index) => (
                            <Badge key={index} variant="outline" className="text-xs py-0 px-1 bg-green-50 text-green-700 border-green-200">
                              {vaccine.toUpperCase()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No vaccines</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {resident.sex || 'N/A'}
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {resident.birthday 
                        ? new Date(resident.birthday).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {resident.barangay || 'N/A'}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-0.5 max-w-xs">
                        {resident.missed_schedule_of_vaccine && Array.isArray(resident.missed_schedule_of_vaccine) && resident.missed_schedule_of_vaccine.length > 0 ? (
                          resident.missed_schedule_of_vaccine.map((vaccine, index) => (
                            <Badge key={index} variant="outline" className="text-xs py-0 px-1 bg-orange-50 text-orange-700 border-orange-200">
                              {vaccine.toUpperCase()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {resident.administered_date 
                        ? new Date(resident.administered_date).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {formatDate(resident.submitted_at)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewDetails(resident)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditDialog(resident)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit resident"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteResident(resident.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete resident"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
