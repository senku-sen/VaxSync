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
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, user_role, address')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    // Return user data with role
    return NextResponse.json({ 
      ok: true, 
      id: authData.user.id, 
      firstName: profile.first_name,
      lastName: profile.last_name,
      userRole: profile.user_role,
      email: authData.user.email,
      address: profile.address || ""
    });
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


