'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast from '@/components/common/Toast';

export default function ResidentApproval() {
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResidents, setSelectedResidents] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [pendingSubmissions, setPendingSubmissions] = useState([
    {
      id: 1,
      name: 'James Doakes',
      barangay: 'Barangay A',
      age: 35,
      vaccineStatus: 'fully vaccinated',
      submittedBy: 'Balugo Santiago',
      date: '2024-10-18'
    },
    {
      id: 2,
      name: 'Dexter Morgan',
      barangay: 'Barangay A',
      age: 26,
      vaccineStatus: 'partially vaccinated',
      submittedBy: 'Balugo Santiago',
      date: '2024-10-18'
    },
    {
      id: 3,
      name: 'Peter Parker',
      barangay: 'Barangay A',
      age: 38,
      vaccineStatus: 'partially vaccinated',
      submittedBy: 'Balugo Santiago',
      date: '2024-10-19'
    },
    {
      id: 4,
      name: 'Taylor Swift',
      barangay: 'Barangay B',
      age: 55,
      vaccineStatus: 'fully vaccinated',
      submittedBy: 'Balugo Santiago',
      date: '2024-10-19'
    },
    {
      id: 5,
      name: 'Raphael Andrei Abad',
      barangay: 'Barangay B',
      age: 26,
      vaccineStatus: 'not vaccinated',
      submittedBy: 'Balugo Santiago',
      date: '2024-10-19'
    },
    {
      id: 6,
      name: 'Kacshan Degusman',
      barangay: 'Barangay B',
      age: 33,
      vaccineStatus: 'partially vaccinated',
      submittedBy: 'Balugo Santiago',
      date: '2024-10-18'
    }
  ]);

  const [approvedSubmissions, setApprovedSubmissions] = useState([]);
  const [rejectedSubmissions, setRejectedSubmissions] = useState([]);

  const pendingCount = pendingSubmissions.length;
  const approvedCount = approvedSubmissions.length;
  const rejectedCount = rejectedSubmissions.length;

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowViewModal(true);
  };

  const handleApproveClick = (submission) => {
    setSelectedSubmission(submission);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (submission) => {
    setSelectedSubmission(submission);
    setShowRejectDialog(true);
  };

  const handleApproveConfirm = () => {
    setApprovedSubmissions([...approvedSubmissions, selectedSubmission]);
    setPendingSubmissions(pendingSubmissions.filter(s => s.id !== selectedSubmission.id));
    setSelectedSubmission(null);
    setToast({ show: true, message: 'Resident approved successfully!', type: 'success' });
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setToast({ show: true, message: 'Please provide a reason for rejection', type: 'error' });
      return;
    }
    setRejectedSubmissions([...rejectedSubmissions, { ...selectedSubmission, rejectReason }]);
    setPendingSubmissions(pendingSubmissions.filter(s => s.id !== selectedSubmission.id));
    setSelectedSubmission(null);
    setRejectReason('');
    setShowRejectDialog(false);
    setToast({ show: true, message: 'Resident rejected', type: 'success' });
  };

  const barangays = [
    { value: 'all', label: 'All Barangays' },
    { value: 'barangay-a', label: 'Barangay A' },
    { value: 'barangay-b', label: 'Barangay B' }
  ];

  const filteredSubmissions = pendingSubmissions.filter(submission => {
    const matchesBarangay = selectedBarangay === 'all' || 
      submission.barangay.toLowerCase().replace(' ', '-') === selectedBarangay;
    const matchesSearch = submission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.barangay.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBarangay && matchesSearch;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedResidents(filteredSubmissions.map(s => s.id));
    } else {
      setSelectedResidents([]);
    }
  };

  const handleSelectResident = (id) => {
    if (selectedResidents.includes(id)) {
      setSelectedResidents(selectedResidents.filter(resId => resId !== id));
    } else {
      setSelectedResidents([...selectedResidents, id]);
    }
  };

  const getVaccineStatusBadge = (status) => {
    const styles = {
      'fully vaccinated': 'bg-green-100 text-green-700 border-green-200',
      'partially vaccinated': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'not vaccinated': 'bg-red-100 text-red-700 border-red-200'
    };

    return (
      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <PageHeader 
          title="Resident Approval Management" 
          subtitle="Review and approve resident submissions" 
        />

        {/* Main Content */}
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#5E936C]">{pendingCount}</p>
              <p className="text-sm text-gray-600 mt-1">Pending Approvals</p>
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

          {/* Filter Section */}
          <div className="bg-[#E8FFD7] rounded-lg shadow-sm border border-[#93DA97] p-5 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Filter by Barangay:</span>
              <button
                onClick={() => setSelectedBarangay('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedBarangay === 'all'
                    ? 'bg-[#3E5F44] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Barangays
              </button>
              <button
                onClick={() => setSelectedBarangay('barangay-a')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedBarangay === 'barangay-a'
                    ? 'bg-[#3E5F44] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Barangay A
              </button>
              <button
                onClick={() => setSelectedBarangay('barangay-b')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedBarangay === 'barangay-b'
                    ? 'bg-[#3E5F44] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Barangay B
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-5">
            <div className="relative max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Pending Resident Submissions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Total pending: {filteredSubmissions.length}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedResidents.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                        className="w-4 h-4 text-[#3E5F44] border-gray-300 rounded focus:ring-[#3E5F44]"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Vaccine Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedResidents.includes(submission.id)}
                          onChange={() => handleSelectResident(submission.id)}
                          className="w-4 h-4 text-[#3E5F44] border-gray-300 rounded focus:ring-[#3E5F44]"
                        />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {submission.name}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {submission.barangay}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {submission.age}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getVaccineStatusBadge(submission.vaccineStatus)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {submission.submittedBy}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {submission.date}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(submission)}
                            className="p-1.5 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-colors" 
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleApproveClick(submission)}
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors" 
                            title="Approve"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleRejectClick(submission)}
                            className="p-1.5 text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded transition-colors" 
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
      {showViewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Resident Details</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Review resident information</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedSubmission(null);
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
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Full Name</p>
                  <p className="text-sm text-gray-800">{selectedSubmission.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Age</p>
                  <p className="text-sm text-gray-800">{selectedSubmission.age} years old</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Barangay</p>
                  <p className="text-sm text-gray-800">{selectedSubmission.barangay}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Vaccine Status</p>
                  <div className="mt-1">
                    {getVaccineStatusBadge(selectedSubmission.vaccineStatus)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Submitted By</p>
                  <p className="text-sm text-gray-800">{selectedSubmission.submittedBy}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#3E5F44] mb-1">Submission Date</p>
                  <p className="text-sm text-gray-800">{selectedSubmission.date}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleRejectClick(selectedSubmission);
                }}
                className="px-5 py-2.5 text-sm font-medium text-pink-700 bg-white border-2 border-pink-300 rounded-md hover:bg-pink-50 transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleApproveClick(selectedSubmission);
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
          setSelectedSubmission(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approve Resident"
        message={`Are you sure you want to approve ${selectedSubmission?.name}? This will add them to the approved residents list.`}
        confirmText="Approve"
        type="success"
      />

      {/* Reject Dialog with Reason */}
      {showRejectDialog && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Reject Resident</h3>
                <p className="text-xs text-red-100 mt-1">Provide a reason for rejection</p>
              </div>
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedSubmission(null);
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
                  You are about to reject <strong>{selectedSubmission.name}</strong> from {selectedSubmission.barangay}.
                </p>
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
                  setSelectedSubmission(null);
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
                Reject Resident
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
