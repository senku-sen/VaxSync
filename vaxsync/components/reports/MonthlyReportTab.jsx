import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MonthlyReportTab() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set default to current month
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-01`;
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyReport();
    }
  }, [selectedMonth]);

  const fetchMonthlyReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/reports/monthly?month=${selectedMonth}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch monthly report");
      }

      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
        setTotals(result.totals);

        // Prepare chart data - show doses administered by vaccine
        const chartData = result.data.map((item) => ({
          name: item.vaccine_name,
          doses: item.administered_doses,
        }));
        setChartData(chartData);
      }
    } catch (err) {
      console.error("Error fetching monthly report:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (!selectedMonth) return;
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() - 1);
    const newMonth = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-01`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    if (!selectedMonth) return;
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() + 1);
    const newMonth = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-01`;
    setSelectedMonth(newMonth);
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return "";
    const date = new Date(monthStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
        <p className="ml-3 text-gray-600">Loading monthly report...</p>
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

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousMonth}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedMonth
              ? formatMonth(selectedMonth)
              : "Select Month"}
          </h2>
          <p className="text-sm text-gray-500">Monthly Vaccination Report</p>
        </div>

        <button
          onClick={handleNextMonth}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Vaccination Summary
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="doses" fill="#4A7C59" name="Doses Administered" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Detailed Report
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
                  Sessions
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
                  Attendance %
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Vaccination %
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
                        {item.sessions_held}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.target_doses}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.administered_doses}
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
                            item.attendance_rate >= 80
                              ? "bg-green-100 text-green-800"
                              : item.attendance_rate >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.attendance_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.vaccination_rate >= 80
                              ? "bg-green-100 text-green-800"
                              : item.vaccination_rate >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.vaccination_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  {totals && (
                    <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                      <td className="px-6 py-4 text-gray-900">{totals.vaccine_name}</td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.sessions_held}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.target_doses}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.administered_doses}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.completion_rate}%
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.attendance_rate}%
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {totals.vaccination_rate}%
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No data available for this month
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
