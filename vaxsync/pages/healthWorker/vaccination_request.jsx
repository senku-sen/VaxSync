import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function Inventory({
  title = "Vaccine Requisition Requests",
  subtitle = "Barangay: Barangay A",
}) {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">

     
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#3E5F44]">0</p>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#5E936C]">0</p>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#93DA97]">0</p>
              <p className="text-sm text-gray-600 mt-1">Approved</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-[#3E5F44]">0</p>
              <p className="text-sm text-gray-600 mt-1">Released</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-gray-600">0</p>
              <p className="text-sm text-gray-600 mt-1">Rejected</p>
            </div>
          </div>








        </main>
      </div>
    </div>
  );
}

