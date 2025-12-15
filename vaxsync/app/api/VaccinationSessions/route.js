import { supabase } from "@/lib/supabase";

/**
 * GET /api/vaccination-sessions
 * Fetch vaccination sessions filtered by status and barangay
 * Query params:
 *   - status: comma-separated list of statuses (e.g., "Scheduled,In progress")
 *   - barangay: barangay name to filter by
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const barangayParam = searchParams.get("barangay");

    // Parse status parameter (can be comma-separated)
    const statuses = statusParam
      ? statusParam.split(",").map((s) => s.trim())
      : [];

    console.log("Fetching sessions with filters:", {
      statuses,
      barangay: barangayParam,
    });

    // First, get the barangay ID if barangay name is provided
    let barangayId = null;
    if (barangayParam && barangayParam.trim()) {
      const { data: barangayData, error: barangayError } = await supabase
        .from("Barangays")
        .select("id")
        .ilike("name", barangayParam.trim())
        .single();

      if (barangayError) {
        console.error("Error fetching barangay:", barangayError);
        // Don't fail - just continue without barangay filter
        console.warn(`Barangay "${barangayParam}" not found, fetching all sessions for status`);
      } else {
        barangayId = barangayData?.id;
      }
    }

    // Start with base query
    let query = supabase
      .from("VaccinationSessions")
      .select(
        `
        id,
        session_date,
        session_time,
        status,
        vaccine_id,
        barangay_id,
        target,
        administered,
        created_at,
        BarangayVaccineInventory:vaccine_id (id, vaccine_id, VaccineDoses:vaccine_id(id, dose_code, Vaccine:vaccine_id(id, name, doses))),
        Barangays:barangay_id (id, name, municipality)
      `
      );

    // Filter by status if provided
    if (statuses.length > 0) {
      query = query.in("status", statuses);
    }

    // Filter by barangay ID if provided
    if (barangayId) {
      query = query.eq("barangay_id", barangayId);
    }

    // Order by date
    query = query.order("session_date", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      return Response.json(
        { error: error.message || "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const transformedData = data.map((session) => {
      const vaccine = session.barangay_vaccine_inventory?.vaccine_doses?.vaccine;
      const vaccineName = vaccine?.name || "Unknown";
      const doses = vaccine?.doses || 10;
      const vaccineDisplay = `${vaccineName} (${doses} doses)`;
      
      return {
        id: session.id,
        name: `${vaccineDisplay} - ${new Date(session.session_date).toLocaleDateString()}`,
        date: session.session_date,
        time: session.session_time,
        status: session.status,
        vaccine_name: vaccineDisplay,
        barangay: session.barangays?.name || "Unknown",
        target: session.target,
        administered: session.administered,
        sessionId: session.id,
        sessionDate: session.session_date,
      };
    });

    console.log("Sessions fetched:", transformedData.length, transformedData);

    return Response.json({
      success: true,
      data: transformedData,
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/vaccination-sessions:", err);
    return Response.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
