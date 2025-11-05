// ============================================
// HEALTH WORKER INVENTORY PAGE
// ============================================
// Displays vaccine inventory and stock levels
// Health workers can view vaccines available
// ============================================

"use client";

import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchVaccines as fetchVaccinesLib } from "@/lib/inventory";
import { loadUserProfile } from "@/lib/vaccineRequest";

export default function Inventory({
  title = "Inventory Management",
  subtitle = "View vaccine stock and supplies",
}) {
  // List of all vaccines in inventory
  const [vaccines, setVaccines] = useState([]);
  
  // Search term for filtering vaccines
  const [searchTerm, setSearchTerm] = useState("");
  
  // Current logged in user profile
  const [userProfile, setUserProfile] = useState(null);
  
  // Loading state for data fetching
  const [isLoading, setIsLoading] = useState(true);
  
  // Error messages if any occur
  const [error, setError] = useState(null);

  useEffect(() => {
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
      await fetchList();
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vaccines from database
  const fetchList = async () => {
    try {
      const { data, error } = await fetchVaccinesLib();
      if (error) {
        console.error("Error fetching vaccines:", error);
        setError(error);
      } else {
        setVaccines(data || []);
      }
    } catch (err) {
      console.error('Error in fetchList:', err);
      setError(err.message);
    }
  };

  // Filter vaccines based on search term
  const filtered = vaccines.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      (v.name || "").toLowerCase().includes(term) ||
      (v.batch_number || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">
          {/* User Info Display */}
          {userProfile && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Logged in as:</span> {userProfile.first_name} {userProfile.last_name} ({userProfile.user_role})
              </p>
            </div>
          )}

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

          {/* Search Bar */}
          {!isLoading && (
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative w-full ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by vaccine name or batch..."
                  className="w-full text-sm pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Vaccine Stock Table */}
          {!isLoading && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Vaccine Stock</h2>
                <p className="text-sm text-gray-500 mt-1 mb-2">All vaccines in inventory</p>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left p-2">
                  <thead className="text-xs font-medium text-gray-600 tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">Vaccine Name</th>
                      <th className="px-6 py-3 text-left">Batch</th>
                      <th className="px-6 py-3 text-left">Quantity</th>
                      <th className="px-6 py-3 text-left">Expiry</th>
   
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((v, i) => (
                      <tr
                        key={v.id || i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {v.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.batch_number}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.quantity_available ?? "N/A"} doses
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.expiry_date}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.location}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No vaccines found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-4">
                {filtered.length > 0 ? (
                  filtered.map((v, i) => (
                    <div key={v.id || i} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{v.name}</h3>
                          <p className="text-sm text-gray-500">Batch: {v.batch_number}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-gray-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button className="text-red-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium">{v.quantity_available ?? "N/A"} doses</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expiry</p>
                          <p className="font-medium">{v.expiry_date}</p>
                        </div>
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
          )}
        </main>
      </div>
    </div>
  );
}