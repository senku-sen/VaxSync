"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import VaccineRequestModal from "../../../components/VaccineRequestModal";

export default function Inventory({
  title = "Vaccine Requisition Requests",
  subtitle = "Barangay: Barangay A",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmitRequest = (formData) => {
    // Handle form submission here
    console.log("Form submitted:", formData);
    setIsModalOpen(false);
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

            

          {/* Vaccine Request Modal */}
          <VaccineRequestModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmitRequest}
            barangayName="Barangay A"
          />
        </div>
        </main>
      </div>
    </div>
  );
}