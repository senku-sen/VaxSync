"use client";

import { useState } from "react";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import { BarChart3, Calendar, MapPin } from "lucide-react";
import MonthlyReportTab from "@/components/reports/MonthlyReportTab";
import DailyReportTab from "@/components/reports/DailyReportTab";
import WeeklyReportTab from "@/components/reports/WeeklyReportTab";
import BarangayReportTab from "@/components/reports/BarangayReportTab";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("monthly");

  const tabs = [
    {
      id: "daily",
      label: "Daily Report",
      icon: Calendar,
      component: DailyReportTab,
    },
    {
      id: "weekly",
      label: "Weekly Report",
      icon: Calendar,
      component: WeeklyReportTab,
    },
    {
      id: "monthly",
      label: "Monthly Report",
      icon: BarChart3,
      component: MonthlyReportTab,
    },
    {
      id: "barangay",
      label: "Barangay Report",
      icon: MapPin,
      component: BarangayReportTab,
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full lg:ml-72">
        <Header
          title="Reports & Analytics"
          subtitle="Vaccine usage and vaccination reports"
        />

        <main className="p-4 md:p-6 lg:p-9 flex-1 overflow-auto">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "text-[#4A7C59] border-b-2 border-[#4A7C59]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  );
}
