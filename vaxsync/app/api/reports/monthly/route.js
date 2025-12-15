import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * GET - Fetch monthly vaccination report
 * Query params: month (YYYY-MM-01), barangay_id (optional)
 * Uses: vaccines, vaccine_doses, vaccination_sessions, session_beneficiaries tables
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const barangayId = searchParams.get("barangay_id");

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required (YYYY-MM-01)" },
        { status: 400 }
      );
    }

    // Parse month to get start and end dates
    const monthDate = new Date(month);
    const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    console.log(`📊 Fetching monthly report for ${month} (${startDateStr} to ${endDateStr})`);

    // Get all sessions for this month first
    const { data: allSessions, error: allSessionsError } = await supabase
      .from("VaccinationSessions")
      .select("id, vaccine_id, target, administered, status")
      .gte("session_date", startDateStr)
      .lte("session_date", endDateStr);

    if (allSessionsError) {
      console.error("Error fetching sessions:", allSessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${allSessions?.length || 0} sessions for the month`);

    if (!allSessions || allSessions.length === 0) {
      console.log("No sessions found for this month");
      return NextResponse.json({
        success: true,
        data: [],
        totals: {
          vaccine_name: "TOTAL",
          sessions_held: 0,
          target_doses: 0,
          administered_doses: 0,
          completion_rate: 0,
          attendance_rate: 0,
          vaccination_rate: 0,
        },
      });
    }

    // Get vaccine details through the chain: barangay_vaccine_inventory -> vaccine_doses -> vaccines
    // Key insight: vaccination_sessions.vaccine_id = barangay_vaccine_inventory.id
    const inventoryIds = [...new Set(allSessions.map((s) => s.vaccine_id))];
    
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
    console.log(`📍 Sample session vaccine_ids:`, allSessions.slice(0, 3).map(s => s.vaccine_id));
    console.log(`📍 Sample vaccine names from map:`, Object.values(vaccinesMap).slice(0, 3).map(v => v?.name));

    // Group sessions by vaccine
    // The key is that session.vaccine_id matches barangay_vaccine_inventory.id
    const sessionsByVaccine = {};
    allSessions.forEach((session) => {
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

    const reportData = [];

    // Process each vaccine
    for (const [vaccineName, vaccineData] of Object.entries(sessionsByVaccine)) {
      try {
        const sessions = vaccineData.sessions;
        const sessionIds = sessions.map((s) => s.id);

        console.log(`✅ Found ${sessions.length} sessions for ${vaccineName}`);

        // Calculate totals from sessions
        const sessionsHeld = sessions.length;
        const targetDoses = sessions.reduce((sum, s) => sum + (s.target || 0), 0);
        const administeredDoses = sessions.reduce((sum, s) => sum + (s.administered || 0), 0);
        const completionRate = targetDoses > 0 ? Math.round((administeredDoses / targetDoses) * 100) : 0;

        // Get beneficiary statistics
        const { data: beneficiaries, error: beneficiariesError } = await supabase
          .from("SessionBeneficiaries")
          .select("id, attended, vaccinated")
          .in("session_id", sessionIds);

        let attendanceRate = 0;
        let vaccinationRate = 0;

        if (beneficiaries && beneficiaries.length > 0) {
          const attendedCount = beneficiaries.filter((b) => b.attended === true).length;
          const vaccinatedCount = beneficiaries.filter((b) => b.vaccinated === true).length;

          attendanceRate = beneficiaries.length > 0 ? Math.round((attendedCount / beneficiaries.length) * 100) : 0;
          vaccinationRate = beneficiaries.length > 0 ? Math.round((vaccinatedCount / beneficiaries.length) * 100) : 0;
        }

        reportData.push({
          vaccine_name: vaccineName,
          vaccine_id: vaccineData.vaccine_id,
          sessions_held: sessionsHeld,
          target_doses: targetDoses,
          administered_doses: administeredDoses,
          completion_rate: completionRate,
          attendance_rate: attendanceRate,
          vaccination_rate: vaccinationRate,
        });
      } catch (err) {
        console.error(`Error processing vaccine ${vaccineName}:`, err);
        continue;
      }
    }

    // Calculate totals
    const totals = {
      vaccine_name: "TOTAL",
      sessions_held: reportData.reduce((sum, r) => sum + r.sessions_held, 0),
      target_doses: reportData.reduce((sum, r) => sum + r.target_doses, 0),
      administered_doses: reportData.reduce((sum, r) => sum + r.administered_doses, 0),
      completion_rate: 0,
      attendance_rate: 0,
      vaccination_rate: 0,
    };

    // Calculate average rates
    if (reportData.length > 0) {
      totals.completion_rate = Math.round(
        reportData.reduce((sum, r) => sum + r.completion_rate, 0) / reportData.length
      );
      totals.attendance_rate = Math.round(
        reportData.reduce((sum, r) => sum + r.attendance_rate, 0) / reportData.length
      );
      totals.vaccination_rate = Math.round(
        reportData.reduce((sum, r) => sum + r.vaccination_rate, 0) / reportData.length
      );
    }

    console.log(`✅ Monthly report generated with ${reportData.length} vaccines`);

    return NextResponse.json({
      success: true,
      data: reportData,
      totals: totals,
    });
  } catch (error) {
    console.error("Error in GET /api/reports/monthly:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
