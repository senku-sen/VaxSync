// ============================================
// HEALTH WORKER VACCINATION REQUEST PAGE
// ============================================
// Allows health workers to submit vaccine requests
// View their own vaccine requests and status
// ============================================

"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import VaccineRequestModalDoses from "../../../../components/vaccination-request/VaccineRequestModalDoses";
import VaccineSummaryCards from "../../../../components/vaccination-request/VaccineSummaryCards";
import VaccineRequestsTable from "../../../../components/vaccination-request/VaccineRequestsTable";
import {
  loadUserProfile,
  loadVaccineRequestsData,
  loadVaccinesData,
  deleteVaccineRequestData,
  createVaccineRequestData,
} from "@/lib/vaccineRequest";

export default function VaccinationRequest({
  title = "Vaccine Requisition Requests",
  subtitle = "Barangay: Barangay A",
}) {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // List of vaccine requests
  const [requests, setRequests] = useState([]);
  
  // Loading state for requests
  const [isLoading, setIsLoading] = useState(true);
  
  // Search query for filtering requests
  const [searchQuery, setSearchQuery] = useState("");
  
  // Error messages
  const [error, setError] = useState(null);
  
  // List of available vaccines
  const [vaccines, setVaccines] = useState([]);
  
  // Loading state for vaccines
  const [isLoadingVaccines, setIsLoadingVaccines] = useState(true);
  
  // Current logged in user profile
  const [userProfile, setUserProfile] = useState(null);
  
  // Barangay name of current user
  const [barangayName, setBarangayName] = useState("");
  
  // User profile ID for request creation
  const [profileID, setProfileID] = useState(null);

  // Loading state for user profile
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Load user profile
      const profile = await loadUserProfile();
      if (profile) {
        setUserProfile(profile);
        // Always capture profile ID for requested_by linkage
        setProfileID(profile.id);
        if (profile.barangays) {
          setBarangayName(profile.barangays.name);
          // Log barangay info for debugging
          console.log('Barangay loaded:', {
            barangayId: profile.barangays.id,
            barangayName: profile.barangays.name,
            municipality: profile.barangays.municipality
          });
        } else {
          console.warn('No barangay assigned to user profile:', profile);
        }
      }

      // Load requests and vaccines in parallel
      await Promise.all([loadRequests(), loadVaccines()]);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadRequests = async () => {
    setIsLoading(true);
    const { data, error } = await loadVaccineRequestsData({ isAdmin: false });
    setRequests(data);
    if (error) setError(error);
    setIsLoading(false);
  };

  const loadVaccines = async () => {
    setIsLoadingVaccines(true);
    const { data, error } = await loadVaccinesData();
    setVaccines(data);
    setIsLoadingVaccines(false);
  };

  const handleDeleteRequest = async (requestId) => {
    const { success, error } = await deleteVaccineRequestData(requestId);
    if (success) {
      await loadRequests();
    } else {
      setError(error);
    }
  };

  const handleSubmitRequest = async (formData) => {
    try {
      console.log('handleSubmitRequest called with:', formData);
      const { success, error } = await createVaccineRequestData(formData);
      console.log('createVaccineRequestData result:', { success, error });
      
      if (success) {
        console.log('Request created successfully');
        await loadRequests();
        setIsModalOpen(false);
        setError(null);
      } else {
        console.error('Request creation failed:', error);
        setError(error);
        alert('Error: ' + error);
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmitRequest:', err);
      setError(err.message);
      alert('Unexpected error: ' + err.message);
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header 
          title={title} 
          subtitle={barangayName ? `Barangay: ${barangayName}` : subtitle} 
        />

        <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-0 sm:px-2">
            {/* Summary Cards */}
            <VaccineSummaryCards requests={requests} />

            {/* Controls Section */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center sm:justify-start gap-2 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-colors whitespace-nowrap w-full sm:w-fit text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                New Request
              </button>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === null
                      ? 'bg-[#4A7C59] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Requests
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === "pending"
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === "approved"
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === "rejected"
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Rejected
                </button>
              </div>

              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by request ID or vaccine type..."
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Requests Table Card */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">My Vaccine Requests</h3>
                {!isLoadingProfile && userProfile && userProfile.barangays && (
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Total requests for {userProfile.barangays.name}: {requests.length}
                  </p>
                )}
                {!isLoadingProfile && userProfile && !userProfile.barangays && (
                  <p className="mt-1 text-xs sm:text-sm text-amber-600">
                    No barangay assigned to your account
                  </p>
                )}
                {isLoadingProfile && (
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">
                    Loading barangay information...
                  </p>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <VaccineRequestsTable
                  requests={requests}
                  vaccines={vaccines}
                  isLoading={isLoading}
                  error={error}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  onDelete={handleDeleteRequest}
                  onRetry={loadRequests}
                />
              </div>
            </div>

            {/* Vaccine Request Modal - Dose Based */}
            {isModalOpen && (
              <VaccineRequestModalDoses
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                  loadRequests();
                  setIsModalOpen(false);
                }}
                userProfile={userProfile}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}