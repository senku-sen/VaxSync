import { NextResponse } from 'next/server';
import { recalculateReservedVials } from '@/lib/BarangayVaccineInventory';

/**
 * POST - Recalculate and fix reserved vials for a vaccine
 * Body: { barangayId, vaccineId }
 */
export async function POST(request) {
  try {
    const { barangayId, vaccineId } = await request.json();

    if (!barangayId || !vaccineId) {
      return NextResponse.json(
        { error: 'barangayId and vaccineId are required' },
        { status: 400 }
      );
    }

    console.log('Fixing reserved vials for:', { barangayId, vaccineId });

    const result = await recalculateReservedVials(barangayId, vaccineId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reserved vials recalculated successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/inventory/fix-reserved:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
