// ============================================
// HEALTH WORKER INVENTORY PAGE
// ============================================
// Displays vaccine inventory and stock levels
// Health workers can view vaccines available
// ============================================

"use client";

import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchBarangayVaccineInventory } from "@/lib/BarangayVaccineInventory";
import { loadUserProfile } from "@/lib/VaccineRequest";

export default function Inventory() {
  const title = "Inventory Management";
  const subtitle = "View vaccine stock and supplies";
  // List of all vaccines in barangay inventory
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
        
        // Then fetch barangay vaccine inventory
        if (profile.barangays?.id) {
          await fetchList(profile.barangays.id);
        } else {
          setError('No barangay assigned to your account');
        }
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message || "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vaccines from barangay vaccine inventory
  const fetchList = async (barangayId) => {
    try {
      const { data, error } = await fetchBarangayVaccineInventory(barangayId);
      if (error) {
        console.error("Error fetching barangay vaccines:", error);
        // Extract error message properly
        const errorMsg = error?.message || error?.details || JSON.stringify(error);
        setError(errorMsg);
      } else {
        setVaccines(data || []);
      }
    } catch (err) {
      console.error('Error in fetchList:', err);
      setError(err.message || "Failed to load inventory");
    }
  };

  // Filter vaccines based on search term
  const filtered = vaccines.filter((v) => {
    const term = searchTerm.toLowerCase();
    const vaccineName = v.vaccine_doses?.vaccine?.name || "";
    const doseCode = v.vaccine_doses?.dose_code || "";
    return (
      vaccineName.toLowerCase().includes(term) ||
      (v.batch_number || "").toLowerCase().includes(term) ||
      doseCode.toLowerCase().includes(term)
    );
  });

  // Determine vaccine status based on expiry date and quantity
  const getVaccineStatus = (vaccine) => {
    const today = new Date();
    const expiryDate = vaccine.expiry_date ? new Date(vaccine.expiry_date) : null;
    const quantity = vaccine.quantity_vial || 0;

    // Check if expired
    if (expiryDate && expiryDate < today) {
      return { status: 'Expired', color: 'bg-gray-100 text-gray-800', icon: '⚫' };
    }

    // Check if low stock (less than 5 vials)
    if (quantity < 5 && quantity > 0) {
      return { status: 'Low Stock', color: 'bg-orange-100 text-orange-800', icon: '🟠' };
    }

    // Good condition
    return { status: 'Good', color: 'bg-green-100 text-green-800', icon: '🟢' };
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-72">
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
                  <thead className="text-xs font-medium text-gray-600 tracking-wider border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">Vaccine Name</th>
                      <th className="px-6 py-3 text-left">Batch</th>
                      <th className="px-6 py-3 text-left">Vials</th>
                      <th className="px-6 py-3 text-left">Doses</th>
                      <th className="px-6 py-3 text-left">Expiry</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((v, i) => (
                      <tr
                        key={v.id || i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div>
                            <p>{v.vaccine_doses?.vaccine?.name || "N/A"}</p>
                            <p className="text-xs text-gray-500 font-normal">{v.vaccine_doses?.dose_code || "N/A"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.batch_number || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.quantity_vial ?? "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.quantity_dose ?? "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {v.expiry_date || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const statusInfo = getVaccineStatus(v);
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.icon} {statusInfo.status}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No vaccines in inventory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-4">
                {filtered.length > 0 ? (
                  filtered.map((v, i) => {
                    const statusInfo = getVaccineStatus(v);
                    return (
                      <div key={v.id || i} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{v.vaccine_doses?.vaccine?.name || "N/A"}</h3>
                            <p className="text-xs text-gray-500 font-normal">Dose: {v.vaccine_doses?.dose_code || "N/A"}</p>
                            <p className="text-sm text-gray-500">Batch: {v.batch_number || "N/A"}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                          <div>
                            <p className="text-gray-500">Vials</p>
                            <p className="font-medium">{v.quantity_vial ?? "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Doses</p>
                            <p className="font-medium">{v.quantity_dose ?? "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Expiry</p>
                            <p className="font-medium">{v.expiry_date || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No vaccines in inventory.
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