// ============================================
// SESSIONS CONTAINER COMPONENT
// ============================================
// Container for displaying vaccination sessions
// Shows header with count and table/card views
// ============================================

import SessionsTable from "./SessionsTable";
import SessionsCardList from "./SessionsCardList";

export default function SessionsContainer({
  sessions = [],
  onEdit = () => {},
  onDelete = () => {},
  onUpdateProgress = () => {},
  isHeadNurse = false
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Vaccination Sessions</h2>
        <p className="text-sm text-gray-500 mt-1">Total sessions: {sessions.length}</p>
      </div>

      {/* Desktop Table View */}
      <SessionsTable
        sessions={sessions}
        onEdit={isHeadNurse ? undefined : onEdit}
        onDelete={isHeadNurse ? undefined : onDelete}
        onUpdateProgress={onUpdateProgress}
        isHeadNurse={isHeadNurse}
      />

      {/* Mobile Card View */}
      <SessionsCardList
        sessions={sessions}
        onEdit={isHeadNurse ? undefined : onEdit}
        onDelete={isHeadNurse ? undefined : onDelete}
        onUpdateProgress={onUpdateProgress}
        isHeadNurse={isHeadNurse}
      />
    </div>
  );
}
