export default function VaccineSummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#4A7C59] mb-2">6</p>
        <p className="text-sm text-gray-500 font-medium">Total</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#6B9080] mb-2">1</p>
        <p className="text-sm text-gray-500 font-medium">Pending</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#A4C3B2] mb-2">0</p>
        <p className="text-sm text-gray-500 font-medium">Approved</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#4A7C59] mb-2">4</p>
        <p className="text-sm text-gray-500 font-medium">Released</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 border-3 border-[#E8FFD7] text-center ">
        <p className="text-4xl font-bold text-[#4A7C59] mb-2">1</p>
        <p className="text-sm text-gray-500 font-medium">Rejected</p>
      </div>
    </div>
  );
}