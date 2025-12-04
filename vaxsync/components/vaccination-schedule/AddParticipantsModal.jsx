// ============================================
// ADD PARTICIPANTS MODAL
// ============================================
// Modal for adding residents to vaccination sessions
// ============================================

"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import { getAvailableResidentsForSession, addBeneficiariesToSession } from "@/lib/sessionBeneficiaries";

export default function AddParticipantsModal({
  isOpen,
  onClose,
  sessionId,
  barangayName,
  onSuccess
}) {
  const [availableResidents, setAvailableResidents] = useState([]);
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen && sessionId && barangayName) {
      loadAvailableResidents();
    }
  }, [isOpen, sessionId, barangayName]);

  const loadAvailableResidents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAvailableResidentsForSession(sessionId, barangayName);
      if (result.success) {
        setAvailableResidents(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleResident = (residentId) => {
    const newSelected = new Set(selectedResidents);
    if (newSelected.has(residentId)) {
      newSelected.delete(residentId);
    } else {
      newSelected.add(residentId);
    }
    setSelectedResidents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResidents.size === filteredResidents.length) {
      setSelectedResidents(new Set());
    } else {
      setSelectedResidents(new Set(filteredResidents.map(r => r.id)));
    }
  };

  const handleAddParticipants = async () => {
    if (selectedResidents.size === 0) {
      setError("Please select at least one resident");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addBeneficiariesToSession(
        sessionId,
        Array.from(selectedResidents)
      );

      if (result.success) {
        console.log("Participants added successfully");
        setSelectedResidents(new Set());
        setSearchTerm("");
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredResidents = availableResidents.filter(resident =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Participants</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select residents to add to this vaccination session
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search by name or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
            />
          </div>

          {/* Select All Button */}
          {filteredResidents.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-[#4A7C59] hover:text-[#3E6B4D] font-medium"
            >
              {selectedResidents.size === filteredResidents.length
                ? "Deselect All"
                : "Select All"}
            </button>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
            </div>
          )}

          {/* Residents List */}
          {!isLoading && filteredResidents.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredResidents.map(resident => (
                <label
                  key={resident.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedResidents.has(resident.id)}
                    onChange={() => handleToggleResident(resident.id)}
                    className="w-4 h-4 text-[#4A7C59] rounded focus:ring-2 focus:ring-[#4A7C59]"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{resident.name}</p>
                    <p className="text-sm text-gray-600">
                      Contact: {resident.contact || "N/A"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredResidents.length === 0 && availableResidents.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No residents match your search</p>
            </div>
          )}

          {/* No Available Residents */}
          {!isLoading && availableResidents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                All residents from this barangay have been added to this session
              </p>
            </div>
          )}

          {/* Selected Count */}
          {selectedResidents.size > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">{selectedResidents.size}</span> resident(s) selected
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAddParticipants}
            disabled={selectedResidents.size === 0 || isSubmitting}
            className="px-4 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3E6B4D] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus size={18} />
                Add {selectedResidents.size > 0 ? `(${selectedResidents.size})` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
