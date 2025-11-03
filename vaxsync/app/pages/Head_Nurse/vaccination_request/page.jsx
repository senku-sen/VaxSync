"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import VaccineRequestsTable from "../../../../components/VaccineRequestsTable";
import { Search } from "lucide-react";
import {
  loadUserProfile,
  loadVaccineRequestsData,
  loadVaccinesData,
  deleteVaccineRequestData,
  updateVaccineRequestStatus,
} from "@/lib/vaccineRequest";
import VaccineSummaryCards from "../../../../components/VaccineSummaryCards";

export default function VaccinationRequest({
  title = "Vaccine Requisition Requests",
}) {
  const [userProfile, setUserProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [vaccines, setVaccines] = useState([]);
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
            {/* Summary Cards */}
            <VaccineSummaryCards />

            {/* Controls Section */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by request ID or vaccine type..."
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Vaccine Requests
                </h3>
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
