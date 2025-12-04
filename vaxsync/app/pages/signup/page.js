"use client";

import { useState } from "react";
import Image from "next/image";

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    month: "",
    date: "",
    year: "",
    sex: "Male",
    address: "",
    userRole: "Health Worker",
    authCode: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

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

  const checkEmailExists = async (email) => {
    try {
      const res = await fetch(`/api/signup?email=${encodeURIComponent(email)}`, {
        method: 'GET',
      });
      const data = await res.json();
      return data.exists || false;
    } catch (err) {
      console.error('Error checking email:', err);
      return false; // On error, allow to proceed (server will catch it)
    }
  };

  const validateEmail = (email) => {
    if (!email || !email.trim()) return { valid: false, error: "Email is required" };
    
    // Proper email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, error: "Please enter a valid email address" };
    }
    
    return { valid: true, error: null };
  };

  const validateStep1 = async () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    
    // Validate email format and Gmail requirement
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.error;
    }
    
    if (!formData.password || formData.password.length < 6) errors.password = "Password must be at least 6 characters";
    
    // Check email existence if format is valid
    if (!errors.email && formData.email.trim()) {
      setIsCheckingEmail(true);
      const emailExists = await checkEmailExists(formData.email.trim());
      setIsCheckingEmail(false);
      if (emailExists) {
        errors.email = "This email is already registered. Please use a different email or sign in.";
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.month) errors.month = "Month is required";
    if (!formData.date) errors.date = "Day is required";
    if (!formData.year) errors.year = "Year is required";
    if (!formData.sex) errors.sex = "Sex is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    
    // Validate date if all fields are provided
    if (formData.month && formData.date && formData.year) {
      const dateValidation = validateDate(formData.month, formData.date, formData.year);
      if (!dateValidation.valid) {
        errors.date = dateValidation.error || "Please enter a valid date of birth";
        errors.month = "";
        errors.year = "";
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.userRole) errors.userRole = "User role is required";
    if (!formData.authCode.trim()) errors.authCode = "Authorization code is required";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateAge = (month, date, year) => {
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(month);
    
    if (monthIndex === -1) return null;
    
    const birthDate = new Date(year, monthIndex, parseInt(date));
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    
    return age;
  };

  const validateDate = (month, date, year) => {
    if (!month || !date || !year) return { valid: false, error: null };
    
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(month);
    
    if (monthIndex === -1) return { valid: false, error: "Invalid month" };
    
    const day = parseInt(date);
    const yearNum = parseInt(year);
    
    if (isNaN(day) || isNaN(yearNum)) return { valid: false, error: "Invalid date" };
    if (day < 1 || day > 31) return { valid: false, error: "Invalid day" };
    
    // Year must be between 1900 and current year (not future)
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) {
      return { valid: false, error: "Year must be between 1900 and current year" };
    }
    
    // Create date object and validate it's a real date
    const dateObj = new Date(yearNum, monthIndex, day);
    
    // Check if the date is valid (e.g., Feb 30 becomes March 2, so dates won't match)
    if (dateObj.getDate() !== day || dateObj.getMonth() !== monthIndex || dateObj.getFullYear() !== yearNum) {
      return { valid: false, error: "Invalid date (e.g., February 30 doesn't exist)" };
    }
    
    // Additional check: ensure date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (dateObj > today) {
      return { valid: false, error: "Date of birth cannot be in the future" };
    }
    
    // Check if user is at least 18 years old
    const age = calculateAge(month, date, year);
    if (age === null) {
      return { valid: false, error: "Could not calculate age" };
    }
    if (age < 18) {
      return { valid: false, error: "You must be at least 18 years old to create an account" };
    }
    
    return { valid: true, error: null };
  };

  const handleNext = async (e) => {
    if (e) e.preventDefault();
    
    if (currentStep === 1) {
      const isValid = await validateStep1();
      if (isValid) {
        setCurrentStep(2);
        setError("");
      }
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      setError("");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!validateStep3()) {
      setIsSubmitting(false);
      return;
    }

    // Validate authentication code
    const validAuthCodes = {
      'Health Worker': 'HW-6A9F',
      'RHM/HRH': 'HN-4Z7Q'
    };

    if (formData.authCode && validAuthCodes[formData.userRole] !== formData.authCode) {
      setFieldErrors(prev => ({ ...prev, authCode: `Invalid authentication code for ${formData.userRole}` }));
      setIsSubmitting(false);
      return;
    }

    // Validate date of birth and age requirement
    const dateValidation = validateDate(formData.month, formData.date, formData.year);
    if (!dateValidation.valid) {
      setError(dateValidation.error || "Please enter a valid date of birth");
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
        } else {
          setError(message);
        }
        setIsSubmitting(false);
        return;
      }
      
      setSuccess(true);
      localStorage.setItem('registeredEmail', formData.email);
      setTimeout(() => {
        window.location.href = '/pages/registration-success';
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred');
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-gray-300 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8 pb-8 px-8 pt-8 0">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/VSyncLogo.png"
              alt="VaxSync Logo"
              width={240}
              height={90}
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join VaxSync to manage vaccine programs</p>
        </div>

        {/* Card Content */}
        <div className="p-8">

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Step {currentStep} of 3</span>
              <span className="text-xs font-semibold text-gray-600">{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%`, backgroundColor: '#3E5F44' }}
              ></div>
            </div>
            <div className="flex justify-between mt-3">
              <span className={`text-xs font-medium ${currentStep >= 1 ? '' : 'text-gray-400'}`} style={currentStep >= 1 ? { color: '#3E5F44' } : {}}>Personal</span>
              <span className={`text-xs font-medium ${currentStep >= 2 ? '' : 'text-gray-400'}`} style={currentStep >= 2 ? { color: '#3E5F44' } : {}}>Details</span>
              <span className={`text-xs font-medium ${currentStep >= 3 ? '' : 'text-gray-400'}`} style={currentStep >= 3 ? { color: '#3E5F44' } : {}}>Verification</span>
            </div>
          </div>

          {/* Error Banner */}
          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3" role="alert" aria-live="assertive">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          ) : null}

          {/* Success Banner */}
          {success ? (
            <div className="mb-6 rounded-lg border px-4 py-3 text-sm flex items-start gap-3" role="alert" aria-live="assertive" style={{ borderColor: '#3E5F44', backgroundColor: '#f0f9f4', color: '#1a4d2e' }}>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Account created successfully! Redirecting...</span>
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
            
            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                
                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                        fieldErrors.firstName ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                      }`}
                      required
                    />
                    {fieldErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                        fieldErrors.lastName ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                      }`}
                      required
                    />
                    {fieldErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                      fieldErrors.email ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                    }`}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                  {isCheckingEmail && (
                    <p className="text-xs mt-1" style={{ color: '#3E5F44' }}>Checking email availability...</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                      fieldErrors.password ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                    }`}
                    required
                  />
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: Personal Details */}
            {currentStep === 2 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h2>
                
                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleInputChange}
                      className={`px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 ${
                        fieldErrors.month ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                      }`}
                      required
                    >
                      <option value="">Month</option>
                      {months.map((month, index) => (
                        <option key={index} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 ${
                        fieldErrors.date ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                      }`}
                      required
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className={`px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 ${
                        fieldErrors.date ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                      }`}
                      required
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {(fieldErrors.date || fieldErrors.month || fieldErrors.year) && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.date || fieldErrors.month || fieldErrors.year}</p>
                  )}
                  {!fieldErrors.date && !fieldErrors.month && !fieldErrors.year && formData.month && formData.date && formData.year && (() => {
                    const age = calculateAge(formData.month, formData.date, formData.year);
                    if (age !== null && age >= 0) {
                      return <p className="text-xs text-gray-500 mt-1">Age: {age} years old {age < 18 ? '(Must be 18+)' : ''}</p>;
                    }
                    return null;
                  })()}
                </div>

                {/* Sex Field */}
                <div>
                  <label htmlFor="sex" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Sex
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 ${
                      fieldErrors.sex ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                    }`}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Address Field */}
                <div>
                  <label htmlFor="address" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City"
                    className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                      fieldErrors.address ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                    }`}
                    required
                  />
                  {fieldErrors.address && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
                  )}
                </div>
              </>
            )}

            {/* STEP 3: Verification */}
            {currentStep === 3 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification</h2>
                
                {/* User Role Section */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    User Role
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-2.5 rounded-lg border border-gray-300 cursor-pointer transition-colors" style={{ '--hover-border': '#3E5F44', '--hover-bg': '#f0f9f4' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3E5F44'; e.currentTarget.style.backgroundColor = '#f0f9f4'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <input
                        type="radio"
                        name="userRole"
                        value="Health Worker"
                        checked={formData.userRole === "Health Worker"}
                        onChange={handleInputChange}
                        style={{ accentColor: '#3E5F44' }}
                      />
                      <span className="ml-2 text-sm text-gray-700 font-medium">Health Worker</span>
                    </label>
                    <label className="flex items-center p-2.5 rounded-lg border border-gray-300 cursor-pointer transition-colors" style={{ '--hover-border': '#3E5F44', '--hover-bg': '#f0f9f4' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3E5F44'; e.currentTarget.style.backgroundColor = '#f0f9f4'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <input
                        type="radio"
                        name="userRole"
                        value="RHM/HRH"
                        checked={formData.userRole === "RHM/HRH"}
                        onChange={handleInputChange}
                        style={{ accentColor: '#3E5F44' }}
                      />
                      <span className="ml-2 text-sm text-gray-700 font-medium">RHM/HRH (Head Nurse)</span>
                    </label>
                  </div>
                </div>

                {/* Authorization Code Field */}
                <div>
                  <label htmlFor="authCode" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Authorization Code
                  </label>
                  <input
                    type="text"
                    id="authCode"
                    name="authCode"
                    value={formData.authCode || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your authorization code"
                    className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 ${
                      fieldErrors.authCode ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#3E5F44]/20 focus:border-[#3E5F44]'
                    }`}
                    required
                  />
                  {fieldErrors.authCode && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.authCode}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Provided by your administrator
                  </p>
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-sm"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: '#3E5F44', '--tw-ring-color': '#3E5F44' }}
                onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#2d4a33')}
                onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#3E5F44')}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {currentStep === 3 ? 'Creating Account…' : 'Next…'}
                  </span>
                ) : (
                  currentStep === 3 ? 'Create Account' : 'Next'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500 font-medium">Have an account?</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-700">
              <a href="/pages/signin" className="font-semibold transition-colors" style={{ color: '#3E5F44' }}>
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}