"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import VaccineRequestModal from "../../../../components/VaccineRequestModal";
import VaccineSummaryCards from "../../../../components/VaccineSummaryCards";
import VaccineRequestsTable from "../../../../components/VaccineRequestsTable";
import { fetchVaccineRequests, deleteVaccineRequest, createVaccineRequest } from "@/lib/vaccineRequest";
import { fetchVaccines } from "@/lib/vaccine";
import { supabase } from "@/lib/supabase";
import { requireAuth, getUserProfile } from "@/lib/accAuth"



export default function VaccinationRequest({
  title = "Vaccine Requisition Requests",
  subtitle = "Barangay: Barangay A",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [isLoadingVaccines, setIsLoadingVaccines] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [barangayName, setBarangayName] = useState("");

  useEffect(() => {
    loadRequests();
    loadVaccines();
    fetchUserProfile();
  }, []);

  // In fetchUserProfile:
const fetchUserProfile = async () => {
  try {
    // Check if logged in
    const localUser = requireAuth();
    if (!localUser) return;

    // Verify with Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    // Get profile with barangay
    const profile = await getUserProfile(session.user.id);
    if (!profile) return;

    setUserProfile(profile);
    if (profile.barangays) {
      setBarangayName(profile.barangays.name);
    }
  } catch (err) {
    console.error('Error in fetchUserProfile:', err);
    window.location.href = '/login';
  }
};

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchVaccineRequests();
      if (error) throw error;
      
      console.log('Fetched requests:', data?.length || 0);
      setRequests(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVaccines = async () => {
    setIsLoadingVaccines(true);
    try {
      const { data, error } = await fetchVaccines();
      if (error) throw error;
      setVaccines(data || []);
    } catch (err) {
      console.error('Error loading vaccines:', err);
    } finally {
      setIsLoadingVaccines(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      const { error } = await deleteVaccineRequest(requestId);
      if (error) throw error;
      
      await loadRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err.message);
    }
  };

  const handleSubmitRequest = async (formData) => {
    try {
      const { data, error } = await createVaccineRequest(formData);
      if (error) throw error;
      
      await loadRequests();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.message);
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
            <VaccineSummaryCards />

            {/* Controls Section */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center sm:justify-start gap-2 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-colors whitespace-nowrap w-full sm:w-fit text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                New Request
              </button>

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
                {userProfile && userProfile.barangays && (
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Total requests for {userProfile.barangays.name}: {requests.length}
                  </p>
                )}
                {userProfile && !userProfile.barangays && (
                  <p className="mt-1 text-xs sm:text-sm text-amber-600">
                    No barangay assigned to your account
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
                  onDelete={handleDeleteRequest}
                  onRetry={loadRequests}
                />
              </div>
            </div>

            {/* Vaccine Request Modal */}
            {isModalOpen && (
              <VaccineRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitRequest}
                barangayName={barangayName || "Barangay A"}
                vaccines={vaccines}
                isLoading={isLoadingVaccines}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}