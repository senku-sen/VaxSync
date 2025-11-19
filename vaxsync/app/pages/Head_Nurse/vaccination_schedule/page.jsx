// ============================================
// HEAD NURSE VACCINATION SCHEDULE PAGE
// ============================================
// View all vaccination sessions across all barangays
// Head nurses can filter by barangay and manage sessions
// ============================================

"use client";

import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import ScheduleSessionModal from "../../../../components/vaccination-schedule/ScheduleSessionModal";
import ScheduleConfirmationModal from "../../../../components/vaccination-schedule/ScheduleConfirmationModal";
import UpdateAdministeredModal from "../../../../components/vaccination-schedule/UpdateAdministeredModal";
import SessionCalendar from "../../../../components/vaccination-schedule/SessionCalendar";
import SearchBar from "../../../../components/shared/SearchBar";
import SessionsContainer from "../../../../components/vaccination-schedule/SessionsContainer";
import { Plus, Calendar, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { loadUserProfile } from "@/lib/vaccineRequest";
import {
  createVaccinationSession,
  fetchAllVaccinationSessions,
  fetchVaccinesForSession,
  getVaccineName,
  updateSessionAdministered
} from "@/lib/vaccinationSession";
import { deductBarangayVaccineInventory } from "@/lib/barangayVaccineInventory";
import { supabase } from "@/lib/supabase";

export default function HeadNurseVaccinationSchedule({
  title = "Vaccination Schedule",
  subtitle = "View and manage all vaccination sessions across barangays",
}) {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Calendar view state - true = calendar, false = table
  const [isCalendarView, setIsCalendarView] = useState(false);
  
  // Update progress modal state
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [updatingSession, setUpdatingSession] = useState(null);
  
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
  
  // List of all vaccination sessions
  const [sessions, setSessions] = useState([]);
  
  // List of all barangays for filtering
  const [barangays, setBarangays] = useState([]);
  
  // Selected barangay filter (null = all barangays)
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  
  // Search term for filtering sessions
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form data state
  const [formData, setFormData] = useState({
    barangay_id: "",
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
        
        // Load vaccines, sessions, and barangays in parallel
        const [vaccinesResult, sessionsResult, barangaysResult] = await Promise.all([
          fetchVaccinesForSession(),
          fetchAllVaccinationSessions(),
          fetchBarangays()
        ]);

        console.log('Vaccines result:', vaccinesResult);
        console.log('Sessions result:', sessionsResult);
        console.log('Barangays result:', barangaysResult);

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

        if (barangaysResult.success) {
          setBarangays(barangaysResult.data);
          console.log('Barangays set:', barangaysResult.data);
        } else {
          console.error('Barangays error:', barangaysResult.error);
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

  // Fetch all barangays
  const fetchBarangays = async () => {
    try {
      const { data, error } = await supabase
        .from("barangays")
        .select("id, name, municipality")
        .order("name");

      if (error) {
        console.error('Error fetching barangays:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Failed to fetch barangays'
        };
      }

      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (err) {
      console.error('Unexpected error in fetchBarangays:', err);
      return {
        success: false,
        data: [],
        error: err.message || 'Unexpected error'
      };
    }
  };

  // Reload sessions from database
  const reloadSessions = async () => {
    const result = await fetchAllVaccinationSessions();
    if (result.success) {
      setSessions(result.data);
    } else {
      setError(result.error);
    }
  };


  // Handle update progress - open modal
  const handleUpdateProgress = (session) => {
    console.log('Update progress for session:', session);
    setUpdatingSession(session);
    setIsUpdateProgressOpen(true);
  };

  // Handle update progress submission
  const handleUpdateProgressSubmit = async (updatedSession, action) => {
    if (action === 'submit') {
      // Validate
      if (updatedSession.administered < 0 || updatedSession.administered > updatedSession.target) {
        alert('Administered count must be between 0 and target');
        return;
      }

      setIsSubmitting(true);
      try {
        // Get previous administered count to calculate difference
        const previousAdministered = updatingSession?.administered || 0;
        const newAdministered = updatedSession.administered;
        const administeredDifference = newAdministered - previousAdministered;

        // Update session in database
        const result = await updateSessionAdministered(
          updatedSession.id,
          updatedSession.administered,
          updatedSession.status
        );

        if (result.success) {
          console.log('Session progress updated successfully');

          // Deduct from barangay vaccine inventory if administered count increased
          if (administeredDifference > 0) {
            console.log('Deducting vaccine from inventory:', {
              barangayId: updatedSession.barangay_id,
              vaccineId: updatedSession.vaccine_id,
              quantityToDeduct: administeredDifference
            });

            const deductResult = await deductBarangayVaccineInventory(
              updatedSession.barangay_id,
              updatedSession.vaccine_id,
              administeredDifference
            );

            if (deductResult.success) {
              console.log('Vaccine inventory deducted successfully');
            } else {
              console.warn('Warning: Failed to deduct from inventory:', deductResult.error);
              // Don't fail the update if inventory deduction fails - just warn
            }
          }

          setIsUpdateProgressOpen(false);
          setUpdatingSession(null);
          await reloadSessions();
          alert('Session progress updated successfully');
        } else {
          alert('Error updating session: ' + result.error);
        }
      } catch (err) {
        console.error('Error updating session:', err);
        alert('Unexpected error: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else if (action === 'update') {
      // Update local state while editing
      setUpdatingSession(updatedSession);
    }
  };


  // Filter sessions based on search term and selected barangay
  const filteredSessions = sessions.filter((session) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (session.barangays?.name || "").toLowerCase().includes(term) ||
      (session.vaccines?.name || "").toLowerCase().includes(term) ||
      (session.session_date || "").includes(searchTerm);
    
    const matchesBarangay = !selectedBarangay || session.barangay_id === selectedBarangay;
    
    return matchesSearch && matchesBarangay;
  });

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!formData.barangay_id) {
      newErrors.barangay_id = "Please select a barangay";
    }

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

    setIsSubmitting(true);
    try {
      const result = await createVaccinationSession({
        barangay_id: formData.barangay_id,
        vaccine_id: formData.vaccine_id,
        session_date: formData.date,
        session_time: formData.time,
        target: parseInt(formData.target),
        created_by: userProfile.id
      });

      if (result.success) {
        // Show confirmation modal
        const barangayName = barangays.find(b => b.id === formData.barangay_id)?.name || "Unknown";
        const vaccineName = getVaccineName(formData.vaccine_id, vaccines);
        setConfirmationData({
          barangayName: barangayName,
          date: formData.date,
          time: formData.time,
          vaccineName: vaccineName,
          target: formData.target
        });
        setIsConfirmationOpen(true);
        
        // Reset form
        setFormData({ barangay_id: "", date: "", time: "", vaccine_id: "", target: "" });
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
    setFormData({ barangay_id: "", date: "", time: "", vaccine_id: "", target: "" });
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

          {/* Action Buttons */}
          {!isLoading && (
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center sm:justify-start gap-2 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-colors whitespace-nowrap w-full sm:w-fit text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                Schedule Session
              </button>
              <button
                onClick={() => setIsCalendarView(!isCalendarView)}
                className="inline-flex items-center justify-center sm:justify-start gap-2 bg-[#4A7C59] hover:bg-[#3E6B4D] text-white font-medium px-4 py-2.5 rounded-lg shadow-md transition-colors whitespace-nowrap w-full sm:w-fit text-sm sm:text-base"
              >
                <Calendar size={18} className="sm:w-5 sm:h-5" />
                {isCalendarView ? 'View Table' : 'View Calendar'}
              </button>
            </div>
          )}

          {/* Barangay Filter and Search */}
          {!isLoading && !isCalendarView && (
            <div className="mb-6 space-y-4">
              {/* Barangay Filter Dropdown */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Filter size={18} />
                  <span>Filter by Barangay:</span>
                </label>
                <select
                  value={selectedBarangay || ""}
                  onChange={(e) => setSelectedBarangay(e.target.value || null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
                >
                  <option value="">All Barangays</option>
                  {barangays.map(barangay => (
                    <option key={barangay.id} value={barangay.id}>
                      {barangay.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <SearchBar
                placeholder="Search by barangay, vaccine, or date..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
          )}

          {/* Table View */}
          {!isLoading && !isCalendarView && (
            <>
              {/* Sessions Container */}
              <SessionsContainer
                sessions={filteredSessions}
                onUpdateProgress={handleUpdateProgress}
                isHeadNurse={true}
              />
            </>
          )}

          {/* Calendar View */}
          {!isLoading && isCalendarView && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <SessionCalendar
                  isOpen={true}
                  onClose={() => setIsCalendarView(false)}
                  sessions={sessions}
                />
              </div>
            </div>
          )}

          {/* Schedule Session Modal */}
          <ScheduleSessionModal
            isOpen={isModalOpen}
            onClose={handleCancel}
            onSubmit={handleSubmit}
            barangayName={null}
            barangayId={null}
            vaccines={vaccines}
            isSubmitting={isSubmitting}
            formData={formData}
            errors={errors}
            barangays={barangays}
            isHeadNurse={true}
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


          {/* Update Progress Modal */}
          <UpdateAdministeredModal
            isOpen={isUpdateProgressOpen}
            onClose={() => {
              setIsUpdateProgressOpen(false);
              setUpdatingSession(null);
            }}
            onSubmit={handleUpdateProgressSubmit}
            session={updatingSession}
            isSubmitting={isSubmitting}
            errors={{}}
            isViewOnly={true}
          />

        </main>
      </div>
    </div>
  );
}
