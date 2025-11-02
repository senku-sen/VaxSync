'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function VaccinationSchedulePage() {
  const [schedules, setSchedules] = useState([
    {
      id: 1,
      barangay: 'Barangay A',
      dateTime: '2025-07-25 09:00',
      vaccine: 'COVID-19',
      target: 100,
      administered: 0,
      status: 'scheduled'
    },
    {
      id: 2,
      barangay: 'Barangay B',
      dateTime: '2025-07-26 10:00',
      vaccine: 'Polio',
      target: 80,
      administered: 0,
      status: 'in-progress'
    },
    {
      id: 3,
      barangay: 'Barangay C',
      dateTime: '2025-07-27 14:00',
      vaccine: 'Measles',
      target: 120,
      administered: 95,
      status: 'completed'
    }
  ]);

  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [administeredCount, setAdministeredCount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleMarkComplete = (schedule) => {
    setSelectedSchedule(schedule);
    setAdministeredCount(schedule.administered.toString());
    setShowMarkCompleteModal(true);
  };

  const handleSubmitComplete = (e) => {
    e.preventDefault();
    
    const administered = parseInt(administeredCount);
    
    // Update schedule status to completed
    setSchedules(schedules.map(s => 
      s.id === selectedSchedule.id 
        ? { ...s, status: 'completed', administered: administered }
        : s
    ));

    // Show success confirmation
    setShowConfirmation(true);
    setShowMarkCompleteModal(false);
    setSelectedSchedule(null);
    setAdministeredCount('');

    // Hide confirmation after 3 seconds
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'scheduled':
        return 'Scheduled';
      case 'in-progress':
        return 'In-progress';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'scheduled':
        return (
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Vaccination Schedule</h1>
              <p className="text-xs text-gray-500 mt-0.5">View and manage vaccination sessions</p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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

        {/* Success Confirmation */}
        {showConfirmation && (
          <div className="mx-6 mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-green-700 font-medium">Vaccination session marked as completed!</p>
                <p className="text-xs text-green-600 mt-0.5">Stock has been automatically adjusted based on usage.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6">
          {/* Scheduled Sessions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Vaccination Sessions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Upcoming and completed vaccination sessions</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Vaccine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Administered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.barangay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.dateTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.vaccine}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.administered}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(session.status)}`}>
                          {getStatusIcon(session.status)}
                          {getStatusText(session.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {session.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkComplete(session)}
                            className="px-3 py-1.5 bg-[#3E5F44] text-white text-xs font-medium rounded hover:bg-[#2d4532] transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                        {session.status === 'completed' && (
                          <span className="text-xs text-gray-400">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Complete Modal */}
      {showMarkCompleteModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Mark Session as Completed</h2>
              <button
                onClick={() => setShowMarkCompleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Barangay</p>
                  <p className="font-medium text-gray-800">{selectedSchedule.barangay}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date & Time</p>
                  <p className="font-medium text-gray-800">{selectedSchedule.dateTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vaccine</p>
                  <p className="font-medium text-gray-800">{selectedSchedule.vaccine}</p>
                </div>
                <div>
                  <p className="text-gray-500">Target</p>
                  <p className="font-medium text-gray-800">{selectedSchedule.target} doses</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitComplete}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doses Administered <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={selectedSchedule.target}
                  value={administeredCount}
                  onChange={(e) => setAdministeredCount(e.target.value)}
                  placeholder="Enter number of doses administered"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: {selectedSchedule.target} doses</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-xs text-blue-800 font-medium">Stock will be adjusted automatically</p>
                    <p className="text-xs text-blue-600 mt-1">
                      The inventory stock for {selectedSchedule.vaccine} will be reduced by the number of doses administered.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMarkCompleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#3E5F44] text-white text-sm font-medium rounded-lg hover:bg-[#2d4532] transition-colors"
                >
                  Mark as Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
