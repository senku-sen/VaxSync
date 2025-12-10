import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Check if email exists
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email || !email.trim()) {
      return NextResponse.json({ exists: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Only check user_profiles table - simpler and faster
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.log('Error checking email in profiles:', profileError.message);
    }

    if (existingProfile && existingProfile.id) {
      return NextResponse.json({ exists: true });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.log('Error checking email:', error.message);
    return NextResponse.json({ exists: false });
  }
}

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log('Signup request received:', { email: formData.email, userRole: formData.userRole });
    
    const { firstName, lastName, email, password, month, date, year, sex, address, userRole, authCode } = formData;

    if (!firstName || !lastName || !email || !password || !month || !date || !year || !sex || !address || !userRole || !authCode) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Pre-check: if profile exists, consider it already registered
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (existingProfile && existingProfile.id) {
        return NextResponse.json({ error: 'An account with this email already exists. Please use a different email or try logging in.' }, { status: 400 });
      }
    } catch (error) {
      console.log('Error checking existing user:', error.message);
      // Don't fail signup if check fails
    }

    // Authentication codes for each role
    // To change auth codes, update the values below:
    // Format: 'Role Name': 'AUTH-CODE'
    const validAuthCodes = { 
      'Rural Health Midwife (RHM)': 'RHM-4Z7Q', 
      'Public Health Nurse': 'PHN-6A9F' 
    };
    
    if (validAuthCodes[userRole] !== authCode) {
      return NextResponse.json({ error: `Invalid authentication code for ${userRole}. Please contact your administrator.` }, { status: 400 });
    }

    // Convert month name to number (1-12)
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthNumber = monthNames.indexOf(month) + 1;
    const monthPadded = monthNumber.toString().padStart(2, '0');
    const datePadded = date.toString().padStart(2, '0');
    const dateOfBirth = `${year}-${monthPadded}-${datePadded}`;

    console.log('Attempting to create user in Supabase Auth...');
    // Store profile data in user_metadata - will be used to create profile after email verification
    // IMPORTANT: Use the full callback URL with type parameter to ensure Supabase redirects through our handler
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback?type=email&redirect=/pages/signin`;
    console.log('Email redirect URL:', callbackUrl);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: callbackUrl,
        data: { 
          first_name: firstName, 
          last_name: lastName, 
          date_of_birth: dateOfBirth, 
          sex, 
          address, 
          user_role: userRole, 
          auth_code: authCode,
          // Store all profile data for later use
          profile_data: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            date_of_birth: dateOfBirth,
            sex,
            address,
            user_role: userRole,
            auth_code: authCode
          })
        }
      }
    });

    console.log('Auth signup result:', { hasUser: !!authData?.user, identities: authData?.user?.identities?.length, hasError: !!authError, errorMessage: authError?.message });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('User already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists. Please use a different email or try logging in.' }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Supabase quirk: when email exists, user may be returned but identities is empty → treat as duplicate
    if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      return NextResponse.json({ error: 'An account with this email already exists. Please use a different email or try logging in.' }, { status: 400 });
    }

    if (!authData?.user) {
      return NextResponse.json({ error: 'An account with this email already exists or is pending confirmation. Please check your email or try logging in.' }, { status: 400 });
    }

    // Clean up any auto-created profile (only if service role key is available)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey && serviceRoleKey.length > 20 && authData.user?.id) {
      try {
        const supabaseService = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Delete any auto-created profile (from trigger)
        await supabaseService
          .from('user_profiles')
          .delete()
          .eq('id', authData.user.id);
        console.log('Cleaned up any auto-created profile for:', authData.user.id);
      } catch (cleanupError) {
        console.log('Profile cleanup skipped:', cleanupError.message);
      }
    }

    // Profile will be created in the auth callback after email verification
    return NextResponse.json({ 
      message: 'Account created successfully. Please check your email to verify your account before logging in.', 
      user: { id: authData.user.id, email: authData.user.email },
      emailSent: true
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
