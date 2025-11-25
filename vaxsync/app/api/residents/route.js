import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch residents
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const search = searchParams.get('search') || '';
    const barangay = searchParams.get('barangay') || '';

    // Build the query
    let query = supabase
      .from('residents')
      .select('*')
      .eq('status', status);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Apply barangay filter
    if (barangay) {
      query = query.eq('barangay', barangay);
    }

    // Order by submitted_at descending
    query = query.order('submitted_at', { ascending: false });

    const { data: residents, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      // Check if it's a connection error
      if (error.message?.includes('fetch failed') || error.message?.includes('TypeError')) {
        return NextResponse.json(
          { success: false, error: 'Unable to connect to database. Please check your internet connection and Supabase configuration.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch residents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      residents: residents || [],
      total: residents?.length || 0
    });
  } catch (error) {
    console.error('Error fetching residents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch residents' },
      { status: 500 }
    );
  }
}

// POST - Create new resident
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, birthday, sex, address, contact, vaccine_status, barangay, barangay_id, municipality, barangay_municipality, submitted_by, vaccines_given } = body;

    // Validate required fields
    if (!name || !birthday || !sex || !address || !contact) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Resolve barangay_id: accept explicit barangay_id, otherwise map from barangay name (and create if missing)
    let resolvedBarangayId = barangay_id || null;
    if (!resolvedBarangayId && barangay) {
      // Try get existing
      const { data: foundBarangay, error: findBarangayError } = await supabase
        .from('barangays')
        .select('id')
        .eq('name', barangay)
        .maybeSingle();
      
      if (findBarangayError) {
        console.error('Supabase error (find barangay):', findBarangayError);
        // Continue to try creating if lookup fails (could be network issue)
      }

      if (foundBarangay && foundBarangay.id) {
        resolvedBarangayId = foundBarangay.id;
      } else {
        // If not found, insert
        const { data: newBarangay, error: insertBarangayError } = await supabase
          .from('barangays')
          .insert([{ name: barangay, municipality: municipality || barangay_municipality || 'Unknown' }])
          .select('id')
          .single();

        if (insertBarangayError) {
          console.error('Supabase error (create barangay):', insertBarangayError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to resolve barangay',
              details: process.env.NODE_ENV === 'development' ? insertBarangayError : undefined
            },
            { status: 500 }
          );
        }
        resolvedBarangayId = newBarangay.id;
      }
    }

    // Create new resident in Supabase
    const { data: newResident, error } = await supabase
      .from('residents')
      .insert([
        {
          name,
          birthday: birthday || null,
          sex: sex || null,
          address,
          contact,
          vaccine_status: vaccine_status || 'not_vaccinated',
          status: 'pending',
          barangay: barangay || null,
          barangay_id: resolvedBarangayId, // satisfy NOT NULL when required
          submitted_by: submitted_by || 'system',
          vaccines_given: Array.isArray(vaccines_given) ? vaccines_given : [],
          submitted_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error (create resident):', error);
      // Check if it's a connection error
      if (error.message?.includes('fetch failed') || error.message?.includes('TypeError')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unable to connect to database. Please check your internet connection and Supabase configuration.'
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create resident',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resident: newResident,
      message: 'Resident created successfully'
    });
  } catch (error) {
    console.error('Error creating resident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resident' },
      { status: 500 }
    );
  }
}

// PUT - Update resident
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, birthday, sex, address, contact, vaccine_status, barangay, barangay_id, municipality, barangay_municipality, vaccines_given } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // Resolve barangay_id if provided as name
    let resolvedBarangayId = barangay_id || null;
    if (!resolvedBarangayId && barangay) {
      const { data: foundBarangay, error: findBarangayError } = await supabase
        .from('barangays')
        .select('id')
        .eq('name', barangay)
        .maybeSingle();
      
      if (findBarangayError) {
        console.error('Supabase error (find barangay):', findBarangayError);
      }
      if (foundBarangay?.id) {
        resolvedBarangayId = foundBarangay.id;
      } else {
        const { data: newBarangay, error: insertBarangayError } = await supabase
          .from('barangays')
          .insert([{ name: barangay, municipality: municipality || barangay_municipality || 'Unknown' }])
          .select('id')
          .single();
        if (!insertBarangayError) {
          resolvedBarangayId = newBarangay.id;
        }
      }
    }

    // Update resident in Supabase
    const updateData = {
      name,
      birthday: birthday !== undefined ? birthday : undefined,
      sex: sex !== undefined ? sex : undefined,
      address,
      contact,
      vaccine_status: vaccine_status || 'not_vaccinated',
      barangay: barangay || null,
      barangay_id: resolvedBarangayId ?? undefined,
      updated_at: new Date().toISOString()
    };

    // Only update vaccines_given if provided
    if (vaccines_given !== undefined) {
      updateData.vaccines_given = Array.isArray(vaccines_given) ? vaccines_given : [];
    }

    const { data: updatedResident, error } = await supabase
      .from('residents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error (update resident):', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Resident not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update resident',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resident: updatedResident,
      message: 'Resident updated successfully'
    });
  } catch (error) {
    console.error('Error updating resident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resident' },
      { status: 500 }
    );
  }
}

// PATCH - Update resident status (approve/reject)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Resident ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Update status in Supabase
    const { data: updatedResident, error } = await supabase
      .from('residents')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error (update status):', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Resident not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update resident status',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resident: updatedResident,
      message: `Resident ${action}d successfully`
    });
  } catch (error) {
    console.error('Error updating resident status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resident status' },
      { status: 500 }
    );
  }
}

// DELETE - Delete resident
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // Delete resident from Supabase
    const { error } = await supabase
      .from('residents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error (delete resident):', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete resident',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resident deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete resident' },
      { status: 500 }
    );
  }
}
