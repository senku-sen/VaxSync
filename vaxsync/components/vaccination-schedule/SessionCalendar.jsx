// ============================================
// SESSION CALENDAR COMPONENT
// ============================================
// Calendar view showing vaccination sessions
// Click on dates to see session details
// ============================================

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

export default function SessionCalendar({
  isOpen = true,
  onClose,
  sessions = []
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get sessions for a specific date
  const getSessionsForDate = (date) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return sessions.filter(session => session.session_date === dateStr);
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Check if date has sessions
  const hasSessionsOnDate = (date) => {
    return getSessionsForDate(date).length > 0;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const calendarDays = generateCalendarDays();
  const sessionsForSelectedDate = selectedDate ? getSessionsForDate(selectedDate) : [];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Vaccination Sessions Calendar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, idx) => {
                  const isSelected = selectedDate && date && 
                    date.toDateString() === selectedDate.toDateString();
                  const hasSession = date && hasSessionsOnDate(date);
                  const isToday = date && date.toDateString() === new Date().toDateString();

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDateClick(date)}
                      disabled={!date}
                      className={`
                        aspect-square p-1 rounded text-xs font-medium transition-colors
                        ${!date ? 'bg-transparent cursor-default' : ''}
                        ${isSelected ? 'bg-[#4A7C59] text-white' : ''}
                        ${!isSelected && date ? 'hover:bg-gray-100' : ''}
                        ${isToday && !isSelected ? 'border-2 border-[#4A7C59]' : ''}
                        ${hasSession && !isSelected ? 'bg-green-100 text-green-800 font-bold' : ''}
                        ${hasSession && isSelected ? 'bg-[#4A7C59] text-white' : ''}
                      `}
                    >
                      {date ? date.getDate() : ''}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Legend:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#4A7C59] rounded"></div>
                    <span className="text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 text-green-800 rounded text-xs flex items-center justify-center">●</div>
                    <span className="text-gray-600">Has sessions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-3 sticky top-20">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'Select a date'}
                </h4>

                {sessionsForSelectedDate.length > 0 ? (
                  <div className="space-y-2">
                    {sessionsForSelectedDate.map((session) => (
                      <div key={session.id} className="bg-white p-2 rounded border border-gray-200">
                        <p className="text-xs font-semibold text-gray-900">
                          {session.barangays?.name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {session.session_time}
                        </p>
                        <p className="text-xs text-gray-600">
                          {session.vaccines?.name || "N/A"}
                        </p>
                        <div className="mt-1 pt-1 border-t border-gray-200">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-semibold text-gray-900">
                              {session.administered}/{session.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                session.administered === session.target ? 'bg-green-600' :
                                session.administered >= session.target * 0.75 ? 'bg-yellow-600' :
                                'bg-blue-600'
                              }`}
                              style={{ width: `${Math.round((session.administered / session.target) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Math.round((session.administered / session.target) * 100)}%
                          </p>
                        </div>
                        <div className="mt-1">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            session.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'In progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    {selectedDate ? 'No sessions' : 'Select a date'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
