"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import VaccineRequestModal from "../../../components/VaccineRequestModal";
import { fetchVaccineRequests, deleteVaccineRequest, createVaccineRequest } from "@/lib/vaccineRequest";
import { fetchVaccines } from "@/lib/vaccine";

export default function Inventory({
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

  useEffect(() => {
    loadRequests();
    loadVaccines();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchVaccineRequests();
      if (error) throw error;
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
      const { data, error } = await fetchVaccines(); // Add this function to lib/vaccine.js
      if (error) throw error;
      setVaccines(data || []);
    } catch (err) {
      console.error('Error loading vaccines:', err);
      // We don't set the main error state here to avoid blocking the main UI
    } finally {
      setIsLoadingVaccines(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      const { error } = await deleteVaccineRequest(requestId);
      if (error) throw error;
      
      // Refresh the requests list
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
      
      // Refresh the requests list
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
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
            <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
              <p className="text-4xl font-bold text-[#4A7C59] mb-2">6</p>
              <p className="text-sm text-gray-500 font-medium">Total</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
              <p className="text-4xl font-bold text-[#6B9080] mb-2">1</p>
              <p className="text-sm text-gray-500 font-medium">Pending</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
              <p className="text-4xl font-bold text-[#A4C3B2] mb-2">0</p>
              <p className="text-sm text-gray-500 font-medium">Approved</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
              <p className="text-4xl font-bold text-[#4A7C59] mb-2">4</p>
              <p className="text-sm text-gray-500 font-medium">Released</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
              <p className="text-4xl font-bold text-[#4A7C59] mb-2">1</p>
              <p className="text-sm text-gray-500 font-medium">Rejected</p>
            </div>
          </div>

          {/* New Request Button and Search Bar */}
          <div className="flex flex-row items-center justify-between gap-4 mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-colors whitespace-nowrap"
            >
              <Plus size={20} />
              New Request
            </button>


          </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by request ID or vaccine type..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-md mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Vaccine Requests</h3>
                <p className="mt-1 text-sm text-gray-500">List of all vaccine requests from your barangay</p>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading requests...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 text-sm">{error}</p>
                  <button 
                    onClick={loadRequests}
                    className="mt-2 text-[#4A7C59] hover:text-[#3E6B4D] text-sm underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests
                        .filter(request => {
                          const searchLower = searchQuery.toLowerCase();
                          const vaccineName = vaccines.find(v => v.id === request.vaccine_id)?.name?.toLowerCase() || '';
                          return request.id?.toString().toLowerCase().includes(searchLower) ||
                                 vaccineName.includes(searchLower);
                        })
                        .map(request => (
                          <tr key={request.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {request.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vaccines.find(v => v.id === request.vaccine_id)?.name || 'Loading...'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.quantity_requested} doses
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex gap-2">
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Eye size={16} />
                                </button>
                                {request.status === 'pending' && (
                                  <button 
                                    onClick={() => handleDeleteRequest(request.id)}
                                    className="text-red-600 hover:text-red-800">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!isLoading && requests.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center">
                              <p className="text-gray-500 text-sm">No requests found.</p>
                              <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-2 text-[#4A7C59] hover:text-[#3E6B4D] text-sm underline"
                              >
                                Create your first request
                              </button>
                            </td>
                          </tr>
                        )}
                        {!isLoading && requests.length > 0 && searchQuery && 
                         !requests.some(request => {
                           const searchLower = searchQuery.toLowerCase();
                           const vaccineName = vaccines.find(v => v.id === request.vaccine_id)?.name?.toLowerCase() || '';
                           return request.id?.toString().toLowerCase().includes(searchLower) ||
                                  vaccineName.includes(searchLower);
                         }) && (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center">
                              <p className="text-gray-500 text-sm">
                                No requests found matching "{searchQuery}"
                              </p>
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          {/* Vaccine Request Modal */}
          <VaccineRequestModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmitRequest}
            barangayName="Barangay A"
            vaccines={vaccines}
            isLoading={isLoadingVaccines}
          />
        </div>
        </main>
      </div>
    </div>
  );
}