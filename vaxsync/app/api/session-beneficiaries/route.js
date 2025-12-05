import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * POST - Create a session beneficiary record
 * Body: { session_id, resident_id, attended, vaccinated, vaccine_name (optional for custom vaccines) }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, resident_id, attended, vaccinated, vaccine_name } = body;

    // Validate required fields
    if (!resident_id) {
      return NextResponse.json(
        { error: "Resident ID is required" },
        { status: 400 }
      );
    }

    // If session_id is provided, validate it exists
    if (session_id) {
      const { data: sessionExists, error: sessionError } = await supabase
        .from("vaccination_sessions")
        .select("id")
        .eq("id", session_id)
        .single();

      if (sessionError || !sessionExists) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
    }

    // Create beneficiary record
    const beneficiaryData = {
      session_id: session_id || null,
      resident_id,
      attended: attended !== undefined ? attended : null,
      vaccinated: vaccinated !== undefined ? vaccinated : null,
    };

    // Add vaccine_name if provided (for custom vaccines with no session)
    if (vaccine_name) {
      beneficiaryData.vaccine_name = vaccine_name;
    }

    const { data, error } = await supabase
      .from("session_beneficiaries")
      .insert(beneficiaryData)
      .select();

    if (error) {
      console.error("Error creating session beneficiary:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create session beneficiary" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error("Error in POST /api/session-beneficiaries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch session beneficiaries
 * Query params: session_id, resident_id
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const residentId = searchParams.get("resident_id");

    let query = supabase.from("session_beneficiaries").select("*");

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching session beneficiaries:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch beneficiaries" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Error in GET /api/session-beneficiaries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a session beneficiary record
 * Query params: id
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Beneficiary ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("session_beneficiaries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting session beneficiary:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete beneficiary" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/session-beneficiaries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
