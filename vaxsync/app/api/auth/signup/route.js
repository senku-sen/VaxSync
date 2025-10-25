import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log('Signup request received:', { email: formData.email, userRole: formData.userRole });
    
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
    console.log('Attempting to create user in Supabase Auth...');
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

    console.log('Auth signup result:', { 
      hasUser: !!authData?.user, 
      userId: authData?.user?.id, 
      hasError: !!authError,
      errorMessage: authError?.message 
    });


    if (authError) {
      console.error('Auth error:', authError);
      
      // Handle specific error cases for existing users
      if (authError.message.includes('already registered') || 
          authError.message.includes('User already registered') ||
          authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please use a different email or try logging in.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // If user was created successfully, insert additional data into user_profiles table
    if (authData.user) {
      console.log('User created successfully, attempting to create profile...');
      
      // Check if profile already exists before inserting
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      console.log('Profile check result:', { 
        existingProfile: !!existingProfile, 
        checkError: checkError?.message 
      });

      if (existingProfile) {
        // Profile already exists, don't create duplicate
        console.log('Profile already exists for email:', email);
      } else {
        // Create new profile
        console.log('Creating new profile with data:', {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email,
          date_of_birth: dateOfBirth,
          sex,
          address,
          user_role: userRole,
          auth_code: authCode
        });

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
        } else {
          console.log('Profile created successfully!');
        }
      }
    } else {
      console.log('No user data returned from auth signup');
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
