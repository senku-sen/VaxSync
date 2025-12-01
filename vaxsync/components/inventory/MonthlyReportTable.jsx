// ============================================
// MONTHLY VACCINE REPORT TABLE
// ============================================
// Displays monthly vaccine inventory tracking
// Shows: Initial, IN, OUT, Wastage, Ending
// Calculates: Stock %, Status
// ============================================

import { useState, useEffect } from "react";
import { fetchMonthlyVaccineReport, getAvailableMonths } from "@/lib/vaccineMonthlyReport";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MonthlyReportTable({ barangayId }) {
  // Monthly reports data
  const [reports, setReports] = useState([]);
  
  // Available months
  const [availableMonths, setAvailableMonths] = useState([]);
  
  // Selected month
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Error state
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize even if barangayId is null (for general data view)
    initializeData();
  }, [barangayId]);

  useEffect(() => {
    if (selectedMonth) {
      fetchReports();
    }
  }, [selectedMonth, barangayId]);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // Get available months
      const { data: months, error: monthError } = await getAvailableMonths(barangayId);
      if (monthError) {
        console.error('Error fetching months:', monthError);
        setError('Failed to load available months');
        return;
      }

      setAvailableMonths(months || []);
      
      // Set default to current month
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      setSelectedMonth(currentMonth);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await fetchMonthlyVaccineReport(barangayId, selectedMonth);
      
      if (fetchError) {
        console.error('Error fetching reports:', fetchError);
        setError('Failed to load monthly report');
        return;
      }

      setReports(data || []);
    } catch (err) {
      console.error('Error in fetchReports:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (!selectedMonth) return;
    
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() - 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    if (!selectedMonth) return;
    
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() + 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedMonth(newMonth);
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const date = new Date(monthStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'OVERSTOCK': { color: 'bg-purple-100 text-purple-800', icon: '🟣' },
      'UNDERSTOCK': { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      'STOCKOUT': { color: 'bg-red-100 text-red-800', icon: '🔴' },
      'GOOD': { color: 'bg-green-100 text-green-800', icon: '🟢' }
    };
    
    const statusInfo = statusMap[status] || statusMap['GOOD'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.icon} {status}
      </span>
    );
  };

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
        <p className="ml-3 text-gray-600">Loading monthly report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            {selectedMonth ? new Date(selectedMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Select Month'}
          </h2>
          <p className="text-sm text-gray-500">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Loading Report...
              </span>
            ) : (
              'Monthly Vaccine Report'
            )}
          </p>
        </div>
        
        <button
          onClick={handleNextMonth}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Status Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">Status Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🟣</span>
            <span className="text-gray-700">OVERSTOCK (&gt;75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟡</span>
            <span className="text-gray-700">UNDERSTOCK (25-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔴</span>
            <span className="text-gray-700">STOCKOUT (&lt;25%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟢</span>
            <span className="text-gray-700">GOOD</span>
          </div>
        </div>
      </div>

      {/* Monthly Report Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Vaccine Name</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Initial</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">IN</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">OUT</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Wastage</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Ending</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Vials Needed (Monthly)</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Max Alloc</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">%Stock</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.length > 0 ? (
                reports.map((report, index) => (
                  <tr key={report.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {report.vaccine?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {report.initial_inventory || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {report.quantity_supplied || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {report.quantity_used || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {report.quantity_wastage || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {report.ending_inventory || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {report.vials_needed || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {report.max_allocation || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">
                      {report.stock_level_percentage || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(report.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No vaccine data available for this month
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
