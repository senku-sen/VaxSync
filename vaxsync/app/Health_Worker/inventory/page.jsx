import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
        <main className="p-9  flex-1 overflow-auto">
          {/* SEARCH BAR */}
          <div className="flex items-center space-x-2 ">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by vaccine name or batch..."
                className="w-full text-sm pl-10"
              />
            </div>
          </div>
          {/* SEARCH BAR */}

          {children}
        </main>
      </div>
    </div>
  );
}

// 3E5F44
