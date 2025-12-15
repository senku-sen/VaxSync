import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * GET - Fetch daily vaccination report
 * Query params: date (YYYY-MM-DD)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching daily report for ${date}`);

    // Get all sessions for this date
    const { data: sessions, error: sessionsError } = await supabase
      .from("VaccinationSessions")
      .select("id, session_time, vaccine_id, barangay_id, target, administered, status")
      .eq("session_date", date)
      .order("session_time", { ascending: true });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        chart_data: [],
      });
    }

    // Fetch vaccine and barangay details
    const vaccineIds = [...new Set(sessions.map((s) => s.vaccine_id))];
    const barangayIds = [...new Set(sessions.map((s) => s.barangay_id))];

    // Get vaccine details through the chain: barangay_vaccine_inventory -> vaccine_doses -> vaccines
    const { data: inventoryData } = await supabase
      .from("BarangayVaccineInventory")
      .select("id, VaccineDoses(vaccine_id, Vaccines(id, name))")
      .in("id", vaccineIds);

    const { data: barangaysData } = await supabase
      .from("Barangays")
      .select("id, name")
      .in("id", barangayIds);

    const vaccinesMap = {};
    const barangaysMap = {};

    if (inventoryData) {
      inventoryData.forEach((inv) => {
        if (inv.vaccine_doses && inv.vaccine_doses.vaccines) {
          vaccinesMap[inv.id] = inv.vaccine_doses.vaccines;
        }
      });
    }

    if (barangaysData) {
      barangaysData.forEach((b) => {
        barangaysMap[b.id] = b;
      });
    }

    // Build report data
    const reportData = [];
    const chartData = {};

    for (const session of sessions) {
      const vaccine = vaccinesMap[session.vaccine_id];
      const barangay = barangaysMap[session.barangay_id];
      const completionRate =
        session.target > 0
          ? Math.round((session.administered / session.target) * 100)
          : 0;

      reportData.push({
        session_id: session.id,
        session_time: session.session_time,
        vaccine_name: vaccine?.name || "Unknown",
        barangay_name: barangay?.name || "Unknown",
        target: session.target,
        administered: session.administered,
        completion_rate: completionRate,
        status: session.status,
      });

      // Aggregate for chart
      const vaccineName = vaccine?.name || "Unknown";
      if (!chartData[vaccineName]) {
        chartData[vaccineName] = 0;
      }
      chartData[vaccineName] += session.administered;
    }

    // Convert chart data to array format
    const chartArray = Object.entries(chartData).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      success: true,
      data: reportData,
      chart_data: chartArray,
    });
  } catch (error) {
    console.error("Error in GET /api/reports/daily:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
