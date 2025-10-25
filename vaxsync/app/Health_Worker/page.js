'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function HealthWorkerDashboard() {
  const router = useRouter();
  
  // NOTIF-02: Report reminders state
  const [reportReminders, setReportReminders] = useState([
    {
      id: 1,
      reportType: 'Weekly Vaccine Usage Report',
      dueDate: '2025-10-26',
      barangay: 'Barangay Alawihao',
      status: 'pending',
      daysUntilDue: 1,
      submitted: false
    },
    {
      id: 2,
      reportType: 'Monthly Stock Inventory Report',
      dueDate: '2025-10-26',
      barangay: 'Barangay Alawihao',
      status: 'pending',
      daysUntilDue: 1,
      submitted: false
    },
    {
      id: 3,
      reportType: 'Vaccination Coverage Report',
      dueDate: '2025-10-27',
      barangay: 'Barangay Alawihao',
      status: 'pending',
      daysUntilDue: 2,
      submitted: false
    }
  ]);

  // Set user role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', 'Health Worker');
    }
  }, []);

  // NOTIF-02: Check for reminders (simulating real-time detection)
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would poll the API for report deadlines
      // Check if any reports are due within 1 day
      console.log('Checking for report deadlines...');
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // NOTIF-02: Mark report as submitted
  const handleMarkAsSubmitted = (id) => {
    setReportReminders(prev =>
      prev.map(report =>
        report.id === id ? { ...report, submitted: true, status: 'submitted' } : report
      )
    );
  };

  // Get pending (not submitted) reminders
  const pendingReminders = reportReminders.filter(r => !r.submitted);
  
  // Get reminders due within 1 day
  const urgentReminders = pendingReminders.filter(r => r.daysUntilDue <= 1);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Dashboard - Health Worker</h1>
              <p className="text-xs text-gray-500 mt-0.5">Report submission reminders</p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* NOTIF-02: Notification Bell with Badge */}
              <button
                onClick={() => router.push('/notifications')}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Badge showing count of pending reminders */}
                {urgentReminders.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {urgentReminders.length}
                  </span>
                )}
              </button>
              
              {/* User Profile */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* NOTIF-02: Urgent Reminder Banner (appears one day before due date) */}
          {urgentReminders.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  {urgentReminders.length} report{urgentReminders.length > 1 ? 's' : ''} due soon!
                </p>
                <p className="text-sm text-yellow-700">
                  You have pending reports due within 1 day. Please submit them before the deadline.
                </p>
              </div>
              <button
                onClick={() => router.push('/notifications')}
                className="px-4 py-2 text-sm font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors whitespace-nowrap"
              >
                View Reports
              </button>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Total Reports</p>
              <p className="text-3xl font-bold text-gray-800">{reportReminders.length}</p>
              <p className="text-xs text-gray-500 mt-1">All reports</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingReminders.length}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting submission</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Submitted</p>
              <p className="text-3xl font-bold text-green-600">
                {reportReminders.filter(r => r.submitted).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </div>
          </div>

          {/* NOTIF-02: Pending Reports Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Pending Report Submissions</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Reports that need to be submitted
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-full">
                {pendingReminders.length} Pending
              </span>
            </div>

            {pendingReminders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 font-medium">All reports submitted!</p>
                <p className="text-sm text-gray-400 mt-1">You have no pending report submissions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReminders.map((report) => {
                  const daysUntil = getDaysUntilDue(report.dueDate);
                  const isUrgent = daysUntil <= 1;
                  
                  return (
                    <div
                      key={report.id}
                      className={`rounded-lg p-4 border-2 transition-all ${
                        isUrgent 
                          ? 'bg-yellow-50 border-yellow-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isUrgent ? 'bg-yellow-100' : 'bg-gray-200'
                        }`}>
                          <svg className={`w-5 h-5 ${isUrgent ? 'text-yellow-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800">
                                {report.reportType}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {report.barangay}
                              </p>
                            </div>
                            {isUrgent && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                DUE SOON
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-600">Due Date</p>
                              <p className="text-sm font-medium text-gray-800">
                                {formatDate(report.dueDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Days Until Due</p>
                              <p className={`text-sm font-bold ${
                                daysUntil <= 1 ? 'text-yellow-600' : 'text-gray-800'
                              }`}>
                                {daysUntil === 0 ? 'Due Today' : daysUntil === 1 ? 'Due Tomorrow' : `${daysUntil} days`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => handleMarkAsSubmitted(report.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors"
                            >
                              Mark as Submitted
                            </button>
                            <button className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
