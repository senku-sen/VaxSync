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
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { BARANGAYS } from "@/lib/utils";
import { loadUserProfile } from "@/lib/vaccineRequest";
import { supabase } from "@/lib/supabase";
import PendingResidentsTable from "../../../../components/PendingResidentsTable";
import ApprovedResidentsTable from "../../../../components/ApprovedResidentsTable";
import UploadMasterListModal from "../../../../components/UploadMasterListModal";

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedBarangayId, setSelectedBarangayId] = useState(null);
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
    vaccines_given: [],
    missed_schedule_of_vaccine: []
  });

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
        
        // Determine assigned barangay using assigned_barangay_id
        let assignedBarangay = null;
        let assignedBarangayId = null;
        
        // Use assigned_barangay_id from profile
        if (profile.assigned_barangay_id) {
          assignedBarangayId = profile.assigned_barangay_id;
          
          // If barangays info is already loaded, use it
          if (profile.barangays?.name) {
            assignedBarangay = profile.barangays.name;
          } else {
            // Fetch barangay info by ID
            const { data: barangay, error: barangayError } = await supabase
              .from('barangays')
              .select('id, name')
              .eq('id', assignedBarangayId)
              .maybeSingle();
            
            if (!barangayError && barangay) {
              assignedBarangay = barangay.name;
              profile.barangays = barangay;
            }
          }
        } else if (profile.barangays?.name) {
          // Fallback: use barangays name if assigned_barangay_id is not set
          assignedBarangay = profile.barangays.name;
          assignedBarangayId = profile.barangays.id;
        }
        
        // Lock the barangay filter to assigned barangay
        if (assignedBarangay) {
          setSelectedBarangay(assignedBarangay);
          if (assignedBarangayId) {
            setSelectedBarangayId(assignedBarangayId);
          }
        } else {
          // If no barangay assigned, show error or empty state
          setAuthError('No barangay assigned. Please contact your head nurse.');
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
      // Always filter by assigned barangay for health workers
      const params = new URLSearchParams({
        status,
        search: searchTerm,
      });

      // For Health Workers, filter primarily by their assigned barangay name.
      // The API uses a case-insensitive match so 'MAGANG' and 'Magang' both work.
      if (selectedBarangay) {
        params.set("barangay", selectedBarangay);
      }
      
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
      // Fetch pending count - always filter by assigned barangay
      const pendingParams = new URLSearchParams({
        status: "pending",
        search: searchTerm,
      });
      if (selectedBarangay) {
        pendingParams.set("barangay", selectedBarangay);
      }
      const pendingResponse = await fetch(`/api/residents?${pendingParams}`);
      const pendingData = await pendingResponse.json();
      
      // Fetch approved count - always filter by assigned barangay
      const approvedParams = new URLSearchParams({
        status: "approved",
        search: searchTerm,
      });
      if (selectedBarangay) {
        approvedParams.set("barangay", selectedBarangay);
      }
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
          barangay_id: selectedBarangayId || null,
          submitted_by: userProfile.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Resident created successfully");
        setIsAddDialogOpen(false);
        setFormData({
          name: "",
          birthday: "",
          sex: "",
          address: "",
          vaccine_status: "not_vaccinated",
          contact: "",
          barangay: "",
          vaccines_given: [],
          missed_schedule_of_vaccine: []
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
    e.preventDefault(); // fixed bug
    try {
      const response = await fetch("/api/residents", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id: selectedResident.id, 
          ...formData,
          barangay_id: selectedBarangayId || null
        }),
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
      vaccines_given: resident.vaccines_given || [],
      missed_schedule_of_vaccine: resident.missed_schedule_of_vaccine || []
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

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (!isAuthLoading && userProfile && selectedBarangay) {
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
          subtitle={`Assigned Barangay: ${selectedBarangay || "Not Assigned"}`} 
        />

        <main className="p-2 md:p-3 lg:p-4 flex-1 overflow-auto w-full">
          {/* User Info Display */}
          {userProfile && (
            <div className="mb-2 p-1 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <span className="font-semibold">Logged in as:</span> {userProfile.first_name} {userProfile.last_name} ({userProfile.user_role})
              </p>
            </div>
          )}

          {/* Auth Error Display */}
          {authError && (
            <div className="mb-2 p-1 bg-red-50 border border-red-200 rounded-lg">
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
                  // Reset form data when opening add dialog, auto-set barangay to assigned
                  setFormData({
                    name: "",
                    birthday: "",
                    sex: "",
                    address: "",
                    vaccine_status: "not_vaccinated",
                    contact: "",
                    barangay: selectedBarangay || "",
                    vaccines_given: [],
                    missed_schedule_of_vaccine: []
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resident
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <Select 
                        value={formData.barangay || selectedBarangay} 
                        onValueChange={(value) => setFormData({...formData, barangay: value})}
                        disabled={!!selectedBarangay}
                      >
                        <SelectTrigger className={selectedBarangay ? "bg-gray-100 cursor-not-allowed" : ""}>
                          <SelectValue placeholder="Select barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedBarangay ? (
                            <SelectItem value={selectedBarangay}>{selectedBarangay}</SelectItem>
                          ) : (
                            BARANGAYS.map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedBarangay && (
                        <p className="text-xs text-gray-500 mt-1">Barangay is locked to your assignment: {selectedBarangay}</p>
                      )}
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
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="vaccine-other"
                              checked={formData.vaccines_given.includes("other")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    vaccines_given: [...formData.vaccines_given, "other"]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    vaccines_given: formData.vaccines_given.filter(v => v !== "other")
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor="vaccine-other"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Other
                            </Label>
                          </div>
                        </div>
                        {formData.vaccines_given.includes("other") && (
                          <Input
                            type="text"
                            placeholder="Specify other"
                            className="mt-3"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const otherVaccine = e.target.value;
                                if (otherVaccine.trim()) {
                                  setFormData({
                                    ...formData,
                                    vaccines_given: formData.vaccines_given.map(v => v === "other" ? otherVaccine : v)
                                  });
                                  e.target.value = "";
                                }
                              }
                            }}
                          />
                        )}
                        {formData.vaccines_given.length > 0 && (
                          <p className="text-xs text-gray-500 mt-3">
                            Selected: {formData.vaccines_given.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Missed Schedule of Vaccine</Label>
                      <div className="mt-2 p-4 border rounded-md max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {VACCINE_TYPES.map((vaccine) => (
                            <div key={vaccine} className="flex items-center space-x-2">
                              <Checkbox
                                id={`missed-vaccine-${vaccine}`}
                                checked={formData.missed_schedule_of_vaccine.includes(vaccine)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      missed_schedule_of_vaccine: [...formData.missed_schedule_of_vaccine, vaccine]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      missed_schedule_of_vaccine: formData.missed_schedule_of_vaccine.filter(v => v !== vaccine)
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`missed-vaccine-${vaccine}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {vaccine.toUpperCase()}
                              </Label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="missed-vaccine-other"
                              checked={formData.missed_schedule_of_vaccine.includes("other")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    missed_schedule_of_vaccine: [...formData.missed_schedule_of_vaccine, "other"]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    missed_schedule_of_vaccine: formData.missed_schedule_of_vaccine.filter(v => v !== "other")
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor="missed-vaccine-other"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Other
                            </Label>
                          </div>
                        </div>
                        {formData.missed_schedule_of_vaccine.includes("other") && (
                          <Input
                            type="text"
                            placeholder="Specify other"
                            className="mt-3"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const otherVaccine = e.target.value;
                                if (otherVaccine.trim()) {
                                  setFormData({
                                    ...formData,
                                    missed_schedule_of_vaccine: formData.missed_schedule_of_vaccine.map(v => v === "other" ? otherVaccine : v)
                                  });
                                  e.target.value = "";
                                }
                              }
                            }}
                          />
                        )}
                        {formData.missed_schedule_of_vaccine.length > 0 && (
                          <p className="text-xs text-gray-500 mt-3">
                            Selected: {formData.missed_schedule_of_vaccine.join(", ")}
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

          {/* Search */}
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
            {/* Display assigned barangay (read-only) */}
            {selectedBarangay && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Assigned Barangay: <span className="font-semibold">{selectedBarangay}</span>
                </span>
              </div>
            )}
          </div>

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
              showApproveButton={false}
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
                  <Select 
                    value={formData.barangay || selectedBarangay} 
                    onValueChange={(value) => setFormData({...formData, barangay: value})}
                    disabled={!!selectedBarangay}
                  >
                    <SelectTrigger className={selectedBarangay ? "bg-gray-100 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Select barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBarangay ? (
                        <SelectItem value={selectedBarangay}>{selectedBarangay}</SelectItem>
                      ) : (
                        BARANGAYS.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedBarangay && (
                    <p className="text-xs text-gray-500 mt-1">Barangay is locked to your assignment: {selectedBarangay}</p>
                  )}
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

                <div>
                  <Label>Missed Schedule of Vaccine</Label>
                  <div className="mt-2 p-4 border rounded-md max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {VACCINE_TYPES.map((vaccine) => (
                        <div key={vaccine} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-missed-vaccine-${vaccine}`}
                            checked={formData.missed_schedule_of_vaccine.includes(vaccine)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  missed_schedule_of_vaccine: [...formData.missed_schedule_of_vaccine, vaccine]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  missed_schedule_of_vaccine: formData.missed_schedule_of_vaccine.filter(v => v !== vaccine)
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-missed-vaccine-${vaccine}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {vaccine.toUpperCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.missed_schedule_of_vaccine.length > 0 && (
                      <p className="text-xs text-gray-500 mt-3">
                        Selected: {formData.missed_schedule_of_vaccine.join(", ")}
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
            selectedBarangay={selectedBarangay || ""}
          />
          
        </main>
      </div>
    </div>
  );
}