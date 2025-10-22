export default function AlertDetailModal({ alert, onClose }) {
  const getRecommendedActions = () => {
    if (alert.type === 'low-stock') {
      return [
        'Request replenishment from central supply',
        'Check alternative vaccine sources',
        'Notify health workers of limited availability'
      ];
    } else if (alert.type === 'expiring-soon') {
      return [
        'Prioritize use of this batch in upcoming sessions',
        'Notify health workers to use expiring stock first',
        'Consider transferring to high-demand barangays'
      ];
    }
    return ['Review stock levels and take appropriate action'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Alert Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {alert.type === 'low-stock' ? 'Low Stock Alert' : 'Expiry Warning'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Alert Type Badge */}
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border uppercase ${
              alert.severity === 'critical'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
            }`}>
              {alert.severity}
            </span>
          </div>

          {/* Alert Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Vaccine Name</p>
              <p className="text-sm font-medium text-gray-800">{alert.vaccineName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Batch Number</p>
              <p className="text-sm font-medium text-gray-800">{alert.batch}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Stock</p>
              <p className="text-sm font-medium text-gray-800">{alert.currentStock} doses</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Threshold</p>
              <p className="text-sm font-medium text-gray-800">{alert.threshold} doses</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Storage Location</p>
              <p className="text-sm font-medium text-gray-800">{alert.location}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
              <p className="text-sm font-medium text-gray-800">{alert.expiryDate}</p>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-1">Alert Message</p>
            <p className="text-sm text-gray-800">{alert.message}</p>
          </div>

          {/* Recommended Actions */}
          <div className="bg-[#E8FFD7] border border-[#93DA97] rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-[#3E5F44] mb-2">Recommended Actions</h3>
            <ul className="space-y-2">
              {getRecommendedActions().map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-[#3E5F44] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Handle request replenishment
              console.log('Request replenishment for:', alert.vaccineName);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3E5F44] rounded-md hover:bg-[#2d4532] transition-colors"
          >
            Request Replenishment
          </button>
        </div>
      </div>
    </div>
  );
}