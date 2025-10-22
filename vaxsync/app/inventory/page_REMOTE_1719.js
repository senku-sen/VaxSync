"use client";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AddVaccine from "@/components/AddVaccine";
import { Input } from "@/components/ui/input";
import { Search, Plus, SquarePen, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client (using environment variables as in AddVaccine)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Inventory({
  title = "Inventory Management",
  subtitle = "Manage vaccine stock and supplies",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch vaccine data from Supabase
  useEffect(() => {
    const fetchVaccines = async () => {
      const { data, error } = await supabase
        .from("vaccines")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching vaccines:", error);
      } else {
        setVaccines(data || []);
      }
    };
    fetchVaccines();
  }, []);

  const handleAddVaccineClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Filter vaccines based on search term
  const filteredVaccines = vaccines.filter(
    (vaccine) =>
      vaccine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vaccine.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Callback to refresh vaccine list after adding a new vaccine
  const handleVaccineAdded = () => {
    const fetchVaccines = async () => {
      const { data, error } = await supabase
        .from("vaccines")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching vaccines:", error);
      } else {
        setVaccines(data || []);
      }
    };
    fetchVaccines();
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
          <div className="flex items-center space-x-2 mb-6">
            <Search className="text-gray-400" />
            <Input
              type="text"
              placeholder="Search by vaccine name or batch..."
              className="w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              className="ml-2 py-2 text-sm flex items-center justify-center space-x-2 bg-[#3E5F44] w-48 text-white rounded-md hover:bg-[#2F4B35]"
              onClick={handleAddVaccineClick}
            >
              <Plus className="w-4 h-4" />
              <span>Add Vaccine</span>
            </Button>
          </div>

          {/* Vaccine Stock Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
                Vaccine Stock Overview
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive list of all available vaccines in the inventory
              </p>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th className="px-6 py-3">Vaccine Name</th>
                    <th className="px-6 py-3">Batch</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Expiry</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVaccines.map((vaccine, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {vaccine.name}
                      </td>
                      <td className="px-6 py-4">{vaccine.batch_number}</td>
                      <td className="px-6 py-4">
                        {vaccine.quantity_available} doses
                      </td>
                      <td className="px-6 py-4">{vaccine.expiry_date}</td>
                      <td className="px-6 py-4">{vaccine.location}</td>
                      <td className="px-6 py-4">{vaccine.status}</td>
                      <td className="px-6 py-4 flex justify-center space-x-3">
                        <button className="text-blue-600 hover:text-blue-800">
                          <SquarePen className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isModalOpen && (
            <div
              className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
              onClick={closeModal}
            >
              <div
                className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ×
                </button>

                <AddVaccine onSuccess={handleVaccineAdded} />

                <div className="mt-6 flex justify-end"></div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
