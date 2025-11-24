"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2 } from "lucide-react";

export default function ApprovedResidentsTable({
  residents,
  loading,
  selectedBarangay,
  openEditDialog,
  handleDeleteResident,
  getVaccineStatusBadge,
  formatDate,
}) {
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Birthday</th>
                  <th className="text-left py-3 px-4 font-medium">Sex</th>
                  <th className="text-left py-3 px-4 font-medium">Address</th>
                  <th className="text-left py-3 px-4 font-medium">Barangay</th>
                  <th className="text-left py-3 px-4 font-medium">Vaccine Status</th>
                  <th className="text-left py-3 px-4 font-medium">Vaccines Given</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((resident) => (
                  <tr key={resident.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{resident.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      {resident.birthday 
                        ? new Date(resident.birthday).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </td>
                    <td className="py-3 px-4">
                      {resident.sex || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        {resident.address}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {resident.barangay || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getVaccineStatusBadge(resident.vaccine_status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {resident.vaccines_given && Array.isArray(resident.vaccines_given) && resident.vaccines_given.length > 0 ? (
                          resident.vaccines_given.map((vaccine, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {vaccine.toUpperCase()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm">
                        {resident.contact}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        {formatDate(resident.submitted_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(resident)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteResident(resident.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

