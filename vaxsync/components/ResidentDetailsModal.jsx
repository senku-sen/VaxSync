// ============================================
// RESIDENT DETAILS MODAL
// ============================================
// Modal for viewing complete resident information
// Includes vaccines given, missed vaccines, and session dates
// ============================================

"use client";

import { useState, useEffect } from "react";
import { X, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResidentDetailsModal({
  isOpen,
  onClose,
  resident = null
}) {
  const [vaccineHistory, setVaccineHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load vaccine history from session_beneficiaries
  useEffect(() => {
    if (isOpen && resident?.id) {
      loadVaccineHistory();
    }
  }, [isOpen, resident?.id]);

  const loadVaccineHistory = async () => {
    setIsLoading(true);
    try {
      // Fetch session beneficiaries for this resident
      const { data: beneficiaries, error: beneficiariesError } = await supabase
        .from('session_beneficiaries')
        .select(`
          id,
          session_id,
          vaccine_name,
          attended,
          vaccinated,
          created_at,
          vaccination_sessions (
            id,
            session_date,
            session_time,
            vaccine_id,
            target,
            administered,
            status,
            barangay_vaccine_inventory (
              vaccine_id,
              vaccine_doses (
                vaccine_id,
                vaccines (
                  id,
                  name
                )
              )
            )
          )
        `)
        .eq('resident_id', resident.id)
        .order('created_at', { ascending: false });

      if (beneficiariesError) {
        console.error('Error fetching vaccine history:', beneficiariesError);
        setVaccineHistory([]);
        return;
      }

      // For custom vaccines (session_id = null), determine if it's a missed vaccine or already received
      const enrichedBeneficiaries = (beneficiaries || []).map((record) => {
        if (!record.session_id) {
          // This is a custom vaccine record
          // Mark as missed only if attended=false and vaccinated=false (not vaccinated status with missed sessions)
          // Otherwise it's a custom vaccine that was already received (partially or fully vaccinated)
          return {
            ...record,
            isCustom: true,
            isMissed: record.attended === false && record.vaccinated === false,
          };
        }
        return record;
      });

      setVaccineHistory(enrichedBeneficiaries);
    } catch (err) {
      console.error('Error loading vaccine history:', err);
      setVaccineHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !resident) {
    return null;
  }

  // Parse vaccines given and missed vaccines
  const vaccinesGiven = Array.isArray(resident.vaccines_given) ? resident.vaccines_given : [];
  const missedVaccines = Array.isArray(resident.missed_schedule_of_vaccine) ? resident.missed_schedule_of_vaccine : [];

  // Get the most recent vaccination date from history
  const getMostRecentVaccinationDate = () => {
    if (vaccineHistory.length === 0) return null;
    
    // Find the most recent vaccinated record (attended=true and vaccinated=true)
    const vaccinatedRecords = vaccineHistory.filter(v => v.attended === true && v.vaccinated === true);
    if (vaccinatedRecords.length === 0) return null;
    
    // Get the first one (since history is ordered by created_at descending)
    const mostRecent = vaccinatedRecords[0];
    const sessionDate = mostRecent.vaccination_sessions?.session_date || mostRecent.created_at;
    return sessionDate;
  };

  const mostRecentVaccineDate = getMostRecentVaccinationDate();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#4A7C59] to-[#3E6B4D] p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{resident.name}</h2>
            <p className="text-green-100 mt-1">{resident.barangay || "N/A"}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Sex</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{resident.sex || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Birthday</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {resident.birthday ? new Date(resident.birthday).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Status</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
                {resident.status || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Date of Vaccine</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {mostRecentVaccineDate ? new Date(mostRecentVaccineDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>

          {/* Vaccines Given - Summary */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              All Vaccines Received
            </h3>
            
            {/* Get all vaccinated records from history */}
            {vaccineHistory.filter(v => v.attended === true && v.vaccinated === true).length > 0 ? (
              <div className="space-y-3">
                {vaccineHistory
                  .filter(v => v.attended === true && v.vaccinated === true)
                  .map((record, index) => {
                    const vaccineName = record.vaccination_sessions?.barangay_vaccine_inventory?.vaccine_doses?.vaccines?.name || record.vaccine_name || "Unknown Vaccine";
                    const sessionDate = record.vaccination_sessions?.session_date || record.created_at;
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 capitalize">
                            {vaccineName}
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Received: {sessionDate ? new Date(sessionDate).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                          ✓ Vaccinated
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : vaccinesGiven.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">Recorded vaccines:</p>
                <div className="flex flex-wrap gap-2">
                  {vaccinesGiven.map((vaccine, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {vaccine.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No vaccines received yet</p>
            )}
          </div>

          {/* Missed Vaccines */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-600" />
              Missed Vaccines
            </h3>
            {vaccineHistory.filter(v => v.isCustom && v.attended === false && v.vaccinated === false).length > 0 ? (
              <div className="space-y-2">
                {vaccineHistory.filter(v => v.isCustom && v.attended === false && v.vaccinated === false).map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold text-orange-900 capitalize">
                        {record.vaccine_name || "Custom Vaccine"}
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        {record.created_at ? new Date(record.created_at).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : missedVaccines.length > 0 ? (
              <div className="space-y-2">
                {missedVaccines.map((vaccine, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold text-orange-900 capitalize">
                        {vaccine}
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        Added to missed schedule
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No missed vaccines</p>
            )}
          </div>

          {/* Vaccination History */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Vaccination History
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#4A7C59] border-t-transparent"></div>
              </div>
            ) : vaccineHistory.length > 0 ? (
              <div className="space-y-3">
                {vaccineHistory.map((record) => {
                  // For custom vaccines (no session), show the date from beneficiary creation
                  const isCustom = record.isCustom || !record.session_id;
                  const vaccineName = record.vaccination_sessions?.barangay_vaccine_inventory?.vaccine_doses?.vaccines?.name || record.vaccine_name || (isCustom ? "Custom Vaccine" : "Unknown Vaccine");
                  const sessionDate = record.vaccination_sessions?.session_date || record.created_at;
                  const sessionTime = record.vaccination_sessions?.session_time;
                  const sessionStatus = record.vaccination_sessions?.status || (isCustom ? "Custom" : "Unknown");

                  return (
                    <div
                      key={record.id}
                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                        record.isMissed ? "border-orange-200 bg-orange-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {vaccineName}
                            {record.isMissed && <span className="text-xs text-orange-600 ml-2">(Missed)</span>}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <Calendar size={14} className="inline mr-1" />
                            {sessionDate 
                              ? new Date(sessionDate).toLocaleDateString()
                              : "N/A"
                            }
                            {sessionTime && (
                              <> at {sessionTime}</>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {record.attended ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Attended
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                              Not Attended
                            </span>
                          )}
                          {record.vaccinated ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              Vaccinated
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              Not Vaccinated
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Session Status: <span className="font-medium capitalize">{sessionStatus}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No vaccination history found</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3E6B4D] transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
