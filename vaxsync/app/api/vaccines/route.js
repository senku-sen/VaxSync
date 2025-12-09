import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createVaccineDoses } from '@/lib/vaccineDosingFunctions';

// GET - Fetch all vaccines
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching vaccines:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch vaccines' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching vaccines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vaccines' },
      { status: 500 }
    );
  }
}

// POST - Create new vaccine with doses
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, quantity_available, expiry_date, batch_number, notes, status, create_doses = true } = body;

    // Validate required fields
    if (!name || !quantity_available || !expiry_date) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, quantity_available, and expiry_date are required' 
        },
        { status: 400 }
      );
    }

    // Create vaccine
    const { data: vaccine, error: vaccineError } = await supabase
      .from('vaccines')
      .insert([{
        name: name.trim(),
        quantity_available: parseInt(quantity_available),
        expiry_date,
        batch_number: batch_number || '',
        notes: notes || '',
        status: status || 'Good'
      }])
      .select()
      .single();

    if (vaccineError || !vaccine) {
      console.error('Error creating vaccine:', vaccineError);
      return NextResponse.json(
        { 
          success: false, 
          error: vaccineError?.message || 'Failed to create vaccine' 
        },
        { status: 500 }
      );
    }

    // Create doses if requested
    let dosesResult = null;
    if (create_doses) {
      dosesResult = await createVaccineDoses(
        vaccine.id,
        name,
        parseInt(quantity_available)
      );

      if (!dosesResult.success) {
        console.error('Error creating doses:', dosesResult.error);
        // Vaccine was created but doses failed - return partial success
        return NextResponse.json({
          success: true,
          data: vaccine,
          warning: 'Vaccine created but failed to create doses',
          dosesError: dosesResult.error?.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: vaccine,
      doses: dosesResult?.doses || [],
      dosesCount: dosesResult?.doses?.length || 0
    });
  } catch (error) {
    console.error('Error creating vaccine:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create vaccine' },
      { status: 500 }
    );
  }
}

// PUT - Update existing vaccine
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, quantity_available, expiry_date, batch_number, notes, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vaccine ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (quantity_available !== undefined) updateData.quantity_available = parseInt(quantity_available);
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
    if (batch_number !== undefined) updateData.batch_number = batch_number;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data: vaccine, error: vaccineError } = await supabase
      .from('vaccines')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (vaccineError || !vaccine) {
      console.error('Error updating vaccine:', vaccineError);
      return NextResponse.json(
        { 
          success: false, 
          error: vaccineError?.message || 'Failed to update vaccine' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: vaccine });
  } catch (error) {
    console.error('Error updating vaccine:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update vaccine' },
      { status: 500 }
    );
  }
}

// DELETE - Delete vaccine
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vaccine ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vaccines')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting vaccine:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to delete vaccine' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error deleting vaccine:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete vaccine' },
      { status: 500 }
    );
  }
}

