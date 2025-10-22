"use client";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AddVaccine from "@/components/AddVaccine";
import DeleteConfirm from "@/components/DeleteConfirm";
import { Input } from "@/components/ui/input";
import { Search, Plus, SquarePen, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  fetchVaccines as fetchVaccinesLib,
  deleteVaccineById,
} from "@/lib/inventory";

export default function Inventory({
  title = "Inventory Management",
  subtitle = "Manage vaccine stock and supplies",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    const { data, error } = await fetchVaccinesLib();
    if (error) {
      console.error("Error fetching vaccines:", error);
    } else {
      setVaccines(data || []);
    }
  };

  const openAddModal = () => {
    setSelectedVaccine(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v) => {
    setSelectedVaccine(v);
    setIsModalOpen(true);
  };

  const handleVaccineSaved = async () => {
    await fetchList();
    setIsModalOpen(false);
    setSelectedVaccine(null);
  };

  const handleDelete = (v) => setToDelete(v);

  const confirmDelete = async () => {
    if (!toDelete || !toDelete.id) return;
    const { error } = await deleteVaccineById(toDelete.id);
    if (error) {
      console.error("Error deleting vaccine:", error);
      alert("Failed to delete vaccine");
    } else {
      await fetchList();
    }
    setToDelete(null);
  };

  const filtered = vaccines.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      (v.name || "").toLowerCase().includes(term) ||
      (v.batch_number || "").toLowerCase().includes(term)
    );
  });

  const statusBadge = (status) => {
    switch (status) {
      case "Expired":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
            {status}
          </span>
        );
      case "Damaged":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-800">
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

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:space-x-2 mb-6">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="text-gray-400 shrink-0" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by vaccine name or batch..."
                className="w-full text-sm"
              />
            </div>
            <Button
              onClick={openAddModal}
              className="w-full md:w-auto py-2 text-sm flex items-center justify-center space-x-2 bg-[#3E5F44] text-white rounded-md hover:bg-[#2F4B35]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vaccine</span>
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 tracking-wide">
                Vaccine Stock Overview
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Comprehensive list of all available vaccines in the inventory
              </p>
            </div>

            <div className="overflow-x-auto p-4 md:p-0">
              <div className="hidden md:block">
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
                    {filtered.map((v, i) => (
                      <tr
                        key={v.id || i}
                        className="bg-white border-b hover:bg-gray-50 transition duration-150"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {v.name}
                        </td>
                        <td className="px-6 py-4">{v.batch_number}</td>
                        <td className="px-6 py-4">
                          {v.quantity_available ?? "N/A"}
                        </td>
                        <td className="px-6 py-4">{v.expiry_date}</td>
                        <td className="px-6 py-4">{v.location}</td>
                        <td className="px-6 py-4">{statusBadge(v.status)}</td>
                        <td className="px-6 py-4 flex justify-center space-x-3">
                          <button
                            onClick={() => openEditModal(v)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
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

              <div className="md:hidden space-y-4">
                {filtered.length > 0 ? (
                  filtered.map((v, i) => (
                    <div
                      key={v.id || i}
                      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {v.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Batch: {v.batch_number}
                          </p>
                        </div>
                        <div>{statusBadge(v.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">
                            {v.quantity_available ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expiry</p>
                          <p className="font-medium text-gray-900">
                            {v.expiry_date}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">
                            {v.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => openEditModal(v)}
                          className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 py-2 text-sm"
                        >
                          <SquarePen className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-red-800 py-2 text-sm"
                        >
                          <Trash className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
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
          </div>

          {isModalOpen && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setIsModalOpen(false)}
            >
              <div
                className="bg-white p-6 md:p-8 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ×
                </button>
                <AddVaccine
                  vaccine={selectedVaccine}
                  onSuccess={handleVaccineSaved}
                  onClose={() => setIsModalOpen(false)}
                />
                <div className="mt-6 flex justify-end"></div>
              </div>
            </div>
          )}

          {toDelete && (
            <DeleteConfirm
              open={!!toDelete}
              title="Delete vaccine"
              message={`Are you sure you want to delete "${toDelete.name}"? This action cannot be undone.`}
              onConfirm={confirmDelete}
              onCancel={() => setToDelete(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
