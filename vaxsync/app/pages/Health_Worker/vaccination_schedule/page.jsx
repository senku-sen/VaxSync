// ============================================
// HEALTH WORKER VACCINATION SCHEDULE PAGE
// ============================================
// Schedule vaccination sessions for barangay
// Health workers can create new vaccination sessions
// ============================================

"use client";

import Sidebar from "../../../../components/Sidebar";
import Header from "../../../../components/Header";
import ScheduleSessionModal from "../../../../components/ScheduleSessionModal";
import ScheduleConfirmationModal from "../../../../components/ScheduleConfirmationModal";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { loadUserProfile } from "@/lib/vaccineRequest";
import {
  createVaccinationSession,
  fetchVaccinesForSession,
  getVaccineName
} from "@/lib/vaccinationSession";

export default function VaccinationSchedule({
  title = "Vaccination Schedule",
  subtitle = "Schedule vaccination sessions and track progress",
}) {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Confirmation modal visibility state
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  
  // Confirmation modal data
  const [confirmationData, setConfirmationData] = useState(null);
  
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
      // Load user profile and vaccines in parallel
      const [profile, vaccinesResult] = await Promise.all([
        loadUserProfile(),
        fetchVaccinesForSession()
      ]);
      
      if (profile) {
        setUserProfile(profile);
        console.log('User profile loaded:', profile);
      }

      if (vaccinesResult.success) {
        setVaccines(vaccinesResult.data);
      } else {
        setError(vaccinesResult.error);
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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
      const result = await createVaccinationSession({
        barangay_id: userProfile.barangays.id,
        vaccine_id: formData.vaccine_id,
        session_date: formData.date,
        session_time: formData.time,
        target: parseInt(formData.target),
        created_by: userProfile.id
      });

      if (result.success) {
        // Show confirmation modal
        const vaccineName = getVaccineName(formData.vaccine_id, vaccines);
        setConfirmationData({
          barangayName: userProfile.barangays.name,
          date: formData.date,
          time: formData.time,
          vaccineName: vaccineName,
          target: formData.target
        });
        setIsConfirmationOpen(true);
        
        // Reset form
        setFormData({ date: "", time: "", vaccine_id: "", target: "" });
        setIsModalOpen(false);
      } else {
        console.error('Error creating session:', result.error);
        alert('Error: ' + result.error);
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
          <ScheduleSessionModal
            isOpen={isModalOpen}
            onClose={handleCancel}
            onSubmit={handleSubmit}
            barangayName={userProfile?.barangays?.name || "Not assigned"}
            vaccines={vaccines}
            isSubmitting={isSubmitting}
            formData={formData}
            errors={errors}
            onFormChange={(newFormData) => {
              setFormData(newFormData);
              // Clear errors when user starts typing
              Object.keys(newFormData).forEach(key => {
                if (errors[key] && newFormData[key]) {
                  setErrors(prev => ({ ...prev, [key]: '' }));
                }
              });
            }}
          />

          {/* Schedule Confirmation Modal */}
          <ScheduleConfirmationModal
            isOpen={isConfirmationOpen}
            onClose={() => setIsConfirmationOpen(false)}
            sessionData={confirmationData}
            vaccineInfo={confirmationData ? vaccines.find(v => v.id === formData.vaccine_id) : null}
          />
        </main>
      </div>
    </div>
  );
}
