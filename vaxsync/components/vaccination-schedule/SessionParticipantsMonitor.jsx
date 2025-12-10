// ============================================
// SESSION PARTICIPANTS MONITOR
// ============================================
// Component to view and update participant vaccination status
// ============================================

"use client";

import { useState, useEffect } from "react";
import { Check, X, Edit2, Trash2, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  fetchSessionBeneficiaries,
  updateBeneficiaryStatus,
  removeBeneficiaryFromSession,
  getSessionStatistics,
  updateResidentVaccineStatus,
  removeVaccineFromResident,
  addMissedVaccineToResident
} from "@/lib/sessionBeneficiaries";
import { updateSessionAdministered } from "@/lib/vaccinationSession";
import { deductBarangayVaccineInventory, addBackBarangayVaccineInventory, deductMainVaccineInventory, addMainVaccineInventory } from "@/lib/barangayVaccineInventory";
import { updateMonthlyReportOutCount } from "@/lib/vaccineMonthlyReport";
import AddParticipantsModal from "./AddParticipantsModal";

export default function SessionParticipantsMonitor({
  sessionId,
  barangayName,
  barangayId,
  vaccineName,
  vaccineId,
  target = 0,
  sessionStatus = "Scheduled",
  onAdministeredCountChange = null,
  isHeadNurse = false
}) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [actualVaccineId, setActualVaccineId] = useState(null);

  useEffect(() => {
    if (sessionId) {
      loadData();
      // Fetch the actual vaccine ID from the session
      fetchActualVaccineId();
    }
  }, [sessionId]);

  const fetchActualVaccineId = async () => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('vaccination_sessions')
        .select('barangay_vaccine_inventory:vaccine_id(vaccine_doses:vaccine_id(vaccine_id))')
        .eq('id', sessionId)
        .single();

      if (!sessionError && session?.barangay_vaccine_inventory?.vaccine_doses?.vaccine_id) {
        setActualVaccineId(session.barangay_vaccine_inventory.vaccine_doses.vaccine_id);
        console.log('Actual vaccine ID:', session.barangay_vaccine_inventory.vaccine_doses.vaccine_id);
      }
    } catch (err) {
      console.error('Error fetching actual vaccine ID:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [beneficiariesResult, statsResult] = await Promise.all([
        fetchSessionBeneficiaries(sessionId),
        getSessionStatistics(sessionId)
      ]);

      if (beneficiariesResult.success) {
        setBeneficiaries(beneficiariesResult.data);
      } else {
        setError(beneficiariesResult.error);
      }

      if (statsResult.success) {
        setStatistics(statsResult.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cycle through states: null → true → false → null
  const getNextState = (currentState) => {
    if (currentState === null) return true;
    if (currentState === true) return false;
    return null;
  };

  const handleToggleAttended = async (beneficiary) => {
    try {
      const newAttendedStatus = getNextState(beneficiary.attended);
      const updateData = { attended: newAttendedStatus };
      
      // If setting attended to false, also set vaccinated to false
      if (newAttendedStatus === false && beneficiary.vaccinated) {
        updateData.vaccinated = false;
      }
      
      const result = await updateBeneficiaryStatus(beneficiary.id, updateData);

      if (result.success) {
        await loadData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleVaccinated = async (beneficiary) => {
    try {
      const newVaccinatedStatus = getNextState(beneficiary.vaccinated);
      const updateData = { vaccinated: newVaccinatedStatus };
      
      // If setting vaccinated to true, also set attended to true
      if (newVaccinatedStatus === true && !beneficiary.attended) {
        updateData.attended = true;
      }
      
      const result = await updateBeneficiaryStatus(beneficiary.id, updateData);

      if (result.success) {
        await loadData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper to render status icon with three states
  const renderStatusIcon = (value, label) => {
    if (value === null) {
      return <span className="text-2xl text-gray-400">?</span>;
    }
    if (value === true) {
      return <Check size={24} className="text-green-600" />;
    }
    return <X size={24} className="text-red-600" />;
  };

  // Get overall status: both approved = ✓, both rejected = ✕, otherwise = ?
  const getOverallStatus = (beneficiary) => {
    if (beneficiary.attended === true && beneficiary.vaccinated === true) {
      return "approved";
    }
    if (beneficiary.attended === false && beneficiary.vaccinated === false) {
      return "rejected";
    }
    return "pending";
  };

  // Check if actions should be enabled
  const areActionsEnabled = () => {
    return sessionStatus === "In progress" || sessionStatus === "Completed";
  };

  // Approve both attended and vaccinated
  const handleApprove = async (beneficiary) => {
    try {
      // Update beneficiary status with vaccine name
      const result = await updateBeneficiaryStatus(beneficiary.id, {
        attended: true,
        vaccinated: true,
        vaccine_name: vaccineName || beneficiary.vaccine_name
      });

      if (result.success) {
        // Also update resident's vaccine status and add vaccine to vaccines_given
        // Use vaccine_name from beneficiary record if vaccineName prop is not provided
        const vaccineToRecord = vaccineName || beneficiary.vaccine_name;
        
        if (beneficiary.resident_id && vaccineToRecord) {
          const residentUpdateResult = await updateResidentVaccineStatus(
            beneficiary.resident_id,
            vaccineToRecord
          );

          if (!residentUpdateResult.success) {
            console.warn('Warning: Failed to update resident vaccine status:', residentUpdateResult.error);
            // Don't fail the approval if resident update fails - just warn
          }
        } else if (beneficiary.resident_id && !vaccineToRecord) {
          console.warn('Warning: No vaccine name available to record for resident');
        }

        // Increment administered count and update database
        if (statistics) {
          const newAdministeredCount = statistics.vaccinated + 1;
          
          // Update session administered count in database
          const updateResult = await updateSessionAdministered(sessionId, newAdministeredCount);
          
          if (updateResult.success) {
            console.log('✅ Session administered count updated');
            
            // ✅ NOTE: Inventory is already deducted when session is scheduled (based on target)
            // When a beneficiary is approved, we're just using from the reserved inventory
            // No need to deduct again from barangay_vaccine_inventory
            console.log('📊 Using from reserved inventory (already deducted on session schedule)');
          } else {
            console.error('Failed to update session administered count:', updateResult.error);
          }
          
          // Notify parent component
          if (onAdministeredCountChange) {
            onAdministeredCountChange(newAdministeredCount);
          }
        }

        await loadData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Reject both attended and vaccinated
  const handleReject = async (beneficiary) => {
    try {
      const result = await updateBeneficiaryStatus(beneficiary.id, {
        attended: false,
        vaccinated: false
      });

      if (result.success) {
        // Add vaccine to missed_schedule_of_vaccine for the resident
        if (beneficiary.resident_id && vaccineName) {
          const missedVaccineResult = await addMissedVaccineToResident(
            beneficiary.resident_id,
            vaccineName
          );

          if (!missedVaccineResult.success) {
            console.warn('Warning: Failed to add vaccine to missed schedule:', missedVaccineResult.error);
            // Don't fail the rejection if resident update fails - just warn
          }
        }

        // Also remove vaccine from resident if it was previously approved
        if (beneficiary.resident_id && vaccineName && beneficiary.vaccinated === true) {
          const residentUpdateResult = await removeVaccineFromResident(
            beneficiary.resident_id,
            vaccineName
          );

          if (!residentUpdateResult.success) {
            console.warn('Warning: Failed to remove vaccine from resident:', residentUpdateResult.error);
            // Don't fail the rejection if resident update fails - just warn
          }
        }

        // Decrement administered count if was previously approved
        if (statistics && beneficiary.vaccinated === true) {
          const newAdministeredCount = Math.max(0, statistics.vaccinated - 1);
          
          // Update session administered count in database
          const updateResult = await updateSessionAdministered(sessionId, newAdministeredCount);
          
          if (updateResult.success) {
            console.log('✅ Session administered count updated');
            
            // Add back to inventory
            if (barangayId && vaccineId) {
              const addBackResult = await addBackBarangayVaccineInventory(
                barangayId,
                actualVaccineId,
                1
              );
              
              if (addBackResult.success) {
                console.log('✅ Barangay inventory added back');
              } else {
                console.warn('⚠️ Warning: Failed to add back to barangay inventory:', addBackResult.error);
              }
              
              // Also add back to main vaccine inventory
              const mainAddBackResult = await addMainVaccineInventory(actualVaccineId, 1);
              
              if (mainAddBackResult.success) {
                console.log('✅ Main vaccine inventory added back');
              } else {
                console.warn('⚠️ Warning: Failed to add back to main vaccine inventory:', mainAddBackResult.error);
              }
            }
          } else {
            console.error('Failed to update session administered count:', updateResult.error);
          }
          
          // Notify parent component
          if (onAdministeredCountChange) {
            onAdministeredCountChange(newAdministeredCount);
          }
        }

        await loadData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (beneficiaryId) => {
    if (!confirm("Are you sure you want to remove this participant?")) return;

    try {
      // Find the beneficiary to get resident_id and vaccination status
      const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);

      const result = await removeBeneficiaryFromSession(beneficiaryId);

      if (result.success) {
        // Also remove vaccine from resident if it was approved
        if (beneficiary && beneficiary.resident_id && vaccineName && beneficiary.vaccinated === true) {
          const residentUpdateResult = await removeVaccineFromResident(
            beneficiary.resident_id,
            vaccineName
          );

          if (!residentUpdateResult.success) {
            console.warn('Warning: Failed to remove vaccine from resident:', residentUpdateResult.error);
            // Don't fail the removal if resident update fails - just warn
          }
        }

        // Decrement administered count if was approved
        if (statistics && beneficiary && beneficiary.vaccinated === true) {
          const newAdministeredCount = Math.max(0, statistics.vaccinated - 1);
          
          // Update session administered count in database
          const updateResult = await updateSessionAdministered(sessionId, newAdministeredCount);
          
          if (updateResult.success) {
            console.log('✅ Session administered count updated');
            
            // Add back to inventory
            if (barangayId && vaccineId) {
              const addBackResult = await addBackBarangayVaccineInventory(
                barangayId,
                actualVaccineId,
                1
              );
              
              if (addBackResult.success) {
                console.log('✅ Barangay inventory added back');
              } else {
                console.warn('⚠️ Warning: Failed to add back to barangay inventory:', addBackResult.error);
              }
              
              // Also add back to main vaccine inventory
              const mainAddBackResult = await addMainVaccineInventory(actualVaccineId, 1);
              
              if (mainAddBackResult.success) {
                console.log('✅ Main vaccine inventory added back');
              } else {
                console.warn('⚠️ Warning: Failed to add back to main vaccine inventory:', mainAddBackResult.error);
              }
            }
          } else {
            console.error('Failed to update session administered count:', updateResult.error);
          }
          
          // Notify parent component
          if (onAdministeredCountChange) {
            onAdministeredCountChange(newAdministeredCount);
          }
        }

        await loadData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4A7C59] to-[#3E6B4D] p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">{vaccineName} - Participants</h3>
            <p className="text-sm text-green-100 mt-1">
              {barangayName}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={isHeadNurse}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              isHeadNurse
                ? "bg-gray-300 text-gray-600 cursor-not-allowed opacity-50"
                : "bg-white text-[#4A7C59] hover:bg-green-50 cursor-pointer"
            }`}
            title={isHeadNurse ? "Head Nurse can only view participant details" : "Add participants to this session"}
          >
            <Plus size={18} />
            Add Participants
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{target}</p>
            <p className="text-sm text-gray-600">Target</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{statistics.attended}</p>
            <p className="text-sm text-gray-600">Attended</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.vaccinated}</p>
            <p className="text-sm text-gray-600">Vaccinated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{statistics.missed}</p>
            <p className="text-sm text-gray-600">Missed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{statistics.vaccinationRate}%</p>
            <p className="text-sm text-gray-600">Vaccination Rate</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Participants Table */}
      <div className="overflow-x-auto">
        {beneficiaries.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Resident Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Birthday
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Vaccination Status
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((beneficiary, index) => {
                const isResidentApproved = beneficiary.residents?.status === "approved";
                const isUnapproved = beneficiary.residents?.status === "pending";
                
                return (
                <tr
                  key={beneficiary.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isUnapproved ? "border-l-4 border-yellow-400" : ""}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {isUnapproved && (
                        <AlertCircle size={18} className="text-yellow-600 flex-shrink-0" title="Resident not yet approved by Head Nurse" />
                      )}
                      {beneficiary.residents?.name || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {beneficiary.residents?.birthday || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      {getOverallStatus(beneficiary) === "approved" ? (
                        <Check size={20} className="text-green-600" />
                      ) : getOverallStatus(beneficiary) === "rejected" ? (
                        <X size={20} className="text-red-600" />
                      ) : (
                        <span className="text-2xl text-gray-400">?</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleApprove(beneficiary)}
                        disabled={!areActionsEnabled() || isUnapproved || isHeadNurse}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          areActionsEnabled() && !isUnapproved && !isHeadNurse
                            ? "bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                        title={isHeadNurse ? "Head Nurse can only view participant details" : isUnapproved ? "Resident must be approved by Head Nurse first" : areActionsEnabled() ? "Approve (Attended & Vaccinated)" : "Session must be 'In progress' or 'Completed'"}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleReject(beneficiary)}
                        disabled={!areActionsEnabled() || isUnapproved || isHeadNurse}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          areActionsEnabled() && !isUnapproved && !isHeadNurse
                            ? "bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                        title={isHeadNurse ? "Head Nurse can only view participant details" : isUnapproved ? "Resident must be approved by Head Nurse first" : areActionsEnabled() ? "Reject (Not Attended & Not Vaccinated)" : "Session must be 'In progress' or 'Completed'"}
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => handleRemove(beneficiary.id)}
                        disabled={!areActionsEnabled() || isHeadNurse}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          areActionsEnabled() && !isHeadNurse
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                        title={isHeadNurse ? "Head Nurse can only view participant details" : areActionsEnabled() ? "Remove participant" : "Session must be 'In progress' or 'Completed'"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">No participants added yet</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#4A7C59] text-white px-4 py-2 rounded-lg hover:bg-[#3E6B4D] transition-colors font-medium"
            >
              <Plus size={18} />
              Add First Participant
            </button>
          </div>
        )}
      </div>

      {/* Add Participants Modal */}
      <AddParticipantsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sessionId={sessionId}
        barangayName={barangayName}
        onSuccess={loadData}
        target={target}
        currentBeneficiaryCount={beneficiaries?.length || 0}
      />
    </div>
  );
}
