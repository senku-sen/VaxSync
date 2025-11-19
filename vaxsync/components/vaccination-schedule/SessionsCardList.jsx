// ============================================
// SESSIONS CARD LIST COMPONENT
// ============================================
// Mobile card view for vaccination sessions
// Displays session details in card format
// ============================================

import { SquarePen, Trash2, Activity } from "lucide-react";

export default function SessionsCardList({
  sessions = [],
  onEdit = () => {},
  onDelete = () => {},
  onUpdateProgress = () => {},
  isHeadNurse = false
}) {
  return (
    <div className="md:hidden p-4 space-y-4">
      {sessions.length > 0 ? (
        sessions.map((session) => (
          <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{session.barangays?.name || "N/A"}</h3>
                <p className="text-sm text-gray-500">{session.session_date} {session.session_time}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                session.status === 'Completed' ? 'bg-green-100 text-green-800' :
                session.status === 'In progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {session.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-500">Vaccine</p>
                <p className="font-medium">{session.vaccines?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500">Target</p>
                <p className="font-medium">{session.target}</p>
              </div>
              <div>
                <p className="text-gray-500">Administered</p>
                <p className="font-medium">{session.administered}</p>
              </div>
              <div>
                <p className="text-gray-500">Progress</p>
                <p className="font-medium">{Math.round((session.administered / session.target) * 100)}%</p>
              </div>
            </div>
            <div className={`flex gap-2 pt-3 border-t border-gray-200 ${isHeadNurse ? 'justify-center' : ''}`}>
              <button 
                onClick={() => onUpdateProgress(session)}
                className={`flex items-center justify-center gap-2 text-green-600 hover:text-green-800 transition-colors py-2 text-sm ${isHeadNurse ? '' : 'flex-1'}`}
              >
                <Activity size={16} />
                {isHeadNurse ? 'View' : 'Progress'}
              </button>
              {!isHeadNurse && (
                <>
                  <button 
                    onClick={() => onEdit(session)}
                    className="flex-1 flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 transition-colors py-2 text-sm"
                  >
                    <SquarePen size={16} />
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete(session.id)}
                    className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-red-800 transition-colors py-2 text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          No vaccination sessions found.
        </div>
      )}
    </div>
  );
}
