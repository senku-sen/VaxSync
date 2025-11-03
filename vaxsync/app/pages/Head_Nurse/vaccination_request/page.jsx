"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";

import VaccineSummaryCards from "../../../../components/VaccineSummaryCards";

import { loadUserProfile } from "@/lib/vaccineRequest";

export default function VaccinationRequest({
  title = "Vaccine Requisition Requests"
  
}) {
  const [userProfile, setUserProfile] = useState(null);
  const [barangayName, setBarangayName] = useState("");

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
        <Header
          title={title}
        />

        <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-0 sm:px-2">
            {/* Summary Cards */}
            <VaccineSummaryCards />
          </div>
        </main>
      </div>
    </div>
  );
}
