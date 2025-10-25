export default function StatsCard({ title, value, subtitle, valueColor = "text-[#93DA97]" }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase mb-2">{title}</p>
      <p className={`text-3xl font-bold ${valueColor} mb-1`}>{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
