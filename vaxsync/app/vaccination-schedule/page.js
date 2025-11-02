'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function VaccinationSchedulePage() {
  const [upcomingEvents] = useState([
    {
      id: 1,
      date: '2025-11-05',
      time: '09:00 AM',
      barangay: 'Barangay Alawihao',
      vaccineType: 'COVID-19',
      target: 100,
      venue: 'Barangay Health Center',
      healthWorker: 'Juan Dela Cruz',
      notes: 'Booster dose campaign for adults'
    },
    {
      id: 2,
      date: '2025-11-06',
      time: '10:00 AM',
      barangay: 'Barangay Awitan',
      vaccineType: 'Polio',
      target: 80,
      venue: 'Elementary School',
      healthWorker: 'Maria Santos',
      notes: 'School vaccination program'
    },
    {
      id: 3,
      date: '2025-11-08',
      time: '02:00 PM',
      barangay: 'Barangay Bagasbas',
      vaccineType: 'Measles',
      target: 120,
      venue: 'Barangay Hall',
      healthWorker: 'Pedro Garcia',
      notes: 'Routine vaccination for infants'
    },
    {
      id: 4,
      date: '2025-11-10',
      time: '09:00 AM',
      barangay: 'Barangay Borabod',
      vaccineType: 'Hepatitis B',
      target: 60,
      venue: 'Health Center',
      healthWorker: 'Ana Reyes',
      notes: 'Newborn vaccination program'
    },
    {
      id: 5,
      date: '2025-11-12',
      time: '01:00 PM',
      barangay: 'Barangay Calasgasan',
      vaccineType: 'DPT',
      target: 90,
      venue: 'Day Care Center',
      healthWorker: 'Carlos Lopez',
      notes: 'Immunization for children 6 weeks to 6 years'
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Sort events chronologically
  const sortedEvents = [...upcomingEvents].sort((a, b) => 
    new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Upcoming Vaccination Events</h1>
              <p className="text-xs text-gray-500 mt-0.5">View scheduled vaccination sessions</p>
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

        {/* Main Content */}
        <div className="p-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8FFD7] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#3E5F44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{sortedEvents.length}</p>
                <p className="text-sm text-gray-500">Upcoming Events</p>
              </div>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Upcoming Events</h2>
              <p className="text-xs text-gray-500 mt-0.5">Scheduled vaccination sessions sorted by date</p>
            </div>

            <div className="divide-y divide-gray-200">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleViewDetails(event)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">{formatDate(event.date)}</span>
                        </div>
                        <span className="text-sm text-gray-500">•</span>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-500">{event.time}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{event.barangay}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-[#E8FFD7] text-[#3E5F44] text-xs font-medium rounded-full border border-[#93DA97]">
                          {event.vaccineType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Target: {event.target} beneficiaries</span>
                      </div>
                    </div>

                    <button className="ml-4 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#3E5F44] hover:bg-[#E8FFD7] rounded transition-colors">
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Event Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Event Header */}
              <div className="mb-6 p-4 bg-[#E8FFD7] rounded-lg border border-[#93DA97]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-[#3E5F44]">{selectedEvent.vaccineType} Vaccination</h3>
                  <span className="px-3 py-1 bg-white text-[#3E5F44] text-xs font-medium rounded-full border border-[#93DA97]">
                    Upcoming
                  </span>
                </div>
                <p className="text-sm text-[#3E5F44]">{selectedEvent.barangay}</p>
              </div>

              {/* Event Information Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-medium text-gray-500 uppercase">Date</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(selectedEvent.date)}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-medium text-gray-500 uppercase">Time</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{selectedEvent.time}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-xs font-medium text-gray-500 uppercase">Venue</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{selectedEvent.venue}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-xs font-medium text-gray-500 uppercase">Target</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{selectedEvent.target} beneficiaries</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-xs font-medium text-gray-500 uppercase">Health Worker</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{selectedEvent.healthWorker}</p>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedEvent.notes}</p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2.5 bg-[#3E5F44] text-white text-sm font-medium rounded-lg hover:bg-[#2d4532] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
