import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function WeeklyReportTab() {
  const [weekStart, setWeekStart] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set default to current week (Monday)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const dateStr = monday.toISOString().split("T")[0];
    setWeekStart(dateStr);
  }, []);

  useEffect(() => {
    if (weekStart) {
      fetchWeeklyReport();
    }
  }, [weekStart]);

  const fetchWeeklyReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/reports/weekly?week_start=${weekStart}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch weekly report");
      }

      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
        setTotals(result.totals);
        setChartData(result.chart_data);
      }
    } catch (err) {
      console.error("Error fetching weekly report:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    if (!weekStart) return;
    const date = new Date(weekStart);
    date.setDate(date.getDate() - 7);
    const newWeek = date.toISOString().split("T")[0];
    setWeekStart(newWeek);
  };

  const handleNextWeek = () => {
    if (!weekStart) return;
    const date = new Date(weekStart);
    date.setDate(date.getDate() + 7);
    const newWeek = date.toISOString().split("T")[0];
    setWeekStart(newWeek);
  };

  const getWeekRange = (startDateStr) => {
    if (!startDateStr) return "";
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const startFormatted = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endFormatted = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
        <p className="ml-3 text-gray-600">Loading weekly report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-900">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousWeek}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {weekStart ? getWeekRange(weekStart) : "Select Week"}
          </h2>
          <p className="text-sm text-gray-500">Weekly Vaccination Report</p>
        </div>

        <button
          onClick={handleNextWeek}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Weekly Vaccination Trend
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="doses"
                stroke="#4A7C59"
                name="Doses Administered"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No vaccination sessions this week
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Weekly Summary by Vaccine
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Vaccine
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Mon
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Tue
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Wed
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Thu
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Fri
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Sat
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Sun
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.length > 0 ? (
                <>
                  {reportData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.vaccine_name}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.daily_breakdown.Mon || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.daily_breakdown.Tue || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.daily_breakdown.Wed || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.daily_breakdown.Thu || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.daily_breakdown.Fri || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.daily_breakdown.Sat || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.daily_breakdown.Sun || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-900">
                        {item.weekly_total}
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  {totals && (
                    <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                      <td className="px-6 py-4 text-gray-900">{totals.vaccine_name}</td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.daily_breakdown.Mon || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.daily_breakdown.Tue || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.daily_breakdown.Wed || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.daily_breakdown.Thu || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.daily_breakdown.Fri || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.daily_breakdown.Sat || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.daily_breakdown.Sun || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.weekly_total}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No data available for this week
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
