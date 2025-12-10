'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook to protect pages that require authentication
 * @param {string} redirectPath - Where to redirect after successful login (defaults to current path)
 * @returns {{ isAuthenticated: boolean, isLoading: boolean, user: object | null, signOut: function }}
 */
export function useAuth(redirectPath) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Also verify localStorage has user data
        const cachedUser = typeof window !== 'undefined' 
          ? localStorage.getItem('vaxsync_user') 
          : null;
        
        if (!session || error || !cachedUser) {
          // Clear all auth data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('vaxsync_user');
            localStorage.removeItem('headNurseNotifications');
            localStorage.removeItem('healthWorkerNotifications');
            document.cookie = 'vaxsync_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const redirect = redirectPath || currentPath;
          // Use window.location.replace for stronger redirect (prevents back-button)
          if (typeof window !== 'undefined') {
            window.location.replace(`/pages/signin?redirect=${encodeURIComponent(redirect)}`);
          } else {
            router.replace(`/pages/signin?redirect=${encodeURIComponent(redirect)}`);
          }
          return;
        }
        
        setUser(session.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear everything on error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vaxsync_user');
          document.cookie = 'vaxsync_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          window.location.replace('/pages/signin');
        } else {
          router.replace('/pages/signin');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Re-check auth when page becomes visible (prevents back-button access)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    // Re-check auth on focus (prevents back-button access)
    const handleFocus = () => {
      checkAuth();
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setUser(null);
        // Clear all auth data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vaxsync_user');
          localStorage.removeItem('headNurseNotifications');
          localStorage.removeItem('healthWorkerNotifications');
          document.cookie = 'vaxsync_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          window.location.replace('/pages/signin');
        } else {
          router.replace('/pages/signin');
        }
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
    });

    // Set up event listeners
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      subscription?.unsubscribe();
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [router, redirectPath]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear the auth cookie
      document.cookie = 'vaxsync_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('vaxsync_user');
      router.replace('/pages/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return { isAuthenticated, isLoading, user, signOut };
}

/**
 * Loading component to show while checking auth
 */
export function AuthLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E5F44] mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    </div>
  );
}

