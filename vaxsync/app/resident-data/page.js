'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast from '@/components/common/Toast';

export default function ResidentData() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [uploadFile, setUploadFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: '',
    vaccineStatus: 'not vaccinated',
    contact: ''
  });

  const [pendingResidents, setPendingResidents] = useState([
    {
      id: 1,
      name: 'Tony Stark',
      age: 35,
      address: '123 Main St',
      vaccineStatus: 'fully vaccinated',
      contact: '09123456789',
      submitted: '2024-10-18'
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      age: 28,
      address: '456 Oak Ave',
      vaccineStatus: 'partially vaccinated',
      contact: '09987654321',
      submitted: '2024-10-18'
    },
    {
      id: 3,
      name: 'Balugo Santiago',
      age: 38,
      address: '987 Cedar Ln',
      vaccineStatus: 'partially vaccinated',
      contact: '09778888999',
      submitted: '2024-10-19'
    }
  ]);

  const [approvedResidents, setApprovedResidents] = useState([]);

  const handleUploadFile = () => {
    if (!uploadFile) {
      setToast({ show: true, message: 'Please select a file to upload', type: 'error' });
      return;
    }
    // Simulate file upload
    setShowUploadModal(false);
    setUploadFile(null);
    setToast({ show: true, message: 'Master list uploaded successfully!', type: 'success' });
  };

  const handleAddResident = () => {
    if (!formData.name || !formData.age || !formData.address || !formData.contact) {
      setToast({ show: true, message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    const newResident = {
      id: pendingResidents.length + 1,
      ...formData,
      age: parseInt(formData.age),
      submitted: new Date().toISOString().split('T')[0]
    };

    setPendingResidents([...pendingResidents, newResident]);
    setShowAddModal(false);
    setFormData({
      name: '',
      age: '',
      address: '',
      vaccineStatus: 'not vaccinated',
      contact: ''
    });
    setToast({ show: true, message: 'Resident added successfully!', type: 'success' });
  };

  const handleEditResident = () => {
    setPendingResidents(pendingResidents.map(resident => 
      resident.id === selectedResident.id ? { ...resident, ...formData, age: parseInt(formData.age) } : resident
    ));
    setShowEditModal(false);
    setSelectedResident(null);
    setToast({ show: true, message: 'Resident updated successfully!', type: 'success' });
  };

  const handleDeleteResident = () => {
    setPendingResidents(pendingResidents.filter(resident => resident.id !== selectedResident.id));
    setSelectedResident(null);
    setToast({ show: true, message: 'Resident deleted successfully!', type: 'success' });
  };

  const openEditModal = (resident) => {
    setSelectedResident(resident);
    setFormData({
      name: resident.name,
      age: resident.age.toString(),
      address: resident.address,
      vaccineStatus: resident.vaccineStatus,
      contact: resident.contact
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (resident) => {
    setSelectedResident(resident);
    setShowDeleteDialog(true);
  };

  const handleExportData = () => {
    // Simulate export
    setToast({ show: true, message: 'Data exported successfully!', type: 'success' });
  };

  const currentResidents = activeTab === 'pending' ? pendingResidents : approvedResidents;
  const pendingCount = pendingResidents.length;
  const approvedCount = approvedResidents.length;

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
          title="Resident Information Management" 
          subtitle="Assigned Barangay: undefined" 
        />

        {/* Main Content */}
        <div className="p-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-5">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3E5F44] text-white text-sm font-medium rounded-md hover:bg-[#2d4532] transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Master List
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Resident
            </button>
            <button 
              onClick={handleExportData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => setActiveTab('pending')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white text-[#3E5F44] border border-[#3E5F44]'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'approved'
                  ? 'bg-white text-[#3E5F44] border border-[#3E5F44]'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approved ({approvedCount})
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
                placeholder="Search by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Residents Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">
                {activeTab === 'pending' ? 'Pending Residents - Barangay A' : 'Approved Residents'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Total {activeTab} residents: {currentResidents.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Vaccine Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentResidents.map((resident) => (
                    <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {resident.name}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {resident.age}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {resident.address}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getVaccineStatusBadge(resident.vaccineStatus)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {resident.contact}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {resident.submitted}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(resident)}
                            className="p-1.5 text-gray-600 hover:text-[#3E5F44] hover:bg-gray-100 rounded transition-colors" 
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openDeleteDialog(resident)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Upload Master List Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Upload Master List</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Upload CSV or Excel file with resident data</p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50">
              <div className="border-2 border-dashed border-[#93DA97] rounded-lg p-8 text-center bg-[#E8FFD7]/30">
                <svg className="w-12 h-12 text-[#3E5F44] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-semibold text-[#3E5F44] mb-2">Choose a file or drag it here</p>
                <p className="text-xs text-gray-600 mb-4">CSV or Excel files only (Max 10MB)</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-white border-2 border-[#3E5F44] text-[#3E5F44] text-sm font-medium rounded-md hover:bg-[#E8FFD7] transition-colors cursor-pointer"
                >
                  Select File
                </label>
                {uploadFile && (
                  <p className="mt-3 text-sm text-[#3E5F44] font-medium">
                    Selected: {uploadFile.name}
                  </p>
                )}
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The file should contain columns: Name, Age, Address, Vaccine Status, Contact
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFile}
                disabled={!uploadFile}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-md hover:from-[#2d4532] hover:to-[#4a7255] transition-all shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Add New Resident</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Enter resident information</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', age: '', address: '', vaccineStatus: 'not vaccinated', contact: '' });
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="Enter age"
                    min="1"
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter complete address"
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Vaccine Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vaccineStatus}
                    onChange={(e) => setFormData({...formData, vaccineStatus: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  >
                    <option value="not vaccinated">Not Vaccinated</option>
                    <option value="partially vaccinated">Partially Vaccinated</option>
                    <option value="fully vaccinated">Fully Vaccinated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    placeholder="09XXXXXXXXX"
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', age: '', address: '', vaccineStatus: 'not vaccinated', contact: '' });
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResident}
                disabled={!formData.name || !formData.age || !formData.address || !formData.contact}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-md hover:from-[#2d4532] hover:to-[#4a7255] transition-all shadow-md disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
              >
                Add Resident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resident Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit Resident</h3>
                <p className="text-xs text-[#E8FFD7] mt-1">Update resident information</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedResident(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    min="1"
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Vaccine Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vaccineStatus}
                    onChange={(e) => setFormData({...formData, vaccineStatus: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  >
                    <option value="not vaccinated">Not Vaccinated</option>
                    <option value="partially vaccinated">Partially Vaccinated</option>
                    <option value="fully vaccinated">Fully Vaccinated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3E5F44] mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93DA97] focus:border-[#3E5F44] transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white border-t-2 border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedResident(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditResident}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-md hover:from-[#2d4532] hover:to-[#4a7255] transition-all shadow-md"
              >
                Save Changes
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
          setSelectedResident(null);
        }}
        onConfirm={handleDeleteResident}
        title="Delete Resident"
        message={`Are you sure you want to delete ${selectedResident?.name}? This action cannot be undone.`}
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
