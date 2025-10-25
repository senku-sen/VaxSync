import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const formData = await request.json();
    
    // Extract form data
    const {
      firstName,
      lastName,
      email,
      password,
      month,
      date,
      year,
      sex,
      address,
      userRole,
      authCode
    } = formData;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !month || !date || !year || !sex || !address || !userRole || !authCode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate authentication codes based on user role
    const validAuthCodes = {
      'Health Worker': 'HW-6A9F',
      'Head Nurse': 'HN-4Z7Q'
    };

    if (validAuthCodes[userRole] !== authCode) {
      return NextResponse.json(
        { error: `Invalid authentication code for ${userRole}. Please contact your administrator.` },
        { status: 400 }
      );
    }

    // Create date of birth string
    const dateOfBirth = `${year}-${month}-${date}`;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin`,
        data: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          sex,
          address,
          user_role: userRole,
          auth_code: authCode
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // If user was created successfully, you can also insert additional data into a custom table
    // This is optional - the user data is already stored in Supabase Auth
    if (authData.user) {
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
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the signup if profile creation fails
        // The user is already created in auth
      }
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        user: authData.user 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
