'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MHOReportsPage() {
  const [activeTab, setActiveTab] = useState('expense-comparison');
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showData, setShowData] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);

  // Trigger animations when report is generated or tab changes
  useEffect(() => {
    setShowData(false);
    setAnimateCards(false);
    const timer = setTimeout(() => {
      setShowData(true);
      setAnimateCards(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, reportGenerated]);

  // Mock data for expense comparison
  const expenseData = [
    {
      id: 1,
      vaccineName: 'COVID-19',
      batch: 'CV-2025-001',
      stockQuantity: 450,
      unitCost: 850,
      totalStockValue: 382500,
      expensesRecorded: 382500,
      discrepancy: 0,
      status: 'match'
    },
    {
      id: 2,
      vaccineName: 'Polio',
      batch: 'PO-2025-002',
      stockQuantity: 380,
      unitCost: 320,
      totalStockValue: 121600,
      expensesRecorded: 118400,
      discrepancy: 3200,
      status: 'discrepancy'
    },
    {
      id: 3,
      vaccineName: 'Measles',
      batch: 'MS-2025-003',
      stockQuantity: 520,
      unitCost: 580,
      totalStockValue: 301600,
      expensesRecorded: 301600,
      discrepancy: 0,
      status: 'match'
    },
    {
      id: 4,
      vaccineName: 'Hepatitis B',
      batch: 'HB-2025-004',
      stockQuantity: 290,
      unitCost: 420,
      totalStockValue: 121800,
      expensesRecorded: 129800,
      discrepancy: -8000,
      status: 'discrepancy'
    },
    {
      id: 5,
      vaccineName: 'Influenza',
      batch: 'FL-2025-005',
      stockQuantity: 410,
      unitCost: 380,
      totalStockValue: 155800,
      expensesRecorded: 155800,
      discrepancy: 0,
      status: 'match'
    }
  ];

  // Calculate totals
  const totalStockValue = expenseData.reduce((sum, item) => sum + item.totalStockValue, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.expensesRecorded, 0);
  const totalDiscrepancy = totalStockValue - totalExpenses;

  const handleGenerateReport = () => {
    setReportGenerated(true);
    setTimeout(() => setReportGenerated(false), 3000);
  };

  const handleExportPDF = () => {
    alert('Exporting Expense Comparison Report to PDF...');
  };

  const handleExportExcel = () => {
    alert('Exporting Expense Comparison Report to Excel...');
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Expense Comparison Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Compare vaccine expenses with inventory data</p>
            </div>
            
            {/* Export Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 text-white bg-[#3E5F44] rounded-lg hover:bg-[#2d4532] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-3 mb-6 bg-white p-4 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('expense-comparison')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'expense-comparison'
                  ? 'bg-[#3E5F44] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Expense Comparison
            </button>
            <button
              onClick={() => setActiveTab('monthly-summary')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'monthly-summary'
                  ? 'bg-[#3E5F44] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Monthly Summary
            </button>
            <button
              onClick={() => setActiveTab('discrepancy-analysis')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'discrepancy-analysis'
                  ? 'bg-[#3E5F44] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Discrepancy Analysis
            </button>
          </div>

          {/* Expense Comparison Section */}
          {activeTab === 'expense-comparison' && (
            <div className="space-y-6">
              {/* Date Selection and Generate */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Month
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                    />
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    className="px-6 py-2 bg-[#3E5F44] text-white rounded-lg hover:bg-[#2d4532] transition-colors font-medium"
                  >
                    Generate Report
                  </button>
                </div>

                {/* Success Message */}
                {reportGenerated && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-medium">Expense comparison report generated successfully!</span>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Stock Value */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-[#3E5F44] transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 0.3s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Total Stock Value</p>
                  <p className="text-2xl font-bold text-gray-800 tabular-nums">
                    {animateCards ? formatCurrency(totalStockValue) : formatCurrency(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Based on inventory</p>
                </div>

                {/* Total Expenses */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-[#3E5F44] transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 0.5s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-800 tabular-nums">
                    {animateCards ? formatCurrency(totalExpenses) : formatCurrency(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Recorded expenses</p>
                </div>

                {/* Total Discrepancy */}
                <div 
                  className={`bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 ${
                    totalDiscrepancy === 0 ? 'hover:border-green-500' : 'hover:border-red-500'
                  }`}
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 0.7s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Total Discrepancy</p>
                  <p className={`text-2xl font-bold tabular-nums ${
                    totalDiscrepancy === 0 ? 'text-green-600' : totalDiscrepancy > 0 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {animateCards ? formatCurrency(Math.abs(totalDiscrepancy)) : formatCurrency(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {totalDiscrepancy === 0 ? 'All records match' : totalDiscrepancy > 0 ? 'Stock exceeds expenses' : 'Expenses exceed stock'}
                  </p>
                </div>
              </div>

              {/* Expense Comparison Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Inventory vs Expense Comparison</h2>
                  <p className="text-sm text-gray-500">Verify accurate fund usage by comparing stock values with recorded expenses</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Vaccine Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Batch
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Stock Qty
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Unit Cost
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Stock Value
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Expenses
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Discrepancy
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenseData.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            opacity: showData ? 1 : 0,
                            transform: showData ? 'translateX(0)' : 'translateX(-20px)',
                            transition: `all 0.4s ease ${idx * 0.05}s`
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                            {item.vaccineName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.batch}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            {item.stockQuantity.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            {formatCurrency(item.unitCost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 text-right">
                            {formatCurrency(item.totalStockValue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            {formatCurrency(item.expensesRecorded)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                            item.discrepancy === 0 ? 'text-green-600' : 
                            item.discrepancy > 0 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {item.discrepancy === 0 ? '-' : formatCurrency(Math.abs(item.discrepancy))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {item.status === 'match' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Discrepancy
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                      <tr className="font-bold">
                        <td colSpan="4" className="px-6 py-4 text-sm text-gray-800 text-right">
                          TOTALS:
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 text-right">
                          {formatCurrency(totalStockValue)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 text-right">
                          {formatCurrency(totalExpenses)}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right ${
                          totalDiscrepancy === 0 ? 'text-green-600' : 
                          totalDiscrepancy > 0 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {totalDiscrepancy === 0 ? '-' : formatCurrency(Math.abs(totalDiscrepancy))}
                        </td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Legend & Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Understanding Discrepancies</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li><strong>Match:</strong> Stock value equals recorded expenses (no discrepancy)</li>
                      <li><strong>Positive Discrepancy:</strong> Stock value exceeds expenses (under-recorded or missing expense entries)</li>
                      <li><strong>Negative Discrepancy:</strong> Expenses exceed stock value (over-recorded or data entry error)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs Placeholder */}
          {(activeTab === 'monthly-summary' || activeTab === 'discrepancy-analysis') && (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-500">
                {activeTab === 'monthly-summary' && 'Monthly Summary feature coming soon...'}
                {activeTab === 'discrepancy-analysis' && 'Discrepancy Analysis feature coming soon...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
