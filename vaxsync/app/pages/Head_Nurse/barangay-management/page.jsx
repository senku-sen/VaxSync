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
import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import BarangayCard from "@/components/BarangayCard";
import BarangayForm from "@/components/BarangayForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { fetchBarangays, insertBarangay, updateBarangay, deleteBarangay } from '@/lib/barangay';
import { loadUserProfile } from "@/lib/vaccineRequest";

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

  // ========== FORM SUBMISSION HANDLER ==========
  // Handles both insert and update operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      ...formData,
      created_at: selectedBarangay?.created_at || new Date().toISOString(),
    };
    let result;
    if (editMode && selectedBarangay) {
      result = await updateBarangay(selectedBarangay.id, payload);
      if (result.error) {
        setSuccessMessage(`Failed to update barangay: ${result.error.message || JSON.stringify(result.error)}`);
      } else {
        setBarangays(barangays.map((b) => (b.id === selectedBarangay.id ? { ...payload, id: b.id, created_at: b.created_at } : b)));
        setSuccessMessage(`Barangay "${formData.name}" updated successfully.`);
      }
    } else {
      result = await insertBarangay(payload);
      if (result.error) {
        setSuccessMessage(`Failed to add barangay: ${result.error.message || JSON.stringify(result.error)}`);
      } else {
        setBarangays([{ id: result.data.id, ...payload }, ...barangays]);
        setSuccessMessage(`Barangay "${formData.name}" added successfully.`);
      }
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), editMode ? 6000 : 3000);
    if (!result.error) {
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
      const result = await deleteBarangay(deleteTarget.id);
      if (result.error) {
        setSuccessMessage(`Failed to delete barangay: ${result.error.message || JSON.stringify(result.error)}`);
      } else {
        setBarangays(barangays.filter((b) => b.id !== deleteTarget.id));
        setSuccessMessage(`Barangay "${deleteTarget.name}" deleted successfully.`);
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
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
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

          {!isAuthLoading && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

            <div className="w-full ">
              <Input
                type="text"
                placeholder="Search barangays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 text-sm sm:text-base py-2 px-4">
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
          )}

          {showSuccess &&  
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <AlertDescription className="text-sm sm:text-base">{successMessage}</AlertDescription>
            </Alert>
          }

          {/* ========== BARANGAY CARDS GRID VIEW ========== */}
          {/* Displays barangays in a responsive 2-column grid using BarangayCard component */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBarangays.length > 0 ? (
              filteredBarangays.map((barangay, index) => (
                <BarangayCard
                  key={barangay.id || `barangay-${index}`}
                  barangay={barangay}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-sm">No barangays found. Register a new barangay to get started.</p>
              </div>
            )}
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