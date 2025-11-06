"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Plus, 
  Download, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { BARANGAYS } from "@/lib/utils";
import { loadUserProfile } from "@/lib/vaccineRequest";

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    address: "",
    vaccine_status: "not_vaccinated",
    contact: "",
    barangay: ""
  });

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
          barangay: ""
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
      age: resident.age || "",
      address: resident.address || "",
      vaccine_status: resident.vaccine_status || "not_vaccinated",
      contact: resident.contact || "",
      barangay: resident.barangay || ""
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

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto max-w-5xl mx-auto w-full">
          {/* User Info Display */}
          {userProfile && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Logged in as:</span> {userProfile.first_name} {userProfile.last_name} ({userProfile.user_role})
              </p>
            </div>
          )}

          {/* Auth Error Display */}
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
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
            <div className="flex flex-wrap gap-4 mb-6">
              <Button className="bg-[#3E5F44] hover:bg-[#3E5F44]/90 text-white">
                <Upload className="mr-2 h-4 w-4" />
                Upload Master List
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                        <Label htmlFor="age">Age *</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="Age"
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          required
                        />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

          {/* Residents Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "pending" ? "Pending Residents" : "Approved Residents"} - {selectedBarangay === "all" ? "All Barangays" : selectedBarangay}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Total pending residents: {residents.length}
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
                  <p>No {activeTab} residents found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Age</th>
                        <th className="text-left py-3 px-4 font-medium">Address</th>
                        <th className="text-left py-3 px-4 font-medium">Barangay</th>
                        <th className="text-left py-3 px-4 font-medium">Vaccine Status</th>
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
                          <td className="py-3 px-4">{resident.age}</td>
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
                              {activeTab === "pending" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(resident.id, "approve")}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
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
                      <Label htmlFor="edit-age">Age *</Label>
                      <Input
                        id="edit-age"
                        type="number"
                        placeholder="Age"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        required
                      />
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
          
        </main>
      </div>
    </div>
  );
}
