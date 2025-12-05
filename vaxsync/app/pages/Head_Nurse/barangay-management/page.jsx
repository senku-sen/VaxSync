"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Plus } from "lucide-react";
import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import BarangayCard from "@/components/barangay-management/BarangayCard";
import BarangayForm from "@/components/barangay-management/BarangayForm";
import DeleteConfirmDialog from "@/components/barangay-management/DeleteConfirmDialog";
import { fetchBarangays, insertBarangay, updateBarangay, deleteBarangay } from '@/lib/barangay';
import { loadUserProfile } from "@/lib/vaccineRequest";
import { useOffline } from "@/components/OfflineProvider";
import { queueOperation } from "@/lib/syncManager";
import { generateTempId } from "@/lib/offlineStorage";
import { toast } from "sonner";

// PAGE COMPONENT: Handles UI rendering and state management
export default function BarangayManagement({
  title = "Barangay Management",
  subtitle = "Register and manage barangays for health worker assignment",
}) {
  // ========== STATE MANAGEMENT ==========
  const [barangays, setBarangays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    municipality: "Daet",
    population: 0,
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const { isOnline, showNotification } = useOffline();

  // ========== FORM SUBMISSION HANDLER ==========
  // Handles both insert and update operations with offline support
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      ...formData,
      created_at: selectedBarangay?.created_at || new Date().toISOString(),
    };
    
    // Check if online
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine || isOnline) 
      : isOnline;

    if (editMode && selectedBarangay) {
      // Update operation
      if (actuallyOnline) {
        try {
          const result = await updateBarangay(selectedBarangay.id, payload);
          if (result.error) {
            setSuccessMessage(`Failed to update barangay: ${result.error.message || JSON.stringify(result.error)}`);
            toast.error("Failed to update barangay");
          } else {
            setBarangays(barangays.map((b) => (b.id === selectedBarangay.id ? { ...payload, id: b.id, created_at: b.created_at } : b)));
            setSuccessMessage(`Barangay "${formData.name}" updated successfully.`);
            toast.success("Barangay updated successfully");
          }
        } catch (err) {
          setSuccessMessage(`Failed to update barangay: ${err.message}`);
          toast.error("Failed to update barangay");
        }
      } else {
        // Offline - queue the operation
        const tempId = generateTempId();
        await queueOperation({
          endpoint: '/api/barangays',
          method: 'PUT',
          body: { id: selectedBarangay.id, ...payload },
          type: 'update',
          description: `Update barangay: ${formData.name}`,
          cacheKey: 'barangays_list',
          tempId
        });

        // Optimistic update
        setBarangays(barangays.map((b) => 
          b.id === selectedBarangay.id 
            ? { ...b, ...payload, _pending: true } 
            : b
        ));
        setSuccessMessage(`Barangay "${formData.name}" changes saved locally. Will sync when online.`);
        toast.info("Changes saved locally. Will sync when online.");
      }
    } else {
      // Insert operation
      if (actuallyOnline) {
        try {
          const result = await insertBarangay(payload);
          if (result.error) {
            setSuccessMessage(`Failed to add barangay: ${result.error.message || JSON.stringify(result.error)}`);
            toast.error("Failed to add barangay");
          } else {
            setBarangays([{ id: result.data.id, ...payload }, ...barangays]);
            setSuccessMessage(`Barangay "${formData.name}" added successfully.`);
            toast.success("Barangay added successfully");
          }
        } catch (err) {
          setSuccessMessage(`Failed to add barangay: ${err.message}`);
          toast.error("Failed to add barangay");
        }
      } else {
        // Offline - queue the operation
        const tempId = generateTempId();
        await queueOperation({
          endpoint: '/api/barangays',
          method: 'POST',
          body: payload,
          type: 'create',
          description: `Create barangay: ${formData.name}`,
          cacheKey: 'barangays_list',
          tempId
        });

        // Optimistic update
        setBarangays([{ id: tempId, ...payload, _pending: true }, ...barangays]);
        setSuccessMessage(`Barangay "${formData.name}" saved locally. Will sync when online.`);
        toast.info("Barangay saved locally. Will sync when online.");
      }
    }
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), editMode ? 6000 : 3000);
    
    // Reset form if operation succeeded (or was queued offline)
    if (actuallyOnline) {
      // Only reset if we got a successful result online
      // For offline, we already showed success message
    } else {
      // Offline - reset form since we queued it
      setFormData({ name: "", municipality: "Daet", population: 0 });
      setIsOpen(false);
      setEditMode(false);
      setSelectedBarangay(null);
    }
    
    setIsLoading(false);
  };

  // ========== FORM INPUT HANDLER ==========
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ========== EDIT HANDLER ==========
  const handleEdit = (barangay) => {
    setFormData(barangay);
    setSelectedBarangay(barangay);
    setEditMode(true);
    setIsOpen(true);
  };

  // ========== DELETE HANDLER ==========
  const handleDelete = (barangay) => {
    setDeleteTarget(barangay);
    setIsDeleteConfirmOpen(true);
  };

  // ========== CONFIRM DELETE HANDLER ==========
  const confirmDelete = async () => {
    if (deleteTarget) {
      setIsLoading(true);
      
      // Check if online
      const actuallyOnline = typeof navigator !== 'undefined' 
        ? (navigator.onLine || isOnline) 
        : isOnline;

      if (actuallyOnline) {
        try {
          const result = await deleteBarangay(deleteTarget.id);
          if (result.error) {
            setSuccessMessage(`Failed to delete barangay: ${result.error.message || JSON.stringify(result.error)}`);
            toast.error("Failed to delete barangay");
          } else {
            setBarangays(barangays.filter((b) => b.id !== deleteTarget.id));
            setSuccessMessage(`Barangay "${deleteTarget.name}" deleted successfully.`);
            toast.success("Barangay deleted successfully");
          }
        } catch (err) {
          setSuccessMessage(`Failed to delete barangay: ${err.message}`);
          toast.error("Failed to delete barangay");
        }
      } else {
        // Offline - queue the operation
        try {
          await queueOperation({
            endpoint: '/api/barangays',
            method: 'DELETE',
            params: { id: deleteTarget.id },
            type: 'delete',
            description: `Delete barangay: ${deleteTarget.name}`,
            cacheKey: 'barangays_list'
          });

          // Optimistic update
          setBarangays(barangays.filter((b) => b.id !== deleteTarget.id));
          setSuccessMessage(`Barangay "${deleteTarget.name}" delete queued. Will sync when online.`);
          toast.info("Delete queued. Will sync when online.");
        } catch (err) {
          console.error("Error queueing delete operation:", err);
          setSuccessMessage(`Failed to queue delete: ${err.message}`);
          toast.error("Failed to queue delete operation");
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setIsDeleteConfirmOpen(false);
      setDeleteTarget(null);
      setIsLoading(false);
    }
  };

  // ========== INITIALIZE DATA ==========
  const initializeData = async () => {
    try {
      // Load user profile first
      const profile = await loadUserProfile();
      if (profile) {
        setUserProfile(profile);
        console.log('User profile loaded:', profile);
      }
      
      // Then fetch barangays
      await loadBarangays();
    } catch (err) {
      console.error('Error initializing data:', err);
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ========== FETCH BARANGAYS ==========
  const loadBarangays = async () => {
    setIsLoading(true);
    const { data, error } = await fetchBarangays();
    if (error) {
      console.error('Error fetching barangays:', error);
    } else {
      setBarangays(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initializeData();
  }, []);

  // Filter barangays based on search term
  const filteredBarangays = barangays.filter((barangay) =>
    barangay.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barangay.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <Header title={title} subtitle={subtitle} />
          
          {/* Auth Loading State */}
          {isAuthLoading && (
            <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
              <p className="ml-3 text-gray-600">Loading user profile...</p>
            </div>
          )}

          {/* Search Bar Section - Sticks with Header */}
          {!isAuthLoading && (
            <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full sm:flex-1">
                  <Input
                    type="text"
                    placeholder="Search barangays..."
                    value={searchTerm || ""}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm sm:text-base"
                  />
                </div>
                <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  setFormData({ name: "", municipality: "Daet", population: 0 });
                  setEditMode(false);
                  setSelectedBarangay(null);
                }
              }}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2 text-sm sm:text-base py-2 px-4 whitespace-nowrap" onClick={() => {
                      setFormData({ name: "", municipality: "Daet", population: 0 });
                      setEditMode(false);
                      setSelectedBarangay(null);
                    }}>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Register Barangay</span>
                    </Button>
                  </DialogTrigger>
                  <BarangayForm
                    formData={formData}
                    editMode={editMode}
                    isLoading={isLoading}
                    onSubmit={handleSubmit}
                    onChange={handleChange}
                    onClose={() => setIsOpen(false)}
                  />
                </Dialog>
              </div>
            </div>
          )}
        </div>

        <main className="flex-1 overflow-auto">

          {/* Content Section */}
          <div className="p-4 sm:p-6 lg:p-8">
            {showSuccess &&  
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <AlertDescription className="text-sm sm:text-base">{successMessage}</AlertDescription>
              </Alert>
            }

            {/* ========== BARANGAY CARDS GRID VIEW ========== */}
            {/* Displays barangays in a responsive 3-column grid using BarangayCard component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBarangays.length > 0 ? (
              filteredBarangays.map((barangay, index) => (
                <BarangayCard
                  key={barangay.id || `barangay-${index}`}
                  barangay={barangay}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isMenuOpen={openMenuId === barangay.id}
                  onMenuToggle={(isOpen) => setOpenMenuId(isOpen ? barangay.id : null)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-sm">No barangays found. Register a new barangay to get started.</p>
              </div>
            )}
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            open={isDeleteConfirmOpen}
            title="Confirm Delete"
            message={`Are you sure you want to delete "${deleteTarget?.name || "this barangay"}"? This action cannot be undone.`}
            isLoading={isLoading}
            onConfirm={confirmDelete}
            onCancel={() => setIsDeleteConfirmOpen(false)}
          />
          
        </main>
      </div>
    </div>
  );
}