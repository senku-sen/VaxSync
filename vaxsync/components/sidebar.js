"use client"

import { cn } from "@/lib/utils"
export default function Sidebar() {
  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '#' },
    { icon: '📦', label: 'Inventory', href: '#' },
    { icon: '💉', label: 'Vaccination Schedule', href: '#' },
    { icon: '👥', label: 'Resident Data', href: '#' },
    { icon: '✓', label: 'Resident Approval', href: '#' },
    { icon: '📋', label: 'Vaccine Requests', href: '#' },
    { icon: '📝', label: 'Request Approval', href: '#' },
    { icon: '📈', label: 'Reports', href: '#' },
    { icon: '🔔', label: 'Notifications', href: '#' },
    { icon: '👤', label: 'User Management', href: '#', active: true },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center font-bold text-sm">
            V
          </div>
          <span className="font-bold text-lg">VaxSync</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {menuItems.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              item.active
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}