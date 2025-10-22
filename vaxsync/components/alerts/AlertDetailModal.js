export default function AlertDetailModal({ alert, onClose }) {
  const severityStyles = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700'
    }
  };

  const style = severityStyles[alert.severity] || severityStyles.info;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${style.bg} ${style.border} border-b px-6 py-4`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`${style.iconBg} p-2 rounded-lg`}>
                {alert.type === 'low-stock' ? (
                  <svg className={`w-6 h-6 ${style.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className={`w-6 h-6 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{alert.vaccineName}</h2>
                <p className="text-sm text-gray-500">Batch: {alert.batch}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Alert Message */}
          <div className={`${style.bg} ${style.border} border rounded-lg p-4 mb-5`}>
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className={`text-sm font-semibold ${style.textColor} mb-1`}>{alert.message}</p>
                <p className="text-xs text-gray-500">Alert triggered {alert.timestamp}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Alert Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Alert Type</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {alert.type.replace('-', ' ')}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Severity Level</p>
                <span className={`${style.badgeBg} ${style.badgeText} px-2 py-1 text-xs font-medium rounded-full`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                <p className="text-sm font-semibold text-gray-800">{alert.currentStock} doses</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Threshold Level</p>
                <p className="text-sm font-semibold text-gray-800">{alert.threshold} doses</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Storage Location</p>
                <p className="text-sm font-semibold text-gray-800">{alert.location}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                <p className="text-sm font-semibold text-gray-800">{alert.expiryDate}</p>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="mt-5 bg-[#E8FFD7] border border-[#93DA97] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#3E5F44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recommended Actions
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 ml-7">
              {alert.type === 'low-stock' && (
                <>
                  <li>• Request immediate replenishment from supplier</li>
                  <li>• Check alternative storage locations for available stock</li>
                  <li>• Notify vaccination teams of limited availability</li>
                </>
              )}
              {alert.type === 'expiring-soon' && (
                <>
                  <li>• Prioritize use of this batch in upcoming vaccinations</li>
                  <li>• Notify barangay health workers to increase distribution</li>
                  <li>• Consider transferring to high-demand locations</li>
                </>
              )}
              {alert.type === 'restock-needed' && (
                <>
                  <li>• Plan for restocking in the next procurement cycle</li>
                  <li>• Monitor usage trends to determine order quantity</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-[#3E5F44] rounded-md hover:bg-[#2d4532] transition-colors">
            Request Replenishment
          </button>
        </div>
      </div>
    </div>
  );
}
