'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import Toast from '@/components/common/Toast';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-12-31');
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);

  const reportTypes = [
    { value: 'inventory', label: 'Inventory Report', description: 'Current stock levels and vaccine details' },
    { value: 'usage', label: 'Usage Report', description: 'Vaccine consumption and distribution' },
    { value: 'expiry', label: 'Expiry Report', description: 'Vaccines nearing expiration' },
    { value: 'requests', label: 'Request Report', description: 'Vaccine requisition requests summary' },
    { value: 'residents', label: 'Resident Report', description: 'Resident vaccination records' }
  ];

  const barangays = [
    { value: 'all', label: 'All Barangays' },
    { value: 'barangay-a', label: 'Barangay A' },
    { value: 'barangay-b', label: 'Barangay B' },
    { value: 'barangay-c', label: 'Barangay C' }
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const reportLabel = reportTypes.find(r => r.value === selectedReport)?.label;
      const newReport = {
        id: Date.now(),
        type: reportLabel,
        dateFrom,
        dateTo,
        barangay: barangays.find(b => b.value === selectedBarangay)?.label,
        generatedAt: new Date().toLocaleString()
      };
      
      setGeneratedReports([newReport, ...generatedReports]);
      setIsGenerating(false);
      setToast({ show: true, message: 'Report generated successfully!', type: 'success' });
    }, 1500);
  };

  const handleExportPDF = () => {
    setToast({ show: true, message: 'Exporting report as PDF...', type: 'info' });
    
    // Simulate PDF export
    setTimeout(() => {
      setToast({ show: true, message: 'PDF exported successfully!', type: 'success' });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <PageHeader 
          title="Reports" 
          subtitle="Generate and export system reports" 
        />

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-4xl">
            {/* Report Generator */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-5">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800">Generate Report</h2>
                <p className="text-xs text-gray-500 mt-0.5">Select report type and parameters</p>
              </div>
              <div className="p-5 space-y-5">
                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Report Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reportTypes.map((report) => (
                      <div
                        key={report.value}
                        onClick={() => setSelectedReport(report.value)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedReport === report.value
                            ? 'border-[#3E5F44] bg-[#E8FFD7]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={selectedReport === report.value}
                            onChange={() => setSelectedReport(report.value)}
                            className="mt-1 w-4 h-4 text-[#3E5F44] border-gray-300 focus:ring-[#3E5F44]"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{report.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{report.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Barangay Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay
                  </label>
                  <select
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    {barangays.map((barangay) => (
                      <option key={barangay.value} value={barangay.value}>
                        {barangay.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generate Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedReport || isGenerating}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      selectedReport && !isGenerating
                        ? 'bg-[#3E5F44] text-white hover:bg-[#2d4532]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={!selectedReport || isGenerating}
                    className={`px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
                      selectedReport && !isGenerating
                        ? 'border-[#3E5F44] text-[#3E5F44] hover:bg-[#E8FFD7]'
                        : 'border-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800">Recent Reports</h2>
                <p className="text-xs text-gray-500 mt-0.5">Previously generated reports</p>
              </div>
              <div className="p-5">
                {generatedReports.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">No reports generated yet</h3>
                    <p className="text-xs text-gray-500">Generate your first report to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {generatedReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#E8FFD7] rounded-lg">
                            <svg className="w-5 h-5 text-[#3E5F44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{report.type}</p>
                            <p className="text-xs text-gray-500">
                              {report.barangay} • {report.dateFrom} to {report.dateTo}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Generated: {report.generatedAt}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleExportPDF}
                          className="px-3 py-1.5 text-xs font-medium text-[#3E5F44] border border-[#3E5F44] rounded-md hover:bg-[#E8FFD7] transition-colors"
                        >
                          Download PDF
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </DashboardLayout>
  );
}
