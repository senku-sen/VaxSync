'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NotificationsPage() {
  // NOTIF-03: Notification history state with archived notifications
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, status
  
  const [notifications, setNotifications] = useState([
    // Current/Recent Notifications
    {
      id: 1,
      type: 'report-reminder',
      title: 'Report Due Tomorrow',
      reportType: 'Weekly Vaccine Usage Report',
      dueDate: '2025-10-26',
      barangay: 'Barangay Alawihao',
      timestamp: '2025-10-25 09:00',
      date: new Date('2025-10-25T09:00:00'),
      read: false,
      submitted: false,
      archived: false,
      status: 'pending'
    },
    {
      id: 2,
      type: 'report-reminder',
      title: 'Report Due Tomorrow',
      reportType: 'Monthly Stock Inventory Report',
      dueDate: '2025-10-26',
      barangay: 'Barangay Alawihao',
      timestamp: '2025-10-25 09:00',
      date: new Date('2025-10-25T09:00:00'),
      read: false,
      submitted: false,
      archived: false,
      status: 'pending'
    },
    {
      id: 3,
      type: 'report-reminder',
      title: 'Upcoming Report Deadline',
      reportType: 'Vaccination Coverage Report',
      dueDate: '2025-10-27',
      barangay: 'Barangay Alawihao',
      timestamp: '2025-10-25 09:00',
      date: new Date('2025-10-25T09:00:00'),
      read: true,
      submitted: false,
      archived: false,
      status: 'pending'
    },
    // Archived/Historical Notifications
    {
      id: 4,
      type: 'report-reminder',
      title: 'Report Submitted',
      reportType: 'Weekly Vaccine Usage Report',
      dueDate: '2025-10-19',
      barangay: 'Barangay Alawihao',
      timestamp: '2025-10-18 14:30',
      date: new Date('2025-10-18T14:30:00'),
      read: true,
      submitted: true,
      archived: true,
      status: 'completed'
    },
    {
      id: 5,
      type: 'report-reminder',
      title: 'Report Submitted',
      reportType: 'Monthly Stock Inventory Report',
      dueDate: '2025-09-30',
      barangay: 'Barangay Alawihao',
      timestamp: '2025-09-29 16:45',
      date: new Date('2025-09-29T16:45:00'),
      read: true,
      submitted: true,
      archived: true,
      status: 'completed'
    },
    {
      id: 6,
      type: 'report-reminder',
      title: 'Report Overdue',
      reportType: 'Vaccination Coverage Report',
      dueDate: '2025-09-15',
      barangay: 'Barangay Alawihao',
      timestamp: '2025-09-14 10:00',
      date: new Date('2025-09-14T10:00:00'),
      read: true,
      submitted: false,
      archived: true,
      status: 'overdue'
    },
    {
      id: 7,
      type: 'report-reminder',
      title: 'Report Submitted',
      reportType: 'Weekly Vaccine Usage Report',
      dueDate: '2025-09-12',
      barangay: 'Barangay Alawihao',
      timestamp: '2025-09-11 11:20',
      date: new Date('2025-09-11T11:20:00'),
      read: true,
      submitted: true,
      archived: true,
      status: 'completed'
    }
  ]);

  // NOTIF-03: Check for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, poll API for new notifications
      console.log('Checking for new notifications...');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // NOTIF-03: Mark as read/unread
  const handleToggleRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: !notif.read } : notif
      )
    );
  };

  // NOTIF-03: Mark report as submitted
  const handleMarkAsSubmitted = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { 
          ...notif, 
          submitted: true, 
          read: true,
          archived: true,
          status: 'completed',
          title: 'Report Submitted'
        } : notif
      )
    );
  };

  // NOTIF-03: Archive notification
  const handleArchive = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, archived: true, read: true } : notif
      )
    );
  };

  // Delete notification
  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // NOTIF-03: Sort notifications
  const sortNotifications = (notifs) => {
    const sorted = [...notifs];
    
    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => b.date - a.date);
      case 'date-asc':
        return sorted.sort((a, b) => a.date - b.date);
      case 'status':
        const statusOrder = { pending: 0, completed: 1, overdue: 2 };
        return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      default:
        return sorted;
    }
  };

  // NOTIF-03: Filter notifications by tab
  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    switch (activeTab) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'archived':
        filtered = notifications.filter(n => n.archived);
        break;
      case 'all':
      default:
        filtered = notifications;
        break;
    }
    
    return sortNotifications(filtered);
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const archivedCount = notifications.filter(n => n.archived).length;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Notification History</h1>
              <p className="text-xs text-gray-500 mt-0.5">View all notifications and past alerts</p>
            </div>
            
            {/* Header Icons */}
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
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
          {/* NOTIF-03: Filter Tabs and Sort */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#3E5F44] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'unread'
                    ? 'bg-[#3E5F44] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'archived'
                    ? 'bg-[#3E5F44] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Archived ({archivedCount})
              </button>
            </div>

            {/* NOTIF-03: Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          {/* NOTIF-03: Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTab === 'unread' ? "You're all caught up!" : "No archived notifications"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const daysUntil = notification.dueDate ? getDaysUntilDue(notification.dueDate) : null;
                const isUrgent = daysUntil !== null && daysUntil <= 1 && !notification.archived;

                return (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-lg border p-4 transition-all ${
                      notification.read ? 'border-gray-200' : 'border-[#3E5F44] bg-green-50'
                    } hover:shadow-sm`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.status === 'completed' ? 'bg-green-100' :
                        notification.status === 'overdue' ? 'bg-red-100' :
                        isUrgent ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {notification.status === 'completed' ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : notification.status === 'overdue' ? (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className={`w-5 h-5 ${isUrgent ? 'text-yellow-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-900' : 'text-[#3E5F44]'}`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-[#3E5F44] rounded-full"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 font-medium mb-1">
                              {notification.reportType}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">
                              {notification.barangay}
                              {notification.dueDate && ` • Due: ${formatDate(notification.dueDate)}`}
                            </p>
                            
                            {/* NOTIF-03: Status Badge */}
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(notification.status)}`}>
                                {notification.status.toUpperCase()}
                              </span>
                              {notification.archived && (
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                                  ARCHIVED
                                </span>
                              )}
                              {isUrgent && (
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">
                                  DUE {daysUntil === 0 ? 'TODAY' : 'TOMORROW'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-400">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                          <div className="flex items-center gap-2">
                            {/* NOTIF-03: Mark as Read/Unread */}
                            <button
                              onClick={() => handleToggleRead(notification.id)}
                              className="text-xs text-[#3E5F44] hover:text-[#2d4532] font-medium"
                            >
                              Mark as {notification.read ? 'unread' : 'read'}
                            </button>
                            
                            {/* Archive button (only for non-archived) */}
                            {!notification.archived && (
                              <button
                                onClick={() => handleArchive(notification.id)}
                                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                              >
                                Archive
                              </button>
                            )}
                            
                            {/* Mark as Submitted (only for pending) */}
                            {notification.status === 'pending' && !notification.submitted && (
                              <button
                                onClick={() => handleMarkAsSubmitted(notification.id)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors"
                              >
                                Mark as Submitted
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
