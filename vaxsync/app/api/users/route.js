
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
// This is for deleting the user in user management page
// Helper function to create Supabase client with service role key
function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Try both variable names (with and without NEXT_PUBLIC_ prefix)
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured. Check .env.local file.")
  }

  // Create client with service role key (bypasses RLS)
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { id } = body

    console.log("Delete request received for user ID:", id)
    
    // Check environment variables - try both with and without NEXT_PUBLIC_ prefix
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    
    console.log("Environment check:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Set" : "NOT SET")
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? `Set (length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : "NOT SET")
    console.log("- NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:", process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? `Set (length: ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY.length})` : "NOT SET")
    console.log("- Using key:", supabaseServiceKey ? `Set (length: ${supabaseServiceKey.length})` : "NOT SET")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!supabaseUrl) {
      console.error("Supabase URL is not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is required for delete operations")
      return NextResponse.json({ 
        error: "Server configuration error",
        message: "Service role key is required to delete users. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.",
        suggestion: "Get the service_role key from Supabase Dashboard → Settings → API"
      }, { status: 500 })
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createSupabaseAdminClient()

    // First, verify the user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("user_profiles")
      .select("id, email, first_name, last_name")
      .eq("id", id)
      .single()

    if (checkError) {
      console.error("Error checking user existence:", checkError)
      // Continue anyway - might be RLS blocking the check
    } else if (existingUser) {
      console.log("User found before deletion:", existingUser)
    } else {
      console.warn("User not found in database before deletion attempt")
      return NextResponse.json({ 
        error: "User not found",
        message: "No user was found with the provided ID"
      }, { status: 404 })
    }

    // Step 1: Remove foreign key references from related tables
    // This prevents foreign key constraint violations
    
    // Remove from barangays table
    console.log("Removing user references from barangays table...")
    try {
      // Try to update barangays to remove the reference (set to null)
      // Using service role key should bypass RLS
      const { error: barangayUpdateError } = await supabase
        .from("barangays")
        .update({ assigned_health_worker_id: null })
        .eq("assigned_health_worker_id", id)

      if (barangayUpdateError) {
        console.error("Error updating barangays:", barangayUpdateError)
        // Check if it's a network error
        const isNetworkError = barangayUpdateError.message && 
          (barangayUpdateError.message.includes('fetch failed') || 
           barangayUpdateError.message.includes('TypeError'))
        
        if (isNetworkError) {
          console.warn("Network error when updating barangays. Will attempt delete anyway - if it fails due to FK constraint, user will see helpful error.")
        } else {
          // If it's a real database error (not network), log it but continue
          // The delete will fail with FK constraint error which we'll handle below
          console.warn("Could not update barangays, but continuing with delete attempt")
        }
      } else {
        console.log("Successfully removed user reference from barangays")
      }
    } catch (barangayError) {
      console.error("Unexpected error handling barangays:", barangayError)
      // Continue with delete attempt - if there are FK constraints, we'll handle them
    }

    // Note: Other tables like vaccine_requests, residents might also reference users
    // but they typically use soft deletes or we can handle them if needed

    // Step 2: Delete user from Supabase user_profiles table
    // Using service role key should bypass RLS
    console.log("Deleting user from user_profiles table...")
    const { data, error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error deleting user from Supabase:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      
      // Check if it's a foreign key constraint error
      if (error.code === '23503' || (error.message && error.message.includes('foreign key constraint'))) {
        return NextResponse.json({ 
          error: "Cannot delete user",
          message: "This user is still assigned to one or more barangays. Please unassign them from all barangays before deleting.",
          details: error.details || error.message,
          code: error.code,
          suggestion: "Go to barangay management and remove this user's assignment first."
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: "Failed to delete user",
        message: error.message || "Database error occurred",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      }, { status: 500 })
    }

    console.log("User deleted successfully. Deleted rows:", data)

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      console.warn("No rows were deleted. User ID might not exist:", id)
      console.warn("Service role key available:", !!supabaseServiceKey)
      console.warn("Supabase URL:", supabaseUrl ? "Set" : "Not set")
      
      // If we found the user earlier but couldn't delete, it's likely RLS blocking
      if (existingUser && !error) {
        console.error("CRITICAL: User exists but delete returned no rows. This suggests RLS is still blocking.")
        console.error("Verify service role key is correct and starts with 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'")
        return NextResponse.json({ 
          error: "Delete operation blocked",
          message: "User exists but deletion was blocked. The service role key may not be working correctly.",
          warning: "No rows were deleted despite user existing",
          suggestion: "1. Verify SUPABASE_SERVICE_ROLE_KEY is the service_role key (not anon key). 2. Restart server after adding env var. 3. Check server logs for key length."
        }, { status: 403 })
      }
      
      return NextResponse.json({ 
        error: "User not found or already deleted",
        message: "No user was found with the provided ID",
        warning: "No rows were deleted"
      }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "User deleted successfully",
      deletedCount: data.length
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ 
      error: "Failed to delete user",
      message: error.message || "An unexpected error occurred",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, data } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Update payload is required" }, { status: 400 })
    }

    const allowedFields = new Set([
      "first_name",
      "last_name",
      "user_role",
      "address",
      "assigned_barangay_id"
    ])

    const updatePayload = Object.entries(data).reduce((acc, [key, value]) => {
      // Include field if it's allowed and not undefined (null is allowed, especially for assigned_barangay_id)
      if (allowedFields.has(key) && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {})

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      )
    }

    updatePayload.updated_at = new Date().toISOString()

    const supabase = createSupabaseAdminClient()
    const { data: updatedUser, error } = await supabase
      .from("user_profiles")
      .update(updatePayload)
      .eq("id", id)
      .select("id, first_name, last_name, email, user_role, address, assigned_barangay_id")
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json(
        { error: "Failed to update user", message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Unexpected error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user", message: error.message },
      { status: 500 }
    )
  }
}