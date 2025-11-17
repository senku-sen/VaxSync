// ============================================
// HEALTH WORKER VACCINATION SCHEDULE PAGE
// ============================================
// Schedule vaccination sessions for barangay
// Health workers can create new vaccination sessions
// ============================================

"use client";

import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import { Plus, X, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { loadUserProfile } from "@/lib/vaccineRequest";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");

export default function VaccinationSchedule({
  title = "Vaccination Schedule",
  subtitle = "Schedule vaccination sessions and track progress",
}) {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Current logged in user profile
  const [userProfile, setUserProfile] = useState(null);
  
  // Loading state for data fetching
  const [isLoading, setIsLoading] = useState(true);
  
  // Error messages if any occur
  const [error, setError] = useState(null);
  
  // List of available vaccines
  const [vaccines, setVaccines] = useState([]);
  
  // Form data state
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    vaccine_id: "",
    target: "",
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await fetchVaccines();
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vaccines from database
  const fetchVaccines = async () => {
    try {
      const { data, error } = await supabase
        .from("vaccines")
        .select("id, name")
        .order("name");
      
      if (error) {
        console.error("Error fetching vaccines:", error);
        setError(error.message);
      } else {
        setVaccines(data || []);
      }
    } catch (err) {
      console.error('Error in fetchVaccines:', err);
      setError(err.message);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
    }

    if (!formData.vaccine_id) {
      newErrors.vaccine_id = "Please select a vaccine";
    }

    if (!formData.target) {
      newErrors.target = "Target is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!userProfile?.barangays?.id) {
      alert("Barangay ID is missing. Please refresh the page.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("vaccination_sessions")
        .insert({
          barangay_id: userProfile.barangays.id,
          vaccine_id: formData.vaccine_id,
          session_date: formData.date,
          session_time: formData.time,
          target: parseInt(formData.target),
          administered: 0,
          status: "Scheduled",
          created_by: userProfile.id,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating session:', error);
        alert('Error: ' + error.message);
      } else {
        alert('Vaccination session scheduled successfully');
        setFormData({ date: "", time: "", vaccine_id: "", target: "" });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ date: "", time: "", vaccine_id: "", target: "" });
    setErrors({});
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
              <p className="ml-3 text-gray-600">Loading...</p>
            </div>
          )}

          {/* Schedule Button */}
          {!isLoading && (
            <div className="mb-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center sm:justify-start gap-2 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-colors whitespace-nowrap w-full sm:w-fit text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                Schedule Session
              </button>
            </div>
          )}

          {/* Schedule Session Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Schedule Vaccination Session</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {userProfile?.barangays?.name || "Barangay"}
                    </p>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* Validation Errors */}
                  {Object.keys(errors).length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Please fill in all required fields</p>
                        {Object.values(errors).map((error, idx) => (
                          error && <p key={idx} className="text-sm text-red-600">{error}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Barangay (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barangay
                      </label>
                      <input
                        type="text"
                        value={userProfile?.barangays?.name || "Not assigned"}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                          errors.date ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                          errors.time ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    {/* Vaccine */}
                    <div>
                      <label htmlFor="vaccine_id" className="block text-sm font-medium text-gray-700 mb-2">
                        Vaccine <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="vaccine_id"
                        name="vaccine_id"
                        value={formData.vaccine_id}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                          errors.vaccine_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select vaccine</option>
                        {vaccines.map((vaccine) => (
                          <option key={vaccine.id} value={vaccine.id}>
                            {vaccine.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target */}
                    <div>
                      <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
                        Target (number of people) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="target"
                        name="target"
                        value={formData.target}
                        onChange={handleChange}
                        placeholder="Enter target number"
                        min="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${
                          errors.target ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    {/* Modal Footer */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? "Scheduling..." : "Schedule Session"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
