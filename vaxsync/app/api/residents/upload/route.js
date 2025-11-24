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

// Parse date from various formats (MM/DD/YYYY, MM-DD-YYYY, MM-DD-YY)
function parseDate(dateString) {
  if (!dateString || !dateString.trim()) return null;
  
  const str = dateString.trim();
  
  // Try MM/DD/YYYY
  let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try MM-DD-YYYY
  match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try MM-DD-YY (assume 20XX)
  match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
  if (match) {
    const [, month, day, year] = match;
    const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try ISO format (YYYY-MM-DD)
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return str;
  }
  
  return null;
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
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSV file must have at least a header and one data row' },
        { status: 400 }
      );
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Find column indices
    const nameIndex = headers.findIndex(h => h.includes('name'));
    const sexIndex = headers.findIndex(h => h.includes('sex'));
    const birthdayIndex = headers.findIndex(h => h.includes('birthday') || h.includes('birth'));
    const dateOfVaccineIndex = headers.findIndex(h => h.includes('date of vaccine') || h.includes('vaccine date'));
    const vaccineGivenIndex = headers.findIndex(h => h.includes('vaccine given') || h.includes('vaccines'));
    const noIndex = headers.findIndex(h => h === 'no.' || h === 'no' || h === '#');

    if (nameIndex === -1 || sexIndex === -1 || birthdayIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'CSV must contain NAME, SEX, and BIRTHDAY columns' },
        { status: 400 }
      );
    }

    // Resolve barangay_id
    let barangayId = null;
    const effectiveBarangayName = barangayName || 'Unknown';
    
    const { data: foundBarangay } = await supabase
      .from('barangays')
      .select('id')
      .eq('name', effectiveBarangayName)
      .maybeSingle();
    
    if (foundBarangay?.id) {
      barangayId = foundBarangay.id;
    } else {
      // Create new barangay if not found
      const { data: newBarangay, error: insertBarangayError } = await supabase
        .from('barangays')
        .insert([{ name: effectiveBarangayName, municipality: 'Unknown' }])
        .select('id')
        .single();
      
      if (!insertBarangayError && newBarangay) {
        barangayId = newBarangay.id;
      } else {
        console.error('Failed to create/find barangay:', insertBarangayError);
        return NextResponse.json(
          { success: false, error: 'Failed to resolve barangay. Please ensure a valid barangay is selected.' },
          { status: 400 }
        );
      }
    }

    // Parse data rows
    const residents = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      
      // Skip if row doesn't have enough columns
      if (values.length < Math.max(nameIndex, sexIndex, birthdayIndex) + 1) {
        errors.push(`Row ${i + 1}: Insufficient columns`);
        continue;
      }
      
      const name = values[nameIndex]?.trim();
      const sex = values[sexIndex]?.trim();
      const birthday = values[birthdayIndex]?.trim();
      const dateOfVaccine = dateOfVaccineIndex >= 0 ? values[dateOfVaccineIndex]?.trim() : null;
      const vaccineGiven = vaccineGivenIndex >= 0 ? values[vaccineGivenIndex]?.trim() : null;
      
      // Validate required fields
      if (!name) {
        errors.push(`Row ${i + 1}: Missing name`);
        continue;
      }
      
      if (!birthday) {
        errors.push(`Row ${i + 1}: Missing birthday`);
        continue;
      }
      
      const parsedBirthday = parseDate(birthday);
      if (!parsedBirthday) {
        errors.push(`Row ${i + 1}: Invalid birthday format: ${birthday}`);
        continue;
      }
      
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
        batchErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
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
      totalRows: lines.length - 1,
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

