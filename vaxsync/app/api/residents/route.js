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
    const { name, age, address, contact, vaccine_status, barangay } = body;

    // Validate required fields
    if (!name || !age || !address || !contact) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new resident in Supabase
    const { data: newResident, error } = await supabase
      .from('residents')
      .insert([
        {
          name,
          age: parseInt(age),
          address,
          contact,
          vaccine_status: vaccine_status || 'not_vaccinated',
          status: 'pending',
          barangay: barangay || null,
          submitted_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create resident' },
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
    const { id, name, age, address, contact, vaccine_status, barangay } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // Update resident in Supabase
    const { data: updatedResident, error } = await supabase
      .from('residents')
      .update({
        name,
        age: parseInt(age),
        address,
        contact,
        vaccine_status: vaccine_status || 'not_vaccinated',
        barangay: barangay || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Resident not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update resident' },
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
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Resident not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update resident status' },
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
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete resident' },
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
