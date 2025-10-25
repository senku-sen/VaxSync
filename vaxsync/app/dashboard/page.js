'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user role from localStorage
    const userRole = localStorage.getItem('userRole') || 'Health Worker';
    
    // Route based on user role
    if (userRole === 'Head Nurse') {
      router.push('/dashboard/head-nurse');
    } else {
      router.push('/dashboard/health-worker');
    }
    
    setIsLoading(false);
  }, [router]);

  if (!isLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E5F44] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
