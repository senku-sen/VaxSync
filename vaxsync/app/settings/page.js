'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import Toast from '@/components/common/Toast';

export default function Settings() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'VaxSync',
    email: 'admin@vaxsync.gov.ph',
    lowStockThreshold: 100,
    expiryWarningDays: 30,
    emailNotifications: true,
    smsNotifications: false,
    autoRefresh: true,
    refreshInterval: 30
  });

  const handleSave = () => {
    // Validation
    if (!settings.siteName.trim()) {
      setToast({ show: true, message: 'Site name is required', type: 'error' });
      return;
    }
    if (!settings.email.trim() || !settings.email.includes('@')) {
      setToast({ show: true, message: 'Valid email is required', type: 'error' });
      return;
    }
    if (settings.lowStockThreshold < 1) {
      setToast({ show: true, message: 'Low stock threshold must be at least 1', type: 'error' });
      return;
    }
    if (settings.expiryWarningDays < 1) {
      setToast({ show: true, message: 'Expiry warning must be at least 1 day', type: 'error' });
      return;
    }
    if (settings.autoRefresh && settings.refreshInterval < 10) {
      setToast({ show: true, message: 'Refresh interval must be at least 10 seconds', type: 'error' });
      return;
    }

    setIsSaving(true);
    
    // Simulate save operation
    setTimeout(() => {
      setIsSaving(false);
      setToast({ show: true, message: 'Settings saved successfully!', type: 'success' });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <PageHeader 
          title="Settings" 
          subtitle="Manage system configuration and preferences" 
        />

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-4xl">
            {/* General Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-5">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800">General Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Basic system configuration</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-5">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800">Alert Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Configure alert thresholds and notifications</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold (doses)
                  </label>
                  <input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => setSettings({...settings, lowStockThreshold: parseInt(e.target.value)})}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Warning (days)
                  </label>
                  <input
                    type="number"
                    value={settings.expiryWarningDays}
                    onChange={(e) => setSettings({...settings, expiryWarningDays: parseInt(e.target.value)})}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when vaccines expire within this many days</p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-5">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800">Notification Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose how you want to receive notifications</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive alerts via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#E8FFD7] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3E5F44]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
                    <p className="text-xs text-gray-500">Receive alerts via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#E8FFD7] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3E5F44]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-5">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-800">System Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Configure system behavior</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto Refresh Dashboard</p>
                    <p className="text-xs text-gray-500">Automatically update dashboard data</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoRefresh}
                      onChange={(e) => setSettings({...settings, autoRefresh: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#E8FFD7] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3E5F44]"></div>
                  </label>
                </div>
                {settings.autoRefresh && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refresh Interval (seconds)
                    </label>
                    <input
                      type="number"
                      value={settings.refreshInterval}
                      onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-2.5 text-sm font-medium rounded-md transition-colors shadow-sm ${
                  isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#3E5F44] text-white hover:bg-[#2d4532]'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
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
