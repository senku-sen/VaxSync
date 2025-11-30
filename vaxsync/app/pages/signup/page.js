"use client";

import { useState } from "react";
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
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateDate = (month, date, year) => {
    if (!month || !date || !year) return false;
    
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(month);
    
    const day = parseInt(date);
    const yearNum = parseInt(year);
    
    if (isNaN(day) || isNaN(yearNum)) return false;
    if (day < 1 || day > 31) return false;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;
    
    const dateObj = new Date(yearNum, monthIndex, day);
    return dateObj.getDate() === day && dateObj.getMonth() === monthIndex && dateObj.getFullYear() === yearNum;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setFieldErrors({});
    setIsSubmitting(true);

    const errors = {};

    // Validate required fields
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.password) errors.password = "Password is required";
    if (!formData.month) errors.month = "Month is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.year) errors.year = "Year is required";
    if (!formData.sex) errors.sex = "Sex is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.authCode.trim()) errors.authCode = "Authentication code is required";

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Validate password length
    if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    // Validate date of birth
    if (formData.month && formData.date && formData.year) {
      if (!validateDate(formData.month, formData.date, formData.year)) {
        errors.date = "Please enter a valid date of birth";
      }
    }

    // Validate authentication code
    const validAuthCodes = {
      'Health Worker': 'HW-6A9F',
      'RHM/HRH': 'HN-4Z7Q'
    };

    if (formData.authCode && validAuthCodes[formData.userRole] !== formData.authCode) {
      errors.authCode = `Invalid authentication code for ${formData.userRole}`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        const message = (data && data.error) || 'Failed to create account';
        if (/already\s+(registered|been registered|exists)/i.test(message)) {
          setFieldErrors(prev => ({ ...prev, email: message }));
        }
        throw new Error(message);
      }
      
      // Store email for success page
      localStorage.setItem('registeredEmail', formData.email);
      
      // Show success message
      setSuccess(true);
      setError("");
      
      // Redirect to success page after a short delay
      setTimeout(() => {
        window.location.href = `/pages/registration-success?email=${encodeURIComponent(formData.email)}`;
      }, 2000);
      
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
      setSuccess(false);
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

        {/* Success Banner */}
        {success ? (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700" role="alert" aria-live="assertive">
            Account created successfully! Please check your email to verify your account. Redirecting to confirmation page...
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
                className={`w-full px-4 py-3 border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': fieldErrors.firstName ? '#ef4444' : '#3E5F44' }}
                required
              />
              {fieldErrors.firstName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
              )}
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
                className={`w-full px-4 py-3 border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': fieldErrors.lastName ? '#ef4444' : '#3E5F44' }}
                required
              />
              {fieldErrors.lastName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
              )}
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
              className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': fieldErrors.email ? '#ef4444' : '#3E5F44' }}
              required
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
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
              className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': fieldErrors.password ? '#ef4444' : '#3E5F44' }}
              required
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
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
                className={`px-3 py-3 border ${fieldErrors.month ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': fieldErrors.month ? '#ef4444' : '#3E5F44' }}
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
                className={`px-3 py-3 border ${fieldErrors.date ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': fieldErrors.date ? '#ef4444' : '#3E5F44' }}
                required
              />
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="Year"
                className={`px-3 py-3 border ${fieldErrors.date ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
                style={{ '--tw-ring-color': fieldErrors.date ? '#ef4444' : '#3E5F44' }}
                required
              />
            </div>
            {fieldErrors.date && (
              <p className="text-red-500 text-xs mt-1 col-span-3">{fieldErrors.date}</p>
            )}
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
              className={`w-full px-4 py-3 border ${fieldErrors.sex ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': fieldErrors.sex ? '#ef4444' : '#3E5F44' }}
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
              className={`w-full px-4 py-3 border ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': fieldErrors.address ? '#ef4444' : '#3E5F44' }}
              required
            />
            {fieldErrors.address && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
            )}
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
                  value="RHM/HRH"
                  checked={formData.userRole === "RHM/HRH"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="headNurse" className="ml-2 block text-sm text-gray-700">
                  RHM/HRH
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
              className={`w-full px-4 py-3 border ${fieldErrors.authCode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-900`}
              style={{ '--tw-ring-color': fieldErrors.authCode ? '#ef4444' : '#3E5F44' }}
              required
            />
            {fieldErrors.authCode && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.authCode}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Enter the authorization code provided by your administrator
            </p>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors font-medium ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: '#3E5F44', '--tw-ring-color': '#3E5F44' }}
          >
            {isSubmitting ? 'Creating Account…' : 'Sign Up'}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/pages/signin" className="font-medium" style={{ color: '#3E5F44' }}>
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
