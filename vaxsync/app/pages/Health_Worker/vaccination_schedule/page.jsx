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
import EditSessionModal from "../../../../components/EditSessionModal";
import UpdateAdministeredModal from "../../../../components/UpdateAdministeredModal";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import SessionCalendar from "../../../../components/SessionCalendar";
import SearchBar from "../../../../components/SearchBar";
import SessionsContainer from "../../../../components/SessionsContainer";
import { Plus, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { loadUserProfile } from "@/lib/vaccineRequest";
import {
  createVaccinationSession,
  fetchVaccinationSessions,
  fetchVaccinesForSession,
  getVaccineName,
  deleteVaccinationSession,
  updateVaccinationSession,
  updateSessionAdministered,
  updateSessionStatus
} from "@/lib/vaccinationSession";

export default function VaccinationSchedule({
  title = "Vaccination Schedule",
  subtitle = "Schedule vaccination sessions and track progress",
}) {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Calendar view state - true = calendar, false = table
  const [isCalendarView, setIsCalendarView] = useState(false);
  
  // Edit modal visibility state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit modal data
  const [editingSession, setEditingSession] = useState(null);
  
  // Update progress modal state
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [updatingSession, setUpdatingSession] = useState(null);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDangerous: false
  });
  
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

  // Handle edit session - open modal
  const handleEditSession = (session) => {
    console.log('Edit session:', session);
    setEditingSession(session);
    setIsEditModalOpen(true);
  };

  // Handle edit session submission
  const handleEditSessionSubmit = async (updatedSession, action) => {
    if (action === 'submit') {
      // Validate form
      if (!updatedSession.session_date || !updatedSession.session_time || !updatedSession.vaccine_id || !updatedSession.target) {
        alert('Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await updateVaccinationSession(updatedSession.id, {
          session_date: updatedSession.session_date,
          session_time: updatedSession.session_time,
          vaccine_id: updatedSession.vaccine_id,
          target: updatedSession.target
        });

        if (result.success) {
          console.log('Session updated successfully');
          setIsEditModalOpen(false);
          setEditingSession(null);
          await reloadSessions();
          alert('Session updated successfully');
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
      setEditingSession(updatedSession);
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
        const result = await updateSessionAdministered(
          updatedSession.id,
          updatedSession.administered,
          updatedSession.status
        );

        if (result.success) {
          console.log('Session progress updated successfully');
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

  // Handle delete session
  const handleDeleteSession = (sessionId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Session",
      message: "Are you sure you want to delete this vaccination session? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDangerous: true,
      onConfirm: async () => {
        try {
          const result = await deleteVaccinationSession(sessionId);
          if (result.success) {
            console.log('Session deleted successfully');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            await reloadSessions();
            alert('Session deleted successfully');
          } else {
            alert('Error deleting session: ' + result.error);
          }
        } catch (err) {
          console.error('Error deleting session:', err);
          alert('Unexpected error: ' + err.message);
        }
      }
    });
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

          {/* Table View */}
          {!isLoading && !isCalendarView && (
            <>
              {/* Search Bar */}
              <SearchBar
                placeholder="Search by barangay, vaccine, or date..."
                value={searchTerm}
                onChange={setSearchTerm}
              />

              {/* Sessions Container */}
              <SessionsContainer
                sessions={filteredSessions}
                onEdit={handleEditSession}
                onDelete={handleDeleteSession}
                onUpdateProgress={handleUpdateProgress}
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

          {/* Edit Session Modal */}
          <EditSessionModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingSession(null);
            }}
            onSubmit={handleEditSessionSubmit}
            session={editingSession}
            vaccines={vaccines}
            isSubmitting={isSubmitting}
            errors={{}}
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
          />

          {/* Confirm Dialog */}
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText || "Confirm"}
            cancelText={confirmDialog.cancelText || "Cancel"}
            isDangerous={confirmDialog.isDangerous}
            onConfirm={() => {
              confirmDialog.onConfirm();
            }}
            onCancel={() => {
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }}
          />
        </main>
      </div>
    </div>
  );
}
