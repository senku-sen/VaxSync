export default function StatsCard({ title, value, subtitle, valueColor = 'text-gray-700' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <h3 className="text-xs font-medium text-gray-500 mb-3">{title}</h3>
      <p className={`text-3xl font-bold ${valueColor} mb-1`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
