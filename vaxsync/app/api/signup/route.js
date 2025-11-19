import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

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
        .eq('email', email)
        .maybeSingle();
      if (existingProfile && existingProfile.id) {
        return NextResponse.json({ error: 'An account with this email already exists. Please use a different email or try logging in.' }, { status: 400 });
      }
    } catch {}

    const validAuthCodes = { 'Health Worker': 'HW-6A9F', 'RHM/HRH': 'HN-4Z7Q' };
    if (validAuthCodes[userRole] !== authCode) {
      return NextResponse.json({ error: `Invalid authentication code for ${userRole}. Please contact your administrator.` }, { status: 400 });
    }

    const dateOfBirth = `${year}-${month}-${date}`;

    console.log('Attempting to create user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin`,
        data: { first_name: firstName, last_name: lastName, date_of_birth: dateOfBirth, sex, address, user_role: userRole, auth_code: authCode }
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

    // Create profile if not existing
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!existingProfile || !existingProfile.id) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email,
          date_of_birth: dateOfBirth,
          sex,
          address,
          user_role: userRole,
          auth_code: authCode,
          assigned_barangay_id: null, // Explicitly set to null for new users
          created_at: new Date().toISOString()
        });
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return NextResponse.json({ message: 'Account created successfully', user: authData.user }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
