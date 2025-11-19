// ============================================
// HEAD NURSE VACCINE REQUEST APPROVAL PAGE
// ============================================
// Approve, reject, or release vaccine requests
// View all vaccine requests from health workers
// Head nurses manage request fulfillment
// ============================================

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import VaccineRequestsTable from "../../../../components/vaccination-request/VaccineRequestsTable";
import { Search } from "lucide-react";
import {
  loadUserProfile,
  loadVaccineRequestsData,
  loadVaccinesData,
  deleteVaccineRequestData,
  updateVaccineRequestStatus,
} from "@/lib/vaccineRequest";
import VaccineSummaryCards from "../../../../components/vaccination-request/VaccineSummaryCards";

export default function VaccinationRequest({
  title = "Vaccine Request Approval",
}) {
  // Current logged in user profile
  const [userProfile, setUserProfile] = useState(null);
  
  // All vaccine requests from health workers
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

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    // Load user profile
    const profile = await loadUserProfile();
    if (profile) {
      setUserProfile(profile);
    }

    // Load requests and vaccines in parallel
    await Promise.all([loadRequests(), loadVaccines()]);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    const { data, error } = await loadVaccineRequestsData({ isAdmin: true });
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

  const handleUpdateStatus = async (requestId, newStatus) => {
    const { success, error } = await updateVaccineRequestStatus(requestId, newStatus);
    if (success) {
      await loadRequests();
    } else {
      setError(error);
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} />

        <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-0 sm:px-2">
            {/* Summary Cards - Status Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Pending Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600 font-medium">Pending Requests</p>
              </div>

              {/* Approved Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
              </div>

              {/* Rejected Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-4xl font-bold text-red-600 mb-2">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-6">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by request ID, barangay, or health worker..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Pending Requests Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">
                  Pending Requests
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Review and approve vaccine requisition requests
                </p>
              </div>

              <div className="overflow-x-auto">
                <VaccineRequestsTable
                  requests={requests}
                  vaccines={vaccines}
                  isLoading={isLoading}
                  error={error}
                  searchQuery={searchQuery}
                  onDelete={handleDeleteRequest}
                  onUpdateStatus={handleUpdateStatus}
                  onRetry={loadRequests}
                  isAdmin={true}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
