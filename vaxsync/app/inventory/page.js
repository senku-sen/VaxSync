// 'use client';

// import { useState } from 'react';
// import DashboardLayout from '@/components/layout/DashboardLayout';

// export default function Inventory() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [inventoryData] = useState([
//     {
//       id: 1,
//       vaccineName: 'COVID-19',
//       batch: 'CV-2025-001',
//       quantity: '450 doses',
//       expiry: '2025-06-15',
//       location: 'Cold Storage A',
//       notes: 'Pfizer'
//     },
//     {
//       id: 2,
//       vaccineName: 'Polio',
//       batch: 'PO-2025-002',
//       quantity: '380 doses',
//       expiry: '2025-08-20',
//       location: 'Cold Storage B',
//       notes: 'IPV'
//     },
//     {
//       id: 3,
//       vaccineName: 'Measles',
//       batch: 'MS-2025-003',
//       quantity: '520 doses',
//       expiry: '2025-07-10',
//       location: 'Cold Storage A',
//       notes: 'MMR'
//     }
//   ]);

//   const filteredData = inventoryData.filter(item =>
//     item.vaccineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.batch.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <DashboardLayout>
//       <div className="min-h-screen bg-gray-50">
//         {/* Header */}
//         <div className="bg-white px-6 py-5 flex items-start justify-between">
//           <div>
//             <h1 className="text-xl font-semibold text-gray-800">Inventory Management</h1>
//             <p className="text-xs text-gray-500 mt-0.5">Track and manage vaccine stock</p>
//           </div>
          
//           {/* Header Actions */}
//           <div className="flex items-center gap-3">
//             {/* Notification Bell */}
//             <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
//               <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//               </svg>
//               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
//             </button>
            
//             {/* User Profile */}
//             <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//               <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="p-6">
//           {/* Search Bar */}
//           <div className="mb-6">
//             <div className="relative max-w-md">
//               <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//               </svg>
//               <input
//                 type="text"
//                 placeholder="Search by vaccine name or batch..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
//               />
//             </div>
//           </div>

//           {/* Vaccine Stock Table */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-100">
//             <div className="px-5 py-4 border-b border-gray-200">
//               <h2 className="text-base font-semibold text-gray-800">Vaccine Stock</h2>
//               <p className="text-xs text-gray-500 mt-0.5">All vaccines in inventory</p>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th className="px-5 py-3 text-left text-xs font-medium text-gray-600">Vaccine Name</th>
//                     <th className="px-5 py-3 text-left text-xs font-medium text-gray-600">Batch</th>
//                     <th className="px-5 py-3 text-left text-xs font-medium text-gray-600">Quantity</th>
//                     <th className="px-5 py-3 text-left text-xs font-medium text-gray-600">Expiry</th>
//                     <th className="px-5 py-3 text-left text-xs font-medium text-gray-600">Location</th>
//                     <th className="px-5 py-3 text-left text-xs font-medium text-gray-600">Notes</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredData.map((item) => (
//                     <tr key={item.id} className="hover:bg-gray-50 transition-colors">
//                       <td className="px-5 py-4 text-sm text-gray-800">{item.vaccineName}</td>
//                       <td className="px-5 py-4 text-sm text-gray-600">{item.batch}</td>
//                       <td className="px-5 py-4 text-sm text-gray-600">{item.quantity}</td>
//                       <td className="px-5 py-4 text-sm text-gray-600">{item.expiry}</td>
//                       <td className="px-5 py-4 text-sm text-gray-600">{item.location}</td>
//                       <td className="px-5 py-4 text-sm text-gray-400">{item.notes}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {filteredData.length === 0 && (
//               <div className="px-5 py-8 text-center text-sm text-gray-500">
//                 No vaccines found matching your search.
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }
