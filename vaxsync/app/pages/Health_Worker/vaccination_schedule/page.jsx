// ============================================
// HEALTH WORKER VACCINATION SCHEDULE PAGE
// ============================================
// Schedule vaccination sessions for barangay
// Health workers can create new vaccination sessions
// ============================================

"use client";

import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import ScheduleSessionModalWithParticipants from "../../../../components/vaccination-schedule/ScheduleSessionModalWithParticipants";
import ScheduleConfirmationModal from "../../../../components/vaccination-schedule/ScheduleConfirmationModal";
import EditSessionModal from "../../../../components/vaccination-schedule/EditSessionModal";
import UpdateAdministeredModal from "../../../../components/vaccination-schedule/UpdateAdministeredModal";
import ConfirmDialog from "../../../../components/dialogs/ConfirmDialog";
import SessionCalendar from "../../../../components/vaccination-schedule/SessionCalendar";
import SearchBar from "../../../../components/shared/SearchBar";
import SessionsContainer from "../../../../components/vaccination-schedule/SessionsContainer";
import SessionPerformanceCards from "../../../../components/vaccination-schedule/SessionPerformanceCards";
import SessionParticipantsMonitor from "../../../../components/vaccination-schedule/SessionParticipantsMonitor";
import { addBeneficiariesToSession } from "@/lib/sessionBeneficiaries";
import { Plus, Calendar, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { loadUserProfile } from "@/lib/vaccineRequest";
import { calculateVialsNeeded, VACCINE_VIAL_MAPPING } from "@/lib/vaccineVialMapping";
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
import { deductBarangayVaccineInventory, addBackBarangayVaccineInventory, addMainVaccineInventory, deductMainVaccineInventory, reserveBarangayVaccineInventory, releaseBarangayVaccineReservation } from "@/lib/barangayVaccineInventory";

export default function VaccinationSchedule() {
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
  // Store original administered count BEFORE modal opens (for calculating difference)
  const [originalAdministeredCount, setOriginalAdministeredCount] = useState(0);
  
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

  // Status filter state
  const [statusFilter, setStatusFilter] = useState(null);
  
  // Form data state - now supports multiple vaccines
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    vaccines: [{ vaccine_id: "", target: "" }]
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to track which session is selected for participant management
  const [selectedSessionForParticipants, setSelectedSessionForParticipants] = useState(null);

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
    // Store the ORIGINAL administered count BEFORE opening modal
    setOriginalAdministeredCount(session.administered || 0);
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
        // ⚠️ IMPORTANT: Use originalAdministeredCount (stored when modal opened)
        // NOT updatingSession.administered (which gets updated as user types)
        const previousAdministered = originalAdministeredCount;
        const newAdministered = updatedSession.administered;
        const administeredDifference = newAdministered - previousAdministered;
        
        console.log('🔍 INVENTORY CALCULATION:', {
          originalAdministeredCount,
          newAdministered,
          administeredDifference,
          action: administeredDifference > 0 ? 'DEDUCT' : administeredDifference < 0 ? 'ADD BACK' : 'NO CHANGE'
        });

        // Update session in database
        const result = await updateSessionAdministered(
          updatedSession.id,
          updatedSession.administered,
          updatedSession.status
        );

        if (result.success) {
          console.log('Session progress updated successfully');

          // Handle inventory changes based on administered count difference
          if (administeredDifference !== 0) {
            console.log('Updating vaccine inventory:', {
              barangayId: updatedSession.barangay_id,
              vaccineId: updatedSession.vaccine_id,
              difference: administeredDifference,
              action: administeredDifference > 0 ? 'DEDUCT' : 'ADD BACK'
            });

            if (administeredDifference > 0) {
              // INCREASE: Deduct from inventory
              console.log('🔴 DEDUCTING inventory for administered increase:', {
                barangayId: updatedSession.barangay_id,
                vaccineId: updatedSession.vaccine_id,
                quantityToDeduct: administeredDifference
              });

              // 1. Deduct from barangay inventory
              const deductResult = await deductBarangayVaccineInventory(
                updatedSession.barangay_id,
                updatedSession.vaccine_id,
                administeredDifference
              );

              if (deductResult.success) {
                console.log('✅ Barangay vaccine inventory deducted successfully');
              } else {
                console.warn('❌ Warning: Failed to deduct from barangay inventory:', deductResult.error);
              }

              // 2. Deduct from main vaccine tables (vaccines and vaccine_doses)
              const mainDeductResult = await deductMainVaccineInventory(
                updatedSession.vaccine_id,
                administeredDifference
              );

              if (mainDeductResult.success) {
                console.log('✅ Main vaccine inventory deducted successfully');
              } else {
                console.warn('❌ Warning: Failed to deduct from main vaccine inventory:', mainDeductResult.error);
              }
            } else {
              // DECREASE: Add back to inventory
              const quantityToAddBack = Math.abs(administeredDifference);

              console.log('🟢 ADDING BACK inventory for administered decrease:', {
                barangayId: updatedSession.barangay_id,
                vaccineId: updatedSession.vaccine_id,
                quantityToAddBack
              });

              // 1. Add back to barangay inventory
              const addBackResult = await addBackBarangayVaccineInventory(
                updatedSession.barangay_id,
                updatedSession.vaccine_id,
                quantityToAddBack
              );

              if (addBackResult.success) {
                console.log('✅ Barangay vaccine inventory added back successfully');
              } else {
                console.warn('❌ Warning: Failed to add back to barangay inventory:', addBackResult.error);
              }

              // 2. Add back to main vaccine tables (vaccines and vaccine_doses)
              const mainAddBackResult = await addMainVaccineInventory(
                updatedSession.vaccine_id,
                quantityToAddBack
              );

              if (mainAddBackResult.success) {
                console.log('Main vaccine inventory added back successfully');
              } else {
                console.warn('Warning: Failed to add back to main vaccine inventory:', mainAddBackResult.error);
              }
            }
          }

          setIsUpdateProgressOpen(false);
          setUpdatingSession(null);
          
          // Reload sessions to reflect inventory changes
          console.log('Reloading sessions after inventory update...');
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

  // Handle manage participants
  const handleManageParticipants = (session) => {
    setSelectedSessionForParticipants(session);
  };

  // Filter sessions based on search term and status
  const filteredSessions = sessions.filter((session) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (session.barangays?.name || "").toLowerCase().includes(term) ||
      (session.vaccines?.name || "").toLowerCase().includes(term) ||
      (session.session_date || "").includes(searchTerm);
    
    const matchesStatus = !statusFilter || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

    // Validate vaccines array
    if (!formData.vaccines || formData.vaccines.length === 0) {
      newErrors.vaccines = "At least one vaccine is required";
    } else {
      formData.vaccines.forEach((vaccine, index) => {
        if (!vaccine.vaccine_id) {
          newErrors[`vaccine_${index}`] = "Please select a vaccine";
        }
        if (!vaccine.target) {
          newErrors[`target_${index}`] = "Target is required";
        }
      });
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

  // Handle form submission - now creates multiple sessions
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
      const createdSessions = [];
      
      // Create a session for each vaccine
      for (let i = 0; i < formData.vaccines.length; i++) {
        const vaccine = formData.vaccines[i];
        
        const result = await createVaccinationSession({
          barangay_id: userProfile.barangays.id,
          vaccine_id: vaccine.vaccine_id,
          session_date: formData.date,
          session_time: formData.time,
          target: parseInt(vaccine.target),
          created_by: userProfile.id
        });

        if (result.success) {
          createdSessions.push({
            vaccineName: getVaccineName(vaccine.vaccine_id, vaccines),
            target: vaccine.target,
            sessionId: result.data?.id
          });

          // Add selected participants to the session
          if (vaccine.selectedParticipants && vaccine.selectedParticipants.length > 0) {
            const participantsResult = await addBeneficiariesToSession(
              result.data.id,
              vaccine.selectedParticipants
            );
            
            if (participantsResult.success) {
              console.log(`✅ Added ${participantsResult.data.length} participants to session`);
            } else {
              console.warn(`⚠️ Warning: Failed to add participants:`, participantsResult.error);
            }
          }

          // Reserve vaccine vials for this session
          // Calculate vials needed based on vaccine type and target people
          const vaccineName = getVaccineName(vaccine.vaccine_id, vaccines);
          const dosesPerVial = VACCINE_VIAL_MAPPING[vaccineName] || 10;
          const vialsNeeded = calculateVialsNeeded(vaccineName, parseInt(vaccine.target));

          console.log(`Attempting to reserve vials for ${vaccineName}:`, {
            barangayId: userProfile.barangays.id,
            vaccineId: vaccine.vaccine_id,
            target: vaccine.target,
            dosesPerVial,
            vialsNeeded
          });

          const reserveResult = await reserveBarangayVaccineInventory(
            userProfile.barangays.id,
            vaccine.vaccine_id,
            vialsNeeded
          );

          if (reserveResult.success) {
            console.log(`✅ Vaccine vials reserved for ${vaccineName}: ${vialsNeeded} vials`);
          } else {
            console.warn(`⚠️ Warning: Failed to reserve vaccine vials for ${vaccineName}:`, {
              error: reserveResult.error,
              vialsNeeded,
              barangayId: userProfile.barangays.id,
              vaccineId: vaccine.vaccine_id
            });
            // Don't fail session creation if reservation fails
            // Reservation is optional - session can still be created
          }
        } else {
          throw new Error(`Failed to create session for ${getVaccineName(vaccine.vaccine_id, vaccines)}: ${result.error}`);
        }
      }

      // Show confirmation modal with all created sessions
      setConfirmationData({
        barangayName: userProfile.barangays.name,
        date: formData.date,
        time: formData.time,
        sessions: createdSessions,
        isMultiple: createdSessions.length > 1
      });
      setIsConfirmationOpen(true);
      
      // Reset form
      setFormData({ date: "", time: "", vaccines: [{ vaccine_id: "", target: "", selectedParticipants: [] }] });
      setIsModalOpen(false);
      
      // Reload sessions
      await reloadSessions();
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ date: "", time: "", vaccines: [{ vaccine_id: "", target: "", selectedParticipants: [] }] });
    setErrors({});
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title="Vaccination Schedule" subtitle="Schedule vaccination sessions and track progress" />

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
              {/* Session Performance Cards */}
              <SessionPerformanceCards 
                sessions={sessions}
                userRole={userProfile?.user_role}
                userBarangayId={userProfile?.barangays?.id}
              />

              {/* Status Filter Buttons */}
              <div className="mb-6 flex flex-wrap gap-2">
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

              {/* Sessions Container */}
              <SessionsContainer
                sessions={filteredSessions}
                onEdit={handleEditSession}
                onDelete={handleDeleteSession}
                onUpdateProgress={handleUpdateProgress}
                onManageParticipants={handleManageParticipants}
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
          <ScheduleSessionModalWithParticipants
            isOpen={isModalOpen}
            onClose={handleCancel}
            onSubmit={handleSubmit}
            barangayName={userProfile?.barangays?.name || "Not assigned"}
            barangayId={userProfile?.barangays?.id}
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
