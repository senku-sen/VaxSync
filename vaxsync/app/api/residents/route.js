import { NextResponse } from 'next/server';

// Mock data for demonstration
let residents = [
  {
    id: 1,
    name: "Maria Santos",
    age: 35,
    address: "123 Main St",
    contact: "09123456789",
    vaccine_status: "fully_vaccinated",
    status: "pending",
    submitted_at: "2024-10-18"
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    age: 28,
    address: "456 Oak Ave",
    contact: "09987654321",
    vaccine_status: "partially_vaccinated",
    status: "pending",
    submitted_at: "2024-10-18"
  },
  {
    id: 3,
    name: "Miguel Torres",
    age: 38,
    address: "987 Cedar Ln",
    contact: "09777888999",
    vaccine_status: "partially_vaccinated",
    status: "pending",
    submitted_at: "2024-10-19"
  },
  {
    id: 4,
    name: "Ana Garcia",
    age: 42,
    address: "321 Pine St",
    contact: "09111222333",
    vaccine_status: "fully_vaccinated",
    status: "approved",
    submitted_at: "2024-10-17"
  },
  {
    id: 5,
    name: "Carlos Rodriguez",
    age: 31,
    address: "654 Elm Ave",
    contact: "09444555666",
    vaccine_status: "fully_vaccinated",
    status: "approved",
    submitted_at: "2024-10-16"
  }
];

// GET - Fetch residents
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const search = searchParams.get('search') || '';
    const barangay = searchParams.get('barangay') || '';

    let filteredResidents = residents.filter(resident => resident.status === status);

    // Apply search filter
    if (search) {
      filteredResidents = filteredResidents.filter(resident =>
        resident.name.toLowerCase().includes(search.toLowerCase()) ||
        resident.address.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply barangay filter
    if (barangay) {
      filteredResidents = filteredResidents.filter(resident =>
        resident.barangay === barangay
      );
    }

    return NextResponse.json({
      success: true,
      residents: filteredResidents,
      total: filteredResidents.length
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
    const { name, age, address, contact, vaccine_status } = body;

    // Validate required fields
    if (!name || !age || !address || !contact) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new resident
    const newResident = {
      id: residents.length + 1,
      name,
      age: parseInt(age),
      address,
      contact,
      vaccine_status: vaccine_status || 'not_vaccinated',
      status: 'pending',
      submitted_at: new Date().toISOString().split('T')[0]
    };

    residents.push(newResident);

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
    const { id, name, age, address, contact, vaccine_status } = body;

    const residentIndex = residents.findIndex(r => r.id === parseInt(id));
    if (residentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Resident not found' },
        { status: 404 }
      );
    }

    // Update resident
    residents[residentIndex] = {
      ...residents[residentIndex],
      name,
      age: parseInt(age),
      address,
      contact,
      vaccine_status: vaccine_status || 'not_vaccinated'
    };

    return NextResponse.json({
      success: true,
      resident: residents[residentIndex],
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

    const residentIndex = residents.findIndex(r => r.id === parseInt(id));
    if (residentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Resident not found' },
        { status: 404 }
      );
    }

    // Update status
    if (action === 'approve') {
      residents[residentIndex].status = 'approved';
    } else if (action === 'reject') {
      residents[residentIndex].status = 'rejected';
    }

    return NextResponse.json({
      success: true,
      resident: residents[residentIndex],
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

    const residentIndex = residents.findIndex(r => r.id === parseInt(id));
    if (residentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Resident not found' },
        { status: 404 }
      );
    }

    // Remove resident
    residents.splice(residentIndex, 1);

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
