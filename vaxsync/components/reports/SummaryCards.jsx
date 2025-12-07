import { Syringe, CheckCircle, TrendingUp } from "lucide-react";

export default function SummaryCards({ data, isLoading }) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Doses Administered",
      value: data.total_doses_administered?.toLocaleString() || "0",
      subtitle: "This month",
      icon: Syringe,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Sessions Completed",
      value: data.total_sessions_completed || "0",
      subtitle: "This month",
      icon: CheckCircle,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Vaccination Rate",
      value: `${data.overall_vaccination_rate || 0}%`,
      subtitle: "Across all barangays",
      icon: TrendingUp,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.color} rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  {card.title}
                </p>
              </div>
              <Icon className={`${card.iconColor} w-8 h-8`} />
            </div>

            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>

            <p className="text-xs text-gray-600">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
