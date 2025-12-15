"use client";

import { useState, useEffect } from "react";
import { Check, WifiOff } from "lucide-react";
import { useOffline } from "@/components/OfflineProvider";
import { cacheData, getCachedData } from "@/lib/offlineStorage";

export default function Step2SessionSelector({
  sessionType, // 'past' or 'upcoming'
  formData,
  onFormDataChange,
  selectedBarangay,
  isLoading,
  fieldName,
}) {
  const { isOnline } = useOffline();
  const [sessions, setSessions] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const cacheKey = `sessions_${sessionType}_${selectedBarangay || 'all'}`;

  useEffect(() => {
    fetchSessions();
  }, [sessionType, selectedBarangay, isOnline]);

  const fetchSessions = async () => {
    setLoadingSession(true);
    setError(null);

    // Check actual online status
    const actuallyOnline = typeof navigator !== 'undefined' 
      ? (navigator.onLine && isOnline) 
      : isOnline;

    if (actuallyOnline) {
      try {
        const status =
          sessionType === "past"
            ? "Completed"
            : "Scheduled,In progress";

        const url = `/api/VaccinationSessions?status=${encodeURIComponent(status)}&barangay=${encodeURIComponent(selectedBarangay || "")}`;
        console.log("Fetching sessions from:", url);

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch sessions (${response.status})`);
        }

        const data = await response.json();
        console.log("Sessions response:", data);
        
        const sessionData = data.data || [];
        setSessions(sessionData);
        setIsFromCache(false);

        // Cache for offline use
        if (sessionData.length > 0) {
          await cacheData(cacheKey, sessionData, 'sessions');
        }

        if (sessionData.length === 0) {
          setError(
            sessionType === "past"
              ? "No past sessions available"
              : "No upcoming sessions available"
          );
        }
      } catch (err) {
        console.log("Failed to fetch sessions, trying cache:", err.message);
        await loadFromCache();
      }
    } else {
      // Offline - try to load from cache
      await loadFromCache();
    }
    
    setLoadingSession(false);
  };

  const loadFromCache = async () => {
    try {
      const cached = await getCachedData(cacheKey);
      if (cached && cached.length > 0) {
        setSessions(cached);
        setIsFromCache(true);
        console.log("Loaded sessions from cache");
        return;
      }
    } catch (err) {
      console.log("Cache retrieval failed:", err.message);
    }
    
    // No cache available
    setSessions([]);
    if (!isOnline) {
      // Don't show error when offline - just inform the user they can skip this
      setError(null);
    } else {
      setError(
        sessionType === "past"
          ? "No past sessions available"
          : "No upcoming sessions available"
      );
    }
  };

  const selectedValue = formData[fieldName] || [];
  const selectedSessions = Array.isArray(selectedValue) ? selectedValue : [];

  const handleSessionToggle = (session) => {
    const isSelected = selectedSessions.some(s => s.sessionId === session.id);
    
    if (isSelected) {
      // Remove session
      const updated = selectedSessions.filter(s => s.sessionId !== session.id);
      onFormDataChange(fieldName, updated);
    } else {
      // Add session
      const updated = [...selectedSessions, {
        sessionId: session.id,
        vaccineName: session.vaccine_name,
        sessionDate: session.date,
        barangayName: session.barangay,
      }];
      onFormDataChange(fieldName, updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Offline indicator */}
      {!isOnline && isFromCache && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <WifiOff className="w-3 h-3" />
          <span>Offline - showing cached sessions</span>
        </div>
      )}

      {loadingSession && (
        <div className="flex justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent" />
        </div>
      )}

      {error && (
        <div className={`p-4 border rounded-lg ${
          error.includes("offline") 
            ? "bg-amber-50 border-amber-200" 
            : "bg-red-50 border-red-200"
        }`}>
          <p className={`text-sm ${
            error.includes("offline") ? "text-amber-900" : "text-red-900"
          }`}>{error}</p>
        </div>
      )}

      {!loadingSession && sessions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-medium">
            {sessionType === "past" ? "Select past sessions" : "Select upcoming sessions (you can select multiple)"}
          </p>
          {sessions.map((session) => {
            const isSelected = selectedSessions.some(s => s.sessionId === session.id);
            return (
              <button
                key={session.id}
                onClick={() => handleSessionToggle(session)}
                disabled={isLoading || loadingSession}
                className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${
                  isSelected
                    ? "border-[#3E5F44] bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                } cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                  isSelected
                    ? "border-[#3E5F44] bg-[#3E5F44]"
                    : "border-gray-300"
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {session.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <p>
                      <span className="font-semibold">Date:</span>{" "}
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold">Vaccine:</span>{" "}
                      {session.vaccine_name}
                    </p>
                    <p>
                      <span className="font-semibold">Barangay:</span>{" "}
                      {session.barangay}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loadingSession && sessions.length === 0 && !error && (
        <div className={`p-4 border rounded-lg ${!isOnline ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
          {!isOnline ? (
            <div className="flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">You're offline</p>
                <p className="text-sm text-amber-700 mt-1">
                  No cached sessions available. You can skip this step and assign a session later when you're back online.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No sessions available</p>
          )}
        </div>
      )}
    </div>
  );
}
