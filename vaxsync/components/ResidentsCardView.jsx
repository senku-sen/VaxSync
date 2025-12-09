"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Edit, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function ResidentsCardView({
  residents,
  loading,
  selectedBarangay,
  openEditDialog,
  handleDeleteResident,
  formatDate,
  onViewDetails = () => {},
}) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E5F44]"></div>
          </div>
        ) : residents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No residents found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {residents.map((resident) => (
              <div
                key={resident.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Main Row - Name, Birthday, and Expand Button */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">
                      {resident.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Birthday: {resident.birthday 
                        ? new Date(resident.birthday).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </div>
                  </div>

                  {/* Vaccines Display */}
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-700 mb-1">Vaccines:</div>
                    <div className="flex flex-wrap gap-1">
                      {resident.vaccines_given && Array.isArray(resident.vaccines_given) && resident.vaccines_given.length > 0 ? (
                        resident.vaccines_given.map((vaccine, index) => (
                          <Badge 
                            key={index} 
                            className="text-xs py-0 px-2 bg-green-100 text-green-800 border border-green-300"
                          >
                            {vaccine.toUpperCase()}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No vaccines</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewDetails(resident)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openEditDialog(resident)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                      title="Edit resident"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteResident(resident.id)}
                      className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Delete resident"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleExpand(resident.id)}
                      className="text-gray-600 hover:text-gray-800 p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title="Expand details"
                    >
                      {expandedId === resident.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === resident.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Sex:</span>
                        <span className="text-gray-600 ml-2">{resident.sex || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Barangay:</span>
                        <span className="text-gray-600 ml-2">{resident.barangay || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date of Vaccine:</span>
                        <span className="text-gray-600 ml-2">
                          {resident.administered_date 
                            ? new Date(resident.administered_date).toLocaleDateString('en-US', { 
                                month: '2-digit', 
                                day: '2-digit', 
                                year: 'numeric' 
                              })
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Submitted:</span>
                        <span className="text-gray-600 ml-2">{formatDate(resident.submitted_at)}</span>
                      </div>
                    </div>

                    {/* Defaulters */}
                    {resident.missed_schedule_of_vaccine && Array.isArray(resident.missed_schedule_of_vaccine) && resident.missed_schedule_of_vaccine.length > 0 && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700 text-sm">Missed Vaccines:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resident.missed_schedule_of_vaccine.map((vaccine, index) => (
                            <Badge 
                              key={index} 
                              className="text-xs py-0 px-2 bg-orange-100 text-orange-800 border border-orange-300"
                            >
                              {vaccine.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mother's Name */}
                    {resident.mother && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-gray-700 text-sm">Mother's Name:</span>
                        <span className="text-gray-600 ml-2">{resident.mother}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
