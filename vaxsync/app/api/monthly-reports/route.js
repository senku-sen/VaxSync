import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * POST /api/monthly-reports
 * Generate monthly report records for all vaccines and barangays
 * Call this endpoint to create initial monthly report records
 */
export async function POST(request) {
  try {
    const { month } = await request.json();

    if (!month) {
      return Response.json(
        { error: 'Month is required (format: YYYY-MM-01)' },
        { status: 400 }
      );
    }

    // Get all vaccines
    const { data: vaccines, error: vaccineError } = await supabase
      .from('vaccines')
      .select('id');

    if (vaccineError) {
      return Response.json(
        { error: 'Failed to fetch vaccines', details: vaccineError },
        { status: 500 }
      );
    }

    // Get all barangays
    const { data: barangays, error: barangayError } = await supabase
      .from('barangays')
      .select('id');

    if (barangayError) {
      return Response.json(
        { error: 'Failed to fetch barangays', details: barangayError },
        { status: 500 }
      );
    }

    // Create records for each vaccine-barangay combination
    const records = [];
    for (const vaccine of vaccines) {
      for (const barangay of barangays) {
        records.push({
          vaccine_id: vaccine.id,
          barangay_id: barangay.id,
          month: month,
          initial_inventory: 0,
          quantity_supplied: 0,
          quantity_used: 0,
          quantity_wastage: 0,
          ending_inventory: 0,
          vials_needed: 0,
          max_allocation: 0,
          stock_level_percentage: 0,
          status: 'GOOD'
        });
      }
    }

    // Insert all records
    const { data: insertedRecords, error: insertError } = await supabase
      .from('vaccine_monthly_report')
      .insert(records)
      .select();

    if (insertError) {
      return Response.json(
        { error: 'Failed to insert monthly reports', details: insertError },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Created ${insertedRecords.length} monthly report records for ${month}`,
      count: insertedRecords.length,
      vaccines: vaccines.length,
      barangays: barangays.length
    });
  } catch (err) {
    console.error('Error creating monthly reports:', err);
    return Response.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/monthly-reports?month=YYYY-MM-01
 * Get existing monthly report records for a specific month
 */
export async function GET(request) {
  try {
    console.log('GET /api/monthly-reports called');
    
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    console.log('Month parameter:', month);

    if (!month) {
      return Response.json(
        { error: 'Month is required (format: YYYY-MM-01)' },
        { status: 400 }
      );
    }

    console.log('Fetching records for month:', month);
    
    const { data: records, error } = await supabase
      .from('vaccine_monthly_report')
      .select('*')
      .eq('month', month);

    console.log('Query result - Records:', records?.length, 'Error:', error);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch records', details: error },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      month: month,
      count: records?.length || 0,
      records: records || []
    });
  } catch (err) {
    console.error('Error fetching monthly reports:', err);
    return Response.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
