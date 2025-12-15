import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * GET - Fetch barangay vaccination report
 * Query params: month (YYYY-MM-01)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

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

    console.log(`📊 Fetching barangay report for ${month}`);

    // Get all barangays
    const { data: barangays, error: barangayError } = await supabase
      .from("Barangays")
      .select("id, name")
      .order("name", { ascending: true });

    if (barangayError) {
      console.error("Error fetching barangays:", barangayError);
      return NextResponse.json(
        { error: "Failed to fetch barangays" },
        { status: 500 }
      );
    }

    // Get all vaccines
    const { data: vaccines, error: vaccineError } = await supabase
      .from("Vaccines")
      .select("id, name")
      .order("name", { ascending: true });

    if (vaccineError) {
      console.error("Error fetching vaccines:", vaccineError);
      return NextResponse.json(
        { error: "Failed to fetch vaccines" },
        { status: 500 }
      );
    }

    const reportData = [];

    // Get all sessions for this month with inventory data
    const { data: allSessions, error: sessionsError } = await supabase
      .from("VaccinationSessions")
      .select("id, barangay_id, vaccine_id, administered")
      .gte("session_date", startDateStr)
      .lte("session_date", endDateStr);

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Get inventory data to map vaccine_id to vaccine names
    const inventoryIds = [...new Set(allSessions.map((s) => s.vaccine_id))];
    const { data: inventoryData } = await supabase
      .from("BarangayVaccineInventory")
      .select("id, VaccineDoses(vaccine_id, Vaccines(id, name))")
      .in("id", inventoryIds);

    // Create map of inventory.id to vaccine info
    const vaccinesMap = {};
    if (inventoryData) {
      inventoryData.forEach((inv) => {
        if (inv.VaccineDoses && inv.VaccineDoses.Vaccines) {
          vaccinesMap[inv.id] = inv.VaccineDoses.Vaccines;
        }
      });
    }

    // For each barangay, calculate vaccine distribution
    for (const barangay of barangays) {
      const vaccineBreakdown = {};
      let barangayTotal = 0;

      // Get sessions for this barangay
      const barangaySessions = allSessions.filter((s) => s.barangay_id === barangay.id);

      // For each vaccine, sum doses administered in this barangay
      for (const vaccine of vaccines) {
        let dosesAdministered = 0;

        // Find all sessions in this barangay that match this vaccine
        barangaySessions.forEach((session) => {
          const vaccineInfo = vaccinesMap[session.vaccine_id];
          if (vaccineInfo && vaccineInfo.id === vaccine.id) {
            dosesAdministered += session.administered || 0;
          }
        });

        vaccineBreakdown[vaccine.name] = dosesAdministered;
        barangayTotal += dosesAdministered;
      }

      reportData.push({
        barangay_name: barangay.name,
        barangay_id: barangay.id,
        vaccines: vaccineBreakdown,
        total: barangayTotal,
      });
    }

    // Calculate grand totals
    const grandTotals = {};
    let grandTotal = 0;

    for (const vaccine of vaccines) {
      const vaccineTotal = reportData.reduce(
        (sum, barangay) => sum + (barangay.vaccines[vaccine.name] || 0),
        0
      );
      grandTotals[vaccine.name] = vaccineTotal;
      grandTotal += vaccineTotal;
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      vaccines: vaccines.map((v) => v.name),
      totals: {
        barangay_name: "TOTAL",
        vaccines: grandTotals,
        total: grandTotal,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/reports/barangay:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
