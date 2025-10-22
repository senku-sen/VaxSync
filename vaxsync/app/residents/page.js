import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function Inventory({
  title = "Resident Information Management",
  subtitle = "Manage Resident Data and Approvals",
}) {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        <Header title={title} subtitle={subtitle} />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto"></main>
      </div>
    </div>
  );
}
