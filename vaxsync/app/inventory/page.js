'use client';

import { useState } from 'react';
import { addInventoryWithSync } from '@/lib/hooks/useInventorySync';

export default function InventoryPage() {
  const [formData, setFormData] = useState({
    vaccine_name: '',
    batch: '',
    quantity: '',
    threshold: '100',
    barangay: '',
    location: '',
    expiry_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required fields
      if (!formData.vaccine_name || !formData.batch || !formData.quantity || !formData.barangay) {
        setMessage('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Add inventory and sync barangay
      const result = await addInventoryWithSync({
        vaccine_name: formData.vaccine_name,
        batch: formData.batch,
        quantity: parseInt(formData.quantity),
        threshold: parseInt(formData.threshold),
        barangay: formData.barangay,
        location: formData.location,
        expiry_date: formData.expiry_date || null
      });

      if (result.success) {
        setMessage('✅ Inventory added successfully! Barangay synced automatically.');
        setFormData({
          vaccine_name: '',
          batch: '',
          quantity: '',
          threshold: '100',
          barangay: '',
          location: '',
          expiry_date: ''
        });
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">Add Vaccine Inventory</h1>
          <p className="text-gray-600 mb-6">Add new vaccine inventory. Barangays will be automatically synced.</p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vaccine Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
              <input
                type="text"
                name="vaccine_name"
                value={formData.vaccine_name}
                onChange={handleChange}
                placeholder="e.g., COVID-19, Polio, Measles"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                required
              />
            </div>

            {/* Batch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
              <input
                type="text"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                placeholder="e.g., COVID-2025-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                required
              />
            </div>

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                <input
                  type="number"
                  name="threshold"
                  value={formData.threshold}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                />
              </div>
            </div>

            {/* Barangay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
              <input
                type="text"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                placeholder="e.g., barangay-a or San Francisco"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Will be automatically added to barangays list</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Main Clinic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[#3E5F44] text-white font-medium rounded-lg hover:bg-[#2d4532] transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Inventory'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>ℹ️ Auto-Sync Feature:</strong> When you add inventory with a barangay, it will automatically be added to the barangays dropdown filter if it doesn't exist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
