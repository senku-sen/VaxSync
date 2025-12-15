
import { NextResponse } from "next/server";
import { supabaseAdmin, hasSupabaseAdmin } from "@/lib/supabaseAdmin";
// This is for editing the information of the user in user management page
export async function PUT(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  if (!hasSupabaseAdmin || !supabaseAdmin) {
    console.error("Supabase service role key is not configured.");
    return NextResponse.json(
      { error: "Server misconfiguration: service role key missing." },
      { status: 500 }
    );
  }

  const payload = await request.json();
  const allowedFields = ["first_name", "last_name", "user_role", "address"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (field in payload) {
      updateData[field] = payload[field] || null;
    }
  });

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields provided." }, { status: 400 });
  }

  try {
  const { data, error } = await supabaseAdmin
      .from("UserProfiles")
      .update(updateData)
    .eq("id", id)
    .select(
      "id, first_name, last_name, email, user_role, address, date_of_birth, sex, created_at"
    )
    .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      user: data,
    });
  } catch (err) {
    console.error("User update failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
