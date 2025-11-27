// ============================================
// HEAD NURSE INVENTORY PAGE
// ============================================
// Manage vaccine inventory and stock
// Add, edit, and delete vaccines
// Head nurses have full inventory control
// ============================================

"use client";

import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import AddVaccineDoses from "@/components/inventory/AddVaccineDoses";
import MonthlyReportTable from "@/components/inventory/MonthlyReportTable";
import { Input } from "@/components/ui/input";
import { Search, Plus, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import DeleteConfirm from "@/components/inventory/DeleteConfirm";
import { loadUserProfile } from "@/lib/vaccineRequest";

// Initialize Supabase environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing Supabase envs. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined and restart the dev server."
  );
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");

export default function Inventory({
  title = "Inventory Management",
  subtitle = "Manage vaccine stock and supplies",
}) {
  // Modal visibility for adding/editing vaccines
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // List of all vaccines
  const [vaccines, setVaccines] = useState([]);
  
  // Currently selected vaccine for editing
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  
  // Vaccine to delete (for confirmation)
  const [toDelete, setToDelete] = useState(null);
  
  // Search term for filtering vaccines
  const [searchTerm, setSearchTerm] = useState("");
  
  // Current logged in user profile
  const [userProfile, setUserProfile] = useState(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Error messages
  const [error, setError] = useState(null);
  
  // Active tab (current-stock or monthly-report)
  const [activeTab, setActiveTab] = useState("current-stock");

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Load user profile first
      const profile = await loadUserProfile();
      if (profile) {
        setUserProfile(profile);
        console.log('User profile loaded:', profile);
      }
      
      // Then fetch vaccines
      await fetchVaccines();
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // expose fetch function so other handlers can refresh
  const fetchVaccines = async () => {
    const { data, error } = await supabase
      .from("vaccines")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching vaccines:", error);
    } else {
      setVaccines(data || []);
    }
  };

  const openAddModal = () => {
    setSelectedVaccine(null);
    setIsModalOpen(true);
    setToDelete(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVaccine(null);
  };

  const handleEdit = (vaccine) => {
    setSelectedVaccine(vaccine);
    setIsModalOpen(true);
    setToDelete(null);
  };

  const handleDelete = (vaccine) => {
    if (!vaccine || !vaccine.id) return;
    setToDelete(vaccine);
    setIsModalOpen(false);
    setSelectedVaccine(null);
  };

  const confirmDelete = async () => {
    if (!toDelete || !toDelete.id) return;
    const { error } = await supabase
      .from("vaccines")
      .delete()
      .eq("id", toDelete.id);
    if (error) {
      console.error("Error deleting vaccine:", error);
      alert("Failed to delete vaccine");
    } else {
      // refresh list
      fetchVaccines();
    }
    setToDelete(null);
    setSelectedVaccine(null);
  };

  const filteredVaccines = vaccines.filter(
    (vaccine) =>
      (vaccine.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vaccine.batch_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleVaccineAdded = () => {
    fetchVaccines();
    setIsModalOpen(false);
    setSelectedVaccine(null);
  };

  // Determine vaccine status based on expiry date and quantity
  const getVaccineStatus = (vaccine) => {
    const today = new Date();
    const expiryDate = vaccine.expiry_date ? new Date(vaccine.expiry_date) : null;
    const quantity = vaccine.quantity_available || 0;

    // Check if expired
    if (expiryDate && expiryDate < today) {
      return { status: 'Expired', color: 'bg-gray-100 text-gray-800', icon: '⚫' };
    }

    // Check if damaged (assuming status field exists, otherwise skip)
    if (vaccine.status === 'damaged') {
      return { status: 'Damaged', color: 'bg-red-100 text-red-800', icon: '🔴' };
    }

    // Check if low stock (less than 10 doses)
    if (quantity < 10 && quantity > 0) {
      return { status: 'Low Stock', color: 'bg-orange-100 text-orange-800', icon: '🟠' };
    }

    // Good condition
    return { status: 'Good', color: 'bg-green-100 text-green-800', icon: '🟢' };
  };

  const statusBadge = (vaccine) => {
    const statusInfo = getVaccineStatus(vaccine);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.icon} {statusInfo.status}
      </span>
    );
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
                <span className="font-semibold">Error:</span> {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
              <p className="ml-3 text-gray-600">Loading inventory...</p>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("current-stock")}
                  className={`px-4 py-3 font-medium text-sm transition-colors ${
                    activeTab === "current-stock"
                      ? "text-[#4A7C59] border-b-2 border-[#4A7C59]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Current Stock
                </button>
                <button
                  onClick={() => setActiveTab("monthly-report")}
                  className={`px-4 py-3 font-medium text-sm transition-colors ${
                    activeTab === "monthly-report"
                      ? "text-[#4A7C59] border-b-2 border-[#4A7C59]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly Report
                </button>
              </div>

              {/* Current Stock Tab */}
              {activeTab === "current-stock" && (
                <>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:space-x-2 mb-6">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Search className="text-gray-400 shrink-0" />
                      <Input
                        type="text"
                        placeholder="Search by vaccine name or batch..."
                        className="w-full text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full md:w-auto py-2 text-sm flex items-center justify-center space-x-2 bg-[#3E5F44] text-white rounded-md hover:bg-[#2F4B35]"
                      onClick={openAddModal}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Vaccine</span>
                    </Button>
                  </div>
                </>
              )}

              {/* Monthly Report Tab */}
              {activeTab === "monthly-report" && (
                <MonthlyReportTable barangayId={userProfile?.barangays?.id} />
              )}

              {activeTab === "current-stock" && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                  <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800 tracking-wide">
                      Vaccine Stock Overview
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      Comprehensive list of all available vaccines in the inventory
                    </p>
                  </div>

                  <div className="overflow-x-auto p-4 md:p-0">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                          <tr>
                            <th className="px-6 py-3">Vaccine Name</th>
                            <th className="px-6 py-3">Batch</th>
                            <th className="px-6 py-3">Quantity</th>
                            <th className="px-6 py-3">Expiry</th>
                            <th className="px-6 py-3">Notes</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVaccines.map((vaccine, index) => (
                            <tr
                              key={index}
                              className="bg-white border-b hover:bg-gray-50 transition duration-150"
                            >
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {vaccine.name}
                              </td>
                              <td className="px-6 py-4">{vaccine.batch_number}</td>
                              <td className="px-6 py-4">
                                {vaccine.quantity_available !== null &&
                                vaccine.quantity_available !== undefined
                                  ? `${vaccine.quantity_available} doses`
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4">{vaccine.expiry_date}</td>
                              <td className="px-6 py-4 max-w-xs truncate">{vaccine.notes || "—"}</td>
                              <td className="px-6 py-4">
                                {statusBadge(vaccine)}
                              </td>
                              <td className="px-6 py-4 flex justify-center space-x-3">
                                <button
                                  onClick={() => handleEdit(vaccine)}
                                  className="text-black hover:text-gray-700"
                                >
                                  <SquarePen className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(vaccine)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredVaccines.length === 0 && (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-6 py-8 text-center text-gray-500"
                              >
                                No vaccines found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {filteredVaccines.length > 0 ? (
                        filteredVaccines.map((vaccine, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">
                                  {vaccine.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Batch: {vaccine.batch_number}
                                </p>
                              </div>
                              <div>{statusBadge(vaccine)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p className="font-medium text-gray-900">
                                  {vaccine.quantity_available !== null &&
                                  vaccine.quantity_available !== undefined
                                    ? `${vaccine.quantity_available} doses`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Expiry</p>
                                <p className="font-medium text-gray-900">
                                  {vaccine.expiry_date}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium text-gray-900">
                                  {vaccine.location}
                                </p>
                              </div>
                              {vaccine.notes && (
                                <div className="col-span-2">
                                  <p className="text-gray-500">Notes</p>
                                  <p className="font-medium text-gray-900">
                                    {vaccine.notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => handleEdit(vaccine)}
                                className="flex-1 flex items-center justify-center gap-2 text-black hover:text-gray-700 py-2 text-sm"
                              >
                                <SquarePen className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(vaccine)}
                                className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-red-800 py-2 text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No vaccines found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isModalOpen && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-[#4A7C59] to-[#3E6B4D] text-white p-6 flex justify-between items-center rounded-t-xl">
                  <h2 className="text-xl font-bold">{selectedVaccine ? 'Edit Vaccine' : 'Add New Vaccine'}</h2>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  <AddVaccineDoses
                    onSuccess={handleVaccineAdded}
                    onClose={() => {
                      setIsModalOpen(false);
                      setSelectedVaccine(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Delete confirmation modal for list deletions */}
          {toDelete && (
            <DeleteConfirm
              open={!!toDelete}
              title="Delete vaccine"
              message={`Are you sure you want to delete "${toDelete.name}"? This action cannot be undone.`}
              onConfirm={confirmDelete}
              onCancel={() => setToDelete(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
