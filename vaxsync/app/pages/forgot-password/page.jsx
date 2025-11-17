"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      // Send a 6-digit OTP to the user's email (passwordless email code)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setMessage("We sent a 6-digit code to your email.");
      setStep(2);
    } catch (err) {
      setMessage(err.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email) return;
    setResending(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setMessage("Code resent. Please check your inbox.");
    } catch (e) {
      setMessage(e.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      // Verify the 6-digit code
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;
      setMessage("Code verified. Enter a new password.");
      setStep(3);
    } catch (err) {
      setMessage(err.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage("Password updated. You can now sign in.");
      setTimeout(() => { window.location.href = "/pages/signin"; }, 800);
    } catch (err) {
      setMessage(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6" style={{ borderColor: "#3E5F44" }}>
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/VSyncLogo.png"
            alt="VaxSync Logo"
            style={{ maxWidth: '240px', height: 'auto' }}
            className="h-24 w-auto"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#3E5F44" }}>Forgot Password</h1>
        <p className="text-sm text-gray-600 mb-6">Reset your password with a 6-digit code sent to your email.</p>

        {message ? <div className="mb-4 text-sm text-gray-800">{message}</div> : null}

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button disabled={loading} className="w-full text-white py-2 rounded" style={{ backgroundColor: "#3E5F44" }}>
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">6-digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="w-full border rounded px-3 py-2 tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0,6))}
                placeholder="123456"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={handleResendCode} disabled={resending} className="text-sm underline" style={{ color: "#3E5F44" }}>
                {resending ? "Resending…" : "Resend code"}
              </button>
              <button disabled={loading} className="text-white py-2 px-4 rounded" style={{ backgroundColor: "#3E5F44" }}>
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">New Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button disabled={loading} className="w-full text-white py-2 rounded" style={{ backgroundColor: "#3E5F44" }}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/pages/signin" className="text-sm" style={{ color: "#3E5F44" }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
