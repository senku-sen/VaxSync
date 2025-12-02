import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function POST(request) {
  try {
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

    // If header row not found, return error
    if (headerRowIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Could not find required columns (NAME, SEX, BIRTHDAY) in the CSV file. Please check the file format.' },
        { status: 400 }
      );
    }

    // Detect barangay from CSV file (check rows before header)
    const detectedBarangay = detectBarangayFromCSV(lines, headerRowIndex);
    
    // Use detected barangay from CSV, fallback to provided barangay, then 'Unknown'
    const effectiveBarangayName = detectedBarangay || barangayName || 'Unknown';
    
    // Log detected barangay for debugging
    if (detectedBarangay) {
      console.log(`Detected barangay from CSV: ${detectedBarangay}`);
    }

    // Resolve barangay_id
    let barangayId = null;
    
    const { data: foundBarangay, error: findBarangayError } = await supabase
      .from('barangays')
      .select('id')
      .eq('name', effectiveBarangayName)
      .maybeSingle();
    
    // Check if we got a valid barangay or if there was a connection error
    if (findBarangayError) {
      // If it's a fetch/network error, provide better error message
      if (findBarangayError.message?.includes('fetch failed') || findBarangayError.message?.includes('TypeError')) {
        console.error('Supabase connection error:', findBarangayError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unable to connect to database. Please check your internet connection and Supabase configuration.' 
          },
          { status: 503 }
        );
      }
      // Other errors, continue to try creating
      console.error('Error finding barangay:', findBarangayError);
    }
    
    if (foundBarangay?.id) {
      barangayId = foundBarangay.id;
    } else {
      // Create new barangay if not found
      const { data: newBarangay, error: insertBarangayError } = await supabase
        .from('barangays')
        .insert([{ name: effectiveBarangayName, municipality: 'Unknown' }])
        .select('id')
        .single();
      
      if (insertBarangayError) {
        // If it's a fetch/network error, provide better error message
        if (insertBarangayError.message?.includes('fetch failed') || insertBarangayError.message?.includes('TypeError')) {
          console.error('Supabase connection error:', insertBarangayError);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Unable to connect to database. Please check your internet connection and Supabase configuration.' 
            },
            { status: 503 }
          );
        }
        console.error('Failed to create/find barangay:', insertBarangayError);
        return NextResponse.json(
          { success: false, error: 'Failed to resolve barangay. Please ensure a valid barangay is selected.' },
          { status: 400 }
        );
      }
      
      if (newBarangay?.id) {
        barangayId = newBarangay.id;
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to create barangay. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Parse data rows (start after header row, skip empty rows)
    const residents = [];
    const errors = [];
    
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      
      // Skip empty rows
      if (isEmptyRow(values)) continue;
      
      // Safely extract values (handle cases where row might have fewer columns)
      const name = values[nameIndex]?.trim() || '';
      const sex = values[sexIndex]?.trim() || '';
      const birthday = values[birthdayIndex]?.trim() || '';
      const dateOfVaccine = (dateOfVaccineIndex >= 0 && values[dateOfVaccineIndex]) ? values[dateOfVaccineIndex].trim() : null;
      const vaccineGiven = (vaccineGivenIndex >= 0 && values[vaccineGivenIndex]) ? values[vaccineGivenIndex].trim() : null;
      
      // Skip rows with empty or invalid names (likely empty rows that weren't caught)
      if (!name || name === '-' || name.length < 2) {
        continue;
      }
      
      // Validate required fields - be lenient with missing data
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
      
      // Accept all dates, even future dates - keep format as is in CSV
      const parsedBirthday = parsedBirthdayResult.date;
      
      const normalizedSex = normalizeSex(sex);
      const vaccines = parseVaccines(vaccineGiven);
      const vaccineStatus = determineVaccineStatus(vaccines);
      
      // Build resident object
      // Use barangay name as default address if CSV doesn't have address field
      const defaultAddress = effectiveBarangayName || 'Not specified';
      
      const resident = {
        name: name,
        birthday: parsedBirthday,
        sex: normalizedSex || 'Male', // Default to 'Male' if missing (database might require it)
        address: defaultAddress,
        contact: 'N/A', // CSV doesn't have contact, use default
        vaccine_status: vaccineStatus,
        status: 'pending',
        barangay: effectiveBarangayName || null,
        barangay_id: barangayId,
        submitted_by: submittedBy,
        vaccines_given: vaccines,
        submitted_at: new Date().toISOString()
      };
      
      // Validate required fields for database
      if (!resident.name || !resident.birthday || !resident.address || !resident.contact) {
        errors.push(`Row ${i + 1}: Missing required fields (name, birthday, address, contact)`);
        continue;
      }
      
      // Validate that we have a barangay_id (required by database)
      if (!resident.barangay_id) {
        errors.push(`Row ${i + 1}: Failed to resolve barangay`);
        continue;
      }
      
      residents.push(resident);
    }

    if (residents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid residents found in CSV file', errors },
        { status: 400 }
      );
    }

    // Insert residents in batches (Supabase has a limit, typically 1000 rows)
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
        // Check if it's a connection error
        if (error.message?.includes('fetch failed') || error.message?.includes('TypeError')) {
          // Return early if it's a connection error - can't continue
          return NextResponse.json(
            {
              success: false,
              error: 'Unable to connect to database. Please check your internet connection and Supabase configuration.',
              successCount, // Return count of successfully inserted before error
              errors: [...errors, ...batchErrors, `Batch ${Math.floor(i / batchSize) + 1}: Connection failed`]
            },
            { status: 503 }
          );
        }
        // Check for constraint violations (like birthday_not_future)
        let errorMessage = error.message;
        if (error.message?.includes('birthday_not_future') || error.code === '23514') {
          errorMessage = `Database constraint violation: Some birthdays are in the future. Please remove the 'birthday_not_future' constraint from your database if you want to allow future dates.`;
        }
        batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${errorMessage}`);
        // Continue with next batch even if one fails
      } else {
        successCount += data?.length || 0;
      }
    }

    // Combine parsing errors with batch errors
    const allErrors = [...errors, ...batchErrors];

    return NextResponse.json({
      success: true,
      successCount,
      totalRows: residents.length, // Count of parsed residents, not total file rows
      processedRows: lines.length - headerRowIndex - 1, // Rows processed after header
      errors: allErrors.length > 0 ? allErrors : undefined
    });

  } catch (error) {
    console.error('Error processing CSV upload:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process CSV file: ' + error.message },
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
        r.address?.toLowerCase().includes(searchLower) ||
        r.contact?.toLowerCase().includes(searchLower)
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
