import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for backend operations (bypasses RLS)
// Fallback to anon key if service role key is not available
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey
);

// Parse CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse date from various formats (MM/DD/YYYY, MM-DD-YYYY, MM/DD/YY, MM-DD-YY)
// Returns { date: string, isFuture: boolean, error: string } or null
function parseDate(dateString) {
  if (!dateString || !dateString.trim()) return null;
  
  const str = dateString.trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare dates only
  
  // Try MM/DD/YYYY
  let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(dateStr);
    
    // Validate date
    if (isNaN(date.getTime())) {
      return { error: 'Invalid date' };
    }
    
    const isFuture = date > today;
    return { date: dateStr, isFuture };
  }
  
  // Try MM-DD-YYYY
  match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return { error: 'Invalid date' };
    }
    
    const isFuture = date > today;
    return { date: dateStr, isFuture };
  }
  
  // Try MM/DD/YY (2-digit year with slashes) - NEW
  match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (match) {
    const [, month, day, year] = match;
    const yearNum = parseInt(year);
    const currentYear = today.getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    
    // For 2-digit years, interpret intelligently:
    // - Years 00-30: try 2000-2030 first, if future then use 1900-1930
    // - Years 31-99: use 1931-1999 (previous century)
    let fullYear;
    
    if (yearNum <= 30) {
      // For 2-digit years 00-30, use current century (2000-2030)
      // Accept future dates as-is
      fullYear = currentCentury + yearNum;
    } else {
      // Years 31-99: previous century (1931-1999)
      fullYear = currentCentury - 100 + yearNum;
    }
    
    const dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return { error: 'Invalid date' };
    }
    
    const isFuture = date > today;
    return { date: dateStr, isFuture };
  }
  
  // Try MM-DD-YY (2-digit year with dashes)
  match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
  if (match) {
    const [, month, day, year] = match;
    const yearNum = parseInt(year);
    const currentYear = today.getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    
    let fullYear;
    
    if (yearNum <= 30) {
      // For 2-digit years 00-30, use current century (2000-2030)
      // Accept future dates as-is
      fullYear = currentCentury + yearNum;
    } else {
      fullYear = currentCentury - 100 + yearNum;
    }
    
    const dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return { error: 'Invalid date' };
    }
    
    const isFuture = date > today;
    return { date: dateStr, isFuture };
  }
  
  // Try ISO format (YYYY-MM-DD)
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      return { error: 'Invalid date' };
    }
    const isFuture = date > today;
    return { date: str, isFuture };
  }
  
  return { error: 'Unrecognized date format' };
}

// Normalize vaccine names (e.g., "PENTA1, PCV1" -> ["penta1", "pcv1"])
function parseVaccines(vaccineString) {
  if (!vaccineString || !vaccineString.trim()) return [];
  
  // Split by comma and clean up
  const vaccines = vaccineString
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(v => v.length > 0);
  
  // Map common variations
  const vaccineMap = {
    'penta1': 'penta1',
    'penta2': 'penta2',
    'pcv1': 'pcv1',
    'pcv2': 'pcv2',
    'pcv3': 'pcv3',
    'mcv1': 'mcv1',
    'mcv2': 'mcv2',
    'opv1': 'opv1',
    'opv2': 'opv2',
    'ipv1': 'ipv1',
    'ipv2': 'ipv2',
    'mmr1': 'mmr1',
    'mmr2': 'mmr2',
    'tt1': 'tt1',
    'tt2': 'tt2'
  };
  
  return vaccines
    .map(v => vaccineMap[v] || v)
    .filter(v => v); // Remove undefined/null values
}

// Normalize sex (FEMALE -> Female, MALE -> Male)
function normalizeSex(sex) {
  if (!sex) return null;
  const normalized = sex.trim().toLowerCase();
  if (normalized === 'female' || normalized === 'f') return 'Female';
  if (normalized === 'male' || normalized === 'm') return 'Male';
  return sex.trim();
}

