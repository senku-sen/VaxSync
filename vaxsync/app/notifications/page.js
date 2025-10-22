'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast from '@/components/common/Toast';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'alert',
      title: 'Low Stock Alert',
      message: 'COVID-19 vaccine stock is below 100 doses',
      timestamp: '2025-05-24 14:30',
      isRead: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'Expiry Warning',
      message: 'Polio vaccine batch PO-2025-001 expires in 7 days',
      timestamp: '2025-05-24 10:15',
      isRead: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
    setToast({ show: true, message: 'Notification marked as read', type: 'success' });
  };

  const handleDeleteClick = (notification) => {
    setSelectedNotification(notification);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setNotifications(notifications.filter(n => n.id !== selectedNotification.id));
    setSelectedNotification(null);
    setToast({ show: true, message: 'Notification deleted', type: 'success' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <PageHeader title="Notifications" />

        {/* Main Content */}
        <div className="p-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-3 mb-6">
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
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'alert' 
                      ? 'bg-red-100' 
                      : 'bg-yellow-100'
                  }`}>
                    {notification.type === 'alert' ? (
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-[#3E5F44] hover:text-[#2d4532] font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(notification)}
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredNotifications.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No notifications</h3>
              <p className="text-sm text-gray-500">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedNotification(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification"
        message={`Are you sure you want to delete this notification? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

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
