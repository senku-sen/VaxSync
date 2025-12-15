import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * GET - Fetch summary statistics
 * Query params: months (number of months to include, default 4)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") || "4", 10);

    console.log(`📊 Fetching summary statistics for last ${months} month(s)`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    // Set to first day of current month
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    // If months > 1, go back to previous months
    if (months > 1) {
      startDate.setMonth(startDate.getMonth() - (months - 1));
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    
    console.log(`📊 Date range: ${startDateStr} to ${endDateStr}`);

    // Get all sessions in this period (not just completed)
    const { data: sessions, error: sessionsError } = await supabase
      .from("VaccinationSessions")
      .select("id, administered, status")
      .gte("session_date", startDateStr)
      .lte("session_date", endDateStr);

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Calculate total doses administered from all sessions
    const totalDosesAdministered = sessions
      ? sessions.reduce((sum, s) => sum + (s.administered || 0), 0)
      : 0;

    // Count only completed sessions
    const totalSessionsCompleted = sessions
      ? sessions.filter((s) => s.status === "Completed").length
      : 0;

    // Get all residents and calculate vaccination rate
    const { data: residents, error: residentsError } = await supabase
      .from("Residents")
      .select("id, vaccine_status");

    if (residentsError) {
      console.error("Error fetching residents:", residentsError);
      return NextResponse.json(
        { error: "Failed to fetch residents" },
        { status: 500 }
      );
    }

    const totalResidents = residents ? residents.length : 0;
    const vaccinatedResidents = residents
      ? residents.filter(
          (r) =>
            r.vaccine_status === "partially_vaccinated" ||
            r.vaccine_status === "fully_vaccinated"
        ).length
      : 0;

    const overallVaccinationRate =
      totalResidents > 0
        ? Math.round((vaccinatedResidents / totalResidents) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_doses_administered: totalDosesAdministered,
        total_sessions_completed: totalSessionsCompleted,
        overall_vaccination_rate: overallVaccinationRate,
        total_residents: totalResidents,
        vaccinated_residents: vaccinatedResidents,
        period_months: months,
        date_range: {
          start: startDateStr,
          end: endDateStr,
        },
      },
    });
  } catch (error) {
    console.error("Error in GET /api/reports/summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
