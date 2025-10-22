'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast from '@/components/common/Toast';

export default function VaccineRequests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    vaccineType: 'COVID-19',
    quantity: '',
    notes: ''
  });

  const [requests, setRequests] = useState([
    {
      id: 'REQ001',
      date: '2024-10-15',
      vaccineType: 'COVID-19',
      quantity: '50 doses',
      status: 'pending',
      notes: 'For immunization drive'
    },
    {
      id: 'REQ002',
      date: '2024-10-18',
      vaccineType: 'Measles',
      quantity: '30 doses',
      status: 'pending',
      notes: 'Routine vaccination for school children'
    },
    {
      id: 'REQ003',
      date: '2024-10-19',
      vaccineType: 'Polio',
      quantity: '25 doses',
      status: 'released',
      notes: 'School vaccination program'
    },
    {
      id: 'REQ006',
      date: '2024-10-14',
      vaccineType: 'Influenza',
      quantity: '60 doses',
      status: 'released',
      notes: 'Essential flu vaccination campaign'
    },
    {
      id: 'REQ008',
      date: '2024-10-16',
      vaccineType: 'COVID-19',
      quantity: '50 doses',
      status: 'rejected',
      notes: 'Booster dose campaign'
    },
    {
      id: 'REQ010',
      date: '2024-10-13',
      vaccineType: 'Hepatitis B',
      quantity: '25 doses',
      status: 'released',
      notes: 'Newborn vaccination program'
    }
  ]);

  const handleNewRequest = () => {
    if (!formData.quantity) {
      setToast({ show: true, message: 'Please enter quantity', type: 'error' });
      return;
    }

    const newRequest = {
      id: `REQ${String(requests.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      vaccineType: formData.vaccineType,
      quantity: `${formData.quantity} doses`,
      status: 'pending',
      notes: formData.notes || 'No additional notes'
    };

    setRequests([newRequest, ...requests]);
    setShowNewRequestModal(false);
    setFormData({ vaccineType: 'COVID-19', quantity: '', notes: '' });
    setToast({ show: true, message: 'Request submitted successfully!', type: 'success' });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleDeleteClick = (request) => {
    setSelectedRequest(request);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setRequests(requests.filter(r => r.id !== selectedRequest.id));
    setSelectedRequest(null);
    setToast({ show: true, message: 'Request deleted successfully!', type: 'success' });
  };

  const totalRequests = 6;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = 1;
  const releasedCount = requests.filter(r => r.status === 'released').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'approved': 'bg-blue-100 text-blue-700 border-blue-200',
      'released': 'bg-green-100 text-green-700 border-green-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200'
    };

    return (
      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.vaccineType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <PageHeader 
          title="Vaccine Requisition Requests" 
          subtitle="Barangay: Barangay A" 
        />

        {/* Main Content */}
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#3E5F44]">{totalRequests}</p>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#5E936C]">{pendingCount}</p>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#93DA97]">{approvedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Approved</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#3E5F44]">{releasedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Released</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-gray-600">{rejectedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Rejected</p>
            </div>
          </div>

          {/* New Request Button */}
          <div className="mb-5">
            <button 
              onClick={() => setShowNewRequestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3E5F44] text-white text-sm font-medium rounded-md hover:bg-[#2d4532] transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-5">
            <div className="relative max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by request ID or vaccine type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">My Vaccine Requests</h2>
              <p className="text-xs text-gray-500 mt-0.5">Total requests for Barangay A: {filteredRequests.length}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Vaccine Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {request.id}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.date}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.vaccineType}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.quantity}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {request.notes}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(request)}
                            className="p-1.5 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors" 
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {request.status === 'pending' && (
                            <button 
                              onClick={() => handleDeleteClick(request)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors" 
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">New Vaccine Request</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Submit a vaccine requisition request</p>
              </div>
              <button
                onClick={() => {
                  setShowNewRequestModal(false);
                  setFormData({ vaccineType: 'COVID-19', quantity: '', notes: '' });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Vaccine Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vaccineType}
                    onChange={(e) => setFormData({...formData, vaccineType: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  >
                    <option>COVID-19</option>
                    <option>Polio</option>
                    <option>Measles</option>
                    <option>Hepatitis B</option>
                    <option>Influenza</option>
                    <option>Tetanus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Quantity (doses) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="Enter number of doses needed"
                    min="1"
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Notes / Purpose
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Describe the purpose of this request..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all resize-none"
                  />
                </div>
              </div>
              <div className="mt-4 bg-[#E8FFD7] border-2 border-[#93DA97] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#3E5F44] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[#3E5F44]">Request Information</p>
                    <p className="text-xs text-[#3E5F44] mt-1">
                      Your request will be reviewed by the Municipal Health Officer. You will be notified once it's approved or if additional information is needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewRequestModal(false);
                  setFormData({ vaccineType: 'COVID-19', quantity: '', notes: '' });
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleNewRequest}
                disabled={!formData.quantity}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-md hover:from-[#2d4532] hover:to-[#4a7255] transition-all shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Request Details</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">View vaccine requisition information</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRequest(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Request ID</p>
                  <p className="text-sm text-gray-800">{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Request Date</p>
                  <p className="text-sm text-gray-800">{selectedRequest.date}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Vaccine Type</p>
                  <p className="text-sm text-gray-800">{selectedRequest.vaccineType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Quantity</p>
                  <p className="text-sm text-gray-800">{selectedRequest.quantity}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Barangay</p>
                  <p className="text-sm text-gray-800">Barangay A</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Notes / Purpose</p>
                  <p className="text-sm text-gray-800">{selectedRequest.notes}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRequest(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Request"
        message={`Are you sure you want to delete request ${selectedRequest?.id} for ${selectedRequest?.vaccineType}? This action cannot be undone.`}
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
