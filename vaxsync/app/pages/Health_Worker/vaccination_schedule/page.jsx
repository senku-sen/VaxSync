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
import SearchBar from "../../../../components/SearchBar";
import SessionsContainer from "../../../../components/SessionsContainer";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { loadUserProfile } from "@/lib/vaccineRequest";
import {
  createVaccinationSession,
  fetchVaccinationSessions,
  fetchVaccinesForSession,
  getVaccineName,
  deleteVaccinationSession
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
  
  // List of vaccination sessions
  const [sessions, setSessions] = useState([]);
  
  // Search term for filtering sessions
  const [searchTerm, setSearchTerm] = useState("");
  
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
      console.log('Profile loaded:', profile);
      
      if (profile) {
        setUserProfile(profile);
        
        // Load vaccines and sessions in parallel
        const [vaccinesResult, sessionsResult] = await Promise.all([
          fetchVaccinesForSession(),
          fetchVaccinationSessions(profile.id)
        ]);

        console.log('Vaccines result:', vaccinesResult);
        console.log('Sessions result:', sessionsResult);

        if (vaccinesResult.success) {
          setVaccines(vaccinesResult.data);
          console.log('Vaccines set:', vaccinesResult.data);
        } else {
          console.error('Vaccines error:', vaccinesResult.error);
          setError(vaccinesResult.error);
        }

        if (sessionsResult.success) {
          setSessions(sessionsResult.data);
          console.log('Sessions set:', sessionsResult.data);
        } else {
          console.error('Sessions error:', sessionsResult.error);
          setError(sessionsResult.error);
        }
      } else {
        console.warn('No profile found');
        setError('Failed to load user profile');
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload sessions from database
  const reloadSessions = async () => {
    if (userProfile?.id) {
      const result = await fetchVaccinationSessions(userProfile.id);
      if (result.success) {
        setSessions(result.data);
      } else {
        setError(result.error);
      }
    }
  };

  // Handle edit session
  const handleEditSession = (session) => {
    console.log('Edit session:', session);
    // TODO: Implement edit functionality
    // Could open a modal with form pre-filled with session data
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId) => {
    if (confirm('Are you sure you want to delete this session?')) {
      const result = await deleteVaccinationSession(sessionId);
      if (result.success) {
        console.log('Session deleted successfully');
        await reloadSessions();
      } else {
        alert('Error deleting session: ' + result.error);
      }
    }
  };

  // Filter sessions based on search term
  const filteredSessions = sessions.filter((session) => {
    const term = searchTerm.toLowerCase();
    return (
      (session.barangays?.name || "").toLowerCase().includes(term) ||
      (session.vaccines?.name || "").toLowerCase().includes(term) ||
      (session.session_date || "").includes(searchTerm)
    );
  });

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
        
        // Reload sessions
        await reloadSessions();
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

          {/* Search Bar */}
          {!isLoading && (
            <SearchBar
              placeholder="Search by barangay, vaccine, or date..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          )}

          {/* Sessions Container */}
          {!isLoading && (
            <SessionsContainer
              sessions={filteredSessions}
              onEdit={handleEditSession}
              onDelete={handleDeleteSession}
            />
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
