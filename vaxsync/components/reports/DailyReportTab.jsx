import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DailyReportTab() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set default to today
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    setSelectedDate(dateStr);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyReport();
    }
  }, [selectedDate]);

  const fetchDailyReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/daily?date=${selectedDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch daily report");
      }

      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
        setChartData(result.chart_data);
      }
    } catch (err) {
      console.error("Error fetching daily report:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
        <p className="ml-3 text-gray-600">Loading daily report...</p>
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

      {/* Date Picker */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          value={selectedDate || ""}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
        />
        <span className="text-sm text-gray-600">{formatDate(selectedDate)}</span>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Daily Vaccination Activity
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4A7C59" name="Doses Administered" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No vaccination sessions for this date
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Sessions for {formatDate(selectedDate)}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Time
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Vaccine
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Barangay
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Target
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Administered
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Completion %
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.session_time}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.vaccine_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.barangay_name}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {item.target}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {item.administered}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.completion_rate >= 80
                            ? "bg-green-100 text-green-800"
                            : item.completion_rate >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.completion_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : item.status === "In progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No sessions scheduled for this date
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
