'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('vaccine-usage');
  const [dateRange, setDateRange] = useState({ start: '2025-01-01', end: '2025-01-31' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Mock report data
  const vaccineUsageData = [
    { id: 1, date: '2025-01-15', vaccine: 'COVID-19', batch: 'CV-2025-001', quantity: 45, barangay: 'Barangay A', recipient: 'John Doe' },
    { id: 2, date: '2025-01-16', vaccine: 'Polio', batch: 'PO-2025-002', quantity: 30, barangay: 'Barangay A', recipient: 'Jane Smith' },
    { id: 3, date: '2025-01-17', vaccine: 'Measles', batch: 'MS-2025-003', quantity: 25, barangay: 'Barangay B', recipient: 'Bob Johnson' },
    { id: 4, date: '2025-01-18', vaccine: 'Hepatitis B', batch: 'HB-2025-004', quantity: 40, barangay: 'Barangay A', recipient: 'Alice Brown' },
    { id: 5, date: '2025-01-19', vaccine: 'COVID-19', batch: 'CV-2025-001', quantity: 50, barangay: 'Barangay C', recipient: 'Charlie Wilson' },
  ];

  const inventoryData = [
    { id: 1, vaccine: 'COVID-19', batch: 'CV-2025-001', currentStock: 450, usedThisMonth: 145, expiryDate: '2025-06-15', location: 'Cold Storage A' },
    { id: 2, vaccine: 'Polio', batch: 'PO-2025-002', currentStock: 380, usedThisMonth: 95, expiryDate: '2025-08-20', location: 'Cold Storage B' },
    { id: 3, vaccine: 'Measles', batch: 'MS-2025-003', currentStock: 520, usedThisMonth: 120, expiryDate: '2025-07-10', location: 'Cold Storage A' },
    { id: 4, vaccine: 'Hepatitis B', batch: 'HB-2025-004', currentStock: 290, usedThisMonth: 85, expiryDate: '2025-09-25', location: 'Cold Storage C' },
  ];

  useEffect(() => {
    if (exportSuccess) {
      const timer = setTimeout(() => setExportSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  // Export to PDF function
  const exportToPDF = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      const data = activeTab === 'vaccine-usage' ? vaccineUsageData : inventoryData;
      const reportTitle = activeTab === 'vaccine-usage' ? 'Vaccine Usage Report' : 'Inventory Report';
      
      // Create PDF content
      let pdfContent = `${reportTitle}\n`;
      pdfContent += `Generated: ${new Date().toLocaleString()}\n`;
      pdfContent += `Period: ${dateRange.start} to ${dateRange.end}\n\n`;
      
      if (activeTab === 'vaccine-usage') {
        pdfContent += 'Date\tVaccine\tBatch\tQuantity\tBarangay\tRecipient\n';
        data.forEach(item => {
          pdfContent += `${item.date}\t${item.vaccine}\t${item.batch}\t${item.quantity}\t${item.barangay}\t${item.recipient}\n`;
        });
      } else {
        pdfContent += 'Vaccine\tBatch\tStock\tUsed\tExpiry\tLocation\n';
        data.forEach(item => {
          pdfContent += `${item.vaccine}\t${item.batch}\t${item.currentStock}\t${item.usedThisMonth}\t${item.expiryDate}\t${item.location}\n`;
        });
      }
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setIsExporting(false);
      setExportSuccess(true);
    }, 500);
  };

  // Export to Excel function
  const exportToExcel = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      const data = activeTab === 'vaccine-usage' ? vaccineUsageData : inventoryData;
      const reportTitle = activeTab === 'vaccine-usage' ? 'Vaccine Usage Report' : 'Inventory Report';
      
      // Create CSV content (Excel can open CSV files)
      let csvContent = `${reportTitle}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Period: ${dateRange.start} to ${dateRange.end}\n\n`;
      
      if (activeTab === 'vaccine-usage') {
        csvContent += 'Date,Vaccine,Batch,Quantity,Barangay,Recipient\n';
        data.forEach(item => {
          csvContent += `${item.date},${item.vaccine},${item.batch},${item.quantity},${item.barangay},${item.recipient}\n`;
        });
      } else {
        csvContent += 'Vaccine,Batch,Current Stock,Used This Month,Expiry Date,Location\n';
        data.forEach(item => {
          csvContent += `${item.vaccine},${item.batch},${item.currentStock},${item.usedThisMonth},${item.expiryDate},${item.location}\n`;
        });
      }
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setIsExporting(false);
      setExportSuccess(true);
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Generate and export vaccination reports</p>
            </div>
            
            {/* Export Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-white bg-[#3E5F44] rounded-lg hover:bg-[#2d4532] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Success Message */}
          {exportSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Report exported successfully!</span>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Parameters</h2>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6 bg-white p-4 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('vaccine-usage')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'vaccine-usage'
                  ? 'bg-[#3E5F44] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Vaccine Usage Report
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-[#3E5F44] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Inventory Report
            </button>
          </div>

          {/* Vaccine Usage Report */}
          {activeTab === 'vaccine-usage' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Vaccine Usage Report</h2>
                <p className="text-sm text-gray-500">Daily vaccination records for the selected period</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vaccine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Barangay</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Recipient</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vaccineUsageData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.vaccine}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.batch}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.barangay}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.recipient}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Report */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Inventory Report</h2>
                <p className="text-sm text-gray-500">Current vaccine stock levels and usage statistics</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vaccine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Current Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Used This Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.vaccine}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.batch}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{item.currentStock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{item.usedThisMonth}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.expiryDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Export Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>PDF Export:</strong> Downloads a text file with all visible report data</li>
                  <li><strong>Excel Export:</strong> Downloads a CSV file that can be opened in Excel</li>
                  <li><strong>Date Range:</strong> Adjust the date range to filter report data</li>
                  <li><strong>All Data Included:</strong> Exported files contain all rows from the current view</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
