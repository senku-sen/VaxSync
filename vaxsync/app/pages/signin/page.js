"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for verification success or errors from URL parameters (both query and hash)
  useEffect(() => {
    // Check hash parameters first (Supabase often uses hash for tokens and errors)
    const hash = window.location.hash.substring(1); // Remove the #
    const hashParams = hash ? new URLSearchParams(hash) : null;
    
    // Check if there's an access_token in the hash (Supabase direct redirect)
    const accessToken = hashParams?.get('access_token');
    const hashError = hashParams?.get('error');
    const hashErrorCode = hashParams?.get('error_code');
    const hashErrorDescription = hashParams?.get('error_description');
    const hashType = hashParams?.get('type');

    // If Supabase redirected directly with access_token after signup, handle it
    // This happens when Supabase's emailRedirectTo is not properly configured or is overridden
    if (accessToken && (hashType === 'signup' || hashType === 'email')) {
      console.log('⚠️ Supabase redirected directly to signin with access_token - redirecting to callback route');
      
      // Decode the JWT token to get user info
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const userId = payload.sub;
          const email = payload.email;
          
          console.log('Token payload:', { userId, email, type: hashType, hasUserMetadata: !!payload.user_metadata });
          
          // If we have userId and email, redirect to our callback route immediately
          // This ensures profile creation happens through our controlled flow
          if (userId && email) {
            // Redirect to callback route which will handle profile creation and then redirect back
            window.location.href = `/api/auth/callback?user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&type=${hashType}&redirect=/pages/signin`;
            return;
          }
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
      
      // Fallback: try to extract token_hash if present
      const tokenHash = hashParams?.get('token_hash');
      if (tokenHash) {
        // Redirect to our callback route to handle verification properly
        window.location.href = `/api/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=email&redirect=/pages/signin`;
        return;
      }
      
      // If we can't extract user info, clear the hash and show error
      console.error('Could not extract user info from access_token');
      window.history.replaceState({}, '', window.location.pathname);
      setError('Unable to process email verification. Please try signing in.');
    }

    // Check query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const verifiedEmail = urlParams.get('email');
    const errorParam = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');

    if (verified === 'true' && verifiedEmail) {
      setError("");
      // Show success message
      console.log('Email verified successfully for:', verifiedEmail);
      // Clear the URL parameters but keep the page state
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Show a temporary success message (optional - you can add a success banner)
      // For now, just clear any errors
    } else if (errorParam || errorCode || hashError || hashErrorCode) {
      // Handle errors from email verification (check both query and hash)
      let errorMessage = 'Email verification failed. ';
      const finalErrorCode = errorCode || hashErrorCode;
      const finalErrorDescription = errorDescription || hashErrorDescription;
      const finalError = errorParam || hashError;
      
      if (finalErrorCode === 'otp_expired') {
        errorMessage = 'The verification link has expired. Please request a new verification email.';
      } else if (finalErrorDescription) {
        errorMessage = decodeURIComponent(finalErrorDescription.replace(/\+/g, ' '));
      } else if (finalError) {
        errorMessage = decodeURIComponent(finalError.replace(/\+/g, ' '));
      }
      setError(errorMessage);
      // Clear the URL parameters and hash
      window.history.replaceState({}, '', '/pages/signin');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }

      console.log('Attempting sign in for:', email);
      
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Sign in response status:', res.status);
      
      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.error || 'Invalid credentials.';
        console.error('Sign in failed:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Ensure the client has a Supabase auth session (needed for Storage RLS)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        console.error('Client auth sign-in error:', authError);
        throw new Error(authError.message || 'Failed to establish client session');
      }

      // Set a cookie to help middleware detect auth
      document.cookie = 'vaxsync_authenticated=true; path=/; max-age=86400; SameSite=Lax';

      // Cache minimal profile for client-only pages
      const userCache = {
        id: data.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        user_role: data.userRole,
        address: data.address || "",
      };
      console.log('Caching user:', userCache);
      try {
        localStorage.setItem('vaxsync_user', JSON.stringify(userCache));
        console.log('User cached successfully');
      } catch (err) {
        console.error('Failed to cache user:', err);
        throw new Error('Failed to cache user data');
      }
      
      // Small delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect based on user role
      console.log('Redirecting based on role:', data.userRole);
      if (data.userRole === 'Public Health Nurse') {
        window.location.href = '/pages/Public_Health_Nurse/dashboard';
      } else if (data.userRole === 'Rural Health Midwife (RHM)') {
        window.location.href = '/pages/Rural_Health_Midwife/dashboard';
      } else {
        // Fallback for unknown roles - default to Rural Health Midwife dashboard
        console.warn('Unknown user role:', data.userRole);
        window.location.href = '/pages/Rural_Health_Midwife/dashboard';
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-gray-300 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8 pb-8 px-8 pt-8 ">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/VSyncLogo.png"
              alt="VaxSync Logo"
              width={300}
              height={112}
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-600">Access your vaccine management dashboard</p>
        </div>

        {/* Card Content */}
        <div className="p-8">

          {/* Error Banner */}
          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3" role="alert" aria-live="assertive">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                  error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                }`}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Password
                </label>
                <Link href="/pages/forgot-password" className="text-xs font-medium transition-colors" style={{ color: '#3E5F44' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                  error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                }`}
                required
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm mt-6 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: '#3E5F44', '--tw-ring-color': '#3E5F44' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d4a33'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3E5F44'}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500 font-medium">New user?</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-700">
              Don't have an account?{" "}
              <Link href="/pages/signup" className="font-semibold transition-colors" style={{ color: '#3E5F44' }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}