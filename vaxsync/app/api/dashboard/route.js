import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const barangayId = searchParams.get('barangay_id');
    const role = searchParams.get('role'); // 'health_worker' or 'head_nurse'

    // Build query for vaccination sessions
    let sessionsQuery = supabase
      .from('vaccination_sessions')
      .select('id, vaccine_id, administered, session_date, barangay_id');

    // Filter by barangay if it's a health worker
    if (role === 'health_worker' && barangayId) {
      sessionsQuery = sessionsQuery.eq('barangay_id', barangayId);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Sessions error:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsError.message },
        { status: 500 }
      );
    }

    // Get all vaccines
    const { data: vaccines, error: vaccinesError } = await supabase
      .from('vaccines')
      .select('id, name');

    if (vaccinesError) {
      console.error('Vaccines error:', vaccinesError);
      return NextResponse.json(
        { error: 'Failed to fetch vaccines', details: vaccinesError.message },
        { status: 500 }
      );
    }

    // Calculate vaccine distribution
    const vaccineDistribution = {};
    let totalDoses = 0;

    // Initialize all vaccines with 0 doses
    vaccines.forEach(vaccine => {
      vaccineDistribution[vaccine.id] = {
        name: vaccine.name,
        doses: 0,
        sessions: 0
      };
    });

    // Count administered doses per vaccine
    sessions.forEach(session => {
      const vaccineId = session.vaccine_id;
      const administered = session.administered || 0;

      if (vaccineDistribution[vaccineId]) {
        vaccineDistribution[vaccineId].doses += administered;
        vaccineDistribution[vaccineId].sessions += 1;
        totalDoses += administered;
      }
    });

    // Calculate percentages and format response
    const colors = ['#3E5F44', '#5E936C', '#93DA97', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50'];
    const distributionData = Object.entries(vaccineDistribution)
      .map(([vaccineId, data], index) => ({
        id: vaccineId,
        name: data.name,
        doses: data.doses,
        sessions: data.sessions,
        percentage: totalDoses > 0 ? Math.round((data.doses / totalDoses) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .filter(v => v.doses > 0)
      .sort((a, b) => b.doses - a.doses); // Sort by doses descending

    return NextResponse.json({
      success: true,
      data: {
        distribution: distributionData,
        totalDoses,
        totalSessions: sessions.length,
        vaccineCount: distributionData.length
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
