// ...existing code...
"use client";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AddVaccine from "@/components/AddVaccine";
import { Input } from "@/components/ui/input";
import { Search, Plus, SquarePen, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing Supabase envs. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined and restart the dev server."
  );
}

const supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");

export default function Inventory({
  title = "Inventory Management",
  subtitle = "Manage vaccine stock and supplies",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

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

  const filteredVaccines = vaccines.filter(
    (vaccine) =>
      (vaccine.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vaccine.batch_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleVaccineAdded = () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

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

  const statusBadge = (status) => {
    switch (status) {
      case "Expired":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
            {status}
          </span>
        );
      case "Low Stock":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            {status || "Good"}
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

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
                        {vaccine.quantity_available !== null &&
                        vaccine.quantity_available !== undefined
                          ? `${vaccine.quantity_available} doses`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">{vaccine.expiry_date}</td>
                      <td className="px-6 py-4">{vaccine.location}</td>
                      <td className="px-6 py-4">
                        {statusBadge(vaccine.status)}
                      </td>
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
                  {filteredVaccines.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No vaccines found.
                      </td>
                    </tr>
                  )}
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
// ...existing code...
