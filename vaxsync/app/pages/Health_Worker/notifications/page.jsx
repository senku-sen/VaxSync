'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/shared/Sidebar';
import Header from '../../../../components/shared/Header';
import { fetchVaccineRequestNotifications, formatNotificationTimestamp, getStatusBadgeColor, getStatusIconBgColor, getStatusIconColor, subscribeToVaccineRequestUpdates } from '@/lib/notification';
import { loadUserProfile } from '@/lib/vaccineRequest';

export default function NotificationsPage() {
  // NOTIF-03: Notification history state with archived notifications
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, status
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // NOTIF-03: Initialize notifications on mount
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const profile = await loadUserProfile();
      if (profile && profile.id) {
        setUserId(profile.id);
        
        // Fetch vaccine request notifications
        const { data: vaccineNotifications, error: notifError } = await fetchVaccineRequestNotifications(profile.id);
        
        if (notifError) {
          console.error('Error fetching notifications:', notifError);
          setError(notifError);
        } else {
          // Mark older notifications as read by default
          const notificationsWithReadStatus = vaccineNotifications.map((notif, index) => ({
            ...notif,
            read: index > 0, // Only first notification is unread
          }));
          setNotifications(notificationsWithReadStatus);
        }
      }
    } catch (err) {
      console.error('Error initializing notifications:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // NOTIF-03: Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToVaccineRequestUpdates(userId, (payload) => {
      console.log('Real-time update received:', payload);
      // Refresh notifications when updates occur
      initializeNotifications();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  // NOTIF-03: Check for new notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Checking for new notifications...');
      initializeNotifications();
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
        const statusOrder = { pending: 0, approved: 1, rejected: 2, released: 3 };
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

  // Get status icon based on vaccine request status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'approved':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'released':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title="Notification History" subtitle="View all notifications and past alerts" />

        <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-0 sm:px-2">
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
            {isLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="flex justify-center mb-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E5F44]"></div>
                </div>
                <p className="text-gray-500 font-medium">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
                <svg className="w-12 h-12 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 font-medium">Error loading notifications</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
                <button
                  onClick={initializeNotifications}
                  className="mt-3 px-4 py-2 text-sm font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
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
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg border p-4 transition-all ${
                    notification.read ? 'border-gray-200' : 'border-[#3E5F44] bg-green-50'
                  } hover:shadow-sm`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusIconBgColor(notification.status)}`}>
                      {getStatusIcon(notification.status)}
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
                          <p className="text-sm text-gray-700 mb-1">
                            {notification.description}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            <span className="font-medium">{notification.vaccineName}</span>
                            {notification.barangayName && ` • ${notification.barangayName}`}
                            {notification.quantity && ` • ${notification.quantity}`}
                          </p>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(notification.status)}`}>
                              {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                            </span>
                            {notification.archived && (
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                                ARCHIVED
                              </span>
                            )}
                          </div>
                          
                          {/* Notes if available */}
                          {notification.notes && (
                            <p className="text-xs text-gray-600 mt-2 italic">
                              Note: {notification.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-400">
                          {formatNotificationTimestamp(notification.timestamp)}
                        </p>
                        <div className="flex items-center gap-2">
                          {/* Mark as Read/Unread */}
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
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
