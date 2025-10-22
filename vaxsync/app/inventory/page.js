// app/inventory/page.jsx
"use client";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AddVaccine from "@/components/AddVaccine";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Inventory({
  title = "Inventory Management",
  subtitle = "Manage vaccine stock and supplies",
  children,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddVaccineClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        {/* Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Main Content */}
        <main className="p-9 flex-1 overflow-auto">
          <div className="flex items-center space-x-2">
            <Search className="text-gray-400" />
            <Input
              type="text"
              placeholder="Search by vaccine name or batch..."
              className="w-full text-sm"
            />
            <Button
              className="ml-2 py-2 text-sm flex items-center justify-center space-x-2 bg-[#3E5F44] w-48 text-white rounded-md hover:bg-[#2F4B35]"
              onClick={handleAddVaccineClick}
            >
              <Plus className="w-4 h-4" />
              <span>Add Vaccine</span>
            </Button>
          </div>

          {children}

          {isModalOpen && (
            <div
              className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
              onClick={closeModal} // clicking outside closes modal
            >
              <div
                className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
              >
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ×
                </button>

                <AddVaccine />

                <div className="mt-6 flex justify-end"></div>
              </div>
            </div>
          )}


          



        </main>
      </div>
    </div>
  );
}
