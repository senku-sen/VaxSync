"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function RegistrationSuccess() {
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState({ sending: false, sent: false, error: "" });

  useEffect(() => {
    // Get email from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || localStorage.getItem('registeredEmail');
    if (email) {
      setUserEmail(email);
    }
  }, []);

  async function handleResendOtp() {
    if (!userEmail) return;
    setStatus({ sending: true, sent: false, error: "" });
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: userEmail, options: { shouldCreateUser: false } });
      if (error) throw error;
      setStatus({ sending: false, sent: true, error: "" });
    } catch (e) {
      setStatus({ sending: false, sent: false, error: e.message || "Failed to send code" });
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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

        {/* Success Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#3E5F44' }}>
            Registration Successful
          </h2>
          <p className="text-gray-600 text-sm">
            Check your email to confirm your account
          </p>
        </div>

        {/* Message Body */}
        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <p className="text-gray-700">Thanks for signing up!</p>
            <p className="text-gray-700">
              We've sent a confirmation email or code to{" "}
              <span className="font-bold" style={{ color: '#3E5F44' }}>
                {userEmail || "your email address"}
              </span>
            </p>
            <p className="text-gray-700 text-sm">
              Didn’t get it? You can resend a code below.
            </p>
            {status.error ? (
              <p className="text-red-600 text-sm">{status.error}</p>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleResendOtp}
            disabled={!userEmail || status.sending}
            className="w-full text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium disabled:opacity-60"
            style={{ backgroundColor: '#3E5F44', '--tw-ring-color': '#3E5F44' }}
          >
            {status.sending ? 'Resending…' : status.sent ? 'Code Sent!' : 'Resend OTP Code'}
          </button>
          <button
            onClick={() => window.location.href = '/pages/signin'}
            className="w-full text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium"
            style={{ backgroundColor: '#3E5F44', '--tw-ring-color': '#3E5F44' }}
          >
            Proceed to Login
          </button>
        </div>
      </div>
    </div>
  );
}
