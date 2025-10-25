import { Eye, Trash2 } from "lucide-react";

export default function VaccineRequestsTable({
  requests = [],
  vaccines = [],
  isLoading = false,
  error = null,
  searchQuery = "",
  onDelete,
  onRetry
}) {
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
      <tr>
        <td colSpan="6" className="px-6 py-12 text-center">
          <p className="text-gray-500 text-sm">No requests found.</p>
        </td>
      </tr>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <tr>
        <td colSpan="6" className="px-6 py-12 text-center">
          <p className="text-gray-500 text-sm">
            No requests found matching "{searchQuery}"
          </p>
        </td>
      </tr>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredRequests.map(request => (
            <tr key={request.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {request.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(request.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {vaccines.find(v => v.id === request.vaccine_id)?.name || 'Loading...'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.quantity_requested} doses
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {request.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    <Eye size={16} />
                  </button>
                  {request.status === 'pending' && (
                    <button 
                      onClick={() => onDelete(request.id)}
                      className="text-red-600 hover:text-red-800"
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
  );
}