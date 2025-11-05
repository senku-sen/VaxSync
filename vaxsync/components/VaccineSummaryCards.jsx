export default function VaccineSummaryCards({ requests = [] }) {
  // Calculate statistics from requests
  const total = requests.length;
  const pending = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const released = requests.filter(r => r.status === 'released').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#4A7C59] mb-2">{total}</p>
        <p className="text-sm text-gray-500 font-medium">Total</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#6B9080] mb-2">{pending}</p>
        <p className="text-sm text-gray-500 font-medium">Pending</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#A4C3B2] mb-2">{approved}</p>
        <p className="text-sm text-gray-500 font-medium">Approved</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#4A7C59] mb-2">{released}</p>
        <p className="text-sm text-gray-500 font-medium">Released</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#4A7C59] mb-2">{rejected}</p>
        <p className="text-sm text-gray-500 font-medium">Rejected</p>
      </div>
    </div>
  );
}