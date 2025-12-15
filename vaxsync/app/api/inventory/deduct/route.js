import { NextResponse } from 'next/server';
import { supabaseAdmin, hasSupabaseAdmin } from '@/lib/supabaseAdmin';
import { deductBarangayVaccineInventory } from '@/lib/BarangayVaccineInventory';

if (!hasSupabaseAdmin) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - inventory updates may fail due to RLS');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { barangayId, vaccineId, quantityToDeduct } = body;

    console.log('🔴 API: Deduct request received:', { barangayId, vaccineId, quantityToDeduct });

    if (!barangayId || !vaccineId || !quantityToDeduct) {
      console.error('❌ API: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: barangayId, vaccineId, quantityToDeduct' },
        { status: 400 }
      );
    }

    console.log('🔴 API: Deducting inventory:', { barangayId, vaccineId, quantityToDeduct });
    console.log('🔑 Admin client available:', !!supabaseAdmin);

    // Call the deduction function (it will use admin client internally)
    const result = await deductBarangayVaccineInventory(barangayId, vaccineId, quantityToDeduct);

    console.log('🔴 API: Deduction result:', { success: result.success, error: result.error, recordsCount: result.deductedRecords?.length });

    if (!result.success) {
      console.error('❌ API: Deduction failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error?.message || result.error || 'Failed to deduct inventory' },
        { status: 500 }
      );
    }

    console.log('✅ API: Deduction successful:', result.deductedRecords);
    return NextResponse.json({
      success: true,
      deductedRecords: result.deductedRecords
    });
  } catch (error) {
    console.error('❌ API: Error in deduct route:', error);
    console.error('   Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

