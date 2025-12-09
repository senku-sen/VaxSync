import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    console.log('Sign in attempt for email:', email);
    
    if (!email || !password) {
      console.error('Missing email or password');
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Check if Supabase is initialized
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not configured');
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth signin error:', authError.message, authError.status);
      return NextResponse.json({ error: authError.message || "Invalid credentials" }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Get user profile to retrieve role
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, user_role, address')
      .eq('id', authData.user.id)
      .single();

    // If profile doesn't exist, try to create it from user metadata
    if (profileError || !profile) {
      console.log('Profile not found, attempting to create from user metadata...');
      
      const userMetadata = authData.user.user_metadata || {};
      let profileData;
      
      try {
        if (userMetadata?.profile_data) {
          profileData = JSON.parse(userMetadata.profile_data);
        } else {
          profileData = {
            first_name: userMetadata?.first_name || email.split('@')[0],
            last_name: userMetadata?.last_name || '',
            email: authData.user.email,
            date_of_birth: userMetadata?.date_of_birth || null,
            sex: userMetadata?.sex || null,
            address: userMetadata?.address || '',
            user_role: userMetadata?.user_role || 'Public Health Nurse',
            auth_code: userMetadata?.auth_code || ''
          };
        }

        // Create the missing profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email || authData.user.email,
            date_of_birth: profileData.date_of_birth,
            sex: profileData.sex,
            address: profileData.address,
            user_role: profileData.user_role,
            auth_code: profileData.auth_code,
            assigned_barangay_id: null,
            created_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Failed to create profile during signin:', createError);
          return NextResponse.json({ error: "Failed to create user profile. Please contact support." }, { status: 500 });
        }

        console.log('Profile created successfully during signin for user:', authData.user.id);
        
        // Set profile for response
        profile = {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          user_role: profileData.user_role,
          address: profileData.address
        };
      } catch (parseError) {
        console.error('Error creating profile:', parseError);
        return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
      }
    }

    // Normalize old role names to new ones
    let normalizedRole = profile.user_role;
    if (normalizedRole === 'Health Worker') {
      normalizedRole = 'Public Health Nurse';
    } else if (normalizedRole === 'Head Nurse' || normalizedRole === 'RHM/HRH' || normalizedRole === 'HRH/RHM') {
      normalizedRole = 'Rural Health Midwife (RHM)';
    }

    // Return user data with role
    return NextResponse.json({ 
      ok: true, 
      id: authData.user.id, 
      firstName: profile.first_name,
      lastName: profile.last_name,
      userRole: normalizedRole,
      email: authData.user.email,
      address: profile.address || ""
    });
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


