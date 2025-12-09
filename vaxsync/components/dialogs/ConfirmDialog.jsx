// ============================================
// CONFIRM DIALOG COMPONENT
// ============================================
// Custom confirmation dialog (replaces browser confirm)
// Used for delete and other confirmations
// ============================================

import { AlertCircle, X } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm = () => {},
  onCancel = () => {},
  isDangerous = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertCircle className={`h-6 w-6 ${isDangerous ? 'text-red-600' : 'text-yellow-600'}`} />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#4A7C59] hover:bg-[#3E6B4D]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
