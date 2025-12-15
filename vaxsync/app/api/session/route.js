import { supabase } from "@/lib/supabase";

/**
 * GET /api/session
 * Get current user session information
 */
export async function GET(request) {
  try {
    // Get the session from Supabase auth
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.error("No session found:", error);
      return Response.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from("UserProfiles")
      .select("id, email, name, role, barangay_id")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return Response.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: userProfile?.name,
        role: userProfile?.role,
        barangay_id: userProfile?.barangay_id,
      },
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/session:", err);
    return Response.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
