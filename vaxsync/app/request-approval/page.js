'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast from '@/components/common/Toast';

export default function RequestApproval() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [requests, setRequests] = useState([
    {
      id: 'REQ002',
      healthWorker: 'James Doakes',
      barangay: 'Barangay A',
      vaccineType: 'Measles',
      qtyRequested: 30,
      availableStock: 150,
      status: 'pending'
    },
    {
      id: 'REQ004',
      healthWorker: 'Dexter Morgan',
      barangay: 'Barangay B',
      vaccineType: 'COVID-19',
      qtyRequested: 75,
      availableStock: 200,
      status: 'pending'
    },
    {
      id: 'REQ006',
      healthWorker: 'Peter Parker',
      barangay: 'Barangay C',
      vaccineType: 'Polio',
      qtyRequested: 40,
      availableStock: 80,
      status: 'pending'
    }
  ]);

  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);

  const pendingCount = requests.length;
  const approvedCount = approvedRequests.length;
  const rejectedCount = rejectedRequests.length;

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const handleApproveConfirm = () => {
    setApprovedRequests([...approvedRequests, selectedRequest]);
    setRequests(requests.filter(r => r.id !== selectedRequest.id));
    setSelectedRequest(null);
    setToast({ show: true, message: 'Request approved successfully!', type: 'success' });
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setToast({ show: true, message: 'Please provide a reason for rejection', type: 'error' });
      return;
    }
    setRejectedRequests([...rejectedRequests, { ...selectedRequest, rejectReason }]);
    setRequests(requests.filter(r => r.id !== selectedRequest.id));
    setSelectedRequest(null);
    setRejectReason('');
    setShowRejectDialog(false);
    setToast({ show: true, message: 'Request rejected', type: 'success' });
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.healthWorker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.barangay.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <PageHeader 
          title="Vaccine Request Approval" 
        />

        {/* Main Content */}
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#5E936C]">{pendingCount}</p>
              <p className="text-sm text-gray-600 mt-1">Pending Requests</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#3E5F44]">{approvedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Approved</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-gray-600">{rejectedCount}</p>
              <p className="text-sm text-gray-600 mt-1">Rejected</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by request ID, barangay, or health worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Pending Requests</h2>
              <p className="text-xs text-gray-500 mt-0.5">Review and approve vaccine requisition requests</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Health Worker
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Vaccine Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Qty Requested
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Available Stock
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
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
                        {request.healthWorker}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.barangay}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.vaccineType}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.qtyRequested}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-[#3E5F44]">
                        {request.availableStock}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">
                          {request.status}
                        </span>
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
                          <button 
                            onClick={() => handleApproveClick(request)}
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors" 
                            title="Approve"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleRejectClick(request)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors" 
                            title="Reject"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
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

      {/* View Details Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Request Details</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Review vaccine requisition request</p>
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
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Health Worker</p>
                  <p className="text-sm text-gray-800">{selectedRequest.healthWorker}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Barangay</p>
                  <p className="text-sm text-gray-800">{selectedRequest.barangay}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Vaccine Type</p>
                  <p className="text-sm text-gray-800">{selectedRequest.vaccineType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Quantity Requested</p>
                  <p className="text-sm text-gray-800">{selectedRequest.qtyRequested} doses</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Available Stock</p>
                  <p className="text-sm font-medium text-[#3E5F44]">{selectedRequest.availableStock} doses</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Status</p>
                  <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
              <div className="mt-4 bg-[#E8FFD7] border-2 border-[#93DA97] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#3E5F44] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[#3E5F44]">Stock Availability</p>
                    <p className="text-xs text-[#3E5F44] mt-1">
                      {selectedRequest.availableStock >= selectedRequest.qtyRequested 
                        ? `Sufficient stock available. ${selectedRequest.availableStock - selectedRequest.qtyRequested} doses will remain after approval.`
                        : `Insufficient stock! Only ${selectedRequest.availableStock} doses available, but ${selectedRequest.qtyRequested} requested.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleRejectClick(selectedRequest);
                }}
                className="px-5 py-2.5 text-sm font-medium text-red-700 bg-white border-2 border-red-300 rounded-md hover:bg-red-50 transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleApproveClick(selectedRequest);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-md hover:from-[#2d4532] hover:to-[#4a7255] transition-all shadow-md"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => {
          setShowApproveDialog(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approve Request"
        message={`Are you sure you want to approve request ${selectedRequest?.id} for ${selectedRequest?.qtyRequested} doses of ${selectedRequest?.vaccineType}? This will allocate the vaccines to ${selectedRequest?.barangay}.`}
        confirmText="Approve"
        type="success"
      />

      {/* Reject Dialog with Reason */}
      {showRejectDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Reject Request</h3>
                <p className="text-xs text-red-100 mt-1">Provide a reason for rejection</p>
              </div>
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  You are about to reject request <strong>{selectedRequest.id}</strong> from <strong>{selectedRequest.healthWorker}</strong> ({selectedRequest.barangay}).
                </p>
                <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600">
                  <p><strong>Vaccine:</strong> {selectedRequest.vaccineType}</p>
                  <p><strong>Quantity:</strong> {selectedRequest.qtyRequested} doses</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-500 transition-all resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-md hover:from-red-700 hover:to-pink-700 transition-all shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

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
