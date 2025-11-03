"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import { Search } from "lucide-react";

import VaccineSummaryCards from "../../../../components/VaccineSummaryCards";

import { loadUserProfile } from "@/lib/vaccineRequest";

export default function VaccinationRequest({
  title = "Vaccine Requisition Requests",
}) {
  const [userProfile, setUserProfile] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    // Load user profile
    const profile = await loadUserProfile();
    if (profile) {
      setUserProfile(profile);
      if (profile.barangays) {
        setBarangayName(profile.barangays.name);
      }
    }

    // Load requests and vaccines in parallel
    await Promise.all([loadRequests(), loadVaccines()]);
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
          </div>
        </main>
      </div>
    </div>
  );
}
