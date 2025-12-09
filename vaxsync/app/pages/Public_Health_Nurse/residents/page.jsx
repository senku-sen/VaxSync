"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  MapPin,
  User,
  Syringe,
  AlertCircle,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { BARANGAYS } from "@/lib/utils";
import { loadUserProfile } from "@/lib/vaccineRequest";
import { supabase } from "@/lib/supabase";
import PendingResidentsTable from "../../../../components/PendingResidentsTable";
import ApprovedResidentsTable from "../../../../components/ApprovedResidentsTable";
import UploadMasterListModal from "../../../../components/UploadMasterListModal";
import ResidentDetailsModal from "../../../../components/ResidentDetailsModal";
import AddResidentWizard from "../../../../components/add-resident-wizard/AddResidentWizard";
import Pagination from "../../../../components/shared/Pagination";
import { useOffline } from "@/components/OfflineProvider";
import { cacheData, getCachedData, generateTempId } from "@/lib/offlineStorage";
import { queueOperation } from "@/lib/syncManager";

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedBarangayId, setSelectedBarangayId] = useState(null);
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Details modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsResident, setDetailsResident] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Batch selection state for pending residents
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  // Batch selection state for approved residents
  const [selectedApprovedResidents, setSelectedApprovedResidents] = useState(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Add vaccine state
  const [newVaccine, setNewVaccine] = useState("");
  const [newVaccineDate, setNewVaccineDate] = useState("");
  const [vaccineType, setVaccineType] = useState("given"); // "given" or "missed"

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

  // Get offline status
  const { isOnline, showNotification } = useOffline();

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
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `${activeTab === "pending" ? "Pending" : "Approved"}_Residents_${timestamp}${isFromCache ? "_OFFLINE" : ""}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${residents.length} resident(s)${isFromCache ? " (from cache)" : ""}`);
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export data");
    }
  };

  // Fetch residents from API with offline support
  const fetchResidents = async (status = "pending") => {
    const cacheKey = `hw_residents_${status}_${selectedBarangay || 'all'}`;
    
    try {
      setLoading(true);
      // Always filter by assigned barangay for health workers
      const params = new URLSearchParams({
        status,
        search: searchTerm,
      });

      // For Health Workers, filter primarily by their assigned barangay name.
      if (selectedBarangay) {
        params.set("barangay", selectedBarangay);
      }

      if (isOnline) {
        const response = await fetch(`/api/residents?${params}`);
        const data = await response.json();
        
        if (response.ok) {
          // Cache the data
          await cacheData(cacheKey, data.residents || [], 'residents');
          setResidents(data.residents || []);
          setIsFromCache(false);
        } else {
          throw new Error("Failed to fetch residents");
        }
      } else {
        // Offline - try cache
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setResidents(cached);
          setIsFromCache(true);
        } else {
          toast.info("No cached data available while offline");
          setResidents([]);
        }
      }
    } catch (error) {
      console.error("Error fetching residents:", error);
      // Try cache on error
      const cacheKey = `hw_residents_${status}_${selectedBarangay || 'all'}`;
      const cached = await getCachedData(cacheKey);
      if (cached) {
        setResidents(cached);
        setIsFromCache(true);
      } else {
        toast.error("Error fetching residents");
      }
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
    };
  };

  // Create new resident
  const handleCreateResident = async (e) => {
    e.preventDefault();

    // Validate user profile is loaded
    if (!userProfile || !userProfile.id) {
      toast.error("User profile not loaded. Please refresh the page.");
      return;
    }

    // Validate health worker has an assigned barangay ID
    if (!selectedBarangayId) {
      console.error("Barangay ID missing:", selectedBarangayId);
      toast.error("Barangay is not assigned. Please contact your head nurse.");
      return;
    }

    // Validate required fields for new schema
    if (!formData.name || !formData.birthday || !formData.sex || !formData.administered_date || !formData.barangay) {
      toast.error("Please fill in all required fields including Barangay");
      return;
    }
    
    const payload = {
      ...formData,
      barangay_id: selectedBarangayId,
      submitted_by: userProfile.id
    };

    console.log("Sending payload:", payload);

    if (isOnline) {
      try {
        const response = await fetch("/api/residents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log("API Response Status:", response.status);
        console.log("API Response Data:", data);

        if (response.ok) {
          toast.success("Resident created successfully");
          setIsAddDialogOpen(false);
          setFormData({
            name: "",
            birthday: "",
            sex: "",
            vaccine_status: "not_vaccinated",
            administered_date: "",
            barangay: "",
            vaccines_given: [],
            missed_schedule_of_vaccine: [],
          });
          // Add delay to allow Supabase to sync before fetching
          setTimeout(() => {
            fetchResidents(activeTab);
            fetchCounts();
          }, 500);
        } else {
          console.error("API Error Status:", response.status);
          console.error("API Error Data:", data);
          toast.error(data.error || "Failed to create resident");
        }
      } catch (error) {
        console.error("Error creating resident:", error);
        toast.error("Error creating resident: " + error.message);
      }
    } else {
      // Offline - queue for later sync
      try {
        const tempId = generateTempId();
        const cacheKey = `hw_residents_${activeTab}_${selectedBarangay || 'all'}`;

        await queueOperation({
          endpoint: '/api/residents',
          method: 'POST',
          body: payload,
          type: 'create',
          description: `Create resident: ${formData.name}`,
          cacheKey,
          tempId
        });

        // Optimistic update
        setResidents(prev => [...prev, { ...payload, id: tempId, _pending: true }]);

        toast.success("Resident saved locally. Will sync when online.");
        setIsAddDialogOpen(false);
        setFormData({
          name: "",
          birthday: "",
          sex: "",
          vaccine_status: "not_vaccinated",
          administered_date: "",
          barangay: "",
          vaccines_given: [],
          missed_schedule_of_vaccine: [],
        });
      } catch (error) {
        console.error("Error saving offline:", error);
        toast.error("Error saving resident offline");
      }
    }
  };

  // Update resident
  const handleUpdateResident = async (e) => {
    e.preventDefault();
    if (!selectedResident) return;

    const payload = { 
      id: selectedResident.id, 
      ...formData,
      barangay_id: selectedBarangayId || null
    };

    // Optimistic update
    const originalResidents = [...residents];
    setResidents(prev => prev.map(r => 
      r.id === selectedResident.id ? { ...r, ...formData, _pending: true } : r
    ));

    if (isOnline) {
      try {
        const response = await fetch("/api/residents", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Resident updated successfully");
          setIsEditDialogOpen(false);
          setSelectedResident(null);
          fetchResidents(activeTab);
          fetchCounts();
        } else {
          // Revert optimistic update
          setResidents(originalResidents);
          toast.error(data.error || "Failed to update resident");
        }
      } catch (error) {
        // Revert optimistic update
        setResidents(originalResidents);
        console.error("Error updating resident:", error);
        toast.error("Error updating resident");
      }
    } else {
      // Offline - queue for later sync
      const cacheKey = `hw_residents_${activeTab}_${selectedBarangay || 'all'}`;

      await queueOperation({
        endpoint: '/api/residents',
        method: 'PUT',
        body: payload,
        type: 'update',
        description: `Update resident ID: ${selectedResident.id}`,
        cacheKey
      });

      toast.success("Changes saved locally. Will sync when online.");
      setIsEditDialogOpen(false);
      setSelectedResident(null);
    }
  };

  // Delete resident
  const handleDeleteResident = async (id) => {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    
    const originalResidents = [...residents];
    
    // Optimistic update
    setResidents(prev => prev.filter(r => r.id !== id));

    if (isOnline) {
      try {
        const response = await fetch(`/api/residents?id=${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Resident deleted successfully");
          fetchCounts();
        } else {
          // Revert optimistic update
          setResidents(originalResidents);
          toast.error(data.error || "Failed to delete resident");
        }
      } catch (error) {
        // Revert optimistic update
        setResidents(originalResidents);
        console.error("Error deleting resident:", error);
        toast.error("Error deleting resident");
      }
    } else {
      // Offline - queue for later sync
      const cacheKey = `hw_residents_${activeTab}_${selectedBarangay || 'all'}`;

      await queueOperation({
        endpoint: '/api/residents',
        method: 'DELETE',
        params: { id },
        type: 'delete',
        description: `Delete resident ID: ${id}`,
        cacheKey
      });

      toast.success("Delete queued. Will sync when online.");
    }
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
          const response = await fetch(`/api/residents?id=${residentId}`, {
            method: "DELETE",
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
        toast.success(`Deleted ${successCount} resident(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} resident(s)`);
      }

      setSelectedApprovedResidents(new Set());
      fetchCounts();
      fetchResidents(activeTab);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch delete residents
  const handleBatchDelete = async () => {
    if (selectedResidents.size === 0) {
      toast.error("Please select residents to delete");
      return;
    }

    if (!confirm(`Delete ${selectedResidents.size} resident(s)?`)) return;

    setIsBatchProcessing(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const residentId of selectedResidents) {
        try {
          const response = await fetch(`/api/residents?id=${residentId}`, {
            method: "DELETE",
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
        toast.success(`Deleted ${successCount} resident(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} resident(s)`);
      }

      setSelectedResidents(new Set());
      fetchCounts();
      fetchResidents(activeTab);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Approve/Reject resident
  const handleStatusChange = async (id, action) => {
    const originalResidents = [...residents];
    
    // Optimistic update - remove from current list
    setResidents(prev => prev.filter(r => r.id !== id));

    if (isOnline) {
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
          fetchCounts();
        } else {
          // Revert
          setResidents(originalResidents);
          toast.error(data.error || `Failed to ${action} resident`);
        }
      } catch (error) {
        // Revert
        setResidents(originalResidents);
        console.error(`Error ${action}ing resident:`, error);
        toast.error(`Error ${action}ing resident`);
      }
    } else {
      // Offline - queue for later sync
      const cacheKey = `hw_residents_${activeTab}_${selectedBarangay || 'all'}`;

      await queueOperation({
        endpoint: '/api/residents',
        method: 'PATCH',
        body: { id, action },
        type: 'status_change',
        description: `${action} resident ID: ${id}`,
        cacheKey
      });

      toast.success(`${action} queued. Will sync when online.`);
    }
  };

  // Add vaccine to resident
  const handleAddVaccine = async () => {
    if (!newVaccine.trim() || !newVaccineDate) {
      toast.error("Please enter vaccine name and date");
      return;
    }

    try {
      // Add to session beneficiaries for custom vaccines
      if (selectedResident?.id) {
        const beneficiaryRecord = {
          session_id: null,
          resident_id: selectedResident.id,
          vaccine_name: newVaccine.trim(),
          attended: vaccineType === "given" ? true : false,
          vaccinated: vaccineType === "given" ? true : false,
        };

        const response = await fetch("/api/session-beneficiaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(beneficiaryRecord),
        });

        if (!response.ok) {
          throw new Error("Failed to add vaccine");
        }

        // Also update local formData
        if (vaccineType === "given") {
          setFormData({
            ...formData,
            vaccines_given: [...formData.vaccines_given, newVaccine.trim()]
          });
        } else {
          // Store both vaccine name and date for missed vaccines
          setFormData({
            ...formData,
            missed_schedule_of_vaccine: [...formData.missed_schedule_of_vaccine, { name: newVaccine.trim(), date: newVaccineDate }]
          });
        }

        toast.success(`Vaccine added to session beneficiaries`);
        setNewVaccine("");
        setNewVaccineDate("");
      }
    } catch (error) {
      console.error("Error adding vaccine:", error);
      toast.error("Failed to add vaccine");
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
      vaccines_given: resident.vaccines_given || [],
      missed_schedule_of_vaccine: resident.missed_schedule_of_vaccine || []
    });
    setIsEditDialogOpen(true);
    // Reset vaccine add form
    setNewVaccine("");
    setNewVaccineDate("");
    setVaccineType("given");
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

      <div className="flex-1 flex flex-col w-full lg:ml-72">
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

          {/* Offline Cache Indicator */}
          {isFromCache && (
            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                <span className="font-semibold">Offline Mode:</span> Showing cached data. Changes will sync when online.
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

          {/* Batch Selection Controls - Pending Tab */}
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
                  onClick={handleBatchDelete}
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

          {/* Batch Selection Controls - Approved Tab */}
          {activeTab === "approved" && residents.length > 0 && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedApprovedResidents.size} of {residents.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllApprovedResidents}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllApprovedResidents}
                  className="text-xs"
                  disabled={selectedApprovedResidents.size === 0}
                >
                  Clear
                </Button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleBatchDeleteApproved}
                  disabled={selectedApprovedResidents.size === 0 || isBatchProcessing}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedApprovedResidents.size})
                </Button>
              </div>
            </div>
          )}

          {/* Residents Table with Pagination */}
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
                    {activeTab === "pending" ? (
                      <PendingResidentsTable
                        residents={paginatedResidents}
                        loading={loading}
                        selectedBarangay={selectedBarangay}
                        openEditDialog={openEditDialog}
                        handleStatusChange={handleStatusChange}
                        handleDeleteResident={handleDeleteResident}
                        getVaccineStatusBadge={getVaccineStatusBadge}
                        formatDate={formatDate}
                        showApproveButton={false}
                        selectedResidents={selectedResidents}
                        onToggleSelection={toggleResidentSelection}
                        onViewDetails={(resident) => {
                          setDetailsResident(resident);
                          setIsDetailsModalOpen(true);
                        }}
                      />
                    ) : (
                      <ApprovedResidentsTable
                        residents={paginatedResidents}
                        loading={loading}
                        selectedBarangay={selectedBarangay}
                        openEditDialog={openEditDialog}
                        handleDeleteResident={handleDeleteResident}
                        getVaccineStatusBadge={getVaccineStatusBadge}
                        formatDate={formatDate}
                        onViewDetails={(resident) => {
                          setDetailsResident(resident);
                          setIsDetailsModalOpen(true);
                        }}
                        showSelection={true}
                        selectedResidents={selectedApprovedResidents}
                        onToggleSelection={toggleApprovedResidentSelection}
                        onSelectAll={handleApprovedSelectAll}
                      />
                    )}
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
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input
                      id="edit-name"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="mt-1"
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
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-sex">Sex *</Label>
                      <Select value={formData.sex} onValueChange={(value) => setFormData({...formData, sex: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Vaccination Information Section */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Syringe size={20} className="text-blue-600" />
                    Vaccination Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="edit-administered_date">Vaccination Date *</Label>
                    <Input
                      id="edit-administered_date"
                      type="date"
                      value={formData.administered_date}
                      onChange={(e) => setFormData({...formData, administered_date: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-vaccine_status">Vaccine Status</Label>
                    <Select value={formData.vaccine_status} onValueChange={(value) => setFormData({...formData, vaccine_status: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select vaccine status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_vaccinated">Not Vaccinated</SelectItem>
                        <SelectItem value="partially_vaccinated">Partially Vaccinated</SelectItem>
                        <SelectItem value="fully_vaccinated">Fully Vaccinated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location Information Section */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin size={20} className="text-blue-600" />
                    Location Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="edit-barangay">Barangay</Label>
                    <Select 
                      value={formData.barangay || selectedBarangay} 
                      onValueChange={(value) => setFormData({...formData, barangay: value})}
                      disabled={!!selectedBarangay}
                    >
                      <SelectTrigger className={`mt-1 ${selectedBarangay ? "bg-gray-100 cursor-not-allowed" : ""}`}>
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
                      <p className="text-xs text-gray-500 mt-2">Barangay is locked to your assignment: {selectedBarangay}</p>
                    )}
                  </div>
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
                        {formData.vaccines_given.map((vaccine, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-green-200 rounded">
                            <div className="flex items-center gap-3">
                              <CheckCircle size={18} className="text-green-600" />
                              <span className="font-medium text-gray-900">{vaccine.toUpperCase()}</span>
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
                        ))}
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
                          value={newVaccine}
                          onChange={(e) => setNewVaccine(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vaccine-date" className="text-sm">Date *</Label>
                        <Input
                          id="vaccine-date"
                          type="date"
                          value={newVaccineDate}
                          onChange={(e) => setNewVaccineDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={handleAddVaccine}
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
                          // Handle both old format (date string) and new format (object with name and date)
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
              fetchResidents(activeTab);
              fetchCounts();
            }}
            userProfile={userProfile}
            selectedBarangay={selectedBarangay || ""}
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
            selectedBarangay={selectedBarangay}
            selectedBarangayId={selectedBarangayId}
            userId={userProfile?.id}
            onSuccess={() => {
              fetchResidents(activeTab);
              fetchCounts();
            }}
          />
          
        </main>
      </div>
    </div>
  );
}