// Determine vaccine status based on vaccines given
function determineVaccineStatus(vaccines) {
  if (!vaccines || vaccines.length === 0) return 'not_vaccinated';
  // This is a simplified logic - you might want to make it more sophisticated
  return vaccines.length > 3 ? 'fully_vaccinated' : 'partially_vaccinated';
}

// POST - Create new resident (JSON only, CSV uploads go to /api/residents/upload)
export async function POST(request) {
  try {
    const body = await request.json();
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON request for adding a single resident
      const { name, birthday, sex, administered_date, vaccine_status, barangay, barangay_id,
         submitted_by, vaccines_given, missed_schedule_of_vaccine } = body;

      // Validate required fields with detailed error messages
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!birthday) missingFields.push('birthday');
      if (!sex) missingFields.push('sex');
      if (!administered_date) missingFields.push('administered_date');
      if (!barangay_id) missingFields.push('barangay_id');
      if (!submitted_by) missingFields.push('submitted_by');

      if (missingFields.length > 0) {
        console.error('Missing fields:', missingFields, 'Body:', body);
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required fields: ${missingFields.join(', ')}`,
            missingFields 
          },
          { status: 400 }
        );
      }

      // Create resident object with new schema
      const resident = {
        name: name.trim().toUpperCase(),
        birthday,
        sex: normalizeSex(sex),
        administered_date,
        vaccine_status: vaccine_status || 'not_vaccinated',
        barangay_id,
        barangay: barangay || null,
        submitted_by,
        vaccines_given: Array.isArray(vaccines_given) ? vaccines_given : [],
        missed_schedule_of_vaccine: Array.isArray(missed_schedule_of_vaccine) ? missed_schedule_of_vaccine : [],
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      // Insert resident
      console.log('Inserting resident:', JSON.stringify(resident, null, 2));
      
      const { data, error } = await supabase
        .from('residents')
        .insert([resident])
        .select('*');

      if (error) {
        console.error('❌ Error inserting resident:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return NextResponse.json(
          { 
            success: false, 
            error: error.message || 'Failed to add resident',
            details: error.details || null,
            code: error.code,
            hint: error.hint
          },
          { status: 400 }
        );
      }

      console.log('✅ Resident inserted successfully:', JSON.stringify(data, null, 2));
      return NextResponse.json({
        success: true,
        data: data?.[0] || {},
        message: 'Resident added successfully'
      });
    }

    // Handle FormData request for CSV upload
    const formData = await request.formData();
    const file = formData.get('file');
    const barangayName = formData.get('barangay') || '';
    const submittedBy = formData.get('submitted_by');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!submittedBy) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSV file must have at least a header and one data row' },
        { status: 400 }
      );
    }

    // Helper function to check if a row is empty or invalid
    const isEmptyRow = (values) => {
      if (!values || values.length === 0) return true;
      const nonEmpty = values.filter(v => v && v.trim() && v.trim() !== '-');
      return nonEmpty.length === 0;
    };

    // Detect barangay name from CSV (usually in first few rows, before header)
    const detectBarangayFromCSV = (lines, headerRowIndex) => {
      // Known barangay names for validation
      const knownBarangays = [
        'mancruz', 'alawihao', 'bibirao', 'calasgasan', 'camambugan',
        'dogongan', 'magang', 'pamorangan', 'barangay ii'
      ];
      
      // Check rows before the header row
      for (let i = 0; i < headerRowIndex && i < 10; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        if (isEmptyRow(values)) continue;
        
        // Check each cell in the row
        for (const cell of values) {
          const cleaned = cell.trim().toLowerCase();
          if (!cleaned || cleaned.length < 3) continue;
          
          // Check if it matches a known barangay (case-insensitive)
          const matchedBarangay = knownBarangays.find(b => cleaned.includes(b) || b.includes(cleaned));
          if (matchedBarangay) {
            // Return proper case version
            const index = knownBarangays.indexOf(matchedBarangay);
            const properCaseBarangays = [
              'Mancruz', 'Alawihao', 'Bibirao', 'Calasgasan', 'Camambugan',
              'Dogongan', 'Magang', 'Pamorangan', 'Barangay II'
            ];
            return properCaseBarangays[index];
          }
          
          // Also check if it's a single word that looks like a barangay name
          // (not a header, not a number, has proper length)
          if (cleaned.length >= 4 && cleaned.length <= 20 && 
              !cleaned.match(/^\d+$/) && 
              !cleaned.includes('name') && !cleaned.includes('sex') && 
              !cleaned.includes('birthday') && !cleaned.includes('vaccine')) {
            // Return with proper capitalization
            return cleaned.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
        }
      }
      
      return null;
    };

    // Find header row by scanning through the file
    let headerRowIndex = -1;
    let headers = [];
    let nameIndex = -1;
    let sexIndex = -1;
    let birthdayIndex = -1;
    let dateOfVaccineIndex = -1;
    let vaccineGivenIndex = -1;

    // Scan up to 50 rows to find the header
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const rowValues = parseCSVLine(line);
      if (isEmptyRow(rowValues)) continue;
      
      const normalizedHeaders = rowValues.map(h => h.toLowerCase().trim());
      
      // Check if this row contains the required column headers
      const foundNameIndex = normalizedHeaders.findIndex(h => h.includes('name') && h.length > 2);
      const foundSexIndex = normalizedHeaders.findIndex(h => h.includes('sex'));
      const foundBirthdayIndex = normalizedHeaders.findIndex(h => (h.includes('birthday') || h.includes('birth')) && h.length > 3);
      
      if (foundNameIndex !== -1 && foundSexIndex !== -1 && foundBirthdayIndex !== -1) {
        // Found the header row!
        headerRowIndex = i;
        headers = normalizedHeaders;
        nameIndex = foundNameIndex;
        sexIndex = foundSexIndex;
        birthdayIndex = foundBirthdayIndex;
        dateOfVaccineIndex = normalizedHeaders.findIndex(h => h.includes('date of vaccine') || h.includes('vaccine date'));
        vaccineGivenIndex = normalizedHeaders.findIndex(h => h.includes('vaccine given') || h.includes('vaccines'));
        break;
      }
    }

    // Validate required fields
    if (!name || !birthday || !sex || !administered_date) {
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
          name: name.toUpperCase(),
          birthday: birthday || null,
          sex: sex || null,
          administered_date,
          vaccine_status: vaccine_status || 'not_vaccinated',
          status: 'pending',
          barangay: barangay || null,
          barangay_id: resolvedBarangayId, // satisfy NOT NULL when required
          submitted_by: submitted_by || 'system',
          vaccines_given: Array.isArray(vaccines_given) ? vaccines_given : [],
          missed_schedule_of_vaccine: Array.isArray(missed_schedule_of_vaccine) ? missed_schedule_of_vaccine : [],
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

// GET - Fetch residents with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const search = searchParams.get('search') || '';
    const barangay = searchParams.get('barangay') || '';

    let query = supabase
      .from('residents')
      .select('*')
      .eq('status', status);

    // Filter by barangay if provided (case-insensitive)
    if (barangay) {
      query = query.ilike('barangay', barangay);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching residents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch residents' },
        { status: 500 }
      );
    }

    // Filter by search term (client-side for now)
    let filtered = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(searchLower) ||
        r.barangay?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ residents: filtered });
  } catch (error) {
    console.error('Error in GET /api/residents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update resident
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // Convert name to uppercase if it's being updated
    if (updateData.name) {
      updateData.name = updateData.name.toUpperCase();
    }

    const { data, error } = await supabase
      .from('residents')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating resident:', error);
      return NextResponse.json(
        { error: 'Failed to update resident' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, resident: data?.[0] });
  } catch (error) {
    console.error('Error in PUT /api/residents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Approve/Reject resident
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Resident ID and action are required' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabase
      .from('residents')
      .update({ status: newStatus })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating resident status:', error);
      return NextResponse.json(
        { error: 'Failed to update resident status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, resident: data?.[0] });
  } catch (error) {
    console.error('Error in PATCH /api/residents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
        { error: 'Resident ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('residents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting resident:', error);
      return NextResponse.json(
        { error: 'Failed to delete resident' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/residents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
