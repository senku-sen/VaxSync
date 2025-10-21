import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function Inventory({
  title = "Inventory Management",
  subtitle = "Manage vaccine stock and supplies",
  children,
}) {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-64">
        {/* Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Main Content */}
        <main className="p-4  flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
