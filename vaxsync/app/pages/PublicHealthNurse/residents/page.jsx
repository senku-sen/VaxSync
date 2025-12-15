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
  X,
  Trash2,
  User,
  Syringe,
  MapPin,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { BARANGAYS } from "@/lib/utils";
import { loadUserProfile } from "@/lib/VaccineRequest";
import PendingResidentsTable from "../../../../components/PendingResidentsTable";
import ApprovedResidentsTable from "../../../../components/ApprovedResidentsTable";
import ResidentsTableView from "../../../../components/ResidentsTableView";
import UploadMasterListModal from "../../../../components/UploadMasterListModal";
import ResidentDetailsModal from "../../../../components/ResidentDetailsModal";
import AddResidentWizard from "../../../../components/AddResidentWizard/AddResidentWizard";
import Pagination from "../../../../components/shared/Pagination";
import { useOfflineResidents } from "@/hooks/UseOfflineResidents";
import { useOffline } from "@/components/OfflineProvider";
import { supabase } from "@/lib/supabase";

export default function ResidentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    birthday: "",
    sex: "",
    vaccine_status: "not_vaccinated",
    administered_date: "",
    barangay: "",
    mother: "", // Mother's name field
    vaccines_given: [],
    missed_schedule_of_vaccine: []
  });
  
  // Use offline hooks for residents data
  const { isOnline } = useOffline();
  const {
    residents,
    loading,
    error: residentsError,
    isFromCache,
    createResident,
    updateResident,
    deleteResident,
    changeResidentStatus,
    refresh: refreshResidents
  } = useOfflineResidents({
    status: "",
    search: searchTerm,
    barangay: selectedBarangay === "all" ? "" : selectedBarangay
  });
  
  // Batch selection state
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  // Batch selection state for approved residents
  const [selectedApprovedResidents, setSelectedApprovedResidents] = useState(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Details modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsResident, setDetailsResident] = useState(null);

  // Vaccine form state for edit modal
  const [newVaccine, setNewVaccine] = useState("");
  const [newVaccineDate, setNewVaccineDate] = useState("");
  const [vaccineType, setVaccineType] = useState("given");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Fetch barangays from database
  const fetchBarangaysFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from("Barangays")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error('Error fetching barangays:', error);
        return [];
      }

      // Normalize barangay names: deduplicate and convert to uppercase
      const barangayMap = new Map();
      (data || []).forEach(barangay => {
        const normalizedName = barangay.name.toUpperCase().trim();
        if (!barangayMap.has(normalizedName)) {
          barangayMap.set(normalizedName, normalizedName);
        }
      });

      // Convert to array and sort alphabetically
      return Array.from(barangayMap.values()).sort();
    } catch (err) {
      console.error('Error fetching barangays:', err);
      return [];
    }
  };

  // Initialize data with auth check
  const initializeData = async () => {
    try {
      setIsAuthLoading(true);
      
      // Fetch barangays from database
      const barangays = await fetchBarangaysFromDB();
      setBarangayOptions(barangays);
      
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

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return "";
    try {
      const birthDate = new Date(birthday);
      if (isNaN(birthDate.getTime())) return "";
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch (err) {
      return "";
    }
  };

  // Export currently visible residents to CSV (works offline using cached data)
  const handleExport = () => {
    try {
      if (!residents || residents.length === 0) {
        toast.info("No data to export for current view");
        return;
      }

      // Show notification if exporting from cache (offline mode)
      if (isFromCache) {
        toast.info("Exporting from cached data (offline mode)");
      }

      const escapeCell = (value) => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
        return str;
      };

      const headers = [
        "Name",
        "Sex",
        "Birthday",
        "Barangay",
        "Defaulters",
        "Date of Vaccine",
        "Vaccines Given",
        "Submitted"
      ];

      const rows = residents.map((r) => [
        r.name,
        r.sex || "",
        r.birthday ? new Date(r.birthday).toLocaleDateString() : "",
        r.barangay || "",
        Array.isArray(r.missed_schedule_of_vaccine) ? r.missed_schedule_of_vaccine.join(", ") : "",
        r.administered_date ? new Date(r.administered_date).toLocaleDateString() : "",
        Array.isArray(r.vaccines_given) ? r.vaccines_given.join(", ") : "",
        r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : ""
      ]);

      // Helper function to count defaulters by month
      const getDefaultersByMonth = (residentsArray) => {
        const monthlyDefaulters = {};
        residentsArray.forEach((r) => {
          if (Array.isArray(r.missed_schedule_of_vaccine) && r.missed_schedule_of_vaccine.length > 0) {
            const date = r.administered_date ? new Date(r.administered_date) : null;
            if (date) {
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              monthlyDefaulters[monthKey] = (monthlyDefaulters[monthKey] || 0) + r.missed_schedule_of_vaccine.length;
            }
          }
        });
        return monthlyDefaulters;
      };

      // If viewing all barangays, create multiple sheets with summary
      if (selectedBarangay === "all") {
        // Group residents by barangay
        const barangayGroups = {};
        residents.forEach((r) => {
          const barangay = r.barangay || "Unknown";
          if (!barangayGroups[barangay]) {
            barangayGroups[barangay] = [];
          }
          barangayGroups[barangay].push(r);
        });

        // Create summary sheet with defaulter counts
        const summaryHeaders = ["Barangay", "Total Defaulters"];
        const summaryRows = Object.entries(barangayGroups).map(([barangay, residents]) => {
          const totalDefaulters = residents.reduce((sum, r) => {
            return sum + (Array.isArray(r.missed_schedule_of_vaccine) ? r.missed_schedule_of_vaccine.length : 0);
          }, 0);
          return [barangay, totalDefaulters];
        });

        // Create monthly defaulters summary
        const monthlyDefaulters = getDefaultersByMonth(residents);
        const monthlyHeaders = ["Month", "Total Defaulters"];
        const monthlyRows = Object.entries(monthlyDefaulters)
          .sort()
          .map(([month, count]) => [month, count]);

        // Build CSV with summaries first, then each barangay section
        let csv = "SUMMARY - Total Defaulters by Barangay\n";
        csv += summaryHeaders.map(escapeCell).join(",") + "\n";
        csv += summaryRows.map((row) => row.map(escapeCell).join(",")).join("\n");
        csv += "\n\n";

        csv += "SUMMARY - Total Defaulters by Month\n";
        csv += monthlyHeaders.map(escapeCell).join(",") + "\n";
        csv += monthlyRows.map((row) => row.map(escapeCell).join(",")).join("\n");
        csv += "\n\n";

        // Add each barangay's data
        Object.entries(barangayGroups).forEach(([barangay, barangayResidents]) => {
          csv += `${barangay}\n`;
          csv += headers.map(escapeCell).join(",") + "\n";
          const barangayRows = barangayResidents.map((r) => [
            r.name,
            r.sex || "",
            r.birthday ? new Date(r.birthday).toLocaleDateString() : "",
            r.barangay || "",
            Array.isArray(r.missed_schedule_of_vaccine) ? r.missed_schedule_of_vaccine.join(", ") : "",
            r.administered_date ? new Date(r.administered_date).toLocaleDateString() : "",
            Array.isArray(r.vaccines_given) ? r.vaccines_given.join(", ") : "",
            r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : ""
          ]);
          csv += barangayRows.map((row) => row.map(escapeCell).join(",")).join("\n");
          csv += "\n\n";
        });

        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const filename = `masterlist.csv`;

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Single barangay export with monthly summary
        const monthlyDefaulters = getDefaultersByMonth(residents);
        const monthlyHeaders = ["Month", "Total Defaulters"];
        const monthlyRows = Object.entries(monthlyDefaulters)
          .sort()
          .map(([month, count]) => [month, count]);

        let csv = "SUMMARY - Total Defaulters by Month\n";
        csv += monthlyHeaders.map(escapeCell).join(",") + "\n";
        csv += monthlyRows.map((row) => row.map(escapeCell).join(",")).join("\n");
        csv += "\n\n";

        csv += headers.map(escapeCell).join(",") + "\n";
        csv += rows.map((row) => row.map(escapeCell).join(",")).join("\n");

        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const filename = `masterlist_${selectedBarangay}.csv`;

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success("Export started");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export data");
    }
  };

  // Fetch counts for both pending and approved residents
  const fetchCounts = async () => {
    try {
      if (isOnline) {
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
      } else {
        // When offline, use cached data to estimate counts
        // This is approximate but better than nothing
        const pendingResidents = residents.filter(r => r.status === 'pending' || !r.status);
        const approvedResidents = residents.filter(r => r.status === 'approved');
        setPendingCount(pendingResidents.length);
        setApprovedCount(approvedResidents.length);
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
      // Fallback to using current residents array
      const pendingResidents = residents.filter(r => r.status === 'pending' || !r.status);
      const approvedResidents = residents.filter(r => r.status === 'approved');
      setPendingCount(pendingResidents.length);
      setApprovedCount(approvedResidents.length);
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

    // Validate required fields
    if (!formData.name || !formData.birthday || !formData.sex || !formData.administered_date || !formData.barangay) {
      toast.error("Please fill in all required fields including Barangay");
      return;
    }
    
    try {
      const result = await createResident({
        ...formData,
        submitted_by: userProfile.id
      }, userProfile.id);

      if (result.success) {
        setIsAddDialogOpen(false);
        setFormData({
          name: "",
          birthday: "",
          sex: "",
          vaccine_status: "not_vaccinated",
          administered_date: "",
          barangay: "",
          mother: "",
          vaccines_given: [],
          missed_schedule_of_vaccine: []
        });
        // Refresh will happen automatically via the hook
        fetchCounts();
      } else {
        toast.error(result.error || "Failed to create resident");
      }
    } catch (error) {
      console.error("Error creating resident:", error);
      toast.error("Error creating resident");
    }
  };

  // Update resident
  const handleUpdateResident = async (e) => {
    e.preventDefault();
    if (!selectedResident) return;
    
    try {
      const result = await updateResident(selectedResident.id, formData);

      if (result.success) {
        setIsEditDialogOpen(false);
        setSelectedResident(null);
        refreshResidents();
      } else {
        toast.error(result.error || "Failed to update resident");
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
      const result = await deleteResident(id);

      if (result.success) {
        refreshResidents();
      } else {
        toast.error(result.error || "Failed to delete resident");
      }
    } catch (error) {
      console.error("Error deleting resident:", error);
      toast.error("Error deleting resident");
    }
  };

  // Open edit dialog
  const openEditDialog = (resident) => {
    setSelectedResident(resident);
    setFormData({
      name: resident.name || "",
      birthday: resident.birthday || "",
      sex: resident.sex || "",
      vaccine_status: resident.vaccine_status || "not_vaccinated",
      administered_date: resident.administered_date || "",
      barangay: resident.barangay || "",
      mother: resident.mother || "",
      vaccines_given: resident.vaccines_given || [],
      missed_schedule_of_vaccine: resident.missed_schedule_of_vaccine || []
    });
    setNewVaccine("");
    setNewVaccineDate("");
    setVaccineType("given");
    setIsEditDialogOpen(true);
  };

  // Handle adding vaccine
  const handleAddVaccine = () => {
    if (!newVaccine || !newVaccineDate) {
      toast.error("Please fill in vaccine name and date");
      return;
    }

    const vaccineEntry = {
      name: newVaccine,
      date: newVaccineDate
    };

    if (vaccineType === "given") {
      setFormData({
        ...formData,
        vaccines_given: [...formData.vaccines_given, vaccineEntry]
      });
    } else {
      setFormData({
        ...formData,
        missed_schedule_of_vaccine: [...formData.missed_schedule_of_vaccine, vaccineEntry]
      });
    }

    setNewVaccine("");
    setNewVaccineDate("");
    setVaccineType("given");
    toast.success("Vaccine added successfully");
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

  // Toggle approved resident selection
  const toggleApprovedResidentSelection = (residentId) => {
    const newSelected = new Set(selectedApprovedResidents);
    if (newSelected.has(residentId)) {
      newSelected.delete(residentId);
    } else {
      newSelected.add(residentId);
    }
    setSelectedApprovedResidents(newSelected);
  };

  // Select all approved residents
  const selectAllApprovedResidents = () => {
    if (residents.length === 0) return;
    const allIds = new Set(residents.map(r => r.id));
    setSelectedApprovedResidents(allIds);
  };

  // Deselect all approved residents
  const deselectAllApprovedResidents = () => {
    setSelectedApprovedResidents(new Set());
  };

  // Handle select all toggle for approved residents
  const handleApprovedSelectAll = () => {
    if (selectedApprovedResidents.size === residents.length) {
      deselectAllApprovedResidents();
    } else {
      selectAllApprovedResidents();
    }
  };

  // Batch delete approved residents
  const handleBatchDeleteApproved = async () => {
    if (selectedApprovedResidents.size === 0) {
      toast.error("Please select residents to delete");
      return;
    }

    if (!confirm(`Delete ${selectedApprovedResidents.size} resident(s)? This action cannot be undone.`)) return;

    setIsBatchProcessing(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const residentId of selectedApprovedResidents) {
        try {
          const result = await deleteResident(residentId);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} resident(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} resident(s)`);
      }

      setSelectedApprovedResidents(new Set());
      fetchCounts();
    } finally {
      setIsBatchProcessing(false);
    }
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
          const result = await changeResidentStatus(residentId, "approve");
          if (result.success) {
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
      refreshResidents();
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
          const result = await changeResidentStatus(residentId, "reject");
          if (result.success) {
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
      refreshResidents();
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch delete pending residents
  const handleBatchDeletePending = async () => {
    if (selectedResidents.size === 0) {
      toast.error("Please select residents to delete");
      return;
    }

    if (!confirm(`Delete ${selectedResidents.size} pending resident(s)? This action cannot be undone.`)) return;

    setIsBatchProcessing(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const residentId of selectedResidents) {
        try {
          const result = await deleteResident(residentId);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} resident(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} resident(s)`);
      }

      setSelectedResidents(new Set());
      fetchCounts();
    } finally {
      setIsBatchProcessing(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    // Refresh residents when filters change
    if (!isAuthLoading && userProfile) {
      refreshResidents();
    }
  }, [searchTerm, selectedBarangay, isAuthLoading, userProfile])

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-72">
        <Header 
          title="Resident Information Management" 
          subtitle={`Assigned Barangay: ${selectedBarangay === "all" ? "All Barangays" : selectedBarangay}`} 
        />

        <main className="p-2 md:p-3 lg:p-4 flex-1 overflow-auto">
          {/* Offline Cache Indicator */}
          {isFromCache && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                <span className="font-semibold">Offline Mode:</span> Showing cached data. Changes will sync when online.
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
              <Button 
                variant="outline"
                onClick={() => setIsAddWizardOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Resident
              </Button>
              
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or barangay..."
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
                {barangayOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Batch Selection Controls */}
          {residents.length > 0 && (
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
                  onClick={handleBatchDeletePending}
                  disabled={selectedResidents.size === 0 || isBatchProcessing}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedResidents.size})
                </Button>
              </div>
            </div>
          )}

          {/* Residents Card View with Pagination */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            {(() => {
              // Calculate pagination
              const totalRecords = residents.length;
              const totalPages = Math.ceil(totalRecords / rowsPerPage);
              const startIndex = (currentPage - 1) * rowsPerPage;
              const endIndex = startIndex + rowsPerPage;
              const paginatedResidents = residents.slice(startIndex, endIndex);

              return (
                <>
                  <div className="flex-1 overflow-x-auto">
                    <ResidentsTableView
                      residents={paginatedResidents}
                      loading={loading}
                      selectedBarangay={selectedBarangay}
                      openEditDialog={openEditDialog}
                      handleDeleteResident={handleDeleteResident}
                      formatDate={formatDate}
                      onViewDetails={(resident) => {
                        setDetailsResident(resident);
                        setIsDetailsModalOpen(true);
                      }}
                      showSelection={true}
                      selectedResidents={selectedResidents}
                      onToggleSelection={toggleResidentSelection}
                      onSelectAll={selectAllResidents}
                    />
                  </div>

                  {/* Pagination Control */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(page) => {
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    onRowsPerPageChange={(newRowsPerPage) => {
                      setRowsPerPage(newRowsPerPage);
                      setCurrentPage(1); // Reset to first page
                    }}
                    isLoading={loading}
                  />
                </>
              );
            })()}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="bg-gradient-to-r from-[#4A7C59] to-[#3E6B4D] -mx-6 -mt-6 px-6 py-4 text-white rounded-t-lg">
                <DialogTitle className="text-xl font-bold text-white">Edit Resident Information</DialogTitle>
                <p className="text-sm text-green-100 mt-1">{selectedResident?.name || "Resident"}</p>
              </DialogHeader>
              <form onSubmit={handleUpdateResident} className="space-y-6 pt-4">
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
                    <Select value={formData.sex || ""} onValueChange={(value) => setFormData({...formData, sex: value})}>
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
                  <Label htmlFor="edit-administered_date">Vaccination Date *</Label>
                  <Input
                    id="edit-administered_date"
                    type="date"
                    value={formData.administered_date}
                    onChange={(e) => setFormData({...formData, administered_date: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-vaccine_status">Vaccine Status</Label>
                  <Select value={formData.vaccine_status || "not_vaccinated"} onValueChange={(value) => setFormData({...formData, vaccine_status: value})}>
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
                  <Select value={formData.barangay || ""} onValueChange={(value) => setFormData({...formData, barangay: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      {barangayOptions.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-mother">Mother's Name</Label>
                  <Input
                    id="edit-mother"
                    placeholder="Enter mother's name"
                    value={formData.mother || ""}
                    onChange={(e) => setFormData({...formData, mother: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    Vaccines Given
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Vaccines administered to this resident</p>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    {formData.vaccines_given.length > 0 ? (
                      <div className="space-y-2">
                        {formData.vaccines_given.map((vaccine, index) => {
                          const isObject = typeof vaccine === 'object' && vaccine !== null;
                          const vaccineName = isObject ? vaccine.name : vaccine;
                          const vaccineDate = isObject ? vaccine.date : '';
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-green-200 rounded">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={18} className="text-green-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{vaccineName.toUpperCase()}</p>
                                  {vaccineDate && <p className="text-sm text-gray-600">{new Date(vaccineDate).toLocaleDateString()}</p>}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  vaccines_given: formData.vaccines_given.filter((_, i) => i !== index)
                                })}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No vaccines added yet</p>
                    )}
                  </div>

                  {/* Add Vaccine Form */}
                  <div className="mt-4 p-4 bg-white border border-green-200 rounded-lg space-y-3">
                    <h4 className="font-semibold text-gray-900">Add Vaccine</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="vaccine-name" className="text-sm">Vaccine Name *</Label>
                        <Input
                          id="vaccine-name"
                          placeholder="Enter vaccine name"
                          value={vaccineType === "given" ? newVaccine : ""}
                          onChange={(e) => {
                            setVaccineType("given");
                            setNewVaccine(e.target.value);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vaccine-date" className="text-sm">Date *</Label>
                        <Input
                          id="vaccine-date"
                          type="date"
                          value={vaccineType === "given" ? newVaccineDate : ""}
                          onChange={(e) => {
                            setVaccineType("given");
                            setNewVaccineDate(e.target.value);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={() => {
                            setVaccineType("given");
                            handleAddVaccine();
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-orange-600" />
                    Missed Schedule of Vaccine
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Vaccines missed during scheduled vaccination dates</p>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    {formData.missed_schedule_of_vaccine.length > 0 ? (
                      <div className="space-y-2">
                        {formData.missed_schedule_of_vaccine.map((item, index) => {
                          const isObject = typeof item === 'object' && item !== null;
                          const vaccineName = isObject ? item.name : 'Unknown Vaccine';
                          const vaccineDate = isObject ? item.date : item;
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded">
                              <div className="flex items-center gap-3">
                                <AlertCircle size={18} className="text-orange-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{vaccineName.toUpperCase()}</p>
                                  <p className="text-sm text-gray-600">{new Date(vaccineDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  missed_schedule_of_vaccine: formData.missed_schedule_of_vaccine.filter((_, i) => i !== index)
                                })}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No missed vaccines recorded</p>
                    )}
                  </div>

                  {/* Add Missed Vaccine Form */}
                  <div className="mt-4 p-4 bg-white border border-orange-200 rounded-lg space-y-3">
                    <h4 className="font-semibold text-gray-900">Add Missed Vaccine</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="missed-vaccine-name" className="text-sm">Vaccine Name *</Label>
                        <Input
                          id="missed-vaccine-name"
                          placeholder="Enter vaccine name"
                          value={vaccineType === "missed" ? newVaccine : ""}
                          onChange={(e) => {
                            setVaccineType("missed");
                            setNewVaccine(e.target.value);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="missed-vaccine-date" className="text-sm">Date *</Label>
                        <Input
                          id="missed-vaccine-date"
                          type="date"
                          value={vaccineType === "missed" ? newVaccineDate : ""}
                          onChange={(e) => {
                            setVaccineType("missed");
                            setNewVaccineDate(e.target.value);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={() => {
                            setVaccineType("missed");
                            handleAddVaccine();
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#4A7C59] hover:bg-[#3E6B4D] text-white">
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
              refreshResidents();
              fetchCounts();
            }}
            userProfile={userProfile}
            selectedBarangay={selectedBarangay === "all" ? "" : selectedBarangay}
          />

          {/* Resident Details Modal */}
          <ResidentDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setDetailsResident(null);
            }}
            resident={detailsResident}
          />

          {/* Add Resident Wizard */}
          <AddResidentWizard
            isOpen={isAddWizardOpen}
            onClose={() => setIsAddWizardOpen(false)}
            selectedBarangay={selectedBarangay === "all" ? "" : selectedBarangay}
            userId={userProfile?.id}
            onSuccess={() => {
              refreshResidents();
              fetchCounts();
            }}
          />
          
        </main>
      </div>
    </div>
  );
}