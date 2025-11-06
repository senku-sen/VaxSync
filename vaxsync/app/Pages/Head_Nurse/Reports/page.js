'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2025-01');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);

  // Trigger animations when report is generated or tab changes
  useEffect(() => {
    setShowChart(false);
    setAnimateCards(false);
    const timer = setTimeout(() => {
      setShowChart(true);
      setAnimateCards(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, reportGenerated]);

  // Mock data for monthly reports
  const monthlyData = {
    'January': {
      purchased: 2100,
      used: 1960,
      remaining: 140,
      months: ['January', 'February', 'March', 'April'],
      data: [
        { month: 'January', purchased: 450, used: 420, remaining: 30 },
        { month: 'February', purchased: 480, used: 450, remaining: 30 },
        { month: 'March', purchased: 600, used: 550, remaining: 50 },
        { month: 'April', purchased: 570, used: 540, remaining: 30 },
      ]
    }
  };

  const handleGenerateReport = () => {
    setReportGenerated(true);
    setTimeout(() => setReportGenerated(false), 3000);
  };

  const handleExportPDF = () => {
    alert('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    alert('Exporting to Excel...');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Reports & Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">Vaccine usage and inventory reports</p>
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
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'daily'
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-[#3E5F44] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Monthly Report
            </button>
            <button
              onClick={() => setActiveTab('barangay')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'barangay'
                  ? 'bg-[#3E5F44] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Barangay Report
            </button>
          </div>

          {/* Monthly Report Section */}
          {activeTab === 'monthly' && (
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
                    <span className="text-green-800 font-medium">Report generated successfully!</span>
                  </div>
                )}
              </div>

              {/* Chart Section */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Monthly Inventory Report</h2>
                  <p className="text-sm text-gray-500">Vaccine usage vs. purchases comparison</p>
                </div>

                {/* Animated Bar Chart */}
                <div className="flex items-end justify-around h-64 gap-8 px-4">
                  {monthlyData['January'].data.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col items-center gap-2"
                      style={{
                        opacity: showChart ? 1 : 0,
                        transform: showChart ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.6s ease ${idx * 0.1}s`
                      }}
                    >
                      <div className="flex items-end gap-2 h-48 relative">
                        {/* Purchased Bar with animation */}
                        <div className="flex flex-col items-center relative group">
                          <div
                            className="w-8 bg-[#93DA97] rounded-t relative overflow-hidden transition-all duration-700 ease-out hover:brightness-110"
                            style={{ 
                              height: showChart ? `${(item.purchased / 600) * 180}px` : '0px',
                              transitionDelay: `${idx * 0.15}s`
                            }}
                          >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                          </div>
                          {/* Value label on hover */}
                          <div className="absolute -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {item.purchased} doses
                          </div>
                        </div>
                        
                        {/* Used Bar with animation */}
                        <div className="flex flex-col items-center relative group">
                          <div
                            className="w-8 bg-[#3E5F44] rounded-t relative overflow-hidden transition-all duration-700 ease-out hover:brightness-110"
                            style={{ 
                              height: showChart ? `${(item.used / 600) * 180}px` : '0px',
                              transitionDelay: `${idx * 0.15 + 0.1}s`
                            }}
                          >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                          </div>
                          <div className="absolute -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {item.used} doses
                          </div>
                        </div>
                        
                        {/* Remaining Bar with animation */}
                        <div className="flex flex-col items-center relative group">
                          <div
                            className="w-8 bg-[#4ECDC4] rounded-t relative overflow-hidden transition-all duration-700 ease-out hover:brightness-110"
                            style={{ 
                              height: showChart ? `${(item.remaining / 600) * 180}px` : '0px',
                              transitionDelay: `${idx * 0.15 + 0.2}s`
                            }}
                          >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                          </div>
                          <div className="absolute -top-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {item.remaining} doses
                          </div>
                        </div>
                      </div>
                      <span 
                        className="text-xs font-medium text-gray-600"
                        style={{
                          opacity: showChart ? 1 : 0,
                          transition: `opacity 0.4s ease ${idx * 0.15 + 0.5}s`
                        }}
                      >
                        {item.month}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-8 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#93DA97] rounded"></div>
                    <span className="text-sm text-gray-600">Purchased</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#3E5F44] rounded"></div>
                    <span className="text-sm text-gray-600">Used</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#4ECDC4] rounded"></div>
                    <span className="text-sm text-gray-600">Remaining</span>
                  </div>
                </div>
              </div>

              {/* Animated Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Used */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-[#3E5F44] transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 0.8s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Total Doses Used</p>
                  <p className="text-3xl font-bold text-gray-800 tabular-nums">
                    {animateCards ? '1,960' : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Last 4 months</p>
                </div>

                {/* Total Purchased */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-[#3E5F44] transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 1s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Total Purchased</p>
                  <p className="text-3xl font-bold text-gray-800 tabular-nums">
                    {animateCards ? '2,100' : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Last 4 months</p>
                </div>

                {/* Variance */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-green-500 transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 1.2s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Variance</p>
                  <p className="text-3xl font-bold text-green-600 tabular-nums">
                    {animateCards ? '+140' : '+0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Surplus Stock</p>
                </div>
              </div>
            </div>
          )}

          {/* Barangay Report Section */}
          {activeTab === 'barangay' && (
            <div className="space-y-6">
              {/* Barangay Usage Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-800">Barangay Usage Report</h2>
                  <p className="text-sm text-gray-500">Vaccine distribution by barangay</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Barangay
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          COVID-19
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Polio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Measles
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Hepatitis B
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          Barangay A
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">120</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">85</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">95</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">110</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">410</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          Barangay B
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">95</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">72</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">88</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">92</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">347</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          Barangay C
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">88</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">78</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">92</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">105</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">363</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          Barangay D
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">85</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">65</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">75</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">80</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">305</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Animated Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Used */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-[#3E5F44] transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 0.5s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Total Doses Used</p>
                  <p className="text-3xl font-bold text-gray-800 tabular-nums">
                    {animateCards ? '1,960' : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Last 4 months</p>
                </div>

                {/* Total Purchased */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-[#3E5F44] transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 0.7s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Total Purchased</p>
                  <p className="text-3xl font-bold text-gray-800 tabular-nums">
                    {animateCards ? '2,100' : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Last 4 months</p>
                </div>

                {/* Variance */}
                <div 
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg hover:border-green-500 transition-all duration-300"
                  style={{
                    opacity: animateCards ? 1 : 0,
                    transform: animateCards ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.6s ease 0.9s'
                  }}
                >
                  <p className="text-sm text-gray-600 mb-2">Variance</p>
                  <p className="text-3xl font-bold text-green-600 tabular-nums">
                    {animateCards ? '+140' : '+0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Surplus Stock</p>
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs Placeholder */}
          {(activeTab === 'daily' || activeTab === 'weekly') && (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-500">
                {activeTab === 'daily' && 'Daily Report feature coming soon...'}
                {activeTab === 'weekly' && 'Weekly Report feature coming soon...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
