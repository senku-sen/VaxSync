// ============================================
// SESSION PERFORMANCE SUMMARY CARDS
// ============================================
// Shows total sessions, completed, in-progress, pending
// Filters by barangay for health workers
// Shows all for head nurses
// ============================================

"use client";

import { Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function SessionPerformanceCards({ sessions, userRole, userBarangayId }) {
  // Filter sessions based on user role
  const filteredSessions = userRole === "Rural Health Midwife (RHM)" && userBarangayId
    ? sessions.filter(s => s.barangay_id === userBarangayId)
    : sessions;

  // Calculate statistics
  const totalSessions = filteredSessions.length;
  const completedSessions = filteredSessions.filter(s => s.status === "Completed").length;
  const inProgressSessions = filteredSessions.filter(s => s.status === "In progress").length;
  const scheduledSessions = filteredSessions.filter(s => s.status === "Scheduled").length;

  // Calculate total administered vs target
  const totalAdministered = filteredSessions.reduce((sum, s) => sum + (s.administered || 0), 0);
  const totalTarget = filteredSessions.reduce((sum, s) => sum + (s.target || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalAdministered / totalTarget) * 100) : 0;

  const cards = [
    {
      title: "Total Sessions",
      value: totalSessions,
      icon: Activity,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: completedSessions,
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      iconColor: "text-green-600"
    },
    {
      title: "In Progress",
      value: inProgressSessions,
      icon: Clock,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700",
      iconColor: "text-yellow-600"
    },
    {
      title: "Scheduled",
      value: scheduledSessions,
      icon: AlertCircle,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`${card.bgColor} border ${card.borderColor} rounded-lg p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${card.textColor} opacity-75`}>
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.textColor} mt-1`}>
                    {card.value}
                  </p>
                </div>
                <Icon className={`${card.iconColor} w-8 h-8 opacity-80`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Text */}
      {userRole === "Rural Health Midwife (RHM)" && (
        <p className="text-xs text-gray-500 text-center">
          Showing sessions for your assigned barangay
        </p>
      )}
      {userRole === "Head Nurse" && (
        <p className="text-xs text-gray-500 text-center">
          Showing all sessions across all barangays
        </p>
      )}
    </div>
  );
}
