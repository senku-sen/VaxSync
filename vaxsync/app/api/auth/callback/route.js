import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as anonSupabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const redirect = searchParams.get('redirect') || '/pages/registration-success';

    // Create Supabase client for server-side operations with service role key
    // We need service role key to verify email confirmation status
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Auth callback - checking env vars:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length
    });
    
    // Check if we have the service role key for admin operations
    const hasServiceKey = supabaseServiceKey && supabaseServiceKey.length > 20;
    
    // Create the appropriate client
    let supabase;
    if (hasServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    } else {
      // Fallback to anon client - limited functionality but can still verify OTP
      console.log('Using anon client (service role key not available)');
      supabase = anonSupabase;
    }
    
    if (!supabaseUrl) {
      console.error('Supabase URL not configured');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?error=config_error`);
    }


    // Handle direct user_id and email (when signin page calls us after Supabase redirect)
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');
    
    if (userId && email && type && hasServiceKey) {
      console.log('Callback received with user_id and email:', { userId, email, type });
      
      try {
        // Get user from admin API (requires service role key)
        const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(userId);
        
        if (getUserError || !authUser?.user) {
          console.error('Error fetching user from admin API:', getUserError);
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?error=user_not_found`);
        }

        // Check if email is confirmed
        if (!authUser.user.email_confirmed_at) {
          console.log('Email not confirmed yet for user:', userId);
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?error=email_not_verified`);
        }

        // Create profile if it doesn't exist
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!existingProfile) {
          console.log('Creating profile for verified user:', userId);
          const userMetadata = authUser.user.user_metadata || {};
          
          try {
            let profileData;
            if (userMetadata?.profile_data) {
              profileData = JSON.parse(userMetadata.profile_data);
            } else {
              profileData = {
                first_name: userMetadata?.first_name || '',
                last_name: userMetadata?.last_name || '',
                email: authUser.user.email || email,
                date_of_birth: userMetadata?.date_of_birth || null,
                sex: userMetadata?.sex || null,
                address: userMetadata?.address || '',
                user_role: userMetadata?.user_role || 'Public Health Nurse',
                auth_code: userMetadata?.auth_code || ''
              };
            }

            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email || authUser.user.email || email,
                date_of_birth: profileData.date_of_birth,
                sex: profileData.sex,
                address: profileData.address,
                user_role: profileData.user_role,
                auth_code: profileData.auth_code,
                assigned_barangay_id: null,
                created_at: new Date().toISOString()
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            } else {
              console.log('Profile created successfully for user:', userId);
            }
          } catch (parseError) {
            console.error('Error parsing profile data:', parseError);
          }
        }

        // Redirect to signin with success
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?verified=true&email=${encodeURIComponent(authUser.user.email || email)}`);
      } catch (adminError) {
        console.error('Admin API error:', adminError);
        // Fall through to OTP verification
      }
    }

    if (type === 'email' && token_hash) {
      console.log('Email verification callback received, token_hash:', token_hash ? 'present' : 'missing');
      
      // Verify the email token
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      });

      if (verifyError) {
        console.error('Email verification error:', verifyError);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?error=verification_failed`);
      }

      console.log('OTP verification result:', {
        hasUser: !!authData?.user,
        userId: authData?.user?.id,
        emailConfirmed: !!authData?.user?.email_confirmed_at,
        emailConfirmedAt: authData?.user?.email_confirmed_at
      });

      // Only proceed if user exists
      if (!authData?.user) {
        console.error('No user returned from OTP verification');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?error=no_user`);
      }

      let userId = authData.user.id;
      let userEmail = authData.user.email;
      let userMetadata = authData.user.user_metadata;
      let emailConfirmed = !!authData.user.email_confirmed_at;

      // If we have service role key, double-check with admin API (more reliable)
      if (hasServiceKey) {
        try {
          const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(authData.user.id);
          
          if (!getUserError && authUser?.user) {
            emailConfirmed = !!authUser.user.email_confirmed_at;
            userMetadata = authUser.user.user_metadata || userMetadata;
            userEmail = authUser.user.email || userEmail;
            console.log('Admin API check - Email confirmed:', emailConfirmed);
          } else {
            console.log('Admin API check failed, using OTP result:', getUserError?.message);
          }
        } catch (adminErr) {
          console.log('Admin API error, using OTP result:', adminErr.message);
        }
      } else {
        // No service key - trust OTP verification result
        // If OTP verified successfully, the email is confirmed
        emailConfirmed = true;
        console.log('No service key - trusting OTP verification result');
      }

      // Only create profile if email is confirmed
      if (!emailConfirmed) {
        console.log('Email not confirmed yet for user:', userId);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?error=email_not_verified`);
      }

      console.log('Email verified for user:', userId);

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      // Create profile only if it doesn't exist and user is verified
      if (existingProfile) {
        console.log('Profile already exists for user:', userId, 'Skipping creation');
      } else {
        console.log('Creating profile for verified user:', userId);
        try {
          // Try to parse profile_data from metadata, otherwise use individual fields
          let profileData;
          if (userMetadata?.profile_data) {
            profileData = JSON.parse(userMetadata.profile_data);
          } else {
            profileData = {
              first_name: userMetadata?.first_name || '',
              last_name: userMetadata?.last_name || '',
              email: userEmail,
              date_of_birth: userMetadata?.date_of_birth || null,
              sex: userMetadata?.sex || null,
              address: userMetadata?.address || '',
              user_role: userMetadata?.user_role || 'Health Worker',
              auth_code: userMetadata?.auth_code || ''
            };
          }

          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              email: profileData.email || userEmail,
              date_of_birth: profileData.date_of_birth,
              sex: profileData.sex,
              address: profileData.address,
              user_role: profileData.user_role,
              auth_code: profileData.auth_code,
              assigned_barangay_id: null,
              created_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Profile creation error after verification:', profileError);
          } else {
            console.log('Profile created successfully after email verification for user:', userId);
          }
        } catch (parseError) {
          console.error('Error parsing profile data:', parseError);
        }
      }

      // After successful verification, redirect to signin page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?verified=true&email=${encodeURIComponent(userEmail || '')}`);
    }

    // If no token_hash or type, check if there's an error in the URL
    // Supabase might redirect directly to signin with errors in the hash
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    
    if (error || errorCode) {
      // Redirect to signin with error parameters
      const errorParams = new URLSearchParams();
      if (error) errorParams.set('error', error);
      if (errorCode) errorParams.set('error_code', errorCode);
      const errorDescription = searchParams.get('error_description');
      if (errorDescription) errorParams.set('error_description', errorDescription);
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?${errorParams.toString()}`);
    }

    // Default redirect to signin
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin`);
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pages/signin?error=callback_error`);
  }
}

