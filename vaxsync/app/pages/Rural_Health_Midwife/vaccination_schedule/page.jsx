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
import SessionPerformanceCards from "../../../../components/vaccination-schedule/SessionPerformanceCards";
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
import SessionParticipantsMonitor from "../../../../components/vaccination-schedule/SessionParticipantsMonitor";
import { X } from "lucide-react";

export default function HeadNurseVaccinationSchedule() {
  const title = "Vaccination Schedule";
  const subtitle = "View and manage all vaccination sessions across barangays";
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

  // State to track which session is selected for participant management
  const [selectedSessionForParticipants, setSelectedSessionForParticipants] = useState(null);
  
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

  // Status filter state
  const [statusFilter, setStatusFilter] = useState(null);
  
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

      // Deduplicate barangays - keep UPPERCASE versions with valid municipality
      const barangayMap = new Map();
      (data || []).forEach(barangay => {
        const normalizedName = barangay.name.toUpperCase();
        const existing = barangayMap.get(normalizedName);
        
        // Prefer barangays that:
        // 1. Are already uppercase
        // 2. Have a valid municipality (not "Unknown")
        const isUppercase = barangay.name === barangay.name.toUpperCase();
        const hasValidMunicipality = barangay.municipality && barangay.municipality.toLowerCase() !== 'unknown';
        
        if (!existing) {
          barangayMap.set(normalizedName, barangay);
        } else {
          const existingIsUppercase = existing.name === existing.name.toUpperCase();
          const existingHasValidMunicipality = existing.municipality && existing.municipality.toLowerCase() !== 'unknown';
          
          // Replace if current is better (uppercase + valid municipality)
          if ((isUppercase && !existingIsUppercase) || 
              (hasValidMunicipality && !existingHasValidMunicipality) ||
              (isUppercase && hasValidMunicipality && (!existingIsUppercase || !existingHasValidMunicipality))) {
            barangayMap.set(normalizedName, barangay);
          }
        }
      });

      // Convert back to array and sort
      const deduplicatedBarangays = Array.from(barangayMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('Deduplicated barangays:', deduplicatedBarangays.length, 'from', data?.length || 0);

      return {
        success: true,
        data: deduplicatedBarangays,
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
          
          // Note: Inventory is already deducted when session is scheduled (based on target)
          // No need to deduct again when updating administered count

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


  // Filter sessions based on search term, selected barangay, and status
  const filteredSessions = sessions.filter((session) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (session.barangays?.name || "").toLowerCase().includes(term) ||
      (session.vaccines?.name || "").toLowerCase().includes(term) ||
      (session.session_date || "").includes(searchTerm);
    
    const matchesBarangay = !selectedBarangay || session.barangay_id === selectedBarangay;
    const matchesStatus = !statusFilter || session.status === statusFilter;
    
    return matchesSearch && matchesBarangay && matchesStatus;
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
      // Get doses_per_person from event (passed by modal) or formData or default to 1
      const dosesPerPerson = e.doses_per_person || formData.doses_per_person || 1;
      
      const result = await createVaccinationSession({
        barangay_id: formData.barangay_id,
        vaccine_id: formData.vaccine_id,
        session_date: formData.date,
        session_time: formData.time,
        target: parseInt(formData.target),
        doses_per_person: dosesPerPerson,
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

  // Handle manage participants
  const handleManageParticipants = (session) => {
    setSelectedSessionForParticipants(session);
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-72">
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

          {/* Session Performance Cards */}
          {!isLoading && !isCalendarView && (
            <SessionPerformanceCards 
              sessions={sessions}
              userRole={userProfile?.user_role}
              userBarangayId={null}
            />
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

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === null
                      ? 'bg-[#4A7C59] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Sessions
                </button>
                <button
                  onClick={() => setStatusFilter("Scheduled")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === "Scheduled"
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  onClick={() => setStatusFilter("In progress")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === "In progress"
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter("Completed")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    statusFilter === "Completed"
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Completed
                </button>
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
                onManageParticipants={handleManageParticipants}
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

          {/* Session Participants Monitor Modal */}
          {selectedSessionForParticipants && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Manage Participants</h2>
                  <button
                    onClick={() => setSelectedSessionForParticipants(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Monitor Component */}
                <div className="p-6">
                  <SessionParticipantsMonitor
                    sessionId={selectedSessionForParticipants.id}
                    barangayName={selectedSessionForParticipants.barangays?.name}
                    barangayId={selectedSessionForParticipants.barangay_id}
                    vaccineName={selectedSessionForParticipants.vaccines?.name}
                    vaccineId={selectedSessionForParticipants.vaccine_id}
                    sessionDate={selectedSessionForParticipants.session_date}
                    target={selectedSessionForParticipants.target}
                    sessionStatus={selectedSessionForParticipants.status}
                    isHeadNurse={true}
                    onAdministeredCountChange={(newCount) => {
                      // Update the session's administered count
                      setSessions(sessions.map(s => 
                        s.id === selectedSessionForParticipants.id 
                          ? { ...s, administered: newCount }
                          : s
                      ));
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
