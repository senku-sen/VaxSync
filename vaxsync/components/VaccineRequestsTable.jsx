import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import VaccineRequestDetailModal from "./VaccineRequestDetailModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function VaccineRequestsTable({
  requests = [],
  vaccines = [],
  isLoading = false,
  error = null,
  searchQuery = "",
  onDelete,
  onRetry
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
  };

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(requestToDelete.id);
      setDeleteConfirmOpen(false);
      setRequestToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRequestToDelete(null);
  };
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4A7C59] border-t-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={onRetry}
          className="mt-2 text-[#4A7C59] hover:text-[#3E6B4D] text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const filteredRequests = requests.filter(request => {
    const searchLower = searchQuery.toLowerCase();
    const vaccineName = vaccines.find(v => v.id === request.vaccine_id)?.name?.toLowerCase() || '';
    return request.id?.toString().toLowerCase().includes(searchLower) ||
           vaccineName.includes(searchLower);
  });

  if (requests.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-gray-500 text-sm">No requests found.</p>
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-gray-500 text-sm">
          No requests found matching "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredRequests.map(request => (
            <tr 
              key={request.id} 
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleViewDetails(request)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {request.request_code || request.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(request.created_at).toLocaleDateString('en-CA')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {vaccines.find(v => v.id === request.vaccine_id)?.name || 'Loading...'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {request.quantity_requested} doses
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    request.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    request.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'}`}>
                  {request.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {request.notes || '-'}
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleViewDetails(request)}
                    className="text-blue-600 hover:text-blue-800 transition-colors" 
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                  {request.status === 'pending' && (
                    <button 
                      onClick={() => handleDeleteClick(request)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete request"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Detail Modal */}
      <VaccineRequestDetailModal
        isOpen={isDetailModalOpen}
        request={selectedRequest}
        vaccine={vaccines.find(v => v.id === selectedRequest?.vaccine_id)}
        onClose={handleCloseModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmOpen}
        requestId={requestToDelete?.id}
        requestCode={requestToDelete?.request_code}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </>
  );
}