'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCheck({ children }) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
}
