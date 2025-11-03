'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'low-stock',
      severity: 'critical',
      title: 'Low Stock Alert',
      message: 'COVID-19 vaccine stock is below 100 doses',
      timestamp: '2025-05-24 14:30',
      isRead: false
    },
    {
      id: 2,
      type: 'expiry',
      severity: 'warning',
      title: 'Expiry Warning',
      message: 'Polio vaccine batch PO-2025-001 expires in 7 days',
      timestamp: '2025-05-24 10:15',
      isRead: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayedNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
            <p className="text-xs text-gray-500 mt-0.5">Stay updated with system alerts</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#3E5F44] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'unread'
                  ? 'bg-[#3E5F44] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          {displayedNotifications.length > 0 ? (
            <div className="space-y-3">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      notification.severity === 'critical'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}>
                      {notification.type === 'low-stock' ? (
                        <svg className={`w-5 h-5 ${
                          notification.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                        }`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${
                          notification.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.timestamp}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs font-medium text-[#3E5F44] hover:text-[#2d4532] transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No notifications</h3>
              <p className="text-sm text-gray-500">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
