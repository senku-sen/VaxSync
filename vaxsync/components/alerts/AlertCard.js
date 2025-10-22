export default function AlertCard({ alert, onClick }) {
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

  const getIcon = () => {
    if (alert.type === 'low-stock') {
      return (
        <svg className={`w-5 h-5 ${style.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (alert.type === 'expiring-soon') {
      return (
        <svg className={`w-5 h-5 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className={`w-5 h-5 ${style.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${style.bg} ${style.border} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`${style.iconBg} p-2 rounded-lg flex-shrink-0`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">{alert.vaccineName}</h3>
              <p className="text-xs text-gray-500">Batch: {alert.batch}</p>
            </div>
            <span className={`${style.badgeBg} ${style.badgeText} px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap`}>
              {alert.severity.toUpperCase()}
            </span>
          </div>

          <p className={`text-sm font-medium ${style.textColor} mb-2`}>
            {alert.message}
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Current Stock:</span> {alert.currentStock} doses
            </div>
            <div>
              <span className="font-medium">Location:</span> {alert.location}
            </div>
            <div>
              <span className="font-medium">Expiry Date:</span> {alert.expiryDate}
            </div>
            <div>
              <span className="font-medium">Threshold:</span> {alert.threshold} doses
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">{alert.timestamp}</span>
            <button className="text-xs font-medium text-[#3E5F44] hover:text-[#2d4532] flex items-center gap-1">
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
