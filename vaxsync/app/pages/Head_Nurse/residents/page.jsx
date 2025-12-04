"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  Plus, 
  Download, 
  Search, 
  CheckCircle, 
  Clock,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { BARANGAYS } from "@/lib/utils";
import { loadUserProfile } from "@/lib/vaccineRequest";
import PendingResidentsTable from "../../../../components/PendingResidentsTable";
import ApprovedResidentsTable from "../../../../components/ApprovedResidentsTable";
import UploadMasterListModal from "../../../../components/UploadMasterListModal";

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    birthday: "",
    sex: "",
    address: "",
    vaccine_status: "not_vaccinated",
    contact: "",
    barangay: "",
    vaccines_given: []
  });
  
  // Batch selection state
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Available vaccine types
  const VACCINE_TYPES = [
    "penta1", "penta2",
    "pcv1", "pcv2", "pcv3",
    "mcv1", "mcv2",
    "opv1", "opv2",
    "mmr1", "mmr2",
    "ipv1", "ipv2",
    "tt1", "tt2"
  ];

  // Initialize data with auth check
  const initializeData = async () => {
    try {
      setIsAuthLoading(true);
      const profile = await loadUserProfile();
      if (profile) {
        setUserProfile(profile);
        console.log('User profile loaded:', profile);
        // Auto-select user's barangay if available
        if (profile.barangays?.name) {
          setSelectedBarangay(profile.barangays.name);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Export currently visible residents to CSV
  const handleExport = () => {
    try {
      if (!residents || residents.length === 0) {
        toast.info("No data to export for current view");
        return;
      }

      const escapeCell = (value) => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
        return str;
      };

      const headers = [
        "Name",
        "Age",
        "Address",
        "Barangay",
        "Vaccine Status",
        "Contact",
        "Submitted"
      ];

      const rows = residents.map((r) => [
        r.name,
        r.age,
        r.address,
        r.barangay || "",
        r.vaccine_status,
        r.contact,
        r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : ""
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map(escapeCell).join(","))
        .join("\n");

      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const filename = `${activeTab === "pending" ? "Pending" : "Approved"}_Residents_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export data");
    }
  };

  // Fetch residents from API
  const fetchResidents = async (status = "pending") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status,
        search: searchTerm,
        barangay: selectedBarangay === "all" ? "" : selectedBarangay
      });
      
      const response = await fetch(`/api/residents?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setResidents(data.residents || []);
      } else {
        toast.error("Failed to fetch residents");
      }
    } catch (error) {
      console.error("Error fetching residents:", error);
      toast.error("Error fetching residents");
    } finally {
      setLoading(false);
    }
  };

  // Fetch counts for both pending and approved residents
  const fetchCounts = async () => {
    try {
      // Fetch pending count
      const pendingParams = new URLSearchParams({
        status: "pending",
        search: searchTerm,
        barangay: selectedBarangay === "all" ? "" : selectedBarangay
      });
      const pendingResponse = await fetch(`/api/residents?${pendingParams}`);
      const pendingData = await pendingResponse.json();
      
      // Fetch approved count
      const approvedParams = new URLSearchParams({
        status: "approved",
        search: searchTerm,
        barangay: selectedBarangay === "all" ? "" : selectedBarangay
      });
      const approvedResponse = await fetch(`/api/residents?${approvedParams}`);
      const approvedData = await approvedResponse.json();
      
      if (pendingResponse.ok) {
        setPendingCount(pendingData.residents?.length || 0);
      }
      
      if (approvedResponse.ok) {
        setApprovedCount(approvedData.residents?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  // Create new resident
  const handleCreateResident = async (e) => {
    e.preventDefault();
    
    // Validate user profile is loaded
    if (!userProfile || !userProfile.id) {
      toast.error("User profile not loaded. Please refresh the page.");
      return;
    }
    
    try {
      const response = await fetch("/api/residents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          submitted_by: userProfile.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Resident created successfully");
        setIsAddDialogOpen(false);
        setFormData({
          name: "",
          age: "",
          address: "",
          vaccine_status: "not_vaccinated",
          contact: "",
          barangay: "",
          vaccines_given: []
        });
        fetchResidents(activeTab);
        fetchCounts();
      } else {
        toast.error(data.error || "Failed to create resident");
      }
    } catch (error) {
      console.error("Error creating resident:", error);
      toast.error("Error creating resident");
    }
  };

  // Update resident
  const handleUpdateResident = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/residents", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedResident.id, ...formData }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Resident updated successfully");
        setIsEditDialogOpen(false);
        setSelectedResident(null);
        fetchResidents(activeTab);
        fetchCounts();
      } else {
        toast.error(data.error || "Failed to update resident");
      }
    } catch (error) {
      console.error("Error updating resident:", error);
      toast.error("Error updating resident");
    }
  };

  // Delete resident
  const handleDeleteResident = async (id) => {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    
    try {
      const response = await fetch(`/api/residents?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Resident deleted successfully");
        fetchResidents(activeTab);
        fetchCounts();
      } else {
        toast.error(data.error || "Failed to delete resident");
      }
    } catch (error) {
      console.error("Error deleting resident:", error);
      toast.error("Error deleting resident");
    }
  };

  // Approve/Reject resident
  const handleStatusChange = async (id, action) => {
    try {
      const response = await fetch("/api/residents", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Resident ${action}d successfully`);
        fetchResidents(activeTab);
        fetchCounts();
      } else {
        toast.error(data.error || `Failed to ${action} resident`);
      }
    } catch (error) {
      console.error(`Error ${action}ing resident:`, error);
      toast.error(`Error ${action}ing resident`);
    }
  };

  // Open edit dialog
  const openEditDialog = (resident) => {
    setSelectedResident(resident);
    setFormData({
      name: resident.name || "",
      birthday: resident.birthday || "",
      sex: resident.sex || "",
      address: resident.address || "",
      vaccine_status: resident.vaccine_status || "not_vaccinated",
      contact: resident.contact || "",
      barangay: resident.barangay || "",
      vaccines_given: resident.vaccines_given || []
    });
    setIsEditDialogOpen(true);
  };

  // Get vaccine status badge
  const getVaccineStatusBadge = (status) => {
    const statusConfig = {
      fully_vaccinated: { label: "fully vaccinated", className: "bg-green-100 text-green-800" },
      partially_vaccinated: { label: "partially vaccinated", className: "bg-yellow-100 text-yellow-800" },
      not_vaccinated: { label: "not vaccinated", className: "bg-red-100 text-red-800" }
    };
    
    const config = statusConfig[status] || statusConfig.not_vaccinated;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Toggle resident selection
  const toggleResidentSelection = (residentId) => {
    const newSelected = new Set(selectedResidents);
    if (newSelected.has(residentId)) {
      newSelected.delete(residentId);
    } else {
      newSelected.add(residentId);
    }
    setSelectedResidents(newSelected);
  };

  // Select all residents
  const selectAllResidents = () => {
    if (residents.length === 0) return;
    const allIds = new Set(residents.map(r => r.id));
    setSelectedResidents(allIds);
  };

  // Deselect all residents
  const deselectAllResidents = () => {
    setSelectedResidents(new Set());
  };

  // Batch approve residents
  const handleBatchApprove = async () => {
    if (selectedResidents.size === 0) {
      toast.error("Please select residents to approve");
      return;
    }

    if (!confirm(`Approve ${selectedResidents.size} resident(s)?`)) return;

    setIsBatchProcessing(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const residentId of selectedResidents) {
        try {
          const response = await fetch("/api/residents", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: residentId, action: "approve" }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Approved ${successCount} resident(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to approve ${failCount} resident(s)`);
      }

      setSelectedResidents(new Set());
      fetchResidents(activeTab);
      fetchCounts();
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch reject residents
  const handleBatchReject = async () => {
    if (selectedResidents.size === 0) {
      toast.error("Please select residents to reject");
      return;
    }

    if (!confirm(`Reject ${selectedResidents.size} resident(s)?`)) return;

    setIsBatchProcessing(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const residentId of selectedResidents) {
        try {
          const response = await fetch("/api/residents", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: residentId, action: "reject" }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Rejected ${successCount} resident(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to reject ${failCount} resident(s)`);
      }

      setSelectedResidents(new Set());
      fetchResidents(activeTab);
      fetchCounts();
    } finally {
      setIsBatchProcessing(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (!isAuthLoading && userProfile) {
      fetchResidents(activeTab);
      fetchCounts();
    }
  }, [activeTab, searchTerm, selectedBarangay, isAuthLoading, userProfile]);

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header 
          title="Resident Information Management" 
          subtitle={`Assigned Barangay: ${selectedBarangay === "all" ? "All Barangays" : selectedBarangay}`} 
        />

        <main className="p-2 md:p-3 lg:p-4 flex-1 overflow-auto">
          {/* User Info Display */}
          {userProfile && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <span className="font-semibold">Logged in as:</span> {userProfile.first_name} {userProfile.last_name} ({userProfile.user_role})
              </p>
            </div>
          )}

          {/* Auth Error Display */}
          {authError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-900">
                <span className="font-semibold">Error:</span> {authError}
              </p>
            </div>
          )}

          {/* Auth Loading State */}
          {isAuthLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
              <p className="ml-3 text-gray-600">Loading user profile...</p>
            </div>
          )}

          {/* Action Buttons */}
          {!isAuthLoading && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Button 
                className="bg-[#3E5F44] hover:bg-[#3E5F44]/90 text-white"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Master List
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (open) {
                  // Reset form data when opening add dialog
        setFormData({
          name: "",
          age: "",
          address: "",
          vaccine_status: "not_vaccinated",
          contact: "",
          barangay: "",
          vaccines_given: []
        });
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resident
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Resident</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateResident} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        placeholder="Enter address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="birthday">Birthday *</Label>
                        <Input
                          id="birthday"
                          type="date"
                          value={formData.birthday}
                          onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sex">Sex *</Label>
                        <Select value={formData.sex} onValueChange={(value) => setFormData({...formData, sex: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="contact">Contact Number *</Label>
                      <Input
                        id="contact"
                        placeholder="09XXXXXXXXX"
                        value={formData.contact}
                        onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vaccine_status">Vaccine Status</Label>
                      <Select value={formData.vaccine_status} onValueChange={(value) => setFormData({...formData, vaccine_status: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vaccine status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_vaccinated">Not Vaccinated</SelectItem>
                          <SelectItem value="partially_vaccinated">Partially Vaccinated</SelectItem>
                          <SelectItem value="fully_vaccinated">Fully Vaccinated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="barangay">Barangay</Label>
                      <Select value={formData.barangay} onValueChange={(value) => setFormData({...formData, barangay: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {BARANGAYS.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Vaccines Given</Label>
                      <div className="mt-2 p-4 border rounded-md max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {VACCINE_TYPES.map((vaccine) => (
                            <div key={vaccine} className="flex items-center space-x-2">
                              <Checkbox
                                id={`vaccine-${vaccine}`}
                                checked={formData.vaccines_given.includes(vaccine)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      vaccines_given: [...formData.vaccines_given, vaccine]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      vaccines_given: formData.vaccines_given.filter(v => v !== vaccine)
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`vaccine-${vaccine}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {vaccine.toUpperCase()}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {formData.vaccines_given.length > 0 && (
                          <p className="text-xs text-gray-500 mt-3">
                            Selected: {formData.vaccines_given.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#3E5F44] hover:bg-[#3E5F44]/90">
                        Create Resident
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by Barangay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barangays</SelectItem>
                {BARANGAYS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Batch Selection Controls */}
          {activeTab === "pending" && residents.length > 0 && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedResidents.size} of {residents.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllResidents}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllResidents}
                  className="text-xs"
                  disabled={selectedResidents.size === 0}
                >
                  Clear
                </Button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleBatchApprove}
                  disabled={selectedResidents.size === 0 || isBatchProcessing}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve ({selectedResidents.size})
                </Button>
                <Button
                  onClick={handleBatchReject}
                  disabled={selectedResidents.size === 0 || isBatchProcessing}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject ({selectedResidents.size})
                </Button>
              </div>
            </div>
          )}

          {/* Residents Table */}
          {activeTab === "pending" ? (
            <PendingResidentsTable
              residents={residents}
              loading={loading}
              selectedBarangay={selectedBarangay}
              openEditDialog={openEditDialog}
              handleStatusChange={handleStatusChange}
              handleDeleteResident={handleDeleteResident}
              getVaccineStatusBadge={getVaccineStatusBadge}
              formatDate={formatDate}
              selectedResidents={selectedResidents}
              onToggleSelection={toggleResidentSelection}
            />
          ) : (
            <ApprovedResidentsTable
              residents={residents}
              loading={loading}
              selectedBarangay={selectedBarangay}
              openEditDialog={openEditDialog}
              handleDeleteResident={handleDeleteResident}
              getVaccineStatusBadge={getVaccineStatusBadge}
              formatDate={formatDate}
            />
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Resident</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateResident} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-address">Address *</Label>
                  <Input
                    id="edit-address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-birthday">Birthday *</Label>
                    <Input
                      id="edit-birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sex">Sex *</Label>
                    <Select value={formData.sex} onValueChange={(value) => setFormData({...formData, sex: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-contact">Contact Number *</Label>
                  <Input
                    id="edit-contact"
                    placeholder="09XXXXXXXXX"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-vaccine_status">Vaccine Status</Label>
                  <Select value={formData.vaccine_status} onValueChange={(value) => setFormData({...formData, vaccine_status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vaccine status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_vaccinated">Not Vaccinated</SelectItem>
                      <SelectItem value="partially_vaccinated">Partially Vaccinated</SelectItem>
                      <SelectItem value="fully_vaccinated">Fully Vaccinated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-barangay">Barangay</Label>
                  <Select value={formData.barangay} onValueChange={(value) => setFormData({...formData, barangay: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      {BARANGAYS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Vaccines Given</Label>
                  <div className="mt-2 p-4 border rounded-md max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {VACCINE_TYPES.map((vaccine) => (
                        <div key={vaccine} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-vaccine-${vaccine}`}
                            checked={formData.vaccines_given.includes(vaccine)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  vaccines_given: [...formData.vaccines_given, vaccine]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  vaccines_given: formData.vaccines_given.filter(v => v !== vaccine)
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-vaccine-${vaccine}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {vaccine.toUpperCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.vaccines_given.length > 0 && (
                      <p className="text-xs text-gray-500 mt-3">
                        Selected: {formData.vaccines_given.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#3E5F44] hover:bg-[#3E5F44]/90">
                    Update Resident
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Upload Master List Modal */}
          <UploadMasterListModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={() => {
              fetchResidents(activeTab);
              fetchCounts();
            }}
            userProfile={userProfile}
            selectedBarangay={selectedBarangay === "all" ? "" : selectedBarangay}
          />
          
        </main>
      </div>
    </div>
  );
}