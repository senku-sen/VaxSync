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

// POST - Create new resident (JSON or CSV upload)
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle JSON request for adding a single resident
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { name, birthday, sex, administered_date, vaccine_status, barangay, barangay_id,
         submitted_by, vaccines_given, missed_schedule_of_vaccine } = body;

      // Validate required fields
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

      // Create resident object
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

      console.log('Inserting resident:', JSON.stringify(resident, null, 2));
      
      const { data, error } = await supabase
        .from('residents')
        .insert([resident])
        .select('*');

      if (error) {
        console.error('❌ Error inserting resident:', error);
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
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
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

      // Helper function to check if a row is empty
      const isEmptyRow = (values) => {
        if (!values || values.length === 0) return true;
        const nonEmpty = values.filter(v => v && v.trim() && v.trim() !== '-');
        return nonEmpty.length === 0;
      };

      // Find header row
      let headerRowIndex = -1;
      let nameIndex = -1;
      let sexIndex = -1;
      let birthdayIndex = -1;
      let dateOfVaccineIndex = -1;
      let vaccineGivenIndex = -1;

      for (let i = 0; i < Math.min(50, lines.length); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const rowValues = parseCSVLine(line);
        if (isEmptyRow(rowValues)) continue;
        
        const normalizedHeaders = rowValues.map(h => h.toLowerCase().trim());
        
        const foundNameIndex = normalizedHeaders.findIndex(h => h.includes('name') && h.length > 2);
        const foundSexIndex = normalizedHeaders.findIndex(h => h.includes('sex'));
        const foundBirthdayIndex = normalizedHeaders.findIndex(h => (h.includes('birthday') || h.includes('birth')) && h.length > 3);
        
        if (foundNameIndex !== -1 && foundSexIndex !== -1 && foundBirthdayIndex !== -1) {
          headerRowIndex = i;
          nameIndex = foundNameIndex;
          sexIndex = foundSexIndex;
          birthdayIndex = foundBirthdayIndex;
          dateOfVaccineIndex = normalizedHeaders.findIndex(h => h.includes('date of vaccine') || h.includes('vaccine date') || h.includes('administered'));
          vaccineGivenIndex = normalizedHeaders.findIndex(h => h.includes('vaccine given') || h.includes('vaccines'));
          break;
        }
      }

      if (headerRowIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Could not find header row with required columns (name, sex, birthday)' },
          { status: 400 }
        );
      }

      // Parse data rows
      const residents = [];
      const errors = [];
      
      for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        if (isEmptyRow(values)) continue;
        
        const name = values[nameIndex]?.trim() || '';
        const sex = values[sexIndex]?.trim() || '';
        const birthday = values[birthdayIndex]?.trim() || '';
        const dateOfVaccine = (dateOfVaccineIndex >= 0 && values[dateOfVaccineIndex]) ? values[dateOfVaccineIndex].trim() : null;
        const vaccineGiven = (vaccineGivenIndex >= 0 && values[vaccineGivenIndex]) ? values[vaccineGivenIndex].trim() : null;
        
        if (!name || name === '-' || name.length < 2) {
          continue;
        }
        
        if (!birthday || birthday === '-') {
          errors.push(`Row ${i + 1}: Missing birthday for ${name}`);
          continue;
        }
        
        const parsedBirthdayResult = parseDate(birthday);
        if (!parsedBirthdayResult || parsedBirthdayResult.error) {
          const errorMsg = parsedBirthdayResult?.error || 'Invalid format';
          errors.push(`Row ${i + 1}: Invalid birthday format "${birthday}" for ${name} (${errorMsg})`);
          continue;
        }
        
        const parsedBirthday = parsedBirthdayResult.date;
        const normalizedSex = normalizeSex(sex);
        const vaccines = parseVaccines(vaccineGiven);
        const vaccineStatus = determineVaccineStatus(vaccines);
        
        const resident = {
          name: name.toUpperCase(),
          birthday: parsedBirthday,
          sex: normalizedSex || 'Male',
          administered_date: dateOfVaccine || new Date().toISOString().split('T')[0],
          vaccine_status: vaccineStatus,
          status: 'pending',
          barangay_id: null,
          submitted_by: submittedBy,
          vaccines_given: vaccines,
          missed_schedule_of_vaccine: [],
          submitted_at: new Date().toISOString()
        };
        
        residents.push(resident);
      }

      if (residents.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid residents found in CSV file', errors },
          { status: 400 }
        );
      }

      // Insert residents in batches
      const batchSize = 100;
      let successCount = 0;
      const batchErrors = [];

      for (let i = 0; i < residents.length; i += batchSize) {
        const batch = residents.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('residents')
          .insert(batch)
          .select('id');

        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
          batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          successCount += data?.length || 0;
        }
      }

      return NextResponse.json({
        success: true,
        inserted: successCount,
        total: residents.length,
        errors,
        batchErrors
      });
    }

    // Unsupported content type
    return NextResponse.json(
      { success: false, error: 'Content-Type must be application/json or multipart/form-data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/residents:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          stack: error.stack
        } : undefined
      },
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

    // Filter by search term (database-side for better performance)
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`name.ilike.${searchTerm},barangay.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching residents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch residents' },
        { status: 500 }
      );
    }

    return NextResponse.json({ residents: data || [] });
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