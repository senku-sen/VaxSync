import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * GET - Fetch weekly vaccination report
 * Query params: week_start (YYYY-MM-DD)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("week_start");

    if (!weekStart) {
      return NextResponse.json(
        { error: "week_start parameter is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Calculate week end (7 days from start)
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    console.log(`📊 Fetching weekly report for ${startDateStr} to ${endDateStr}`);

    // Get all sessions for this week
    const { data: sessions, error: sessionsError } = await supabase
      .from("VaccinationSessions")
      .select("id, session_date, vaccine_id, administered")
      .gte("session_date", startDateStr)
      .lte("session_date", endDateStr)
      .order("session_date", { ascending: true });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${sessions?.length || 0} sessions for the week`);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        chart_data: [],
        totals: {
          vaccine_name: "TOTAL",
          daily_breakdown: {
            Mon: 0,
            Tue: 0,
            Wed: 0,
            Thu: 0,
            Fri: 0,
            Sat: 0,
            Sun: 0,
          },
          weekly_total: 0,
        },
      });
    }

    // Get vaccine details through the chain: barangay_vaccine_inventory -> vaccine_doses -> vaccines
    // Key insight: vaccination_sessions.vaccine_id = barangay_vaccine_inventory.id
    const inventoryIds = [...new Set(sessions.map((s) => s.vaccine_id))];
    
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("BarangayVaccineInventory")
      .select("id, VaccineDoses(vaccine_id, Vaccines(id, name))")
      .in("id", inventoryIds);

    if (inventoryError) {
      console.error("Error fetching inventory:", inventoryError);
      return NextResponse.json(
        { error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${inventoryData?.length || 0} inventory records`);

    // Create map of inventory.id to vaccine info
    const vaccinesMap = {};
    if (inventoryData) {
      inventoryData.forEach((inv) => {
        if (inv.VaccineDoses && inv.VaccineDoses.Vaccines) {
          vaccinesMap[inv.id] = inv.VaccineDoses.Vaccines;
        }
      });
    }

    console.log(`📍 Vaccines map size: ${Object.keys(vaccinesMap).length}`);
    console.log(`📍 Sample session vaccine_ids:`, sessions.slice(0, 3).map(s => s.vaccine_id));
    console.log(`📍 Sample vaccine names from map:`, Object.values(vaccinesMap).slice(0, 3).map(v => v?.name));

    // Group sessions by vaccine
    // The key is that session.vaccine_id matches barangay_vaccine_inventory.id
    const sessionsByVaccine = {};
    sessions.forEach((session) => {
      const vaccine = vaccinesMap[session.vaccine_id];
      if (vaccine) {
        const vaccineName = vaccine.name;
        if (!sessionsByVaccine[vaccineName]) {
          sessionsByVaccine[vaccineName] = {
            vaccine_id: vaccine.id,
            sessions: [],
          };
        }
        sessionsByVaccine[vaccineName].sessions.push(session);
      } else {
        console.warn(`⚠️ No vaccine info found for inventory.id: ${session.vaccine_id}`);
      }
    });

    console.log(`✅ Grouped into ${Object.keys(sessionsByVaccine).length} vaccines`);

    // Build daily breakdown for each vaccine
    const reportData = [];
    const chartData = {};

    for (const [vaccineName, vaccineData] of Object.entries(sessionsByVaccine)) {
      const vaccineSessions = vaccineData.sessions;

      // Build daily breakdown
      const dailyBreakdown = {};
      let weeklyTotal = 0;

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];

        const dayDoses = vaccineSessions
          .filter((s) => s.session_date === dateStr)
          .reduce((sum, s) => sum + (s.administered || 0), 0);

        dailyBreakdown[dayName] = dayDoses;
        weeklyTotal += dayDoses;

        // Aggregate for chart
        if (!chartData[dayName]) {
          chartData[dayName] = 0;
        }
        chartData[dayName] += dayDoses;
      }

      if (weeklyTotal > 0) {
        reportData.push({
          vaccine_name: vaccineName,
          daily_breakdown: dailyBreakdown,
          weekly_total: weeklyTotal,
        });
      }
    }

    // Convert chart data to array format (for line chart)
    const chartArray = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day) => ({
        day,
        doses: chartData[day] || 0,
      })
    );

    // Calculate totals row
    const totalsRow = {
      vaccine_name: "TOTAL",
      daily_breakdown: {},
      weekly_total: 0,
    };

    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day) => {
      const dayTotal = reportData.reduce(
        (sum, r) => sum + (r.daily_breakdown[day] || 0),
        0
      );
      totalsRow.daily_breakdown[day] = dayTotal;
      totalsRow.weekly_total += dayTotal;
    });

    return NextResponse.json({
      success: true,
      data: reportData,
      totals: totalsRow,
      chart_data: chartArray,
    });
  } catch (error) {
    console.error("Error in GET /api/reports/weekly:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
