"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    month: "",
    date: "",
    year: "",
    sex: "Male",
    address: "",
    email: "",
    password: "",
    userRole: "Health Worker",
    authCode: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      window.location.href = '/Pages/SignInPage';
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

        {/* Sign Up Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#3E5F44' }}>Sign Up</h2>
          <p className="text-gray-600 text-sm">Fill in your information to create an account</p>
        </div>

        {/* Error Banner */}
        {error ? (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First Name and Last Name Fields - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your First Name"
                className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your Last Name"
                className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your Email"
              className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a Password"
              className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                className={`px-3 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
                required
              >
                <option value="">Month</option>
                {months.map((month, index) => (
                  <option key={index} value={month}>{month}</option>
                ))}
              </select>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                placeholder="Date"
                className={`px-3 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
                required
              />
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="Year"
                className={`px-3 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
                required
              />
            </div>
          </div>

          {/* Sex Field */}
          <div>
            <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-2">
              Sex
            </label>
            <select
              id="sex"
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Address Field */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your Address"
              className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
              required
            />
          </div>

          {/* User Role Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Role
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="healthWorker"
                  name="userRole"
                  value="Health Worker"
                  checked={formData.userRole === "Health Worker"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="healthWorker" className="ml-2 block text-sm text-gray-700">
                  Health Worker
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="headNurse"
                  name="userRole"
                  value="Head Nurse"
                  checked={formData.userRole === "Head Nurse"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="headNurse" className="ml-2 block text-sm text-gray-700">
                  Head Nurse
                </label>
              </div>
            </div>
          </div>

          {/* Authorization Code Field */}
          <div>
            <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-2">
              Authorization Code
            </label>
            <input
              type="text"
              id="authCode"
              name="authCode"
              value={formData.authCode || ""}
              onChange={handleInputChange}
              placeholder="Enter your authorization code"
              className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': error ? '#ef4444' : '#3E5F44' }}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter the authorization code provided by your administrator</p>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: '#3E5F44', '--tw-ring-color': '#3E5F44' }}
          >
            {isSubmitting ? 'Creating Account…' : 'Sign In'}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Have an account?{" "}
            <Link href="/Pages/SignInPage" className="font-medium" style={{ color: '#3E5F44' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}