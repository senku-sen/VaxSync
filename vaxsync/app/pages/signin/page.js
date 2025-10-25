"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials.');
      
      // Redirect based on user role
      if (data.userRole === 'Health Worker') {
        window.location.href = '/Health_Worker/inventory';
      } else if (data.userRole === 'Head Nurse') {
        window.location.href = '/Head_Nurse/inventory';
      } else {
        // Fallback for unknown roles
        window.location.href = '/inventory';
      }
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md" style={{ border: '2px solid #3E5F44' }}>
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <Image
            src="/VSyncLogo.png"
            alt="VaxSync Logo"
            width={240}
            height={90}
            className="h-24 w-auto"
          />
        </div>

        {/* Sign In Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#3E5F44' }}>Sign In</h2>
          <p className="text-gray-600 text-sm">Enter your credentials to access your account</p>
        </div>

        {/* Error Banner */}
        {error ? (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Please use the email you registered with</p>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm font-medium" style={{ color: '#3E5F44' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
              required
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: '#3E5F44', '--tw-ring-color': '#3E5F44' }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/pages/signup" className="font-medium" style={{ color: '#3E5F44' }}>
              Sign up
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-2">Use the email address you registered with.</p>
        </div>
      </div>
    </div>
  );
}
