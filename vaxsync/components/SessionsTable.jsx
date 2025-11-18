// ============================================
// SESSIONS TABLE COMPONENT
// ============================================
// Desktop table view for vaccination sessions
// Displays session details with action buttons
// ============================================

import { SquarePen, Trash2 } from "lucide-react";

export default function SessionsTable({
  sessions = [],
  onEdit = () => {},
  onDelete = () => {}
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs font-medium text-gray-600 tracking-wider border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">Barangay</th>
            <th className="px-6 py-3 text-left">Date & Time</th>
            <th className="px-6 py-3 text-left">Vaccine</th>
            <th className="px-6 py-3 text-left">Target</th>
            <th className="px-6 py-3 text-left">Administered</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {session.barangays?.name || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {session.session_date} {session.session_time}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {session.vaccines?.name || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {session.target}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {session.administered}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    session.status === 'In progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit(session)}
                      className="text-gray-600 hover:text-blue-600 transition-colors p-1"
                    >
                      <SquarePen size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(session.id)}
                      className="text-red-600 hover:text-red-800 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                No vaccination sessions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
