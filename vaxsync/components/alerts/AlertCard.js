export default function AlertCard({ alert, onClick }) {
  const severityStyles = {
    critical: 'bg-red-50 border-red-200 hover:bg-red-100',
    warning: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    info: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  };

  const iconColors = {
    critical: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  const badgeStyles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${severityStyles[alert.severity]}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {alert.type === 'low-stock' ? (
            <svg className={`w-5 h-5 ${iconColors[alert.severity]}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className={`w-5 h-5 ${iconColors[alert.severity]}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-800">{alert.vaccineName}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border uppercase ${badgeStyles[alert.severity]}`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Batch: {alert.batch}</span>
            <span>Stock: {alert.currentStock}</span>
            <span>Location: {alert.location}</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}