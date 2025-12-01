"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Redirect based on user role
      console.log('Redirecting based on role:', data.userRole);
      if (data.userRole === 'Health Worker') {
        window.location.href = '/pages/Health_Worker/dashboard';
      } else if (data.userRole === 'Head Nurse') {
        window.location.href = '/pages/Head_Nurse/dashboard';
      } else {
        // Fallback for unknown roles
        console.warn('Unknown user role:', data.userRole);
        window.location.href = '/inventory';
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
              width={240}
              height={90}
              className="h-16 w-auto"
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
                  error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200 focus:border-green-500'
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
                <Link href="/pages/forgot-password" className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                  error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200 focus:border-green-500'
                }`}
                required
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm mt-6 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
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
              <Link href="/pages/signup" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}